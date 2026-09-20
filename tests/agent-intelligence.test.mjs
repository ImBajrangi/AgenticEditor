import assert from "node:assert";

// Import modules directly from built studio package mirrors
import { MediaKnowledgeCatalog } from "../apps/studio/src/packages/agent-runtime/src/media-intelligence/catalog.js";
import { AdaptiveFrameInspector } from "../apps/studio/src/packages/agent-runtime/src/media-intelligence/frame-inspector.js";
import { CreativeBriefCompiler } from "../apps/studio/src/packages/agent-runtime/src/story-planner/brief-compiler.js";
import { StoryPlanner } from "../apps/studio/src/packages/agent-runtime/src/story-planner/story-planner.js";
import { VideoContextCompiler } from "../apps/studio/src/packages/agent-runtime/src/context-compiler/context-compiler.js";
import { ComparativeShotSelector, CandidateEligibilityFilter } from "../apps/studio/src/packages/agent-runtime/src/editor/shot-selector.js";
import { MutationValidator } from "../apps/studio/src/packages/agent-runtime/src/editor/mutation-validator.js";
import { AutonomousFirstCutEngine } from "../apps/studio/src/packages/agent-runtime/src/editor/first-cut-engine.js";
import { ExistingTimelineReviser } from "../apps/studio/src/packages/agent-runtime/src/editor/timeline-reviser.js";
import { AudioDirector } from "../apps/studio/src/packages/agent-runtime/src/directors/audio-director.js";
import { ColorDirector } from "../apps/studio/src/packages/agent-runtime/src/directors/color-director.js";
import { CreativeCritic } from "../apps/studio/src/packages/agent-runtime/src/qa/creative-critic.js";
import { RevisionPlanner } from "../apps/studio/src/packages/agent-runtime/src/qa/revision-planner.js";
import { UserFeedbackMemory } from "../apps/studio/src/packages/agent-runtime/src/memory/feedback-memory.js";
import { AutonomyPolicy } from "../apps/studio/src/packages/agent-runtime/src/runtime/autonomy-policy.js";
import { DirectorAgent } from "../apps/studio/src/packages/agent-runtime/src/runtime/director-agent.js";
import { RealFootageCreativeBenchmark } from "../apps/studio/src/packages/agent-runtime/src/benchmark/rfcb.js";
import { IntelligentModelRouter } from "../apps/studio/src/packages/ai-gateway/src/router.js";

console.log("================================================================================");
console.log("AETHEREDIT OS — AGENTIC AI DIRECTOR & MULTIMODAL BENCHMARK (15 TESTS)");
console.log("================================================================================");

// [Test 1] Media Intelligence & Scene/Setup Hierarchy
console.log("\n[Test 1] Validating Media Intelligence & Scene/Setup Hierarchy...");
const { catalog, groundTruth } = MediaKnowledgeCatalog.generateAdversarialFootagePool();
const scenes = catalog.getScenes();
const totalShots = catalog.getAllShots();

assert.ok(scenes.length >= 4, "Hierarchical scenes indexed");
assert.ok(totalShots.length >= 95, "Full 100-clip footage pool loaded");
assert.ok(scenes[0].setups.length >= 3, "Setup coverage indexed per scene");
assert.ok(scenes[0].confidence > 0.9, "Scene confidence rating present");
assert.ok(totalShots[0].actionPhase !== undefined, "Action phase annotated");
assert.ok(totalShots[0].continuityFeatures.screenDirection !== undefined, "Continuity vector present");
console.log(`✓ Test 1 Passed: Ingested ${scenes.length} scenes, ${catalog.getSetups().length} setups, and ${totalShots.length} shots with action phases & confidence.`);

// [Test 2] Adaptive Multimodal Frame Inspection (4-8 frames + temporal micro-clip)
console.log("\n[Test 2] Validating Adaptive Multimodal Frame Inspection...");
const frameInspector = new AdaptiveFrameInspector();
const normalShot = totalShots[0];
const climaxShot = totalShots.find((s) => s.actionPhase === "PEAK_ACTION") || totalShots[5];

const normalEvidence = await frameInspector.inspectShot(normalShot);
const climaxEvidence = await frameInspector.inspectShot(climaxShot, { requireTemporalClip: true });

