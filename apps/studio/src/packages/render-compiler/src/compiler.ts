import { TimelineIR, TimelineClip } from "@aetheredit/timeline-ir";
import { RenderJobOptions } from "./types";
import { AudioDspCompiler } from "./audio-dsp";

export class RenderCompiler {
  /**
   * Compiles a Timeline IR and asset mapping into an executable FFmpeg argument list.
   * STRICT PROXY RULE: Master render always selects original master media (`assetFileMap`).
   * Low-resolution proxy media (`proxyFileMap`) is NEVER rendered as master output unless
   * `allowProxyExport: true` is explicitly passed.
   */
  public static compileToFFmpegArgs(options: RenderJobOptions): string[] {
    const { timeline, outputFilePath, assetFileMap, proxyFileMap, allowProxyExport, resolution } = options;
    const canvasW = resolution?.width || timeline.canvas.width;
    const canvasH = resolution?.height || timeline.canvas.height;
    const fps = Math.round(timeline.timebase.numerator / timeline.timebase.denominator);

    const videoTrack = timeline.tracks.find((t) => t.type === "VIDEO");
    const clips = videoTrack?.clips || [];
    if (clips.length === 0) {
      throw new Error("Cannot compile render: Timeline contains no video clips.");
    }

    const inputArgs: string[] = [];
    const filterParts: string[] = [];
    const clipLabels: string[] = [];

    // Map each clip to an FFmpeg input with precise -ss and -t trimming
    clips.forEach((clip: TimelineClip, idx: number) => {
      // Resolve master file path: STRICTLY use original asset unless allowProxyExport is explicitly true
      let filePath = assetFileMap[clip.assetId];

      if (!filePath && allowProxyExport && proxyFileMap?.[clip.assetId]) {
        filePath = proxyFileMap[clip.assetId];
      }

      if (!filePath) {
        throw new Error(`Master asset file path missing for assetId: ${clip.assetId} (Original required for master rendering)`);
      }

      const inSeconds = clip.sourceRange.in / fps;
      const durationSeconds = clip.timelineRange.duration / fps;

      // Add input flags
      inputArgs.push("-ss", inSeconds.toFixed(3), "-t", durationSeconds.toFixed(3), "-i", filePath);

      // Build scaling and format filter for each input
      const label = `v${idx}`;
      filterParts.push(
        `[${idx}:v]scale=${canvasW}:${canvasH}:force_original_aspect_ratio=increase,crop=${canvasW}:${canvasH},setsar=1,fps=${fps}[${label}]`
      );
      clipLabels.push(`[${label}]`);
    });

    // Concat video streams
    filterParts.push(`${clipLabels.join("")}concat=n=${clips.length}:v=1:a=0[v_master]`);

    const filterComplex = filterParts.join(";");

    const args: string[] = [
      "-y",
      ...inputArgs,
      "-filter_complex",
      filterComplex,
      "-map",
      "[v_master]",
      "-c:v",
      options.hardwareAccel === "VIDEOTOOLBOX" ? "h264_videotoolbox" : "libx264",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      outputFilePath,
    ];

    return args;
  }
}
