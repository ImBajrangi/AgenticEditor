import { AutonomyLevel } from "../types";

export type EditorialOperationType =
  | "TRIM_SILENCE"
  | "MINOR_SHOT_REPLACE"
  | "AUDIO_DUCKING"
  | "COLOR_MATCHING"
  | "TECHNICAL_FIX"
  | "MAJOR_NARRATIVE_RESTRUCTURE"
  | "DELETE_IMPORTANT_DIALOGUE"
  | "CHANGE_STORY_ARC"
  | "REMOVE_MANDATORY_CONTENT"
  | "MAJOR_MUSIC_REPLACE";

export interface AutonomyPolicyConfig {
  level: AutonomyLevel;
  confidenceThreshold: number;
}

export class AutonomyPolicy {
  private level: AutonomyLevel;
  private confidenceThreshold: number;

  constructor(config: AutonomyPolicyConfig = { level: "L3_EXECUTE_CREATIVE", confidenceThreshold: 0.75 }) {
    this.level = config.level;
    this.confidenceThreshold = config.confidenceThreshold;
  }

  public setLevel(level: AutonomyLevel): void {
    this.level = level;
  }

  public canAutoExecute(operation: EditorialOperationType, confidence: number): { allowed: boolean; reason: string } {
    if (this.level === "L0_SUGGEST_ONLY") {
      return { allowed: false, reason: "Autonomy level L0 (Suggest Only) requires user approval for all changes." };
    }

    if (this.level === "L4_FULLY_AUTONOMOUS") {
      return { allowed: true, reason: "Autonomy level L4 permits fully autonomous execution." };
    }

    const isRoutine = [
      "TRIM_SILENCE",
      "MINOR_SHOT_REPLACE",
      "AUDIO_DUCKING",
      "COLOR_MATCHING",
      "TECHNICAL_FIX",
    ].includes(operation);

    const isMajorCreative = [
      "MAJOR_NARRATIVE_RESTRUCTURE",
      "DELETE_IMPORTANT_DIALOGUE",
      "CHANGE_STORY_ARC",
      "REMOVE_MANDATORY_CONTENT",
      "MAJOR_MUSIC_REPLACE",
    ].includes(operation);

    if (this.level === "L2_EXECUTE_REVERSIBLE" || this.level === "L3_EXECUTE_CREATIVE") {
      if (isRoutine && confidence >= this.confidenceThreshold) {
        return { allowed: true, reason: `Routine operation '${operation}' with ${(confidence * 100).toFixed(0)}% confidence auto-approved.` };
      }
      if (isMajorCreative) {
        return { allowed: false, reason: `Major creative operation '${operation}' requires human director confirmation.` };
      }
    }

    return { allowed: confidence >= this.confidenceThreshold, reason: `Execution based on confidence threshold (${confidence.toFixed(2)})` };
  }
}
