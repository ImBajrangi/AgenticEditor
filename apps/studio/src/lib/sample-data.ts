import { TimelineIR } from "@aetheredit/timeline-ir";
import { WorkflowGraph } from "@aetheredit/workflow-engine";

export interface MediaAsset {
  id: string;
  title: string;
  type: "VIDEO" | "AUDIO" | "IMAGE";
  durationFrames: number;
  durationSec: number;
  resolution: string;
  fps: number;
  thumbnailUrl: string;
  tags: string[];
  scenes: Array<{
    startFrame: number;
    endFrame: number;
    shotType: string;
    motion: string;
    score: number;
  }>;
}

export const SAMPLE_ASSETS: MediaAsset[] = [
  {
    id: "ast_mountain_mist",
    title: "Alpine Misty Sunrise (4K ProRes)",
    type: "VIDEO",
    durationFrames: 900,
    durationSec: 30,
    resolution: "3840x2160",
    fps: 30,
    thumbnailUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80",
    tags: ["Landscape", "Cinematic", "Mystery", "Aerial"],
    scenes: [
      { startFrame: 0, endFrame: 360, shotType: "Extreme Wide", motion: "Push In Slow", score: 0.94 },
      { startFrame: 360, endFrame: 900, shotType: "Wide Vista", motion: "Pan Right", score: 0.91 },
    ],
  },
  {
    id: "ast_beach_sunset",
    title: "Golden Hour Coastal Waves",
    type: "VIDEO",
    durationFrames: 750,
    durationSec: 25,
    resolution: "3840x2160",
    fps: 30,
    thumbnailUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80",
    tags: ["Sunset", "Ocean", "Warmth", "Drone"],
    scenes: [
      { startFrame: 0, endFrame: 400, shotType: "Wide", motion: "Forward Orbit", score: 0.96 },
      { startFrame: 400, endFrame: 750, shotType: "Medium", motion: "Tracking Left", score: 0.89 },
    ],
  },
  {
    id: "ast_surfer_action",
    title: "Surfer Barrel Wave Action",
    type: "VIDEO",
    durationFrames: 600,
    durationSec: 20,
    resolution: "3840x2160",
    fps: 30,
    thumbnailUrl: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600&auto=format&fit=crop&q=80",
    tags: ["Action", "Speed", "Water", "High Energy"],
    scenes: [
      { startFrame: 0, endFrame: 280, shotType: "Close Up", motion: "Dynamic Handheld", score: 0.98 },
      { startFrame: 280, endFrame: 600, shotType: "Medium", motion: "Whip Pan Right", score: 0.93 },
    ],
  },
  {
    id: "ast_podcast_host",
    title: "Studio Podcast Interview - Host (4K)",
    type: "VIDEO",
    durationFrames: 1800,
    durationSec: 60,
    resolution: "3840x2160",
    fps: 30,
    thumbnailUrl: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600&auto=format&fit=crop&q=80",
    tags: ["Interview", "Talking Head", "Studio", "Dialogue"],
    scenes: [
      { startFrame: 0, endFrame: 900, shotType: "Medium Close Up", motion: "Static", score: 0.92 },
      { startFrame: 900, endFrame: 1800, shotType: "Close Up", motion: "Subtle Push", score: 0.95 },
    ],
  },
  {
    id: "ast_cinematic_music",
    title: "Cinematic Ambient Horizon (Master WAV)",
    type: "AUDIO",
    durationFrames: 2700,
    durationSec: 90,
    resolution: "48kHz 24-bit",
    fps: 30,
    thumbnailUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
    tags: ["Soundtrack", "Ambient", "Orchestral", "Epic"],
    scenes: [],
  },
];

export const SAMPLE_TIMELINE_TRAVEL: TimelineIR = {
  timelineId: "tl_travel_cinematic_90s",
  version: 1,
  timebase: { numerator: 30, denominator: 1 },
  canvas: {
    width: 1920,
    height: 1080,
    pixelAspectRatio: "1:1",
    colorSpace: "Rec.709",
  },
  tracks: [
    {
      id: "trk_v1_primary",
      type: "VIDEO",
      name: "V1: Primary A-Roll",
      index: 0,
      muted: false,
      locked: false,
      clips: [
        {
          id: "clip_01",
          assetId: "ast_mountain_mist",
          name: "Alpine Misty Sunrise",
          timelineRange: { start: 0, duration: 180 },
          sourceRange: { in: 0, out: 180 },
          speed: 1.0,
          transform: { position: { x: 0, y: 0 }, scale: { x: 1, y: 1 }, rotation: 0, opacity: 1 },
          effects: [
            {
              id: "fx_lut_01",
              pluginId: "builtin_lut_kodak",
              enabled: true,
              parameters: { lut: "Warm_Filmic_5207.cube", intensity: 0.85 },
            },
          ],
        },
        {
          id: "clip_02",
          assetId: "ast_beach_sunset",
          name: "Golden Hour Coastal Waves",
          timelineRange: { start: 180, duration: 240 },
          sourceRange: { in: 50, out: 290 },
          speed: 1.25,
          transform: { position: { x: 0, y: 0 }, scale: { x: 1, y: 1 }, rotation: 0, opacity: 1 },
          effects: [],
        },
        {
          id: "clip_03",
          assetId: "ast_surfer_action",
          name: "Surfer Barrel Wave Action",
          timelineRange: { start: 420, duration: 210 },
          sourceRange: { in: 20, out: 230 },
          speed: 1.5,
          transform: { position: { x: 0, y: 0 }, scale: { x: 1.05, y: 1.05 }, rotation: 0, opacity: 1 },
          effects: [],
        },
      ],
      transitions: [
        {
          id: "tr_01",
          type: "CROSS_DISSOLVE",
          durationFrames: 24,
          fromClipId: "clip_01",
          toClipId: "clip_02",
          alignment: "CENTER_ON_EDIT",
        },
      ],
    },
    {
      id: "trk_v2_broll",
      type: "VIDEO",
      name: "V2: B-Roll & Inserts",
      index: 1,
      muted: false,
      locked: false,
      clips: [],
      transitions: [],
    },
    {
      id: "trk_v3_graphics",
      type: "GRAPHICS",
      name: "V3: Titles & Lower Thirds",
      index: 2,
      muted: false,
      locked: false,
      clips: [],
      transitions: [],
    },
    {
      id: "trk_a1_dialogue",
      type: "AUDIO",
      name: "A1: Dialogue & Ambience",
      index: 3,
      muted: false,
      locked: false,
      volume: 0,
      clips: [],
      transitions: [],
    },
    {
      id: "trk_a2_music",
      type: "AUDIO",
      name: "A2: Master Music Bed",
      index: 4,
      muted: false,
      locked: false,
      volume: -4,
      clips: [
        {
          id: "clip_music_01",
          assetId: "ast_cinematic_music",
          name: "Cinematic Horizon Theme",
          timelineRange: { start: 0, duration: 630 },
          sourceRange: { in: 0, out: 630 },
          speed: 1.0,
          transform: { position: { x: 0, y: 0 }, scale: { x: 1, y: 1 }, rotation: 0, opacity: 1 },
          effects: [
            {
              id: "fx_ducking",
              pluginId: "builtin_sidechain_duck",
              enabled: true,
              parameters: { targetLufs: -23, attenuationDb: -14 },
            },
          ],
        },
      ],
      transitions: [],
    },
  ],
  markers: [
    { id: "m1", frame: 180, label: "Reveal Vista", color: "#3b82f6" },
    { id: "m2", frame: 420, label: "Energy Drop / Climax", color: "#ef4444" },
  ],
};

