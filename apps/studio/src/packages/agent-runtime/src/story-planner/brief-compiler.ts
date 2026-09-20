import { CreativeIntent, CreativeConstraint } from "../types";

export interface CreativeBrief extends CreativeIntent {
  mustInclude: string[];
  mustAvoid: string[];
  musicStyle: string;
  musicEnergy: "LOW" | "MEDIUM" | "HIGH" | "DYNAMIC_BUILD";
  dialoguePriority: "PRIMARY" | "BACKGROUND" | "NONE";
  visualPriority: "AESTHETIC_HERO" | "ACTION_MOMENTUM" | "SUBTLE_INTIMATE";
  openingRequirement: string;
  endingRequirement: string;
  brandConstraints: Record<string, unknown>;
  constraints: CreativeConstraint[];
  rawPrompt: string;
}

export class CreativeBriefCompiler {
  public static compile(prompt: string, userOverrides: Partial<CreativeBrief> = {}): CreativeBrief {
    const lower = prompt.toLowerCase();

    let targetDurationSec = 45.0;
    if (lower.includes("30") || lower.includes("30s")) targetDurationSec = 30.0;
    else if (lower.includes("60") || lower.includes("60s") || lower.includes("1 minute")) targetDurationSec = 60.0;
    else if (lower.includes("90") || lower.includes("90s")) targetDurationSec = 90.0;

    let aspectRatio: "16:9" | "9:16" | "1:1" = "16:9";
    if (lower.includes("9:16") || lower.includes("reel") || lower.includes("tiktok") || lower.includes("shorts")) {
      aspectRatio = "9:16";
    }

    let editingIntent = "CINEMATIC_PREMIUM";
    if (lower.includes("viral") || lower.includes("fast") || lower.includes("tiktok")) {
      editingIntent = "FAST_VIRAL";
    } else if (lower.includes("interview") || lower.includes("talking head") || lower.includes("podcast")) {
      editingIntent = "CLEAR_STORYTELLING";
    } else if (lower.includes("commercial") || lower.includes("expensive")) {
      editingIntent = "EXPENSIVE_COMMERCIAL";
    }

    const mustInclude: string[] = [];
    if (lower.includes("scenic") || lower.includes("travel")) mustInclude.push("scenic", "landscape", "arrival");
    if (lower.includes("surf") || lower.includes("action")) mustInclude.push("surfing", "action");
    if (lower.includes("sunset")) mustInclude.push("sunset");

    const mustAvoid: string[] = ["shaky", "out_of_focus", "duplicate_angle"];

    const constraints: CreativeConstraint[] = [
      { type: "DURATION", target: `${targetDurationSec}s`, description: `Total edit duration ~${targetDurationSec} seconds` },
      { type: "ASPECT_RATIO", target: aspectRatio, description: `Canvas aspect ratio ${aspectRatio}` },
    ];

    return {
      goal: prompt,
      targetDurationSec,
      aspectRatio,
      editingIntent,
      pacingProfile: editingIntent === "FAST_VIRAL" ? "DYNAMIC_RAPID" : "DYNAMIC_CINEMATIC",
      visualStyle: "Natural 35mm filmic tone, warm golden highlights",
      mustInclude,
      mustAvoid,
      musicStyle: "Organic acoustic swell leading into uplifting cinematic percussion",
      musicEnergy: "DYNAMIC_BUILD",
      dialoguePriority: lower.includes("interview") ? "PRIMARY" : "BACKGROUND",
      visualPriority: "AESTHETIC_HERO",
      openingRequirement: "High-energy hook within first 2.5 seconds",
      endingRequirement: "Emotional visual payoff with warm resolution",
      brandConstraints: {},
      constraints,
      rawPrompt: prompt,
      ...userOverrides,
    };
  }
}
