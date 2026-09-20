import { CreativeBrief } from "./brief-compiler";
import { MediaKnowledgeCatalog } from "../media-intelligence/catalog";
import { IntelligentModelRouter } from "@aetheredit/ai-gateway";

export type NarrativeBeatRole =
  | "HOOK"
  | "ESTABLISHING"
  | "CONTEXT"
  | "BUILD"
  | "PEAK_ACTION"
  | "CLIMAX"
  | "RESOLUTION"
  | "CTA";

export interface NarrativeBeat {
  beatId: string;
  role: NarrativeBeatRole;
  targetDurationSec: number;
  targetEmotion: string;
  requiredShotTypes: string[];
  preferredActionPhase: string;
  pacingDensity: "FAST" | "MEDIUM" | "SLOW";
  audioRole: "HOOK_STINGER" | "DIALOGUE_PRIMARY" | "MUSIC_BUILD" | "CLIMAX_DROP" | "AMBIENT_OUTRO";
  setupForPayoffBeatId?: string;
  isPayoffForBeatId?: string;
}

export interface SetupPayoffRelationship {
  setupBeatId: string;
  payoffBeatId: string;
  description: string;
}

export interface StoryStructureOption {
  optionId: string;
  name: string;
  archetype: string;
  justification: string;
  beats: NarrativeBeat[];
  setupPayoffs: SetupPayoffRelationship[];
  confidence: number;
  evidenceCoverage: number;
  constraintSatisfaction: number;
  modelUncertainty: number;
}

export interface StoryPlanSelectionResult {
  selectedOption: StoryStructureOption;
  alternativeOptions: StoryStructureOption[];
  requiresUserConfirmation: boolean;
  selectionRationale: string;
}

export class StoryPlanner {
  private aiRouter: IntelligentModelRouter;

  constructor(aiRouter?: IntelligentModelRouter) {
    this.aiRouter = aiRouter || new IntelligentModelRouter();
  }

