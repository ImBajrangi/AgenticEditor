import { createHash } from "crypto";

export class ContentAddressableCache {
  private inMemoryCache = new Map<string, Record<string, unknown>>();

  /**
   * Generates a deterministic SHA-256 fingerprint from node inputs, parameters, and version.
   */
  public static computeFingerprint(
    nodeType: string,
    inputs: Record<string, unknown>,
    parameters: Record<string, unknown>,
    version: string = "1.0.0"
  ): string {
    const canonicalPayload = JSON.stringify({
      nodeType,
      version,
      inputs: sortObjectKeys(inputs),
      parameters: sortObjectKeys(parameters),
    });

    return createHash("sha256").update(canonicalPayload).digest("hex");
  }

  public get(fingerprint: string): Record<string, unknown> | null {
    return this.inMemoryCache.get(fingerprint) || null;
  }

  public set(fingerprint: string, output: Record<string, unknown>): void {
    this.inMemoryCache.set(fingerprint, output);
  }

  public clear(): void {
    this.inMemoryCache.clear();
  }
}

function sortObjectKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
  const result: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    result[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
  }
  return result;
}
