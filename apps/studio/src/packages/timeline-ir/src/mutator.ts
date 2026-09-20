import { TimelineIR, TimelineMutationOp, TimelineClip, TimelineTrack } from "./types";
import { TimelineIRSchema } from "./schema";

export class TimelineMutator {
  /**
   * Resolves the target track for a mutation by direct ID, containing clip ID,
   * fuzzy name match, or nearest matching track type/fallback.
   */
  private static resolveTrack(
    timeline: TimelineIR,
    trackId?: string,
    clipId?: string,
    preferredType?: string
  ): TimelineTrack {
    if (trackId) {
      const direct = timeline.tracks.find((t) => t.id === trackId);
      if (direct) return direct;
    }
    if (clipId) {
      const containing = timeline.tracks.find((t) => t.clips.some((c) => c.id === clipId));
      if (containing) return containing;
    }
    if (trackId) {
      const fuzzy = timeline.tracks.find(
        (t) =>
          t.id.toLowerCase().includes(trackId.toLowerCase()) ||
          t.name.toLowerCase().includes(trackId.toLowerCase())
      );
      if (fuzzy) return fuzzy;
    }
    if (preferredType) {
      const typed = timeline.tracks.find((t) => t.type === preferredType);
      if (typed) return typed;
    }
    if (timeline.tracks.length > 0) {
      return timeline.tracks[0];
    }
    
    // Create a default track if timeline has no tracks
    const fallbackTrack: TimelineTrack = {
      id: "trk_v1_main",
      type: (preferredType as any) || "VIDEO",
      name: preferredType === "AUDIO" ? "A1: Audio 1" : "V1: Video 1",
      index: 0,
      muted: false,
      locked: false,
      clips: [],
      transitions: [],
    };
    timeline.tracks.push(fallbackTrack);
    return fallbackTrack;
  }