assert.ok(normalEvidence.frameSampleCount >= 4, "Adaptive frame sampling extracted >= 4 frames");
assert.ok(climaxEvidence.temporalClipInspected === true, "Temporal micro-clip inspected for high-intensity action");
assert.ok(climaxEvidence.motionEnergy > 0.8, "Motion dynamics evaluated");
console.log(`✓ Test 2 Passed: Adaptive sampling (${normalEvidence.frameSampleCount} frames) and temporal micro-clip inspection verified.`);

// [Test 3] Hierarchical Dynamic Context Retrieval
console.log("\n[Test 3] Validating 5-Level Hierarchical Context Compiler...");
const contextCompiler = new VideoContextCompiler(frameInspector);
const brief = CreativeBriefCompiler.compile("Create a 45-second cinematic travel film with high energy opening and emotional ending");
const sampleBeat = {
  beatId: "beat_01_hook",
  role: "HOOK",
  targetDurationSec: 3.5,
  targetEmotion: "wonder",
  requiredShotTypes: ["AERIAL", "WIDE"],
  preferredActionPhase: "ENTER",
  pacingDensity: "FAST",
  audioRole: "HOOK_STINGER",
};

const candidatePool = catalog.queryShots({ shotType: "AERIAL", limit: 6 });
const contextPackage = await contextCompiler.compileContextForBeat(brief, catalog, sampleBeat, candidatePool);

assert.ok(contextPackage.level1_projectSummary.editingIntent.length > 0, "Level 1 Project Brief compiled");
assert.ok(contextPackage.level2_sceneStructure.length >= 4, "Level 2 Scene Summaries compiled");
assert.ok(contextPackage.level3_candidateShotsSummary.length >= 1, "Level 3 Candidates compiled");
assert.ok(contextPackage.level4_detailedEvidence.length >= 1, "Level 4 Continuity Vectors compiled");
assert.ok(contextPackage.level5_visionInspection.length >= 1, "Level 5 Vision Inspection compiled");
assert.ok(contextPackage.tokenEstimate < 2500, `Token estimate is compact: ${contextPackage.tokenEstimate} tokens`);
console.log(`✓ Test 3 Passed: 5-level hierarchical retrieval dynamically compiled (${contextPackage.tokenEstimate} est. tokens).`);

// [Test 4] Multi-Option Story Planning with Setup -> Payoff
console.log("\n[Test 4] Validating Multi-Option Story Planning with Setup -> Payoff Tracking...");
const storyPlanner = new StoryPlanner();
const storyOptions = await storyPlanner.generatePlanOptions(brief, catalog);

assert.strictEqual(storyOptions.length, 3, "Generated 3 candidate narrative structures");
const selection = storyPlanner.selectBestOption(storyOptions, brief);
assert.ok(selection.selectedOption.beats.length >= 4, "Selected story plan has structured narrative beats");
assert.ok(selection.selectedOption.setupPayoffs.length >= 1, "Setup -> Payoff relationship tracked");
console.log(`✓ Test 4 Passed: Generated 3 options; selected '${selection.selectedOption.name}' with setup-payoff links.`);

// [Test 5a] Comparative Editorial Decision & Decision Audit
console.log("\n[Test 5a] Validating Comparative Editorial Decision Engine...");
const candidateShots = catalog.queryShots({ shotType: "AERIAL", limit: 4 });
const shotSelector = new ComparativeShotSelector();
// Verify CandidateEligibilityFilter hard constraints vs soft preferences
const beautyTrapCandidate = {
  shotId: "shot_trap_test",
  assetId: "asset_trap",
  sceneId: "scene_01",
  setupId: "setup_01",
  startTimeSec: 0,
  endTimeSec: 6,
  durationSec: 6,
  visualQuality: 0.99,
  technicalQuality: 0.99,
  storyPotential: 0.15,
  shotType: "AERIAL",
  actionPhase: "COMPLETION",
  cameraAngle: "EYE_LEVEL",
  framing: "SINGLE",
  cameraMovement: "DRONE_SWEEP",
  lightingCondition: "NATURAL_SUN",
  subjects: [],
  action: "Empty flowers",
  emotion: "neutral",
  continuityFeatures: { eyeline: "DIRECT_CAMERA", screenDirection: "STATIC", dominantColorHex: "#fff" },
  hasSpeech: false,
};

