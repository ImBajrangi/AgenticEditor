import { spawn } from "child_process";
import { statSync, existsSync } from "fs";
import { RenderJobOptions, RenderProgress, RenderResult } from "./types";
import { RenderCompiler } from "./compiler";

export class FFmpegRunner {
  private ffmpegPath: string;

  constructor(ffmpegPath: string = process.env.FFMPEG_PATH || "/opt/homebrew/bin/ffmpeg") {
    this.ffmpegPath = existsSync(ffmpegPath) ? ffmpegPath : "ffmpeg";
  }

  /**
   * Detects hardware acceleration available on this host.
   */
  public async detectHardwareAcceleration(): Promise<"VIDEOTOOLBOX" | "NVENC" | "VAAPI" | "CPU"> {
    if (process.platform === "darwin") {
      return "VIDEOTOOLBOX";
    }
    return "CPU";
  }

  /**
   * Executes an end-to-end render job.
   */
  public async render(
    options: RenderJobOptions,
    onProgress?: (progress: RenderProgress) => void
  ): Promise<RenderResult> {
    const startTime = Date.now();
    const hwAccel = options.hardwareAccel || (await this.detectHardwareAcceleration());
    const compiledArgs = RenderCompiler.compileToFFmpegArgs({ ...options, hardwareAccel: hwAccel });

    // Inject progress pipe flags
    const runArgs = ["-progress", "pipe:1", ...compiledArgs];
    const fullCommand = `${this.ffmpegPath} ${runArgs.join(" ")}`;

    return new Promise<RenderResult>((resolve, reject) => {
      const proc = spawn(this.ffmpegPath, runArgs);
      let stderrBuffer = "";

      const totalFrames =
        options.timeline.tracks.find((t) => t.type === "VIDEO")?.clips.reduce(
          (acc, c) => acc + c.timelineRange.duration,
          0
        ) || 1;

      proc.stdout.on("data", (chunk: Buffer) => {
        const text = chunk.toString();
        const lines = text.split("\n");
        const meta: Record<string, string> = {};

        for (const line of lines) {
          const [key, val] = line.split("=");
          if (key && val) {
            meta[key.trim()] = val.trim();
          }
        }

        if (meta["frame"]) {
          const currentFrame = parseInt(meta["frame"], 10) || 0;
          const fps = parseFloat(meta["fps"]) || 0;
          const bitrateKbps = parseFloat(meta["bitrate"]?.replace("kbits/s", "")) || 0;
          const timeMs = parseInt(meta["out_time_us"] || "0", 10) / 1000;

          if (onProgress) {
            onProgress({
              frame: currentFrame,
              fps,
              bitrateKbps,
              totalFrames,
              progressPercent: Math.min(100, Math.round((currentFrame / totalFrames) * 100)),
              timeSeconds: timeMs / 1000,
              speed: meta["speed"] || "1x",
            });
          }
        }
      });

      proc.stderr.on("data", (chunk: Buffer) => {
        stderrBuffer += chunk.toString();
      });

      proc.on("close", (code) => {
        const durationMs = Date.now() - startTime;
        if (code === 0 && existsSync(options.outputFilePath)) {
          const fileSizeBytes = statSync(options.outputFilePath).size;
          resolve({
            success: true,
            outputFilePath: options.outputFilePath,
            totalDurationMs: durationMs,
            fileSizeBytes,
            ffmpegCommand: fullCommand,
          });
        } else {
          resolve({
            success: false,
            outputFilePath: options.outputFilePath,
            totalDurationMs: durationMs,
            fileSizeBytes: 0,
            ffmpegCommand: fullCommand,
            error: `FFmpeg exited with code ${code}. Stderr: ${stderrBuffer.slice(-800)}`,
          });
        }
      });

      proc.on("error", (err) => {
        reject(new Error(`Failed to spawn FFmpeg process: ${err.message}`));
      });
    });
  }
}
