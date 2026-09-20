import { BoundingBox, ReframeOffset } from "./types";

export class SmartReframeEngine {
  /**
   * Generates smooth 9:16 camera pan coordinates to track active subjects without jitter.
   */
  public static calculateVerticalTracking(
    faceBoxes: Array<{ frame: number; box: BoundingBox }>,
    originalWidth: number = 1920,
    originalHeight: number = 1080,
    targetWidth: number = 1080,
    targetHeight: number = 1920
  ): ReframeOffset[] {
    const offsets: ReframeOffset[] = [];
    let smoothedCenterX = 0.5;
    const smoothingFactor = 0.12; // Kalman-like low-pass filter

    for (const item of faceBoxes) {
      // Update low-pass filter toward current subject center
      smoothedCenterX = smoothedCenterX * (1 - smoothingFactor) + item.box.x * smoothingFactor;

      // Calculate pixel shift relative to 9:16 crop window
      const targetCenterX = smoothedCenterX * originalWidth;
      const panX = targetCenterX - originalWidth / 2;

      offsets.push({
        frame: item.frame,
        panX: Math.round(panX),
        scale: 1.777, // Scale 16:9 to fill 9:16 vertical canvas
      });
    }

    return offsets;
  }
}