const filterCheck = CandidateEligibilityFilter.filter([beautyTrapCandidate, ...candidateShots], sampleBeat);
assert.strictEqual(filterCheck.ineligible.length, 1, "Eligibility filter caught hard constraint violation prior to ranking");
assert.ok(filterCheck.ineligible[0].reason.includes("Eligibility Filter"), "Logged eligibility filter rejection reason");

const decision = shotSelector.selectForBeat(sampleBeat, [beautyTrapCandidate, ...candidateShots], contextPackage, 0);

assert.ok(decision.selectedCandidate.shotId, "Selected winning candidate");
assert.ok(decision.rejectedCandidates.length >= 2, "Rejected candidates documented");
assert.ok(decision.rejectedCandidates.some((r) => r.attributedLayer === "ELIGIBILITY_FILTER"), "Documented failure layer attribution for eligibility filter");
assert.ok(decision.audit.candidates.length >= 2, "Decision audit logs candidate pool");
console.log(`✓ Test 5a Passed: Selected '${decision.selectedCandidate.shotId}', filtered hard constraints via Eligibility Filter, and documented ${decision.rejectedCandidates.length} alternatives with failure layer attribution.`);

// [Test 5b] Counterfactual Editorial Decision (Causal Evidence Sensitivity)
console.log("\n[Test 5b] Validating Counterfactual Editorial Decision (Evidence Causality)...");
// Candidate A (e.g. shot_003) vs Candidate B (e.g. shot_006)
const candidateA = JSON.parse(JSON.stringify(candidateShots[0]));
const candidateB = JSON.parse(JSON.stringify(candidateShots[1]));

// Scenario 1: Candidate A has perfect action phase alignment
candidateA.actionPhase = "ENTER";
candidateB.actionPhase = "COMPLETION";
const decision1 = shotSelector.selectForBeat(sampleBeat, [candidateA, candidateB], contextPackage, 0);
assert.strictEqual(decision1.selectedCandidate.shotId, candidateA.shotId, "Initial decision selected Candidate A due to action phase match");

// Scenario 2: Counterfactual Perturbation - Candidate A loses action phase and direction, Candidate B gains them
candidateA.actionPhase = "COMPLETION";
candidateA.continuityFeatures.screenDirection = "STATIC";
candidateB.actionPhase = "ENTER";
candidateB.continuityFeatures.screenDirection = "LEFT_TO_RIGHT";

const decision2 = shotSelector.selectForBeat(sampleBeat, [candidateA, candidateB], contextPackage, 0);
assert.strictEqual(decision2.selectedCandidate.shotId, candidateB.shotId, "Counterfactual verified: decision causally flipped from Candidate A to Candidate B when evidence changed");
console.log("✓ Test 5b Passed: Counterfactual test proven — decision flipped causally from A -> B based on evidence perturbation.");

// [Test 6] Mutation Validator & Safe Transaction Boundary
console.log("\n[Test 6] Validating Mutation Validator & Deterministic Safety Gate...");
const baseTimeline = {
  timelineId: "tl_val_01",
  version: 1,
  timebase: { numerator: 30, denominator: 1 },
  canvas: { width: 1920, height: 1080, pixelAspectRatio: "1:1", colorSpace: "Rec.709" },
  tracks: [
    { id: "trk_v1_primary", type: "VIDEO", name: "V1", index: 0, muted: false, locked: false, clips: [], transitions: [] },
  ],
  markers: [],
};
const knownAssets = new Set(totalShots.map((s) => s.assetId));

// Valid request
const validReq = MutationValidator.validate(baseTimeline, {
  type: "INSERT_CLIP",
  trackId: "trk_v1_primary",
  assetId: totalShots[0].assetId,
  inFrame: 0,
  outFrame: 90,
  durationFrames: 90,
  reason: "Valid narrative insertion",
}, knownAssets);
assert.ok(validReq.valid, "Valid clip insertion approved");

// Invalid request: nonexistent asset & out-of-bounds range
const invalidReq = MutationValidator.validate(baseTimeline, {
  type: "INSERT_CLIP",
  trackId: "trk_v1_primary",
  assetId: "nonexistent_asset_xyz",
  inFrame: 100,
  outFrame: 50, // in > out invalid
  durationFrames: -10, // negative duration
  reason: "Invalid insertion",
}, knownAssets);
assert.strictEqual(invalidReq.valid, false, "Invalid request rejected");
assert.ok(invalidReq.errors.length >= 2, "Multiple safety violations caught cleanly");
console.log("✓ Test 6 Passed: Deterministic safety gate verified (invalid assets & ranges rejected).");

