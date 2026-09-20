import { TimelineIR, TimelineMutationOp, TimelineClip } from "./types";
import { TimelineIRSchema } from "./schema";

export class TimelineMutator {
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
        const track = next.tracks.find((t) => t.id === mutation.trackId);
        if (!track) throw new Error(`Track ${mutation.trackId} not found`);
        track.clips.push(mutation.clip);
        // Sort clips by timeline start frame
        track.clips.sort((a, b) => a.timelineRange.start - b.timelineRange.start);
        break;
      }

      case "TRIM_CLIP": {
        const track = next.tracks.find((t) => t.id === mutation.trackId);
        if (!track) throw new Error(`Track ${mutation.trackId} not found`);
        const clip = track.clips.find((c) => c.id === mutation.clipId);
        if (!clip) throw new Error(`Clip ${mutation.clipId} not found in track ${mutation.trackId}`);

        if (mutation.newTimelineRange) {
          clip.timelineRange = { ...clip.timelineRange, ...mutation.newTimelineRange };
        }
        if (mutation.newSourceRange) {
          clip.sourceRange = { ...clip.sourceRange, ...mutation.newSourceRange };
        }
        break;
      }

      case "SPLIT_CLIP": {
        const track = next.tracks.find((t) => t.id === mutation.trackId);
        if (!track) throw new Error(`Track ${mutation.trackId} not found`);
        const clipIndex = track.clips.findIndex((c) => c.id === mutation.clipId);
        if (clipIndex === -1) throw new Error(`Clip ${mutation.clipId} not found`);

        const original = track.clips[clipIndex];
        const splitFrame = mutation.splitFrame;

        // Verify splitFrame falls strictly within clip bounds
        const clipStart = original.timelineRange.start;
        const clipEnd = clipStart + original.timelineRange.duration;

        if (splitFrame <= clipStart || splitFrame >= clipEnd) {
          throw new Error(`Split frame ${splitFrame} is outside clip bounds [${clipStart}, ${clipEnd}]`);
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
        track.clips.splice(clipIndex, 1, firstClip, secondClip);
        break;
      }

      case "REMOVE_CLIP": {
        const track = next.tracks.find((t) => t.id === mutation.trackId);
        if (!track) throw new Error(`Track ${mutation.trackId} not found`);
        track.clips = track.clips.filter((c) => c.id !== mutation.clipId);
        break;
      }

      case "SET_CLIP_TRANSFORM": {
        const track = next.tracks.find((t) => t.id === mutation.trackId);
        if (!track) throw new Error(`Track ${mutation.trackId} not found`);
        const clip = track.clips.find((c) => c.id === mutation.clipId);
        if (!clip) throw new Error(`Clip ${mutation.clipId} not found`);
        clip.transform = { ...clip.transform, ...mutation.transform };
        break;
      }

      case "APPLY_CLIP_EFFECT": {
        const track = next.tracks.find((t) => t.id === mutation.trackId);
        if (!track) throw new Error(`Track ${mutation.trackId} not found`);
        const clip = track.clips.find((c) => c.id === mutation.clipId);
        if (!clip) throw new Error(`Clip ${mutation.clipId} not found`);
        
        const existingIdx = clip.effects.findIndex((e) => e.pluginId === mutation.effect.pluginId);
        if (existingIdx >= 0) {
          clip.effects[existingIdx] = mutation.effect;
        } else {
          clip.effects.push(mutation.effect);
        }
        break;
      }

      case "ADD_TRANSITION": {
        const track = next.tracks.find((t) => t.id === mutation.trackId);
        if (!track) throw new Error(`Track ${mutation.trackId} not found`);
        track.transitions.push(mutation.transition);
        break;
      }

      case "SET_TRACK_VOLUME": {
        const track = next.tracks.find((t) => t.id === mutation.trackId);
        if (!track) throw new Error(`Track ${mutation.trackId} not found`);
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
      throw new Error(`Mutation caused schema validation failure: ${parsed.error.message}`);
    }

    return next;
  }
}
