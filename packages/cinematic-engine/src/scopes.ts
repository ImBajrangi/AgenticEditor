export interface ScopeAnalysisResult {
  waveform: {
    lumaMean: number;
    lumaMin: number;
    lumaMax: number;
    histogram: number[]; // 256 bins
  };
  rgbParade: {
    rMean: number;
    gMean: number;
    bMean: number;
    rHistogram: number[];
    gHistogram: number[];
    bHistogram: number[];
  };
  vectorscope: {
    cbMean: number;
    crMean: number;
    saturationMean: number;
  };
}

export class ColorScopeCalculator {
  /**
   * Performs pixel-accurate color scope analysis on a raw RGBA Uint8ClampedArray/Buffer.
   * Uses ITU-R BT.709 luminance coefficients: Y = 0.2126*R + 0.7152*G + 0.0722*B.
   */
  public static analyzeFrame(
    pixelBuffer: Uint8Array | Uint8ClampedArray | number[],
    width: number,
    height: number
  ): ScopeAnalysisResult {
    const totalPixels = width * height;
    if (totalPixels === 0 || pixelBuffer.length < totalPixels * 4) {
      throw new Error(`Invalid pixel buffer: expected at least ${totalPixels * 4} bytes for ${width}x${height} RGBA.`);
    }

    const lumaHistogram = new Array(256).fill(0);
    const rHistogram = new Array(256).fill(0);
    const gHistogram = new Array(256).fill(0);
    const bHistogram = new Array(256).fill(0);

    let lumaSum = 0;
    let lumaMin = 255;
    let lumaMax = 0;
    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    let cbSum = 0;
    let crSum = 0;
    let satSum = 0;

    for (let i = 0; i < totalPixels; i++) {
      const offset = i * 4;
      const r = pixelBuffer[offset];
      const g = pixelBuffer[offset + 1];
      const b = pixelBuffer[offset + 2];

      // ITU-R BT.709 Luma calculation
      const luma = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
      const clampedLuma = Math.max(0, Math.min(255, luma));

      lumaHistogram[clampedLuma]++;
      rHistogram[r]++;
      gHistogram[g]++;
      bHistogram[b]++;

      lumaSum += clampedLuma;
      if (clampedLuma < lumaMin) lumaMin = clampedLuma;
      if (clampedLuma > lumaMax) lumaMax = clampedLuma;

      rSum += r;
      gSum += g;
      bSum += b;

      // Color difference components (BT.709 chroma)
      const cb = -0.1146 * r - 0.3854 * g + 0.5 * b;
      const cr = 0.5 * r - 0.4542 * g - 0.0458 * b;
      const sat = Math.sqrt(cb * cb + cr * cr);

      cbSum += cb;
      crSum += cr;
      satSum += sat;
    }

    return {
      waveform: {
        lumaMean: parseFloat((lumaSum / totalPixels).toFixed(2)),
        lumaMin,
        lumaMax,
        histogram: lumaHistogram,
      },
      rgbParade: {
        rMean: parseFloat((rSum / totalPixels).toFixed(2)),
        gMean: parseFloat((gSum / totalPixels).toFixed(2)),
        bMean: parseFloat((bSum / totalPixels).toFixed(2)),
        rHistogram,
        gHistogram,
        bHistogram,
      },
      vectorscope: {
        cbMean: parseFloat((cbSum / totalPixels).toFixed(2)),
        crMean: parseFloat((crSum / totalPixels).toFixed(2)),
        saturationMean: parseFloat((satSum / totalPixels).toFixed(2)),
      },
    };
  }
}