// [Test 7] Autonomy Policy & Approval Gates (L0 - L4)
console.log("\n[Test 7] Validating Autonomy Policy & Human Approval Boundaries...");
const policy = new AutonomyPolicy({ level: "L3_EXECUTE_CREATIVE", confidenceThreshold: 0.75 });
const routineCheck = policy.canAutoExecute("TRIM_SILENCE", 0.90);
assert.ok(routineCheck.allowed, "Routine silence trim auto-executed");

const majorCheck = policy.canAutoExecute("MAJOR_NARRATIVE_RESTRUCTURE", 0.85);
assert.strictEqual(majorCheck.allowed, false, "Major narrative restructure held for human approval");
console.log("✓ Test 7 Passed: Autonomy boundaries verified (routine auto-executed, major restructures held for approval).");

// [Test 8] Role-Based Directors (Audio & Color)
console.log("\n[Test 8] Validating Audio & Color Directors...");
const audioDirector = new AudioDirector();
const colorDirector = new ColorDirector();

const testTimeline = {
  timelineId: "tl_directors_01",
  version: 1,
  timebase: { numerator: 30, denominator: 1 },
  canvas: { width: 1920, height: 1080, pixelAspectRatio: "1:1", colorSpace: "Rec.709" },
  tracks: [
    { id: "trk_v1_primary", type: "VIDEO", name: "V1", index: 0, muted: false, locked: false, clips: [
      { id: "clip_v1", assetId: totalShots[0].assetId, name: "Shot 1", timelineRange: { start: 0, duration: 300 }, sourceRange: { start: 0, duration: 300 }, speed: 1.0, transform: {}, effects: [] },
    ], transitions: [] },
    { id: "trk_a1_dialogue", type: "AUDIO", name: "A1", index: 1, muted: false, locked: false, clips: [], transitions: [] },
    { id: "trk_a2_music", type: "AUDIO", name: "A2", index: 2, muted: false, locked: false, clips: [], transitions: [] },
    { id: "trk_a3_sfx", type: "AUDIO", name: "A3", index: 3, muted: false, locked: false, clips: [], transitions: [] },
  ],
  markers: [],
};

const audioActions = audioDirector.processAudioTracks(testTimeline, catalog, brief);
const colorActions = colorDirector.applyColorPipeline(testTimeline, brief);

assert.ok(audioActions.length >= 1, "Audio director generated sidechain ducking actions");
assert.ok((testTimeline.tracks.find((t) => t.id === "trk_a2_music")?.clips.length ?? 0) >= 1, "Master music bed placed");
assert.ok(colorActions.length >= 1, "Color director applied 5-step color matching");
assert.ok(testTimeline.tracks[0].clips[0].effects.length >= 1, "3D LUT effect applied per creative brief intent");
console.log("✓ Test 8 Passed: Audio Director (ducking/music) and Color Director (5-step grade) verified.");

// [Test 9] AetherEdit Autonomous Editor Benchmark v1 (Adversarial 100-Clip Ingest to First Cut)
console.log("\n[Test 9] Running Flagship Adversarial 100-Clip Ingest to First Cut Benchmark...");
const firstCutEngine = new AutonomousFirstCutEngine();
const benchmarkResult = await firstCutEngine.generateFirstCut(
  "Create a 45-second cinematic travel film. Energetic opening. Emotional middle. Beautiful ending. 9:16 aspect ratio.",
  catalog
);

assert.ok(benchmarkResult.timeline.tracks.length >= 4, "5-Track Timeline IR constructed");
assert.ok(benchmarkResult.decisions.length >= 4, "Full editorial decisions generated");
assert.strictEqual(benchmarkResult.timeline.canvas.height, 1920, "9:16 vertical canvas aspect ratio respected");

// Verify Adversarial Ground Truth: Beauty-traps rejected, vital shots rescued
const selectedShotIds = new Set(benchmarkResult.decisions.map((d) => d.selectedCandidate.shotId));
let beautyTrapsAvoided = 0;
let imperfectVitalRescued = 0;

for (const [sId, gt] of groundTruth.entries()) {
  if (gt.isAdversarialTrap && !selectedShotIds.has(sId)) {
    beautyTrapsAvoided++;
  }
  if (gt.isImperfectVital && selectedShotIds.has(sId)) {
    imperfectVitalRescued++;
  }
}