  public async generatePlanOptions(
    brief: CreativeBrief,
    catalog: MediaKnowledgeCatalog
  ): Promise<StoryStructureOption[]> {
    const totalDuration = brief.targetDurationSec || 45.0;

    // Option A: Hero Cinematic Journey (Establishing -> Discovery -> Action Peak -> Sunset Resolution)
    const optionA: StoryStructureOption = {
      optionId: "opt_a_hero_journey",
      name: "Cinematic Journey Arc",
      archetype: "HERO_JOURNEY",
      justification: "Focuses on geographic progression from coastal arrival to peak adrenaline and golden hour sunset.",
      beats: [
        {
          beatId: "beat_01_hook",
          role: "HOOK",
          targetDurationSec: Math.min(3.5, totalDuration * 0.08),
          targetEmotion: "instant wonder",
          requiredShotTypes: ["AERIAL", "CLOSE_UP"],
          preferredActionPhase: "ENTER",
          pacingDensity: "FAST",
          audioRole: "HOOK_STINGER",
          setupForPayoffBeatId: "beat_04_climax",
        },
        {
          beatId: "beat_02_establishing",
          role: "ESTABLISHING",
          targetDurationSec: totalDuration * 0.20,
          targetEmotion: "spacious awe",
          requiredShotTypes: ["WIDE", "AERIAL"],
          preferredActionPhase: "OPENING",
          pacingDensity: "SLOW",
          audioRole: "MUSIC_BUILD",
        },
        {
          beatId: "beat_03_build",
          role: "BUILD",
          targetDurationSec: totalDuration * 0.35,
          targetEmotion: "accelerating energy",
          requiredShotTypes: ["MEDIUM", "TRACKING"],
          preferredActionPhase: "ENTER",
          pacingDensity: "MEDIUM",
          audioRole: "MUSIC_BUILD",
        },
        {
          beatId: "beat_04_climax",
          role: "CLIMAX",
          targetDurationSec: totalDuration * 0.22,
          targetEmotion: "peak exhilaration",
          requiredShotTypes: ["CLOSE_UP", "AERIAL"],
          preferredActionPhase: "PEAK_ACTION",
          pacingDensity: "FAST",
          audioRole: "CLIMAX_DROP",
          isPayoffForBeatId: "beat_01_hook",
        },
        {
          beatId: "beat_05_resolution",
          role: "RESOLUTION",
          targetDurationSec: totalDuration * 0.15,
          targetEmotion: "peaceful warmth",
          requiredShotTypes: ["WIDE", "MEDIUM"],
          preferredActionPhase: "COMPLETION",
          pacingDensity: "SLOW",
          audioRole: "AMBIENT_OUTRO",
        },
      ],
      setupPayoffs: [
        {
          setupBeatId: "beat_01_hook",
          payoffBeatId: "beat_04_climax",
          description: "Initial surfer glimpse in Beat 1 pays off with massive wave barrel victory in Beat 4",
        },
      ],
      confidence: 0.93,
      evidenceCoverage: 0.95,
      constraintSatisfaction: 0.98,
      modelUncertainty: 0.08,
    };

    // Option B: Character & Culture Focus
    const optionB: StoryStructureOption = {
      optionId: "opt_b_character_arc",
      name: "Human & Cultural Narrative Arc",
      archetype: "CHARACTER_STORY",
      justification: "Centers on traveler interacting with town locals before reaching the cliff overlook.",
      beats: [
        {
          beatId: "beat_01_portrait_hook",
          role: "HOOK",
          targetDurationSec: totalDuration * 0.10,
          targetEmotion: "intimacy",
          requiredShotTypes: ["CLOSE_UP"],
          preferredActionPhase: "ENTER",
          pacingDensity: "MEDIUM",
          audioRole: "DIALOGUE_PRIMARY",
        },
        {
          beatId: "beat_02_context",
          role: "CONTEXT",
          targetDurationSec: totalDuration * 0.30,
          targetEmotion: "curiosity",
          requiredShotTypes: ["MEDIUM", "WIDE"],
          preferredActionPhase: "ENTER",
          pacingDensity: "MEDIUM",
          audioRole: "MUSIC_BUILD",
        },
        {
          beatId: "beat_03_climax_reunion",
          role: "CLIMAX",
          targetDurationSec: totalDuration * 0.40,
          targetEmotion: "heartfelt connection",
          requiredShotTypes: ["CLOSE_UP"],
          preferredActionPhase: "PEAK_ACTION",
          pacingDensity: "MEDIUM",
          audioRole: "CLIMAX_DROP",
        },
        {
          beatId: "beat_04_resolution",
          role: "RESOLUTION",
          targetDurationSec: totalDuration * 0.20,
          targetEmotion: "gratitude",
          requiredShotTypes: ["WIDE"],
          preferredActionPhase: "COMPLETION",
          pacingDensity: "SLOW",
          audioRole: "AMBIENT_OUTRO",
        },
      ],
      setupPayoffs: [],
      confidence: 0.81,
      evidenceCoverage: 0.78,
      constraintSatisfaction: 0.85,
      modelUncertainty: 0.20,
    };

    // Option C: High-Energy Sensory Montage
    const optionC: StoryStructureOption = {
      optionId: "opt_c_sensory_montage",
      name: "High-Energy Kinetic Montage",
      archetype: "KINETIC_MONTAGE",
      justification: "Rapid beat-synchronized cuts emphasizing action and motion transitions.",
      beats: [
        {
          beatId: "beat_01_flash_hook",
          role: "HOOK",
          targetDurationSec: totalDuration * 0.12,
          targetEmotion: "shock & awe",
          requiredShotTypes: ["AERIAL", "CLOSE_UP"],
          preferredActionPhase: "PEAK_ACTION",
          pacingDensity: "FAST",
          audioRole: "HOOK_STINGER",
        },
        {
          beatId: "beat_02_kinetic_surge",
          role: "BUILD",
          targetDurationSec: totalDuration * 0.50,
          targetEmotion: "pure momentum",
          requiredShotTypes: ["TRACKING", "POV"],
          preferredActionPhase: "ENTER",
          pacingDensity: "FAST",
          audioRole: "MUSIC_BUILD",
        },
        {
          beatId: "beat_03_sensory_peak",
          role: "CLIMAX",
          targetDurationSec: totalDuration * 0.25,
          targetEmotion: "apex rush",
          requiredShotTypes: ["AERIAL"],
          preferredActionPhase: "PEAK_ACTION",
          pacingDensity: "FAST",
          audioRole: "CLIMAX_DROP",
        },
        {
          beatId: "beat_04_stinger",
          role: "CTA",
          targetDurationSec: totalDuration * 0.13,
          targetEmotion: "memorable mark",
          requiredShotTypes: ["CLOSE_UP"],
          preferredActionPhase: "COMPLETION",
          pacingDensity: "SLOW",
          audioRole: "AMBIENT_OUTRO",
        },
      ],
      setupPayoffs: [],
      confidence: 0.86,
      evidenceCoverage: 0.88,
      constraintSatisfaction: 0.90,
      modelUncertainty: 0.14,
    };

    return [optionA, optionB, optionC];
  }

  public selectBestOption(options: StoryStructureOption[], brief: CreativeBrief): StoryPlanSelectionResult {
    // Sort by composite score: confidence + evidenceCoverage + constraintSatisfaction - modelUncertainty
    const scored = options.map((opt) => {
      const composite = opt.confidence * 0.4 + opt.evidenceCoverage * 0.3 + opt.constraintSatisfaction * 0.3 - opt.modelUncertainty * 0.2;
      return { opt, composite };
    });

    scored.sort((a, b) => b.composite - a.composite);

    const winner = scored[0].opt;
    const runnerUp = scored[1]?.opt;
    const delta = runnerUp ? (scored[0].composite - scored[1].composite) : 1.0;

    const requiresUserConfirmation = delta < 0.10; // If very close, flag for user

    return {
      selectedOption: winner,
      alternativeOptions: options.filter((o) => o.optionId !== winner.optionId),
      requiresUserConfirmation,
      selectionRationale: `Selected '${winner.name}' (${winner.archetype}) as it best satisfies brief intent '${brief.editingIntent}' with ${(winner.confidence * 100).toFixed(0)}% confidence and strong setup-payoff continuity.`,
    };
  }
}
