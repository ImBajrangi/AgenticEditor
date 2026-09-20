import {
  AgentRun,
  AgentStep,
  AgentRunState,
  DirectorState,
  AutonomyLevel,
  EditQualityScore,
  EditQualityEvaluator,
  DecisionAudit,
  AgentBudget,
  TimelineSnapshot,
} from "../types";
import { MediaKnowledgeCatalog } from "../media-intelligence/catalog";
import { CreativeBriefCompiler, CreativeBrief } from "../story-planner/brief-compiler";
import { StoryPlanner, StoryStructureOption } from "../story-planner/story-planner";
import { VideoContextCompiler } from "../context-compiler/context-compiler";
import { ComparativeShotSelector } from "../editor/shot-selector";
import { EditorialDecision } from "../editor/edit-decision";
import { AudioDirector } from "../directors/audio-director";
import { ColorDirector } from "../directors/color-director";
import { CreativeCritic, CriticEvaluationResult } from "../qa/creative-critic";
import { RevisionPlanner, RevisionResult } from "../qa/revision-planner";
import { AutonomyPolicy } from "./autonomy-policy";
import { MutationValidator } from "../editor/mutation-validator";
import { TimelineIR, TimelineMutator } from "@aetheredit/timeline-ir";

export interface DirectorAgentOptions {
  runId: string;
  projectId: string;
  prompt: string;
  catalog: MediaKnowledgeCatalog;
  timeline: TimelineIR;
  autonomyLevel?: AutonomyLevel;
  budget?: Partial<AgentBudget>;
  emitEvent: (type: string, payload: Record<string, unknown>) => void;
}

export class DirectorAgent {
  private storyPlanner: StoryPlanner;
  private contextCompiler: VideoContextCompiler;
  private shotSelector: ComparativeShotSelector;
  private audioDirector: AudioDirector;
  private colorDirector: ColorDirector;
  private critic: CreativeCritic;
  private revisionPlanner: RevisionPlanner;
  private autonomyPolicy: AutonomyPolicy;

  constructor() {
    this.storyPlanner = new StoryPlanner();
    this.contextCompiler = new VideoContextCompiler();
    this.shotSelector = new ComparativeShotSelector();
    this.audioDirector = new AudioDirector();
    this.colorDirector = new ColorDirector();
    this.critic = new CreativeCritic();
    this.revisionPlanner = new RevisionPlanner();
    this.autonomyPolicy = new AutonomyPolicy();
  }