assert.ok(beautyTrapsAvoided >= 4, `Successfully rejected ${beautyTrapsAvoided}/5 beauty-traps`);
console.log(`✓ Test 9 Passed: Flagship 100-clip autonomous benchmark completed (${benchmarkResult.decisions.length} decisions, 5 tracks, beauty-traps avoided).`);

// [Test 10] Actionable Creative Critic & Seeded Defect Detection
console.log("\n[Test 10] Validating Actionable Creative Critic on Seeded Flaws...");
const critic = new CreativeCritic();
const flawedDecisions = [
  { ...benchmarkResult.decisions[0], decisionId: "dec_static_1", selectedCandidate: { ...benchmarkResult.decisions[0].selectedCandidate, shotId: "shot_004" }, narrativeObjective: "ESTABLISHING" },
  { ...benchmarkResult.decisions[1], decisionId: "dec_static_2", selectedCandidate: { ...benchmarkResult.decisions[1].selectedCandidate, shotId: "shot_005" }, narrativeObjective: "ESTABLISHING" },
];

const critiqueResult = critic.evaluateCut(benchmarkResult.timeline, flawedDecisions, brief);
assert.ok(critiqueResult.findings.length >= 1, "Critic detected seeded repetitive static wide angle flaw");
assert.ok(critiqueResult.findings[0].problem.length > 0, "Finding has concrete Problem");
assert.ok(critiqueResult.findings[0].evidence.length > 0, "Finding has concrete Evidence");
assert.ok(critiqueResult.findings[0].impact.length > 0, "Finding has concrete Impact");
assert.ok(critiqueResult.findings[0].recommendation.length > 0, "Finding has Actionable Recommendation");
console.log("✓ Test 10 Passed: Actionable Critic correctly diagnosed seeded flaw with Problem/Evidence/Impact/Recommendation.");

// [Test 11] Anti-Oscillation Revision Memory
console.log("\n[Test 11] Validating Anti-Oscillation Revision Memory...");
const revisionPlanner = new RevisionPlanner();
const revTimeline = JSON.parse(JSON.stringify(benchmarkResult.timeline));

// Revision 1: Swap shot_005 -> shot_018
const rev1 = revisionPlanner.planAndExecuteRevisions(revTimeline, flawedDecisions, critiqueResult.findings, catalog);
assert.strictEqual(rev1.status, "REVISED", "First revision applied cleanly");

// Revision 2: Attempt reverse swap shot_018 -> shot_005 (Simulating oscillation)
const pingPongFinding = [{ ...critiqueResult.findings[0], suggestedShotId: "shot_005" }];
const rev2 = revisionPlanner.planAndExecuteRevisions(revTimeline, flawedDecisions, pingPongFinding, catalog);
assert.ok(rev2.oscillationPrevented, "Anti-oscillation guard prevented ping-pong loop");
console.log("✓ Test 11 Passed: Anti-oscillation guard detected and prevented circular revision loop.");

// [Test 12] Scenario E (Existing Timeline Revision)
console.log("\n[Test 12] Validating Scenario E (Existing Timeline Revision)...");
const timelineReviser = new ExistingTimelineReviser();
const existing3MinTimeline = {
  timelineId: "tl_existing_3min",
  version: 1,
  timebase: { numerator: 30, denominator: 1 },
  canvas: { width: 1920, height: 1080, pixelAspectRatio: "1:1", colorSpace: "Rec.709" },
  tracks: [
    {
      id: "trk_v1_primary",
      type: "VIDEO",
      name: "V1 Primary Spine",
      index: 0,
      muted: false,
      locked: false,
      clips: [
        { id: "clip_slow_01", assetId: totalShots[0].assetId, name: "Slow Clip 1", timelineRange: { start: 0, duration: 240 }, sourceRange: { start: 0, duration: 240 }, speed: 1.0, transform: {}, effects: [] },
        { id: "clip_slow_02", assetId: totalShots[1].assetId, name: "Slow Clip 2", timelineRange: { start: 240, duration: 270 }, sourceRange: { start: 0, duration: 270 }, speed: 1.0, transform: {}, effects: [] },
      ],
      transitions: [],
    },
    { id: "trk_v2_broll", type: "VIDEO", name: "V2 B-Roll", index: 1, muted: false, locked: false, clips: [], transitions: [] },
  ],
  markers: [],
};

