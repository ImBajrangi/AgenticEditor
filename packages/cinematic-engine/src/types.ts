export type RhythmModel = "FAST_AGGRESSIVE" | "DOCUMENTARY_MEASURED" | "BREATHING_SINE";

export interface PacingProfile {
  targetAverageShotLengthSec: number;
  rhythmModel: RhythmModel;
  minShotDurationSec: number;
  maxShotDurationSec: number;
}

export interface SilenceInterval {
  startMs: number;
  endMs: number;
  durationMs: number;
}

export interface BoundingBox {
  x: number; // 0.0 to 1.0 (normalized center X)
  y: number; // 0.0 to 1.0 (normalized center Y)
  width: number;
  height: number;
}

export interface ReframeOffset {
  frame: number;
  panX: number; // Pixel shift from canvas center
  scale: number;
}
