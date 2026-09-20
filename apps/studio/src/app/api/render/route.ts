import { NextResponse } from "next/server";
import { TimelineIR } from "@aetheredit/timeline-ir";
import { FFmpegRunner, RenderCompiler } from "@aetheredit/render-compiler";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

export async function POST(req: Request) {
  try {
    const { timeline, resolution } = await req.json() as {
      timeline: TimelineIR;
      resolution?: { width: number; height: number };
    };

    if (!timeline) {
      return NextResponse.json({ error: "Missing Timeline IR" }, { status: 400 });
    }

    const runner = new FFmpegRunner();
    const hwAccel = await runner.detectHardwareAcceleration();

    // Ensure output directory exists
    const outputDir = join(process.cwd(), "public", "renders");
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `render_${timeline.timelineId}_${Date.now()}.mp4`;
    const outputFilePath = join(outputDir, fileName);

    // Mock asset mapping or local clips
    const assetFileMap: Record<string, string> = {
      ast_mountain_mist: "/tmp/sample_clip_01.mp4",
      ast_beach_sunset: "/tmp/sample_clip_02.mp4",
      ast_surfer_action: "/tmp/sample_clip_03.mp4",
      ast_cinematic_music: "/tmp/sample_music.wav",
    };

    // Verify if local test clips exist; if not, compile command and return ready manifest
    const hasLocalFiles = Object.values(assetFileMap).every((p) => existsSync(p));

    if (hasLocalFiles) {
      const result = await runner.render({
        timeline,
        outputFilePath,
        assetFileMap,
        hardwareAccel: hwAccel,
        resolution,
      });

      return NextResponse.json({
        success: result.success,
        downloadUrl: `/renders/${fileName}`,
        hardwareAccel: hwAccel,
        fileSizeBytes: result.fileSizeBytes,
        durationMs: result.totalDurationMs,
        command: result.ffmpegCommand,
      });
    } else {
      // Return compiled deterministic FFmpeg command and mock download URL
      const compiledArgs = RenderCompiler.compileToFFmpegArgs({
        timeline,
        outputFilePath,
        assetFileMap,
        hardwareAccel: hwAccel,
        resolution,
      });

      return NextResponse.json({
        success: true,
        isSimulated: true,
        hardwareAccel: hwAccel,
        downloadUrl: `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`,
        fileName,
        compiledCommand: `/opt/homebrew/bin/ffmpeg ${compiledArgs.join(" ")}`,
        message: "Compiled deterministic FFmpeg filtergraph with hardware acceleration.",
      });
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
