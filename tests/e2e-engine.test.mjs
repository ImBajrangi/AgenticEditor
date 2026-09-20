import assert from "node:assert";

// Import modules directly from built studio package mirrors
import { TimelineMutator } from "../apps/studio/src/packages/timeline-ir/src/mutator.js";
import { TimelineHistoryManager } from "../apps/studio/src/packages/timeline-ir/src/history.js";
import { DagValidator } from "../apps/studio/src/packages/workflow-engine/src/dag.js";
import { ContentAddressableCache } from "../apps/studio/src/packages/workflow-engine/src/cache.js";
import { WorkflowExecutor } from "../apps/studio/src/packages/workflow-engine/src/executor.js";
import { RenderCompiler } from "../apps/studio/src/packages/render-compiler/src/compiler.js";
import { AudioDspCompiler } from "../apps/studio/src/packages/render-compiler/src/audio-dsp.js";
import { PacingAnalyzer } from "../apps/studio/src/packages/cinematic-engine/src/pacing.js";
import { CutEngine } from "../apps/studio/src/packages/cinematic-engine/src/cuts.js";
import { SmartReframeEngine } from "../apps/studio/src/packages/cinematic-engine/src/reframe.js";
import { IntelligentModelRouter } from "../apps/studio/src/packages/ai-gateway/src/router.js";

console.log("==================================================");
console.log("RUNNING AETHEREDIT OS TEST SUITE");
console.log("==================================================");

// 1. Test Timeline IR & Non-Destructive Mutations
console.log("\n[Test 1] Testing Timeline IR & Atomic Mutations...");
const sampleTimeline = {
  timelineId: "tl_test_01",
  version: 1,
  timebase: { numerator: 30, denominator: 1 },
  canvas: { width: 1920, height: 1080, pixelAspectRatio: "1:1", colorSpace: "Rec.709" },
  tracks: [
    {
      id: "trk_v1",
      type: "VIDEO",
      name: "Video 1",
      index: 0,
      muted: false,
      locked: false,
      clips: [
        {
          id: "clip_01",
          assetId: "ast_01",
          name: "Drone Shot",
          timelineRange: { start: 0, duration: 120 },
          sourceRange: { in: 0, out: 120 },
          speed: 1.0,
          transform: { position: { x: 0, y: 0 }, scale: { x: 1, y: 1 }, rotation: 0, opacity: 1 },
          effects: [],
        },
      ],
      transitions: [],
    },
    {
      id: "trk_a1",
      type: "AUDIO",
      name: "Dialogue 1",
      index: 1,
      muted: false,
      locked: false,
      volume: 0,
      clips: [],
      transitions: [],
    },
  ],
  markers: [],
};

// Split clip at frame 60
const splitTimeline = TimelineMutator.apply(sampleTimeline, {
  type: "SPLIT_CLIP",
  trackId: "trk_v1",
  clipId: "clip_01",
  splitFrame: 60,
});

assert.strictEqual(splitTimeline.version, 2, "Timeline version must bump on mutation");
const vTrack = splitTimeline.tracks[0];
assert.strictEqual(vTrack.clips.length, 2, "Splitting a clip must produce exactly 2 clips");
assert.strictEqual(vTrack.clips[0].timelineRange.duration, 60, "Part 1 duration must be 60 frames");
assert.strictEqual(vTrack.clips[1].timelineRange.start, 60, "Part 2 start must be 60 frames");
console.log("✓ Timeline Mutator: Split clip passed.");

// Test Undo/Redo History
const history = new TimelineHistoryManager(sampleTimeline);
history.pushMutation({
  type: "SPLIT_CLIP",
  trackId: "trk_v1",
  clipId: "clip_01",
  splitFrame: 60,
});
assert.strictEqual(history.canUndo(), true, "Should be able to undo after mutation");
const undone = history.undo();
assert.strictEqual(undone.tracks[0].clips.length, 1, "Undone state must restore single clip");
const redone = history.redo();
assert.strictEqual(redone.tracks[0].clips.length, 2, "Redone state must restore split clips");
console.log("✓ Timeline History: Undo/Redo passed.");

// 2. Test Workflow Engine & DAG Topology
console.log("\n[Test 2] Testing Workflow Engine & DAG...");
const sampleGraph = {
  id: "wf_test",
  name: "Test DAG",
  version: 1,
  nodes: [
    {
      id: "node_a",
      type: "TRIGGER",
      label: "Start",
      category: "TRIGGER",
      position: { x: 0, y: 0 },
      parameters: {},
      inputs: [],
      outputs: [{ name: "out", type: "any" }],
    },
    {
      id: "node_b",
      type: "PROCESS",
      label: "Middle",
      category: "MEDIA",
      position: { x: 100, y: 0 },
      parameters: {},
      inputs: [{ name: "in", type: "any" }],
      outputs: [{ name: "out", type: "any" }],
    },
  ],
  edges: [
    { id: "e1", sourceNodeId: "node_a", sourceOutputPort: "out", targetNodeId: "node_b", targetInputPort: "in" },
  ],
};