export const SAMPLE_WORKFLOW_TRAVEL: WorkflowGraph = {
  id: "wf_travel_master",
  name: "Cinematic Travel Film Orchestrator",
  version: 1,
  nodes: [
    {
      id: "node_1_ingest",
      type: "TRIGGER_UPLOAD",
      label: "Ingest Drone Clips",
      category: "TRIGGER",
      position: { x: 80, y: 180 },
      parameters: { autoTranscodeProxy: true, targetFps: 30 },
      inputs: [],
      outputs: [{ name: "rawMedia", type: "MediaAsset[]" }],
    },
    {
      id: "node_2_vision",
      type: "ANALYSIS_SCENE_DETECTION",
      label: "TransNetV2 & OpenCLIP",
      category: "ANALYSIS",
      position: { x: 340, y: 180 },
      parameters: { model: "TransNetV2-CUDA", embeddingDim: 512 },
      inputs: [{ name: "rawMedia", type: "MediaAsset[]" }],
      outputs: [{ name: "scenes", type: "SceneCatalog" }],
    },
    {
      id: "node_3_story",
      type: "AI_AGENT_STORY",
      label: "Story & Narrative Agent",
      category: "AI",
      position: { x: 620, y: 180 },
      parameters: { targetDurationSec: 90, tone: "Mysterious to Epic Peak" },
      inputs: [{ name: "scenes", type: "SceneCatalog" }],
      outputs: [{ name: "productionPlan", type: "ProductionPlan" }],
    },
    {
      id: "node_4_human_gate",
      type: "CONTROL_HUMAN_APPROVAL",
      label: "Director Creative Sign-off",
      category: "CONTROL",
      position: { x: 900, y: 180 },
      parameters: { prompt: "Review proposed 90s shot pacing and cut points before color grading." },
      inputs: [{ name: "productionPlan", type: "ProductionPlan" }],
      outputs: [{ name: "approvedPlan", type: "ProductionPlan" }],
    },
    {
      id: "node_5_color",
      type: "CREATIVE_COLOR_GRADE",
      label: "Warm Kodak 5207 LUT",
      category: "CREATIVE",
      position: { x: 1180, y: 180 },
      parameters: { lut: "Warm_Filmic_5207.cube", skinToneProtect: true },
      inputs: [{ name: "approvedPlan", type: "ProductionPlan" }],
      outputs: [{ name: "timelineIr", type: "TimelineIR" }],
    },
    {
      id: "node_6_render",
      type: "OUTPUT_RENDER_MASTER",
      label: "FFmpeg Hardware Master",
      category: "OUTPUT",
      position: { x: 1460, y: 180 },
      parameters: { codec: "VIDEOTOOLBOX_H264", crf: 18, preset: "hq" },
      inputs: [{ name: "timelineIr", type: "TimelineIR" }],
      outputs: [{ name: "videoMasterUrl", type: "string" }],
    },
  ],
  edges: [
    { id: "e1", sourceNodeId: "node_1_ingest", sourceOutputPort: "rawMedia", targetNodeId: "node_2_vision", targetInputPort: "rawMedia" },
    { id: "e2", sourceNodeId: "node_2_vision", sourceOutputPort: "scenes", targetNodeId: "node_3_story", targetInputPort: "scenes" },
    { id: "e3", sourceNodeId: "node_3_story", sourceOutputPort: "productionPlan", targetNodeId: "node_4_human_gate", targetInputPort: "productionPlan" },
    { id: "e4", sourceNodeId: "node_4_human_gate", sourceOutputPort: "approvedPlan", targetNodeId: "node_5_color", targetInputPort: "approvedPlan" },
    { id: "e5", sourceNodeId: "node_5_color", sourceOutputPort: "timelineIr", targetNodeId: "node_6_render", targetInputPort: "timelineIr" },
  ],
};
