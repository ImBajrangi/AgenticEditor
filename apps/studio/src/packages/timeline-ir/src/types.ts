export type TrackType = "VIDEO" | "AUDIO" | "GRAPHICS" | "EFFECTS" | "SUBTITLE";

export interface RationalTime {
  numerator: number;
  denominator: number;
}

export interface CanvasSettings {
  width: number;
  height: number;
  pixelAspectRatio: "1:1" | "16:9" | "4:3" | "9:16";
  colorSpace: "Rec.709" | "Rec.2020" | "DCI-P3";
}

export interface TimeRange {
  start: number; // In frames
  duration: number; // In frames
}

export interface SourceTimeRange {
  in: number; // In frames
  out: number; // In frames
}

export interface Keyframe<T = unknown> {
  frame: number;
  value: T;
  interpolation: "LINEAR" | "BEZIER" | "HOLD";
}

export interface TransformParameters {
  position: { x: number; y: number };
  scale: { x: number; y: number };
  rotation: number; // degrees
  opacity: number; // 0.0 to 1.0
}

export interface ClipEffect {
  id: string;
  pluginId: string;
  enabled: boolean;
  parameters: Record<string, unknown>;
  keyframes?: Record<string, Keyframe<unknown>[]>;
}

export interface TimelineClip {
  id: string;
  assetId: string;
  name: string;
  timelineRange: TimeRange;
  sourceRange: SourceTimeRange;
  speed: number;
  transform: TransformParameters;
  effects: ClipEffect[];
}

export interface TimelineTransition {
  id: string;
  type: "CROSS_DISSOLVE" | "DIP_TO_BLACK" | "WHIP_PAN" | "LIGHT_LEAK";
  durationFrames: number;
  fromClipId: string;
  toClipId: string;
  alignment: "START_ON_EDIT" | "CENTER_ON_EDIT" | "END_ON_EDIT";
}

export interface TimelineTrack {
  id: string;
  type: TrackType;
  name: string;
  index: number;
  muted: boolean;
  locked: boolean;
  volume?: number; // dB offset (-60 to +12)
  pan?: number; // -1.0 (Left) to 1.0 (Right)
  clips: TimelineClip[];
  transitions: TimelineTransition[];
}

export interface TimelineMarker {
  id: string;
  frame: number;
  label: string;
  color: string;
}

export interface TimelineIR {
  timelineId: string;
  version: number;
  timebase: RationalTime;
  canvas: CanvasSettings;
  tracks: TimelineTrack[];
  markers: TimelineMarker[];
}

// Atomic Mutation Operations
export type TimelineMutationOp =
  | {
      type: "INSERT_CLIP";
      trackId: string;
      clip: TimelineClip;
    }
  | {
      type: "TRIM_CLIP";
      trackId: string;
      clipId: string;
      newTimelineRange?: Partial<TimeRange>;
      newSourceRange?: Partial<SourceTimeRange>;
    }
  | {
      type: "SPLIT_CLIP";
      trackId: string;
      clipId: string;
      splitFrame: number; // Global timeline frame where cut happens
    }
  | {
      type: "REMOVE_CLIP";
      trackId: string;
      clipId: string;
    }
  | {
      type: "SET_CLIP_TRANSFORM";
      trackId: string;
      clipId: string;
      transform: Partial<TransformParameters>;
    }
  | {
      type: "APPLY_CLIP_EFFECT";
      trackId: string;
      clipId: string;
      effect: ClipEffect;
    }
  | {
      type: "ADD_TRANSITION";
      trackId: string;
      transition: TimelineTransition;
    }
  | {
      type: "SET_TRACK_VOLUME";
      trackId: string;
      volumeDb: number;
    }
  | {
      type: "ADD_MARKER";
      marker: TimelineMarker;
    };
