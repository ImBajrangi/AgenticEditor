import { NextResponse } from "next/server";
import { spawn } from "child_process";
import { existsSync, mkdirSync } from "fs";

export async function POST() {
  try {
    const ffmpegPath = "/opt/homebrew/bin/ffmpeg";
    if (!existsSync(ffmpegPath)) {
      return NextResponse.json({ error: "FFmpeg not found at /opt/homebrew/bin/ffmpeg" }, { status: 500 });
    }

    const clips = [
      {
        path: "/tmp/sample_clip_01.mp4",
        args: [
          "-y",
          "-f", "lavfi", "-i", "testsrc=duration=5:size=1920x1080:rate=30",
          "-f", "lavfi", "-i", "sine=frequency=440:duration=5",
          "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac",
          "/tmp/sample_clip_01.mp4"
        ]
      },
      {
        path: "/tmp/sample_clip_02.mp4",
        args: [
          "-y",
          "-f", "lavfi", "-i", "smptebars=duration=5:size=1920x1080:rate=30",
          "-f", "lavfi", "-i", "sine=frequency=880:duration=5",
          "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac",
          "/tmp/sample_clip_02.mp4"
        ]
      },
      {
        path: "/tmp/sample_clip_03.mp4",
        args: [
          "-y",
          "-f", "lavfi", "-i", "mandelbrot=duration=5:size=1920x1080:rate=30",
          "-f", "lavfi", "-i", "sine=frequency=554:duration=5",
          "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac",
          "/tmp/sample_clip_03.mp4"
        ]
      },
      {
        path: "/tmp/sample_music.wav",
        args: [
          "-y",
          "-f", "lavfi", "-i", "sine=frequency=220:duration=15",
          "/tmp/sample_music.wav"
        ]
      }
    ];

    for (const clip of clips) {
      if (!existsSync(clip.path)) {
        await new Promise<void>((resolve, reject) => {
          const proc = spawn(ffmpegPath, clip.args);
          proc.on("close", (code) => {
            if (code === 0) resolve();
            else reject(new Error(`FFmpeg failed with code ${code}`));
          });
          proc.on("error", reject);
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Generated 4 local test media assets in /tmp for hardware-accelerated rendering.",
      clips: clips.map((c) => c.path),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
