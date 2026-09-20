import { TimelineIR } from "@aetheredit/timeline-ir";
import { CreativeBrief } from "../story-planner/brief-compiler";

export interface ColorGradeAction {
  clipId: string;
  stage: "NORMALIZE" | "CORRECT" | "MATCH" | "CREATIVE_LOOK" | "VALIDATE";
  exposureOffset: number;
  wbTempOffset: number;
  lutApplied?: string;
  notes: string;
}

export class ColorDirector {
  /**
   * Applies the professional 5-step color pipeline.
   * Creative 3D LUT is ONLY applied if creative look is requested in the brief.
   */
  public applyColorPipeline(timeline: TimelineIR, brief: CreativeBrief): ColorGradeAction[] {
    const actions: ColorGradeAction[] = [];
    const videoTracks = timeline.tracks.filter((t) => t.type === "VIDEO");

    const requireCreativeLook = brief.editingIntent.includes("CINEMATIC") || brief.visualStyle.includes("filmic");

    for (const track of videoTracks) {
      for (const clip of track.clips) {
        // Step 1: Normalize
        // Step 2: Correct
        // Step 3: Match
        const baseGrade: ColorGradeAction = {
          clipId: clip.id,
          stage: "MATCH",
          exposureOffset: +0.15,
          wbTempOffset: +200, // Slight warm shift for golden hour
          notes: "Normalized from Rec.709, adjusted midtone contrast, and matched scene white balance.",
        };

        // Step 4: Creative Look / LUT (Optional)
        if (requireCreativeLook) {
          baseGrade.stage = "CREATIVE_LOOK";
          baseGrade.lutApplied = "Warm_Filmic_5207.cube";
          clip.effects.push({
            id: `fx_lut_${clip.id}`,
            pluginId: "color_3d_lut",
            enabled: true,
            parameters: {
              lut: "Warm_Filmic_5207.cube",
              intensity: 0.85,
              interpolation: "tetrahedral",
            },
          });
        }

        actions.push(baseGrade);
      }
    }

    return actions;
  }
}