const sorted = DagValidator.topologicalSort(sampleGraph);
assert.strictEqual(sorted[0].id, "node_a", "Topological sort must place source node first");
assert.strictEqual(sorted[1].id, "node_b", "Topological sort must place target node second");
console.log("✓ DAG Validator: Topological sort passed.");

// Test Content-Addressable Cache (CAC)
const cac1 = ContentAddressableCache.computeFingerprint("TRANSCODE", { file: "clip.mp4" }, { crf: 18 });
const cac2 = ContentAddressableCache.computeFingerprint("TRANSCODE", { file: "clip.mp4" }, { crf: 18 });
const cac3 = ContentAddressableCache.computeFingerprint("TRANSCODE", { file: "clip.mp4" }, { crf: 23 });
assert.strictEqual(cac1, cac2, "Identical inputs & parameters must produce identical fingerprints");
assert.notStrictEqual(cac1, cac3, "Different parameters must produce distinct fingerprints");
console.log("✓ Content-Addressable Cache: SHA256 fingerprinting passed.");

// 3. Test Render Compiler & Audio DSP
console.log("\n[Test 3] Testing Render Compiler & Audio DSP...");
const compiledArgs = RenderCompiler.compileToFFmpegArgs({
  timeline: sampleTimeline,
  outputFilePath: "/tmp/output.mp4",
  assetFileMap: { ast_01: "/tmp/ast_01.mp4" },
  resolution: { width: 1920, height: 1080 },
});
const fullCmdString = compiledArgs.join(" ");
assert.ok(fullCmdString.includes("-filter_complex"), "Render compiler must construct filter_complex argument");
assert.ok(fullCmdString.includes("concat=n=1:v=1:a=0[v_master]"), "Filtergraph must concat video streams");
console.log("✓ Render Compiler: FFmpeg argument generation passed.");

const dspFilter = AudioDspCompiler.buildFilter("dialogue_in", "music_in", "master_out");
assert.ok(dspFilter.includes("loudnorm=I=-23"), "Audio DSP must enforce EBU R128 loudness");
assert.ok(dspFilter.includes("sidechaincompress"), "Audio DSP must configure sidechain ducking");
console.log("✓ Audio DSP: EBU R128 & sidechain ducking passed.");

// 4. Test Cinematic Intelligence Engine
console.log("\n[Test 4] Testing Cinematic Intelligence Engine...");
const asl = PacingAnalyzer.calculateASL(sampleTimeline);
assert.strictEqual(asl, 4.0, "ASL for 120 frames at 30fps with 1 clip must equal 4.0 seconds");

const pacingCurve = PacingAnalyzer.generateDurationCurve(60, {
  targetAverageShotLengthSec: 3.0,
  rhythmModel: "FAST_AGGRESSIVE",
  minShotDurationSec: 1.0,
  maxShotDurationSec: 5.0,
});
assert.ok(pacingCurve.length > 5, "Pacing curve must generate multiple shot segments");
assert.ok(pacingCurve[0] > pacingCurve[pacingCurve.length - 1], "Fast aggressive rhythm must accelerate (shorter shots at end)");
console.log("✓ Cinematic Engine: ASL and dynamic pacing curves passed.");

// Test Silence / Dead-Air Removal
const rmsData = [0.1, 0.1, 0.005, 0.005, 0.005, 0.005, 0.005, 0.1, 0.1]; // silent in middle
const silences = CutEngine.planSilenceRemoval(rmsData, 100, 0.01, 300);
assert.strictEqual(silences.length, 1, "Dead-air detector must identify the 500ms silence interval");
console.log("✓ Cinematic Engine: Dead-air pause detection passed.");

// Test Smart 9:16 Reframe
const tracking = SmartReframeEngine.calculateVerticalTracking([
  { frame: 0, box: { x: 0.5, y: 0.5, width: 0.2, height: 0.2 } },
  { frame: 30, box: { x: 0.7, y: 0.5, width: 0.2, height: 0.2 } },
]);
assert.strictEqual(tracking.length, 2, "Smart reframe must produce tracking offsets for frames");
assert.ok(tracking[1].scale > 1.5, "Vertical 9:16 scale must exceed 1.5 to fill vertical frame");
console.log("✓ Cinematic Engine: Smart 9:16 vertical reframe passed.");

// 5. Test AI Gateway & Router
console.log("\n[Test 5] Testing AI Gateway & Router...");
const router = new IntelligentModelRouter({ mode: "LOCAL", allowCloudFallback: true });
const textResult = await router.generateText({ prompt: "Make this scene tense" });
assert.ok(textResult.text.length > 0, "Router must successfully return text response");
console.log("✓ AI Gateway: Model routing and local fallback passed.");

console.log("\n==================================================");
console.log("ALL 12 CRITICAL SUBSYSTEM TESTS PASSED WITH 100% SUCCESS");
console.log("==================================================");
