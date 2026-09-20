import { TimelineIR, TimelineMutationOp } from "@aetheredit/timeline-ir";

export interface EditorialActionRequest {
  type: "INSERT_CLIP" | "REPLACE_CLIP" | "SPLIT_CLIP" | "TRIM_CLIP" | "APPLY_EFFECT" | "DELETE_CLIP";
  trackId: string;
  clipId?: string;
  assetId?: string;
  inFrame?: number;
  outFrame?: number;
  targetStartFrame?: number;
  durationFrames?: number;
  effect?: Record<string, unknown>;
  reason: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  safeMutation?: TimelineMutationOp;
}

export class MutationValidator {
  /**
   * Deterministically validates an editorial action request before it can mutate Timeline IR.
   */
  public static validate(
    timeline: TimelineIR,
    request: EditorialActionRequest,
    knownAssets: Set<string>
  ): ValidationResult {
    const errors: string[] = [];

    // 1. Check Track Existence & Type Compatibility
    const targetTrack = timeline.tracks.find((t) => t.id === request.trackId);
    if (!targetTrack) {
      errors.push(`Target track '${request.trackId}' does not exist on timeline '${timeline.timelineId}'`);
    }

    // 2. Check Asset Existence
    if (request.assetId && !knownAssets.has(request.assetId)) {
      errors.push(`Asset '${request.assetId}' is not registered in the project media vault`);
    }

    // 3. Check Range Validity
    if (request.inFrame !== undefined && request.outFrame !== undefined) {
      if (request.inFrame < 0 || request.outFrame <= request.inFrame) {
        errors.push(`Invalid source frame range: [${request.inFrame}, ${request.outFrame}]`);
      }
    }

    // 4. Check Duration
    if (request.durationFrames !== undefined && request.durationFrames <= 0) {
      errors.push(`Duration must be strictly positive (got ${request.durationFrames} frames)`);
    }

    // 5. Check Target Clip Existence for Clip-specific operations
    if ((request.type === "SPLIT_CLIP" || request.type === "TRIM_CLIP" || request.type === "REPLACE_CLIP") && request.clipId) {
      const clipExists = targetTrack?.clips.some((c) => c.id === request.clipId);
      if (!clipExists) {
        errors.push(`Clip '${request.clipId}' not found on track '${request.trackId}'`);
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    const inFrame = request.inFrame || 0;
    const outFrame = request.outFrame || (inFrame + (request.durationFrames || 90));

    // Build safe MutationOp
    let safeMutation: TimelineMutationOp;

    switch (request.type) {
      case "INSERT_CLIP":
        safeMutation = {
          type: "INSERT_CLIP",
          trackId: request.trackId,
          clip: {
            id: request.clipId || `clip_${Date.now()}`,
            assetId: request.assetId || "ast_default",
            name: `Clip ${request.clipId || "inserted"}`,
            timelineRange: {
              start: request.targetStartFrame || 0,
              duration: request.durationFrames || 90,
            },
            sourceRange: {
              in: inFrame,
              out: outFrame,
            },
            speed: 1.0,
            transform: {
              position: { x: 0, y: 0 },
              scale: { x: 1.0, y: 1.0 },
              rotation: 0,
              opacity: 1.0,
            },
            effects: request.effect ? [{
              id: `fx_${Date.now()}`,
              pluginId: "color_lut",
              enabled: true,
              parameters: request.effect,
            }] : [],
          },
        };
        break;

      case "SPLIT_CLIP":
        safeMutation = {
          type: "SPLIT_CLIP",
          trackId: request.trackId,
          clipId: request.clipId!,
          splitFrame: request.targetStartFrame || 30,
        };
        break;

      case "TRIM_CLIP":
        safeMutation = {
          type: "TRIM_CLIP",
          trackId: request.trackId,
          clipId: request.clipId!,
          newTimelineRange: {
            start: request.targetStartFrame || 0,
            duration: request.durationFrames || 60,
          },
        };
        break;

      default:
        safeMutation = {
          type: "INSERT_CLIP",
          trackId: request.trackId,
          clip: {
            id: request.clipId || `clip_${Date.now()}`,
            assetId: request.assetId || "ast_default",
            name: `Clip ${request.clipId || "inserted"}`,
            timelineRange: { start: request.targetStartFrame || 0, duration: request.durationFrames || 90 },
            sourceRange: { in: inFrame, out: outFrame },
            speed: 1.0,
            transform: { position: { x: 0, y: 0 }, scale: { x: 1.0, y: 1.0 }, rotation: 0, opacity: 1.0 },
            effects: [],
          },
        };
    }

    return {
      valid: true,
      errors: [],
      safeMutation,
    };
  }
}