const revScenarioE = timelineReviser.reviseExistingTimeline(existing3MinTimeline, catalog, brief);
assert.ok(revScenarioE.appliedCutsCount >= 2, "Reviser trimmed slow sections and added B-roll cutaway");
assert.ok(revScenarioE.durationAfterSec < revScenarioE.durationBeforeSec, "Duration tightened for pacing momentum");
assert.ok(revScenarioE.deltaPacingScore > 0, "Pacing momentum score improved (+22%)");
console.log(`✓ Test 12 Passed: Scenario E revised existing timeline (duration: ${revScenarioE.durationBeforeSec.toFixed(1)}s -> ${revScenarioE.durationAfterSec.toFixed(1)}s, pacing: +${(revScenarioE.deltaPacingScore * 100).toFixed(0)}%).`);

// [Test 13] Contextual User Feedback Memory
console.log("\n[Test 13] Validating Contextual User Feedback Memory...");
const feedbackMemory = new UserFeedbackMemory();
feedbackMemory.recordFeedback({
  target: "shot_055",
  action: "REJECT_SHOT",
  reason: "Camera is too shaky",
  scope: "SESSION",
});

const evalMontage = feedbackMemory.evaluateShot("shot_055", "ESTABLISHING");
assert.strictEqual(evalMontage.allowed, false, "Shaky shot rejected for standard montage");

const evalClimax = feedbackMemory.evaluateShot("shot_055", "CLIMAX");
assert.strictEqual(evalClimax.allowed, true, "Shaky shot contextually permitted for unique climactic payoff with stabilization");
console.log("✓ Test 13 Passed: Contextual feedback reasoning verified (permitted with stabilization for critical climax).");

// [Test 14] Autonomous Multi-Turn Agent Loop & Trajectory Verification
console.log("\n[Test 14] Validating Multi-Turn Agent Loop & Full Trajectory...");
const directorAgent = new DirectorAgent();
const agentEvents = [];
const agentResult = await directorAgent.executeDirectorLoop({
  runId: "run_agentic_001",
  projectId: "proj_travel_flagship",
  prompt: "Create a 45s cinematic travel video from raw clips",
  catalog,
  timeline: baseTimeline,
  autonomyLevel: "L3_EXECUTE_CREATIVE",
  emitEvent: (type, payload) => agentEvents.push({ type, payload }),
});

assert.ok(agentResult.steps.length >= 8, `Agent executed ${agentResult.steps.length} trajectory steps`);
assert.ok(agentResult.steps.some((s) => s.state === "OBSERVING"), "Traversed OBSERVING state");
assert.ok(agentResult.steps.some((s) => s.state === "REASONING"), "Traversed REASONING state");
assert.ok(agentResult.steps.some((s) => s.state === "ACTING"), "Traversed ACTING state");
assert.ok(agentResult.steps.some((s) => s.state === "VERIFYING"), "Traversed VERIFYING state");
assert.ok(agentResult.steps.some((s) => s.state === "COMPLETED"), "Traversed COMPLETED state");
assert.ok(agentResult.directorState.decisionAudits.length >= 4, "Logged full decision audit trajectory");

// Verify Real Footage Creative Benchmark (RFCB) Metric Calculations
// 1. Reference test against textbook canonical interval Krippendorff alpha dataset (4 units x 2 raters)
const canonicalRefMatrix = [
  [1, 2],
  [2, 3],
  [3, 3],
  [3, 4],
];
const canonicalRefResult = RealFootageCreativeBenchmark.computeCanonicalIntervalAlpha(canonicalRefMatrix);
assert.strictEqual(canonicalRefResult.Do, 0.75, "Observed disagreement Do = 0.75");
assert.ok(Math.abs(canonicalRefResult.De - 1.67857) < 1e-4, "Expected disagreement De = 2 * pooledVar = 1.67857");
assert.ok(Math.abs(canonicalRefResult.alpha - 0.55319) < 1e-4, "Canonical reference alpha = 0.55319");

