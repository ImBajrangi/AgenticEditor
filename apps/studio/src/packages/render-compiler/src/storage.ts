import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { TimelineIR } from "@aetheredit/timeline-ir";

export interface RenderManifest {
  renderId: string;
  projectId: string;
  timelineVersion: number;
  workflowVersion: number;
  compilerVersion: string;
  rendererVersion: string;
  sourceHashes: Record<string, string>;
  settings: {
    codec: string;
    resolution: { width: number; height: number };
    fps: number;
    audio: { sampleRate: number; channels: number; targetLufs: number };
  };
  hardwareCapabilities: {
    decode: string;
    filters: string;
    composite: string;
    encode: string;
  };
  timestamp: number;
  reproducibilityHash: string;
}

export class ObjectStorageService {
  private baseDir: string;

  constructor(baseDir?: string) {
    if (baseDir) {
      this.baseDir = baseDir;
    } else {
      const cwd = process.cwd();
      if (existsSync(join(cwd, "storage"))) {
        this.baseDir = join(cwd, "storage", "vault");
      } else if (existsSync(join(cwd, "..", "storage"))) {
        this.baseDir = resolve(cwd, "..", "storage", "vault");
      } else if (existsSync(join(cwd, "..", "..", "storage"))) {
        this.baseDir = resolve(cwd, "..", "..", "storage", "vault");
      } else {
        this.baseDir = join(cwd, "storage", "vault");
      }
    }
    this.ensureDirs();
  }

  private ensureDirs(): void {
    const subdirs = ["originals", "proxies", "previews", "renders", "manifests"];
    for (const sub of subdirs) {
      const p = join(this.baseDir, sub);
      if (!existsSync(p)) {
        mkdirSync(p, { recursive: true });
      }
    }
  }

  public getPath(bucket: "originals" | "proxies" | "previews" | "renders" | "manifests", key: string): string {
    return join(this.baseDir, bucket, key);
  }

  /**
   * Computes the real cryptographic SHA256 hash of a file on disk.
   */
  public static computeFileSha256(filePath: string): string {
    if (!existsSync(filePath)) {
      throw new Error(`Cannot compute SHA256: file not found at '${filePath}'`);
    }
    const fileBuffer = readFileSync(filePath);
    return createHash("sha256").update(fileBuffer).digest("hex");
  }

  public writeManifest(manifest: RenderManifest): string {
    const key = `${manifest.renderId}_manifest.json`;
    const fullPath = this.getPath("manifests", key);
    writeFileSync(fullPath, JSON.stringify(manifest, null, 2), "utf-8");
    return fullPath;
  }

  public readManifest(renderId: string): RenderManifest | null {
    const key = `${renderId}_manifest.json`;
    const fullPath = this.getPath("manifests", key);
    if (!existsSync(fullPath)) return null;
    return JSON.parse(readFileSync(fullPath, "utf-8"));
  }

  /**
   * Generates a strictly deterministic reproducibility hash.
   * Excludes ephemeral non-deterministic parameters (timestamp, renderId, random IDs).
   * Incorporates canonical timeline representation, real source hashes, and delivery settings.
   */
  public static generateReproducibilityHash(
    timeline: TimelineIR,
    sourceHashes: Record<string, string>,
    settings: Record<string, unknown>
  ): string {
    // Canonicalize timeline data (stripping ephemeral markers if any)
    const canonicalTimeline = {
      timelineId: timeline.timelineId,
      timebase: timeline.timebase,
      canvas: timeline.canvas,
      tracks: timeline.tracks.map((t) => ({
        id: t.id,
        type: t.type,
        index: t.index,
        clips: t.clips.map((c) => ({
          id: c.id,
          assetId: c.assetId,
          timelineRange: c.timelineRange,
          sourceRange: c.sourceRange,
          speed: c.speed,
          transform: c.transform,
          effects: c.effects,
        })),
      })),
    };

    // Sort source hashes for deterministic serialization
    const sortedSourceHashes = Object.keys(sourceHashes)
      .sort()
      .reduce((acc, k) => {
        acc[k] = sourceHashes[k];
        return acc;
      }, {} as Record<string, string>);

    const deterministicPayload = JSON.stringify({
      timeline: canonicalTimeline,
      sourceHashes: sortedSourceHashes,
      settings,
    });

    return createHash("sha256").update(deterministicPayload).digest("hex");
  }
}
