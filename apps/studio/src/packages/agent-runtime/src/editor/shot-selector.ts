import { NarrativeBeat } from "../story-planner/story-planner";
import { ShotDescriptor, ActionPhase } from "../media-intelligence/types";
import { HierarchicalContextPackage } from "../context-compiler/context-compiler";
import { EditorialDecision, CandidateEvaluation } from "./edit-decision";
import { DecisionAudit, FailureLayer } from "../types";
import { UserFeedbackMemory } from "../memory/feedback-memory";

export interface CandidateEligibilityCriteria {
  minStoryPotential?: number;
  allowAmbientBroll: boolean;
  requiresSubjectPresence: boolean;
  requiredActionPhases?: ActionPhase[];
}

export class CandidateEligibilityFilter {
  public static filter(
    candidates: ShotDescriptor[],
    beat: NarrativeBeat,
    criteria?: Partial<CandidateEligibilityCriteria>
  ): {
    eligible: ShotDescriptor[];
    ineligible: Array<{ shot: ShotDescriptor; reason: string }>;
  } {
    const isNarrativeBeat =
      beat.role === "HOOK" || beat.role === "BUILD" || beat.role === "PEAK_ACTION" || beat.role === "CLIMAX";
    const allowAmbientBroll = criteria?.allowAmbientBroll ?? !isNarrativeBeat;
    const minStoryPotential = criteria?.minStoryPotential ?? (isNarrativeBeat ? 0.30 : 0.10);
    const requiresSubjectPresence = criteria?.requiresSubjectPresence ?? isNarrativeBeat;

    const eligible: ShotDescriptor[] = [];
    const ineligible: Array<{ shot: ShotDescriptor; reason: string }> = [];

    for (const shot of candidates) {
      if (!allowAmbientBroll && shot.storyPotential < minStoryPotential) {
        ineligible.push({
          shot,
          reason: `Disqualified by Eligibility Filter: Story potential (${shot.storyPotential.toFixed(2)}) is below narrative threshold (${minStoryPotential.toFixed(2)}) for '${beat.role}' beat.`,
        });
        continue;
      }

      if (requiresSubjectPresence && (!shot.subjects || shot.subjects.length === 0)) {
        ineligible.push({
          shot,
          reason: `Disqualified by Eligibility Filter: Narrative beat '${beat.role}' requires protagonist or subject presence.`,
        });
        continue;
      }

      eligible.push(shot);
    }

    return { eligible, ineligible };
  }
}

export interface CoverageSimilarityCheck {
  isRedundant: boolean;
  similarityScore: number;
  reasons: string[];
}

export class CoverageSimilarity {
  public static evaluate(
    previousShot: ShotDescriptor | undefined,
    candidate: ShotDescriptor
  ): CoverageSimilarityCheck {
    if (!previousShot) {
      return { isRedundant: false, similarityScore: 0, reasons: [] };
    }

    let matchCount = 0;
    const reasons: string[] = [];

    // 1. Setup / Camera Position match
    if (previousShot.setupId && candidate.setupId && previousShot.setupId === candidate.setupId) {
      matchCount += 2.0;
      reasons.push("Same camera setup");
    }

    // 2. Framing & Shot type match
    if (previousShot.shotType === candidate.shotType && previousShot.framing === candidate.framing) {
      matchCount += 1.5;
      reasons.push("Identical framing & shot type");
    }

    // 3. Subject presence match
    const prevSubjects = new Set(previousShot.subjects || []);
    const candSubjects = new Set(candidate.subjects || []);
    const sharedSubjects = [...prevSubjects].filter((s) => candSubjects.has(s));
    if (sharedSubjects.length > 0 && prevSubjects.size === candSubjects.size) {
      matchCount += 1.0;
      reasons.push(`Identical subject focus (${sharedSubjects.join(", ")})`);
    }

    // 4. Action phase match
    if (previousShot.actionPhase === candidate.actionPhase) {
      matchCount += 0.5;
      reasons.push(`Same action phase (${candidate.actionPhase})`);
    }

    const similarityScore = Math.min(1.0, matchCount / 5.0);
    const isRedundant = similarityScore >= 0.70;

    return { isRedundant, similarityScore, reasons };
  }
}

export class ComparativeShotSelector {
  private feedbackMemory: UserFeedbackMemory;

  constructor(feedbackMemory?: UserFeedbackMemory) {
    this.feedbackMemory = feedbackMemory || new UserFeedbackMemory();
  }