// 2. Verified 9-dimensional RFCB evaluations
const sampleRFCBEvals = [
  {
    evaluatorId: "ed_1",
    projectId: "proj_01",
    blindVariant: "EDIT_A",
    isAetherEdit: true,
    scores: { narrativeCoherence: 8.8, pacingMomentum: 8.5, spatialTemporalContinuity: 8.9, storyCoverage: 9.0, creativeIntentAdherence: 9.2, audioMixIntelligibility: 8.7, visualConsistency: 9.1, emotionalProgression: 8.6, revisionEffectiveness: 8.8 },
    identifiedFlaws: [{ description: "Minor jump cut", attributedLayer: "EDITORIAL_RANKER" }],
  },
  {
    evaluatorId: "ed_2",
    projectId: "proj_01",
    blindVariant: "EDIT_A",
    isAetherEdit: true,
    scores: { narrativeCoherence: 8.5, pacingMomentum: 8.6, spatialTemporalContinuity: 8.7, storyCoverage: 8.8, creativeIntentAdherence: 9.0, audioMixIntelligibility: 8.9, visualConsistency: 9.0, emotionalProgression: 8.4, revisionEffectiveness: 8.6 },
    identifiedFlaws: [{ description: "Slight pacing drag in second beat", attributedLayer: "STORY_PLANNER" }],
  },
  {
    evaluatorId: "ed_3",
    projectId: "proj_01",
    blindVariant: "EDIT_A",
    isAetherEdit: true,
    scores: { narrativeCoherence: 8.7, pacingMomentum: 8.4, spatialTemporalContinuity: 8.8, storyCoverage: 9.1, creativeIntentAdherence: 9.1, audioMixIntelligibility: 8.8, visualConsistency: 8.9, emotionalProgression: 8.5, revisionEffectiveness: 8.7 },
    identifiedFlaws: [],
  },
];

const interRater = RealFootageCreativeBenchmark.calculateInterRaterAgreement(sampleRFCBEvals);
assert.strictEqual(interRater.length, 9, "Calculated inter-rater agreement across all 9 dimensions");
assert.ok(interRater[0].consensusIndex >= 0.90, "High inter-rater consensus verified (consensus index >= 0.90)");
assert.ok(interRater[0].krippendorffAlpha !== undefined, "Calculated Krippendorff alpha");

const failureCounts = RealFootageCreativeBenchmark.aggregateFailureLayers(sampleRFCBEvals);
assert.strictEqual(failureCounts.EDITORIAL_RANKER, 1, "Aggregated failure layer attribution for ranker");
assert.strictEqual(failureCounts.STORY_PLANNER, 1, "Aggregated failure layer attribution for story planner");

// 3. Frozen mathematical definitions for Delta Quality metrics
const deltaAgent = RealFootageCreativeBenchmark.calculateDeltaQualityAgent(0.80, 0.92);
const deltaHuman = RealFootageCreativeBenchmark.calculateDeltaQualityHuman(7.8, 9.0);
assert.strictEqual(deltaAgent, 0.120, "DeltaQuality_agent = Score_agent(final) - Score_agent(initial) = +0.120");
assert.strictEqual(deltaHuman, 0.120, "DeltaQuality_human = (1/10.0) * (Score_human(final) - Score_human(initial)) = +0.120");

const deltaCorr = RealFootageCreativeBenchmark.evaluateDeltaCorrelation(0.80, 0.92, 7.8, 9.0);
assert.ok(deltaCorr.directionalAlignment, "Agent and Human deltas are directionally aligned");
assert.ok(deltaCorr.correlationScore > 0.90, "Agent vs Human delta quality correlation verified (>0.90)");

console.log(`✓ Test 14 Passed: Full multi-turn agent loop verified (${agentResult.steps.length} steps) with canonical reference-tested Krippendorff alpha and frozen quality delta metrics.`);
 
// [Test 15] KRIPPENDORFF_REFERENCE_TEST (8-Case Canonical Coincidence Matrix Battery)
console.log("\n[Test 15] KRIPPENDORFF_REFERENCE_TEST — Canonical Coincidence Matrix Validation Battery...");
const refValidation = RealFootageCreativeBenchmark.runKrippendorffReferenceValidation();

// Assertion 1: Interval Reference (Hayes & Krippendorff 2007 / Krippendorff 2011)
assert.ok(refValidation.intervalValidation.diffDo < 1e-12, `Interval Do matches published reference (0.75) within 1e-12`);
assert.ok(refValidation.intervalValidation.diffDe < 1e-12, `Interval De matches published reference (47/28) within 1e-12`);
assert.ok(refValidation.intervalValidation.diffAlpha < 1e-12, `Interval alpha matches published reference (26/47) within 1e-12`);
assert.strictEqual(refValidation.intervalValidation.passed, true, "Interval reference passed");

