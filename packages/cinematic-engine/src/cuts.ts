import { TimelineIR, TimelineClip } from "@aetheredit/timeline-ir";
import { SilenceInterval } from "./types";

export class CutEngine {
  /**
   * Detects silences exceeding minPauseMs and creates an edit decision plan removing dead air.
   */
  public static planSilenceRemoval(
    audioRmsPeaks: number[], // RMS energy per 20ms audio frame
    sampleRateMs: number = 20,
    thresholdRms: number = 0.02,
    minPauseMs: number = 400
  ): SilenceInterval[] {
    const silences: SilenceInterval[] = [];
    let inSilence = false;
    let silenceStart = 0;

    for (let i = 0; i < audioRmsPeaks.length; i++) {
      const isQuiet = audioRmsPeaks[i] < thresholdRms;
      const currentMs = i * sampleRateMs;

      if (isQuiet && !inSilence) {
        inSilence = true;
        silenceStart = currentMs;
      } else if (!isQuiet && inSilence) {
        inSilence = false;
        const duration = currentMs - silenceStart;
        if (duration >= minPauseMs) {
          silences.push({
            startMs: silenceStart,
            endMs: currentMs,
            durationMs: duration,
          });
        }
      }
    }

    return silences;
  }

  /**
   * Applies an L-Cut or J-Cut split edit between two adjacent conversational clips.
   * - J-Cut: Audio of incoming clip starts before its video appears.
   * - L-Cut: Video switches to reaction shot while outgoing dialogue continues.
   */
  public static applySplitEdit(
    timeline: TimelineIR,
    cutType: "J_CUT" | "L_CUT",
    splitOffsetFrames: number = 18
  ): TimelineIR {
    const next: TimelineIR = JSON.parse(JSON.stringify(timeline));
    next.version += 1;

    const videoTrack = next.tracks.find((t) => t.type === "VIDEO");
    const audioTrack = next.tracks.find((t) => t.type === "AUDIO");

    if (!videoTrack || !audioTrack || videoTrack.clips.length < 2) {
      return next;
    }

    if (cutType === "J_CUT") {
      // Advance incoming audio by splitOffsetFrames
      const incomingAudio = audioTrack.clips[1];
      if (incomingAudio && incomingAudio.timelineRange.start >= splitOffsetFrames) {
        incomingAudio.timelineRange.start -= splitOffsetFrames;
        incomingAudio.timelineRange.duration += splitOffsetFrames;
      }
    } else if (cutType === "L_CUT") {
      // Extend outgoing audio by splitOffsetFrames past video cut
      const outgoingAudio = audioTrack.clips[0];
      if (outgoingAudio) {
        outgoingAudio.timelineRange.duration += splitOffsetFrames;
      }
    }

    return next;
  }
}
