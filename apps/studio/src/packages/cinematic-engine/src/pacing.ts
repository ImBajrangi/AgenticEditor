import { TimelineIR } from "@aetheredit/timeline-ir";
import { PacingProfile } from "./types";

export class PacingAnalyzer {
  /**
   * Calculates current Average Shot Length (ASL) in seconds.
   */
  public static calculateASL(timeline: TimelineIR): number {
    const videoTrack = timeline.tracks.find((t) => t.type === "VIDEO");
    const clips = videoTrack?.clips || [];
    if (clips.length === 0) return 0;

    const fps = timeline.timebase.numerator / timeline.timebase.denominator;
    const totalFrames = clips.reduce((acc, c) => acc + c.timelineRange.duration, 0);
    return totalFrames / fps / clips.length;
  }

  /**
   * Generates a dynamic shot duration curve (in seconds) for a total timeline duration.
   */
  public static generateDurationCurve(
    totalDurationSec: number,
    profile: PacingProfile
  ): number[] {
    const durations: number[] = [];
    let elapsed = 0;
    let step = 0;

    while (elapsed < totalDurationSec) {
      let shotSec = profile.targetAverageShotLengthSec;

      switch (profile.rhythmModel) {
        case "FAST_AGGRESSIVE":
          // Accelerate cuts as story progresses
          const progress = elapsed / totalDurationSec;
          shotSec = profile.maxShotDurationSec * (1 - progress * 0.6);
          break;

        case "BREATHING_SINE":
          // Sine-wave alternation between fast kinetic cuts and breathing room
          shotSec =
            profile.targetAverageShotLengthSec +
            Math.sin(step * 0.8) * (profile.maxShotDurationSec - profile.minShotDurationSec) * 0.4;
          break;

        case "DOCUMENTARY_MEASURED":
        default:
          shotSec = profile.targetAverageShotLengthSec;
          break;
      }

      shotSec = Math.max(profile.minShotDurationSec, Math.min(profile.maxShotDurationSec, shotSec));

      if (elapsed + shotSec > totalDurationSec) {
        shotSec = totalDurationSec - elapsed;
      }

      durations.push(parseFloat(shotSec.toFixed(2)));
      elapsed += shotSec;
      step++;
    }

    return durations;
  }
}