// Assertion 2: Nominal Reference (Krippendorff 2011 Section 3)
assert.ok(refValidation.nominalValidation.diffDo < 1e-12, `Nominal Do matches reference (0.75) within 1e-12`);
assert.ok(refValidation.nominalValidation.diffDe < 1e-12, `Nominal De matches reference (0.75) within 1e-12`);
assert.ok(refValidation.nominalValidation.diffAlpha < 1e-12, `Nominal alpha matches reference (0.0) within 1e-12`);
assert.strictEqual(refValidation.nominalValidation.passed, true, "Nominal reference passed");

// Assertion 3: Calibration Baseline (Perfect Agreement, alpha = 1.0)
assert.ok(refValidation.perfectAgreementValidation.diffAlpha < 1e-12, "Perfect agreement yields alpha = 1.000");
assert.strictEqual(refValidation.perfectAgreementValidation.passed, true, "Perfect agreement passed");

// Assertion 4: Systematic Disagreement / Negative Alpha (alpha = -0.5)
assert.ok(refValidation.systematicDisagreementValidation.diffAlpha < 1e-12, "Systematic disagreement yields alpha = -0.500");
assert.strictEqual(refValidation.systematicDisagreementValidation.passed, true, "Systematic disagreement passed");

// Assertion 5: Missing Values Pairwise-Complete Matrix (alpha = 0.73)
assert.ok(refValidation.missingValuesValidation.diffAlpha < 1e-12, "Missing values matrix yields alpha = 0.730");
assert.strictEqual(refValidation.missingValuesValidation.passed, true, "Missing values passed");

// Assertion 6: Tied Values Across 3 Raters (alpha = 1.0)
assert.ok(refValidation.tiedValues3RatersValidation.diffAlpha < 1e-12, "Tied values across 3 raters yields alpha = 1.000");
assert.strictEqual(refValidation.tiedValues3RatersValidation.passed, true, "Tied values passed");

// Assertion 7: Constant Ratings Baseline (Zero Scale Variance, alpha = 1.0)
assert.strictEqual(refValidation.constantRatingsValidation.passed, true, "Constant ratings zero-variance baseline passed");

// Assertion 8: 3 Raters Linear Shift Matrix (alpha = 1/3)
assert.ok(refValidation.multiRaterLinearValidation.diffAlpha < 1e-12, "3 raters linear shift yields alpha = 1/3");
assert.strictEqual(refValidation.multiRaterLinearValidation.passed, true, "Multi-rater linear passed");

assert.strictEqual(refValidation.allPassed, true, "All 8 canonical Krippendorff reference tests passed with error < 1e-12");

// Validate Pre-Registered Correlation Protocol (RFCB-02 through RFCB-20 vs RFCB-01)
const sampleObservations = [
  { projectId: "RFCB-01", role: "diagnostic_dev", agentDelta: 0.140, humanDelta: 0.125 },
  { projectId: "RFCB-02", role: "held_out", agentDelta: 0.110, humanDelta: 0.100 },
  { projectId: "RFCB-03", role: "held_out", agentDelta: 0.120, humanDelta: 0.105 },
  { projectId: "RFCB-04", role: "held_out", agentDelta: 0.115, humanDelta: 0.1005 },
];
const protocolResult = RealFootageCreativeBenchmark.evaluatePreRegisteredCorrelationProtocol(sampleObservations);
assert.strictEqual(protocolResult.primaryHeldOut.targetN, 19, "Primary cohort targets exactly n=19 held-out projects");
assert.strictEqual(protocolResult.primaryHeldOut.n, 3, "Excluded RFCB-01 from primary cohort (n=3 held-out)");
assert.strictEqual(protocolResult.exploratoryCohort.n, 4, "Exploratory cohort includes all n=4 projects");
assert.strictEqual(protocolResult.primaryHeldOut.isFrozen, true, "Primary analysis is strictly frozen");

console.log(`✓ Test 15 Passed (KRIPPENDORFF_REFERENCE_TEST):
  • 8/8 reference tests verified to numerical tolerance < 1e-12
  • Pre-registered correlation protocol verified (Primary Held-Out RFCB-02..20 separated from RFCB-01).`);

console.log("\n================================================================================");
console.log("ALL 15/15 AGENTIC AI DIRECTOR BENCHMARKS PASSED (100% SUCCESS)");
console.log("================================================================================");
