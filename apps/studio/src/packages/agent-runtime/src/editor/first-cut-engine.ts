import { MediaKnowledgeCatalog } from "../media-intelligence/catalog";
import { CreativeBrief, CreativeBriefCompiler } from "../story-planner/brief-compiler";
import { StoryPlanner, StoryStructureOption } from "../story-planner/story-planner";
import { VideoContextCompiler } from "../context-compiler/context-compiler";
import { ComparativeShotSelector } from "./shot-selector";
import { EditorialDecision } from "./edit-decision";
import { MutationValidator } from "./mutation-validator";
import { TimelineIR, TimelineMutator } from "@aetheredit/timeline-ir";
import { AudioDirector } from "../directors/audio-director";
import { ColorDirector } from "../directors/color-director";
import { CreativeCritic, CriticEvaluationResult } from "../qa/creative-critic";
import { RevisionPlanner, RevisionResult } from "../qa/revision-planner";

export interface FirstCutResult {
  timeline: TimelineIR;
  brief: CreativeBrief;
  selectedStory: StoryStructureOption;
  decisions: EditorialDecision[];
  critiqueBefore: CriticEvaluationResult;
  critiqueAfter: CriticEvaluationResult;
  revisionResult?: RevisionResult;
  qualityDelta: number;
}

export class AutonomousFirstCutEngine {
  private storyPlanner: StoryPlanner;
  private contextCompiler: VideoContextCompiler;
  private shotSelector: ComparativeShotSelector;
  private audioDirector: AudioDirector;
  private colorDirector: ColorDirector;
  private critic: CreativeCritic;
  private revisionPlanner: RevisionPlanner;

  constructor() {
    this.storyPlanner = new StoryPlanner();
    this.contextCompiler = new VideoContextCompiler();
    this.shotSelector = new ComparativeShotSelector();
    this.audioDirector = new AudioDirector();
    this.colorDirector = new ColorDirector();
    this.critic = new CreativeCritic();
    this.revisionPlanner = new RevisionPlanner();
  }

  /**
   * Executes the full 11-Stage Autonomous First Cut Pipeline.
   */
  public async generateFirstCut(
    prompt: string,
    catalog: MediaKnowledgeCatalog,
    baseTimeline?: TimelineIR
  ): Promise<FirstCutResult> {
    // Stage 1 & 2: Ingest & Media Hierarchy Analysis (already loaded in catalog)
    // Stage 3: Creative Brief Compilation
    const brief = CreativeBriefCompiler.compile(prompt);

    // Stage 4: Multi-Option Story Planning
    const storyOptions = await this.storyPlanner.generatePlanOptions(brief, catalog);

    // Stage 5: Story Arc Selection
    const selection = this.storyPlanner.selectBestOption(storyOptions, brief);
    const selectedStory = selection.selectedOption;

    // Initialize 5-Track Timeline IR compliant with TimelineIRSchema
    const fps = 30;
    const timeline: TimelineIR = baseTimeline ? JSON.parse(JSON.stringify(baseTimeline)) : {
      timelineId: `tl_first_cut_${Date.now()}`,
      version: 1,
      timebase: { numerator: fps, denominator: 1 },
      canvas: {
        width: brief.aspectRatio === "9:16" ? 1080 : 1920,
        height: brief.aspectRatio === "9:16" ? 1920 : 1080,
        pixelAspectRatio: "1:1",
        colorSpace: "Rec.709",
      },
      tracks: [
        { id: "trk_v1_primary", type: "VIDEO", name: "V1 Primary Spine", index: 0, muted: false, locked: false, clips: [], transitions: [] },
        { id: "trk_v2_broll", type: "VIDEO", name: "V2 B-Roll Cutaways", index: 1, muted: false, locked: false, clips: [], transitions: [] },
        { id: "trk_a1_dialogue", type: "AUDIO", name: "A1 Dialogue", index: 2, muted: false, locked: false, clips: [], transitions: [] },
        { id: "trk_a2_music", type: "AUDIO", name: "A2 Music Bed", index: 3, muted: false, locked: false, clips: [], transitions: [] },
        { id: "trk_a3_sfx", type: "AUDIO", name: "A3 SFX Accents", index: 4, muted: false, locked: false, clips: [], transitions: [] },
      ],
      markers: [],
    };

    const knownAssets = new Set(catalog.getAllShots().map((s) => s.assetId));
    const decisions: EditorialDecision[] = [];

    let currentTimelineFrame = 0;

    // Stage 6: Comparative Editorial Decision Process & Assembly
    for (const beat of selectedStory.beats) {
      const candidates = catalog.queryShots({
        shotType: beat.requiredShotTypes[0],
        limit: 8,
      });

      const fallbackCandidates = candidates.length > 0 ? candidates : catalog.getAllShots().slice(0, 6);
      const context = await this.contextCompiler.compileContextForBeat(brief, catalog, beat, fallbackCandidates);

      const decision = this.shotSelector.selectForBeat(
        beat,
        fallbackCandidates,
        context,
        currentTimelineFrame / fps
      );

      decisions.push(decision);

      const durationFrames = Math.round(decision.selectedCandidate.durationSec * fps);

      // Validate mutation before adding
      const validation = MutationValidator.validate(timeline, {
        type: "INSERT_CLIP",
        trackId: decision.targetTrackId,
        clipId: `clip_${decision.selectedCandidate.shotId}_${currentTimelineFrame}`,
        assetId: decision.selectedCandidate.assetId,
        inFrame: 0,
        outFrame: durationFrames,
        targetStartFrame: currentTimelineFrame,
        durationFrames,
        reason: decision.selectedCandidate.selectionRationale,
      }, knownAssets);

      if (validation.valid && validation.safeMutation) {
        TimelineMutator.apply(timeline, validation.safeMutation);
      }

      currentTimelineFrame += durationFrames;
    }

    // Stage 8: Audio Director Processing
    this.audioDirector.processAudioTracks(timeline, catalog, brief);

    // Stage 9: Color Director Processing
    this.colorDirector.applyColorPipeline(timeline, brief);

    // Stage 10: Dual QA & Actionable Creative Critique
    const critiqueBefore = this.critic.evaluateCut(timeline, decisions, brief);

    // Stage 11: Revision Loop
    let critiqueAfter = critiqueBefore;
    let revisionResult: RevisionResult | undefined;

    if (!critiqueBefore.passed && critiqueBefore.findings.length > 0) {
      revisionResult = this.revisionPlanner.planAndExecuteRevisions(timeline, decisions, critiqueBefore.findings, catalog);
      critiqueAfter = this.critic.evaluateCut(timeline, decisions, brief);
    }

    const qualityDelta = critiqueAfter.overallScore - critiqueBefore.overallScore;

    return {
      timeline,
      brief,
      selectedStory,
      decisions,
      critiqueBefore,
      critiqueAfter,
      revisionResult,
      qualityDelta: Math.max(0, qualityDelta),
    };
  }
}