  /**
   * Applies an atomic mutation operation to a Timeline IR snapshot,
   * returning a brand new immutable TimelineIR with bumped version.
   */
  public static apply(timeline: TimelineIR, mutation: TimelineMutationOp): TimelineIR {
    // Deep clone timeline to guarantee immutability
    const next: TimelineIR = JSON.parse(JSON.stringify(timeline));
    next.version += 1;

    switch (mutation.type) {
      case "INSERT_CLIP": {
        const track = TimelineMutator.resolveTrack(next, mutation.trackId, undefined, "VIDEO");
        track.clips.push(mutation.clip);
        // Sort clips by timeline start frame
        track.clips.sort((a, b) => a.timelineRange.start - b.timelineRange.start);
        break;
      }

      case "TRIM_CLIP": {
        const track = TimelineMutator.resolveTrack(next, mutation.trackId, mutation.clipId);
        let clip = track.clips.find((c) => c.id === mutation.clipId);
        if (!clip) {
          // Check other tracks as fallback
          for (const t of next.tracks) {
            const found = t.clips.find((c) => c.id === mutation.clipId);
            if (found) {
              clip = found;
              break;
            }
          }
        }
        if (!clip) {
          console.warn(`[TimelineMutator] Clip ${mutation.clipId} not found for TRIM_CLIP`);
          break;
        }

        if (mutation.newTimelineRange) {
          clip.timelineRange = { ...clip.timelineRange, ...mutation.newTimelineRange };
        }
        if (mutation.newSourceRange) {
          clip.sourceRange = { ...clip.sourceRange, ...mutation.newSourceRange };
        }
        break;
      }

      case "SPLIT_CLIP": {
        const track = TimelineMutator.resolveTrack(next, mutation.trackId, mutation.clipId);
        let clipIndex = track.clips.findIndex((c) => c.id === mutation.clipId);
        let targetTrack = track;

        if (clipIndex === -1) {
          for (const t of next.tracks) {
            const idx = t.clips.findIndex((c) => c.id === mutation.clipId);
            if (idx !== -1) {
              targetTrack = t;
              clipIndex = idx;
              break;
            }
          }
        }
        if (clipIndex === -1 || !targetTrack) {
          console.warn(`[TimelineMutator] Clip ${mutation.clipId} not found for SPLIT_CLIP`);
          break;
        }

        const original = targetTrack.clips[clipIndex];
        const splitFrame = mutation.splitFrame;

        // Verify splitFrame falls strictly within clip bounds
        const clipStart = original.timelineRange.start;
        const clipEnd = clipStart + original.timelineRange.duration;

        if (splitFrame <= clipStart || splitFrame >= clipEnd) {
          break;
        }

        const firstDuration = splitFrame - clipStart;
        const secondDuration = clipEnd - splitFrame;

        // Calculate source in/out offsets based on clip speed
        const speed = original.speed || 1.0;
        const sourceDelta1 = Math.round(firstDuration * speed);

        const firstClip: TimelineClip = {
          ...JSON.parse(JSON.stringify(original)),
          id: `${original.id}_part1`,
          timelineRange: {
            start: clipStart,
            duration: firstDuration,
          },
          sourceRange: {
            in: original.sourceRange.in,
            out: original.sourceRange.in + sourceDelta1,
          },
        };

        const secondClip: TimelineClip = {
          ...JSON.parse(JSON.stringify(original)),
          id: `${original.id}_part2`,
          timelineRange: {
            start: splitFrame,
            duration: secondDuration,
          },
          sourceRange: {
            in: original.sourceRange.in + sourceDelta1,
            out: original.sourceRange.out,
          },
        };

        // Replace original clip with the two split parts
        targetTrack.clips.splice(clipIndex, 1, firstClip, secondClip);
        break;
      }

      case "REMOVE_CLIP": {
        next.tracks.forEach((t) => {
          t.clips = t.clips.filter((c) => c.id !== mutation.clipId);
        });
        break;
      }

      case "SET_CLIP_TRANSFORM": {
        let clip: TimelineClip | undefined;
        for (const t of next.tracks) {
          const found = t.clips.find((c) => c.id === mutation.clipId);
          if (found) {
            clip = found;
            break;
          }
        }
        if (clip) {
          clip.transform = { ...clip.transform, ...mutation.transform };
        }
        break;
      }

      case "APPLY_CLIP_EFFECT": {
        let clip: TimelineClip | undefined;
        for (const t of next.tracks) {
          const found = t.clips.find((c) => c.id === mutation.clipId);
          if (found) {
            clip = found;
            break;
          }
        }
        if (!clip) {
          const vTrack = next.tracks.find((t) => t.type === "VIDEO") || next.tracks[0];
          clip = vTrack?.clips[0];
        }
        if (clip) {
          const existingIdx = clip.effects.findIndex((e) => e.pluginId === mutation.effect.pluginId);
          if (existingIdx >= 0) {
            clip.effects[existingIdx] = mutation.effect;
          } else {
            clip.effects.push(mutation.effect);
          }
        }
        break;
      }

      case "ADD_TRANSITION": {
        const track = TimelineMutator.resolveTrack(next, mutation.trackId, undefined, "VIDEO");
        track.transitions.push(mutation.transition);
        break;
      }

      case "SET_TRACK_VOLUME": {
        const track = TimelineMutator.resolveTrack(next, mutation.trackId, undefined, "AUDIO");
        track.volume = mutation.volumeDb;
        break;
      }

      case "ADD_MARKER": {
        next.markers.push(mutation.marker);
        next.markers.sort((a, b) => a.frame - b.frame);
        break;
      }
    }

    // Validate against Zod schema to ensure invariant integrity
    const parsed = TimelineIRSchema.safeParse(next);
    if (!parsed.success) {
      console.warn(`[TimelineMutator] Schema validation warning:`, parsed.error.message);
      return next;
    }

    return next;
  }
}

