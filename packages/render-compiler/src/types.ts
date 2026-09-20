import { TimelineIR } from "@aetheredit/timeline-ir";

export type HardwareAccelerationMode = "AUTO" | "VIDEOTOOLBOX" | "NVENC" | "VAAPI" | "CPU";

export interface RenderJobOptions {
  timeline: TimelineIR;
  outputFilePath: string;
  assetFileMap: Record<string, string>; // assetId -> original master file path
  proxyFileMap?: Record<string, string>; // assetId -> proxy file path
  allowProxyExport?: boolean; // STRICT: false by default, preventing low-res proxy rendering
  hardwareAccel?: HardwareAccelerationMode;
  resolution?: { width: number; height: number };
  frameRate?: number;
  crf?: number;
  preset?: string;
}

export interface RenderProgress {
  frame: number;
  fps: number;
  bitrateKbps: number;
  totalFrames: number;
  progressPercent: number;
  timeSeconds: number;
  speed: string;
}

export interface RenderResult {
  success: boolean;
  outputFilePath: string;
  totalDurationMs: number;
  fileSizeBytes: number;
  ffmpegCommand: string;
  error?: string;
}
