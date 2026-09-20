import { DecisionAudit } from "../types";

export interface CandidateEvaluation {
  shotId: string;
  assetId: string;
  actionPhase: string;
  visualQuality: number;
  pros: string[];
  cons: string[];
  rejectionReason?: string;
  visionSummary?: string;
}

export interface EditorialDecision {
  decisionId: string;
  beatId: string;
  narrativeObjective: string;
  candidateSet: string[];
  constraints: string[];
  candidateComparisons: CandidateEvaluation[];
  selectedCandidate: {
    shotId: string;
    assetId: string;
    sourceInSec: number;
    sourceOutSec: number;
    durationSec: number;
    selectionRationale: string;
    visionEvidence: string;
  };
  rejectedCandidates: Array<{ shotId: string; reason: string; potentialFutureRole?: string }>;
  targetTrackId: "trk_v1_primary" | "trk_v2_broll";
  targetStartSec: number;
  transition: { type: "CUT" | "CROSS_DISSOLVE" | "DIP_TO_BLACK"; durationSec: number };
  audioDecision: {
    bus: "DIALOGUE" | "MUSIC" | "SFX";
    duckingDb?: number;
    fadeInSec?: number;
    holdVisualAfterSentence?: boolean;
  };
  colorDecision: {
    sourceGrading: string;
    exposureOffset: number;
    wbTempOffset: number;
    lutName?: string;
    intensity?: number;
  };
  confidence: number;
  audit: DecisionAudit;
}
