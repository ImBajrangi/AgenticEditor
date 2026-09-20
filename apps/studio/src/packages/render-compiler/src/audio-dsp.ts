export type AudioDeliveryStandard =
  | "YOUTUBE"
  | "STREAMING"
  | "BROADCAST_EBU"
  | "PODCAST"
  | "SOCIAL";

export interface AudioDeliveryProfile {
  id: AudioDeliveryStandard;
  name: string;
  targetLufs: number; // Integrated LUFS
  maxTruePeakDbTp: number; // Maximum True Peak ceiling
  maxLra: number; // Loudness Range
  sampleRate: number; // e.g. 48000 Hz
  channels: number; // 2 (Stereo) or 6 (5.1 Surround)
  codec: string; // "aac", "pcm_s24le", "flac"
  bitrateKbps: number;
}

export interface SidechainCompressorConfig {
  thresholdDb: number; // e.g. -24 dB
  ratio: number; // e.g. 4 (4:1)
  attackMs: number; // e.g. 20 ms
  releaseMs: number; // e.g. 250 ms
  kneeDb: number; // e.g. 2.0 dB
  makeupGainDb: number; // e.g. 0.0 dB
  maxDuckingDb: number; // e.g. -14 dB
}

export class AudioDspCompiler {
  public static readonly DELIVERY_PROFILES: Record<AudioDeliveryStandard, AudioDeliveryProfile> = {
    YOUTUBE: {
      id: "YOUTUBE",
      name: "YouTube Optimized",
      targetLufs: -14.0,
      maxTruePeakDbTp: -1.0,
      maxLra: 9.0,
      sampleRate: 48000,
      channels: 2,
      codec: "aac",
      bitrateKbps: 320,
    },
    STREAMING: {
      id: "STREAMING",
      name: "Streaming (Netflix / Apple TV+)",
      targetLufs: -24.0,
      maxTruePeakDbTp: -2.0,
      maxLra: 14.0,
      sampleRate: 48000,
      channels: 6,
      codec: "pcm_s24le",
      bitrateKbps: 1536,
    },
    BROADCAST_EBU: {
      id: "BROADCAST_EBU",
      name: "Broadcast Standard (EBU R128)",
      targetLufs: -23.0,
      maxTruePeakDbTp: -1.0,
      maxLra: 7.0,
      sampleRate: 48000,
      channels: 2,
      codec: "pcm_s24le",
      bitrateKbps: 1536,
    },
    PODCAST: {
      id: "PODCAST",
      name: "Podcast Spoken Word",
      targetLufs: -16.0,
      maxTruePeakDbTp: -1.0,
      maxLra: 6.0,
      sampleRate: 44100,
      channels: 2,
      codec: "aac",
      bitrateKbps: 192,
    },
    SOCIAL: {
      id: "SOCIAL",
      name: "Social Media (Instagram Reels / TikTok)",
      targetLufs: -13.0,
      maxTruePeakDbTp: -1.0,
      maxLra: 5.0,
      sampleRate: 48000,
      channels: 2,
      codec: "aac",
      bitrateKbps: 256,
    },
  };

  public static readonly DEFAULT_SIDECHAIN: SidechainCompressorConfig = {
    thresholdDb: -22.0,
    ratio: 4.5,
    attackMs: 25,
    releaseMs: 300,
    kneeDb: 2.0,
    makeupGainDb: 0.0,
    maxDuckingDb: -14.0,
  };

  /**
   * Generates FFmpeg audio filtergraph based on delivery profile and sidechain compressor parameters.
   */
  public static buildFilter(
    dialogueLabel: string,
    musicLabel: string,
    outputLabel: string,
    options?: {
      profile?: AudioDeliveryProfile;
      sidechain?: SidechainCompressorConfig;
      enableDucking?: boolean;
    }
  ): string {
    const profile = options?.profile || this.DELIVERY_PROFILES.BROADCAST_EBU;
    const sidechain = options?.sidechain || this.DEFAULT_SIDECHAIN;
    const enableDucking = options?.enableDucking !== false;

    const loudnorm = `loudnorm=I=${profile.targetLufs.toFixed(1)}:LRA=${profile.maxLra.toFixed(1)}:TP=${profile.maxTruePeakDbTp.toFixed(1)}`;

    if (!enableDucking) {
      return `[${dialogueLabel}]${loudnorm}[norm_dialogue];[${musicLabel}]volume=0.3[norm_music];[norm_dialogue][norm_music]amix=inputs=2:duration=first[${outputLabel}]`;
    }

    // Convert dB threshold to linear ratio for sidechaincompress
    const thresholdLinear = Math.pow(10, sidechain.thresholdDb / 20).toFixed(4);
    const ducking = `sidechaincompress=threshold=${thresholdLinear}:ratio=${sidechain.ratio}:attack=${sidechain.attackMs}:release=${sidechain.releaseMs}:knee=${sidechain.kneeDb}`;

    return [
      `[${dialogueLabel}]${loudnorm}[norm_dialogue]`,
      `[${musicLabel}]volume=0.4[low_music]`,
      `[low_music][norm_dialogue]${ducking}[ducked_music]`,
      `[norm_dialogue][ducked_music]amix=inputs=2:duration=first[${outputLabel}]`,
    ].join(";");
  }
}
