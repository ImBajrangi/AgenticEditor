import { CreativeBrief } from "../story-planner/brief-compiler";
import { MediaKnowledgeCatalog } from "../media-intelligence/catalog";
import { NarrativeBeat } from "../story-planner/story-planner";
import { AdaptiveFrameInspector } from "../media-intelligence/frame-inspector";
import { VisionEvidenceItem } from "../types";
import { ShotDescriptor, SceneDescriptor, SetupDescriptor } from "../media-intelligence/types";

export interface HierarchicalContextPackage {
  level1_projectSummary: {
    goal: string;
    targetDurationSec: number;
    aspectRatio: string;
    editingIntent: string;
    mustInclude: string[];
    mustAvoid: string[];
  };
  level2_sceneStructure: Array<{
    sceneId: string;
    location: string;
    timeOfDay: string;
    confidence: number;
    setupCount: number;
  }>;
  level3_candidateShotsSummary: Array<{
    shotId: string;
    shotType: string;
    actionPhase: string;
    visualQuality: number;
    subjects: string[];
  }>;
  level4_detailedEvidence: Array<{
    shotId: string;
    continuity: { eyeline: string; screenDirection: string };
    storyPotential: number;
    emotionalIntensity: number;
    action: string;
  }>;
  level5_visionInspection: VisionEvidenceItem[];
  tokenEstimate: number;
}

export class VideoContextCompiler {
  private frameInspector: AdaptiveFrameInspector;

  constructor(frameInspector?: AdaptiveFrameInspector) {
    this.frameInspector = frameInspector || new AdaptiveFrameInspector();
  }

  public async compileContextForBeat(
    brief: CreativeBrief,
    catalog: MediaKnowledgeCatalog,
    activeBeat: NarrativeBeat,
    candidateShots: ShotDescriptor[]
  ): Promise<HierarchicalContextPackage> {
    // Level 1: Project & Brief
    const level1 = {
      goal: brief.goal,
      targetDurationSec: brief.targetDurationSec,
      aspectRatio: brief.aspectRatio,
      editingIntent: brief.editingIntent,
      mustInclude: brief.mustInclude,
      mustAvoid: brief.mustAvoid,
    };

    // Level 2: Scene Summaries
    const scenes = catalog.getScenes();
    const level2 = scenes.map((s: SceneDescriptor) => ({
      sceneId: s.sceneId,
      location: s.location,
      timeOfDay: s.timeOfDay,
      confidence: s.confidence,
      setupCount: s.setups.length,
    }));

    // Level 3: Candidate Shots
    const level3 = candidateShots.map((c) => ({
      shotId: c.shotId,
      shotType: c.shotType,
      actionPhase: c.actionPhase,
      visualQuality: c.visualQuality,
      subjects: c.subjects,
    }));

    // Level 4: Detailed Shot Evidence (top 6-8 candidates)
    const topCandidates = candidateShots.slice(0, 6);
    const level4 = topCandidates.map((c) => ({
      shotId: c.shotId,
      continuity: {
        eyeline: c.continuityFeatures.eyeline,
        screenDirection: c.continuityFeatures.screenDirection,
      },
      storyPotential: c.storyPotential,
      emotionalIntensity: c.emotionalIntensity,
      action: c.action,
    }));

    // Level 5: Adaptive Multimodal Frame Inspection for top 2-3 candidates
    const inspectionCandidates = candidateShots.slice(0, 3);
    const level5: VisionEvidenceItem[] = [];

    for (const shot of inspectionCandidates) {
      const visionEvidence = await this.frameInspector.inspectShot(shot, {
        requireTemporalClip: activeBeat.role === "CLIMAX" || activeBeat.role === "HOOK",
      });
      level5.push(visionEvidence);
    }

    const tokenEstimate = 450 + level2.length * 25 + level3.length * 30 + level4.length * 40 + level5.length * 60;

    return {
      level1_projectSummary: level1,
      level2_sceneStructure: level2,
      level3_candidateShotsSummary: level3,
      level4_detailedEvidence: level4,
      level5_visionInspection: level5,
      tokenEstimate,
    };
  }
}