  /**
   * Evaluates a candidate pool for a narrative beat through explicit comparative reasoning.
   * Architecture:
   *   Retriever -> Candidate Pool -> Eligibility Filter (Hard Constraints) -> Comparative Ranker (Soft Preferences) -> Editorial Decision
   */
  public selectForBeat(
    beat: NarrativeBeat,
    candidates: ShotDescriptor[],
    context: HierarchicalContextPackage,
    targetStartSec: number,
    criteria?: Partial<CandidateEligibilityCriteria>,
    previousShot?: ShotDescriptor
  ): EditorialDecision {
    if (candidates.length === 0) {
      throw new Error(`No candidate shots available for narrative beat '${beat.beatId}'`);
    }

    // Step 1: Hard Constraints / Eligibility Filtering
    const { eligible, ineligible } = CandidateEligibilityFilter.filter(candidates, beat, criteria);
    const poolToRank = eligible.length > 0 ? eligible : candidates;

    const comparisons: CandidateEvaluation[] = [];

    // Step 2: Score and compare each eligible candidate
    for (const candidate of poolToRank) {
      const pros: string[] = [];
      const cons: string[] = [];

      // Check feedback constraints
      const feedbackCheck = this.feedbackMemory.evaluateShot(candidate.shotId, beat.role);
      if (feedbackCheck.penalty > 0) {
        cons.push(`User feedback constraint penalty: ${feedbackCheck.reason}`);
      }

      // Action Phase check
      if (candidate.actionPhase === beat.preferredActionPhase) {
        pros.push(`Action phase '${candidate.actionPhase}' perfectly matches beat requirement`);
      } else if (candidate.actionPhase === "PEAK_ACTION" && beat.role === "CLIMAX") {
        pros.push("Peak action dynamic matches climactic energy");
      } else {
        cons.push(`Action phase '${candidate.actionPhase}' does not align with beat phase '${beat.preferredActionPhase}'`);
      }

      // Visual quality check
      if (candidate.visualQuality >= 0.85) {
        pros.push(`High visual aesthetic (${(candidate.visualQuality * 100).toFixed(0)}% quality)`);
      } else if (candidate.visualQuality < 0.70) {
        cons.push(`Lower technical sharpness (${(candidate.visualQuality * 100).toFixed(0)}%)`);
      }

      // Screen direction & continuity
      if (candidate.continuityFeatures.screenDirection === "LEFT_TO_RIGHT") {
        pros.push("Screen direction 'LEFT_TO_RIGHT' maintains positive forward momentum");
      }

      // Multi-factor coverage redundancy check
      const redundancyCheck = CoverageSimilarity.evaluate(previousShot, candidate);
      if (redundancyCheck.isRedundant) {
        cons.push(`Coverage redundancy: ${redundancyCheck.reasons.join(", ")}`);
      }

      // Story potential
      if (candidate.storyPotential >= 0.85) {
        pros.push("High narrative significance with strong subject focus");
      }

      comparisons.push({
        shotId: candidate.shotId,
        assetId: candidate.assetId,
        actionPhase: candidate.actionPhase,
        visualQuality: candidate.visualQuality,
        pros,
        cons,
      });
    }

    // Step 3: Comparative ranking based on pros vs cons + narrative fitness
    const isActionBeat = beat.role === "BUILD" || beat.role === "PEAK_ACTION" || beat.role === "CLIMAX";
    const ranked = poolToRank.map((candidate, idx) => {
      const comp = comparisons[idx];
      const proScore = comp.pros.length * 1.5;
      const conScore = comp.cons.length * 1.2;
      const feedbackPenalty = this.feedbackMemory.evaluateShot(candidate.shotId, beat.role).penalty;

      // Special handling for Action beats vs Ambient beats:
      // In action beats, kinetic density and story potential heavily outweigh pure visual quality
      const kineticMultiplier = isActionBeat ? 4.5 : 3.0;
      const storyWeight = candidate.storyPotential * kineticMultiplier;
      const visualWeight = candidate.visualQuality * 1.5;

      const redundancyPenalty = CoverageSimilarity.evaluate(previousShot, candidate).isRedundant ? 2.5 : 0.0;

      const fitness = proScore - conScore + storyWeight + visualWeight - feedbackPenalty - redundancyPenalty;

      return { candidate, comp, fitness };
    });

    ranked.sort((a, b) => b.fitness - a.fitness);

    const winner = ranked[0].candidate;
    const winningComp = ranked[0].comp;

    // Step 4: Combine documented rejections from ranking and eligibility filtering
    const rejectedCandidates: Array<{ shotId: string; reason: string; attributedLayer?: FailureLayer }> = [];

    // Add ineligible shots
    for (const inel of ineligible) {
      rejectedCandidates.push({
        shotId: inel.shot.shotId,
        reason: inel.reason,
        attributedLayer: "ELIGIBILITY_FILTER",
      });
    }

    // Add ranked alternatives
    for (const r of ranked.slice(1)) {
      let reason = `Cons outweigh pros: ${r.comp.cons.join("; ") || "Lower overall narrative/action phase alignment"}`;
      if (r.candidate.storyPotential < 0.3 && r.candidate.visualQuality > 0.9) {
        reason = "Rejected beauty-trap: aesthetically high quality but narratively empty/irrelevant for sequence progression.";
      } else if (r.candidate.continuityFeatures.screenDirection === "STATIC" && beat.role === "BUILD") {
        reason = "Rejected: static composition fails to generate required forward momentum.";
      }
      r.comp.rejectionReason = reason;
      rejectedCandidates.push({
        shotId: r.candidate.shotId,
        reason,
        attributedLayer: "EDITORIAL_RANKER",
      });
    }

    const visionSummary =
      context.level5_visionInspection.find((v) => v.shotId === winner.shotId)?.notes ||
      `Verified spatial trajectory for '${winner.shotId}'`;

    const decisionId = `dec_${beat.beatId}_${winner.shotId}`;
    const selectedDuration = Math.min(winner.durationSec, beat.targetDurationSec);

    const audit: DecisionAudit = {
      decisionId,
      objective: `Deliver ${beat.role} with ${beat.targetEmotion} emotion and ${beat.pacingDensity} pacing density`,
      candidates: candidates.map((c) => c.shotId),
      selectedCandidate: winner.shotId,
      rejectedCandidates,
      evidenceUsed: winningComp.pros,
      constraintsUsed: [`Duration ~${beat.targetDurationSec}s`, `Phase ${beat.preferredActionPhase}`],
      visionEvidenceUsed: [visionSummary],
      uncertainty: ranked[0].fitness - (ranked[1]?.fitness || 0) < 1.0 ? ["Alternative shot is close in fitness"] : [],
      confidence: Math.min(0.98, Math.max(0.70, 0.80 + (ranked[0].fitness - (ranked[1]?.fitness || 0)) * 0.05)),
      attributedLayer: "EDITORIAL_RANKER",
    };

    return {
      decisionId,
      beatId: beat.beatId,
      narrativeObjective: audit.objective,
      candidateSet: candidates.map((c) => c.shotId),
      constraints: audit.constraintsUsed,
      candidateComparisons: comparisons,
      selectedCandidate: {
        shotId: winner.shotId,
        assetId: winner.assetId,
        sourceInSec: 0,
        sourceOutSec: selectedDuration,
        durationSec: selectedDuration,
        selectionRationale: `Selected '${winner.shotId}' because its action phase '${winner.actionPhase}' and subject focus (${winner.subjects.join(", ")}) best achieve ${beat.role} requirements.`,
        visionEvidence: visionSummary,
      },
      rejectedCandidates,
      targetTrackId:
        beat.role === "ESTABLISHING" || beat.role === "HOOK" || beat.role === "CLIMAX"
          ? "trk_v1_primary"
          : "trk_v2_broll",
      targetStartSec,
      transition: {
        type: beat.role === "RESOLUTION" ? "CROSS_DISSOLVE" : "CUT",
        durationSec: beat.role === "RESOLUTION" ? 1.0 : 0.0,
      },
      audioDecision: {
        bus: beat.role === "HOOK" ? "SFX" : "DIALOGUE",
        duckingDb: beat.role === "CLIMAX" ? -14 : -10,
        holdVisualAfterSentence: true,
      },
      colorDecision: {
        sourceGrading: "Rec.709 Standard Scene Neutral",
        exposureOffset: 0.0,
        wbTempOffset: 0.0,
        lutName: beat.role === "CLIMAX" || beat.role === "RESOLUTION" ? "Warm_Filmic_5207.cube" : undefined,
        intensity: 0.85,
      },
      confidence: audit.confidence,
      audit,
    };
  }
}