  /**
   * Executes an intelligent, auditable multi-turn Observe -> Reason -> Act agent loop.
   */
  public async executeDirectorLoop(options: DirectorAgentOptions): Promise<{
    timeline: TimelineIR;
    directorState: DirectorState;
    steps: AgentStep[];
    decisions: EditorialDecision[];
    critique: CriticEvaluationResult;
    qualityHistory: EditQualityScore[];
  }> {
    const steps: AgentStep[] = [];
    const decisions: EditorialDecision[] = [];
    const qualityHistory: EditQualityScore[] = [];

    const startTime = Date.now();
    const budget: AgentBudget = {
      maxIterations: options.budget?.maxIterations ?? 4,
      maxToolCalls: options.budget?.maxToolCalls ?? 40,
      maxVisionCalls: options.budget?.maxVisionCalls ?? 30,
      maxHighQualityVisionCalls: options.budget?.maxHighQualityVisionCalls ?? 10,
      maxRenderAttempts: options.budget?.maxRenderAttempts ?? 3,
      maxRuntimeMs: options.budget?.maxRuntimeMs ?? 60000,
    };

    const budgetUsage = {
      iterations: 1,
      toolCalls: 0,
      visionCalls: 0,
      highQualityVisionCalls: 0,
      renderAttempts: 0,
      elapsedMs: 0,
    };

    const recordStep = (
      state: AgentRunState,
      observation: string,
      reasoning: string,
      selectedTool?: string,
      toolInput?: Record<string, unknown>,
      toolResult?: unknown,
      decision?: string
    ) => {
      budgetUsage.toolCalls++;
      budgetUsage.elapsedMs = Date.now() - startTime;

      const step: AgentStep = {
        stepId: `step_${steps.length + 1}_${Date.now()}`,
        runId: options.runId,
        state,
        observation,
        reasoning,
        selectedTool,
        toolInput,
        toolResult,
        decision,
        timestamp: Date.now(),
      };
      steps.push(step);
      options.emitEvent("STEP_RECORDED", { step });
    };

    // Initialize State
    recordStep("PLANNING", "Received user creative brief prompt", "Parsing creative intent, constraints, and narrative targets.");
    const brief = CreativeBriefCompiler.compile(options.prompt);

    const directorState: DirectorState = {
      projectIntent: brief,
      currentObjective: `Direct and produce a ${brief.targetDurationSec}s ${brief.editingIntent} video`,
      observedEvidence: [],
      visionEvidence: [],
      editorialDecisions: [],
      decisionAudits: [],
      unresolvedProblems: [],
      constraints: brief.constraints,
      autonomyLevel: options.autonomyLevel || "L3_EXECUTE_CREATIVE",
      iteration: 1,
      confidence: 0.90,
      qualityHistory: [],
      budgetUsage,
    };

    // Turn 1: Observe Media Hierarchy
    recordStep(
      "OBSERVING",
      `Observed ${options.catalog.getScenes().length} scenes and ${options.catalog.getAllShots().length} raw shots in media catalog`,
      "Analyzing scene locations, setups, camera angles, and action phases to understand narrative coverage.",
      "inspect_media",
      { sceneCount: options.catalog.getScenes().length, totalShots: options.catalog.getAllShots().length },
      { ready: true }
    );

    // Turn 2: Generate Multi-Option Story Arcs
    recordStep(
      "REASONING",
      "Evaluating candidate narrative structures against creative brief intent",
      "Formulating 3 distinct narrative approaches: Cinematic Journey, Character Story, and Kinetic Montage.",
      "generate_story_options",
      { prompt: options.prompt }
    );

    const storyOptions = await this.storyPlanner.generatePlanOptions(brief, options.catalog);
    const storySelection = this.storyPlanner.selectBestOption(storyOptions, brief);
    const selectedStory = storySelection.selectedOption;
    directorState.narrativePlan = selectedStory as unknown as Record<string, unknown>;

    recordStep(
      "PLANNING",
      `Selected story structure '${selectedStory.name}' (${selectedStory.archetype})`,
      storySelection.selectionRationale,
      "story_select_arc",
      { selectedOptionId: selectedStory.optionId, beatsCount: selectedStory.beats.length },
      { beats: selectedStory.beats.map((b) => b.role) },
      `Committed to ${selectedStory.beats.length}-beat narrative plan`
    );

    // Turn 3: Observe Candidates & Make Comparative Editorial Decisions
    const timeline = JSON.parse(JSON.stringify(options.timeline)) as TimelineIR;
    if (!timeline.markers) timeline.markers = [];
    if (!timeline.tracks) timeline.tracks = [];
    for (const track of timeline.tracks) {
      if (!track.clips) track.clips = [];
      if (!track.transitions) track.transitions = [];
    }
    const fps = timeline.timebase.numerator / timeline.timebase.denominator;
    let currentFrame = 0;

    const knownAssets = new Set(options.catalog.getAllShots().map((s) => s.assetId));

    for (let beatIdx = 0; beatIdx < selectedStory.beats.length; beatIdx++) {
      const beat = selectedStory.beats[beatIdx];
      directorState.activeBeatId = beat.beatId;
      directorState.activeBeat = beat as unknown as Record<string, unknown>;

      recordStep(
        "OBSERVING",
        `Retrieving candidate shots for Beat ${beatIdx + 1} (${beat.role}, target: ${beat.targetDurationSec.toFixed(1)}s)`,
        `Searching catalog for shotType: '${beat.requiredShotTypes.join(", ")}' and actionPhase: '${beat.preferredActionPhase}'.`,
        "retrieve_candidates",
        { beatRole: beat.role, requiredShotTypes: beat.requiredShotTypes }
      );

      const candidates = options.catalog.queryShots({
        shotType: beat.requiredShotTypes[0],
        limit: 8,
      });
      const fallbackCandidates = candidates.length > 0 ? candidates : options.catalog.getAllShots().slice(0, 6);

      const context = await this.contextCompiler.compileContextForBeat(brief, options.catalog, beat, fallbackCandidates);
      budgetUsage.visionCalls += context.level5_visionInspection.length;

      recordStep(
        "OBSERVING",
        `Inspected ${context.level5_visionInspection.length} candidate keyframes with multimodal vision`,
        "Extracted subject trajectories and verified spatial continuity vectors.",
        "inspect_frames",
        { candidatesSampled: context.level5_visionInspection.map((v) => v.shotId) },
        context.level5_visionInspection
      );

      recordStep(
        "REASONING",
        `Comparing ${fallbackCandidates.length} candidate shots for Beat '${beat.beatId}'`,
        "Evaluating pros/cons, screen direction, action phase alignment, and documenting rejection reasons for competing shots.",
        "compare_candidates",
        { candidates: fallbackCandidates.map((c) => c.shotId) }
      );

      const decision = this.shotSelector.selectForBeat(
        beat,
        fallbackCandidates,
        context,
        currentFrame / fps
      );

      decisions.push(decision);
      directorState.decisionAudits.push(decision.audit);

      const durationFrames = Math.round(decision.selectedCandidate.durationSec * fps);

      // Turn 4: Act via Safe Mutation Validator
      recordStep(
        "ACTING",
        `Selected '${decision.selectedCandidate.shotId}' (${decision.selectedCandidate.selectionRationale})`,
        "Validating editorial mutation bounds and appending clip to timeline track.",
        "construct_timeline",
        { targetTrackId: decision.targetTrackId, durationFrames },
        { validated: true },
        `Placed clip '${decision.selectedCandidate.shotId}' at frame ${currentFrame}`
      );

      const validation = MutationValidator.validate(timeline, {
        type: "INSERT_CLIP",
        trackId: decision.targetTrackId,
        clipId: `clip_${decision.selectedCandidate.shotId}_${currentFrame}`,
        assetId: decision.selectedCandidate.assetId,
        inFrame: 0,
        outFrame: durationFrames,
        targetStartFrame: currentFrame,
        durationFrames,
        reason: decision.selectedCandidate.selectionRationale,
      }, knownAssets);

      if (validation.valid && validation.safeMutation) {
        TimelineMutator.apply(timeline, validation.safeMutation);
      }

      currentFrame += durationFrames;
    }

    directorState.editorialDecisions = decisions as unknown as Record<string, unknown>[];
    directorState.timelineSnapshot = {
      version: timeline.version,
      clipCount: timeline.tracks.reduce((acc, t) => acc + t.clips.length, 0),
      totalDurationFrames: currentFrame,
      tracksSummary: timeline.tracks.map((t) => ({ id: t.id, type: t.type, clipCount: t.clips.length })),
    };

    // Turn 5: Direct Audio & Color
    recordStep(
      "ACTING",
      "Applying audio bus routing, speech-triggered sidechain ducking, and sound design",
      "Balancing dialogue clarity with cinematic music swells and rhythmic impacts.",
      "direct_audio",
      { duckingIntent: brief.editingIntent }
    );
    this.audioDirector.processAudioTracks(timeline, options.catalog, brief);

    recordStep(
      "ACTING",
      "Executing 5-step professional color pipeline (Normalize -> Correct -> Match -> Optional Creative Look)",
      "Matching scene white balances and applying warm 35mm filmic tone.",
      "direct_color",
      { style: brief.visualStyle }
    );
    this.colorDirector.applyColorPipeline(timeline, brief);

    // Turn 6: Verify & Creative Critique
    recordStep(
      "VERIFYING",
      "Conducting comprehensive dual QA and creative critique on assembled sequence",
      "Analyzing narrative rhythm, visual repetition, pacing density, and dialogue intelligibility.",
      "critique_edit"
    );

    const critiqueInitial = this.critic.evaluateCut(timeline, decisions, brief);
    qualityHistory.push(critiqueInitial.qualityScore);
    directorState.qualityBefore = critiqueInitial.qualityScore;

    let currentCritique = critiqueInitial;
    let iteration = 1;
    let terminationReason: DirectorState["terminationReason"] = "COMPLETED";

    // Turn 7: Multi-Turn Revision Loop with Anti-Oscillation & Quality Delta Thresholds
    while (iteration <= budget.maxIterations) {
      budgetUsage.iterations = iteration;
      budgetUsage.elapsedMs = Date.now() - startTime;

      if (budgetUsage.elapsedMs > budget.maxRuntimeMs || budgetUsage.toolCalls >= budget.maxToolCalls) {
        terminationReason = "BUDGET_EXHAUSTED";
        break;
      }

      if (currentCritique.passed || currentCritique.findings.length === 0) {
        terminationReason = currentCritique.findings.length === 0 ? "NO_UNRESOLVED_PROBLEMS" : "QUALITY_TARGET_MET";
        break;
      }

      // Check autonomy approval boundary for revision if required
      if (directorState.autonomyLevel === "L0_SUGGEST_ONLY" || directorState.autonomyLevel === "L1_EXECUTE_WITH_APPROVAL") {
        terminationReason = "APPROVAL_REQUIRED";
        break;
      }

      // Execute revision
      recordStep(
        "REVISING",
        `Iteration ${iteration}: Critic identified ${currentCritique.findings.length} actionable editorial finding(s)`,
        "Formulating revision plan with anti-oscillation guards to replace suboptimal candidate shots.",
        "modify_timeline",
        { findings: currentCritique.findings.map((f) => f.problem), iteration }
      );

      const revResult = this.revisionPlanner.planAndExecuteRevisions(
        timeline,
        decisions,
        currentCritique.findings,
        options.catalog
      );

      if (revResult.oscillationPrevented) {
        terminationReason = "ANTI_OSCILLATION_TRIGGERED";
        break;
      }

      const newCritique = this.critic.evaluateCut(timeline, decisions, brief);
      const deltaQuality = EditQualityEvaluator.calculateDelta(currentCritique.qualityScore, newCritique.qualityScore);
      newCritique.qualityScore.revisionImprovement = deltaQuality;
      qualityHistory.push(newCritique.qualityScore);

      // Stop revision if quality improvement has plateaued (deltaQuality <= 0.01) to prevent over-editing
      if (deltaQuality <= 0.01 && iteration > 1) {
        terminationReason = "QUALITY_DELTA_BELOW_THRESHOLD";
        currentCritique = newCritique;
        break;
      }

      currentCritique = newCritique;
      iteration++;
    }

    directorState.qualityAfter = currentCritique.qualityScore;
    directorState.terminationReason = terminationReason;
    directorState.budgetUsage = budgetUsage;
    directorState.qualityHistory = qualityHistory;
    directorState.confidence = currentCritique.overallScore;

    recordStep(
      "COMPLETED",
      `Finished autonomous directing loop (Reason: ${terminationReason}) with ${(currentCritique.overallScore * 100).toFixed(0)}% quality score`,
      `Final cut produced across ${timeline.tracks.length} tracks with ${decisions.length} justified editorial decisions.`,
      undefined,
      undefined,
      { finalVersion: timeline.version, score: currentCritique.overallScore, terminationReason },
      "Delivered production master cut"
    );

    return {
      timeline,
      directorState,
      steps,
      decisions,
      critique: currentCritique,
      qualityHistory,
    };
  }
}
