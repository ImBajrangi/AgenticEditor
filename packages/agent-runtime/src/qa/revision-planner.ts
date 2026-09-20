import { TimelineIR, TimelineMutator } from "@aetheredit/timeline-ir";
import { EditorialDecision } from "../editor/edit-decision";
import { CriticFinding } from "./creative-critic";
import { MediaKnowledgeCatalog } from "../media-intelligence/catalog";

export interface RevisionActionRecord {
  findingId: string;
  actionType: string;
  targetClipId: string;
  replacedShotId?: string;
  newShotId?: string;
  reason: string;
  timestamp: number;
}

export interface RevisionResult {
  appliedActions: RevisionActionRecord[];
  oscillationPrevented: boolean;
  status: "REVISED" | "CONVERGED_EARLY" | "NO_CHANGE";
  summary: string;
}

export class RevisionPlanner {
  private revisionHistory: RevisionActionRecord[] = [];
  private seenCombinations = new Set<string>();

  /**
   * Plans and applies non-destructive revisions to resolve CriticFindings.
   * Includes anti-oscillation guards to prevent infinite swap loops.
   */
  public planAndExecuteRevisions(
    timeline: TimelineIR,
    decisions: EditorialDecision[],
    findings: CriticFinding[],
    catalog: MediaKnowledgeCatalog
  ): RevisionResult {
    const appliedActions: RevisionActionRecord[] = [];
    let oscillationPrevented = false;

    const primaryTrack = timeline.tracks.find((t) => t.id === "trk_v1_primary") || timeline.tracks[0];

    for (const finding of findings) {
      if (finding.actionType === "EDITORIAL_SWAP") {
        const targetDec = decisions.find((d) => d.decisionId === finding.targetDecisionId) || decisions[0];
        const oldShotId = targetDec.selectedCandidate.shotId;
        const newShotId = finding.suggestedShotId || targetDec.rejectedCandidates[0]?.shotId || "shot_018";

        const swapKey = `${targetDec.decisionId}:${oldShotId}->${newShotId}`;
        const reverseKey = `${targetDec.decisionId}:${newShotId}->${oldShotId}`;

        // Anti-Oscillation Guard: Check if we are ping-ponging back to a previously replaced shot
        if (this.seenCombinations.has(reverseKey)) {
          oscillationPrevented = true;
          continue; // Halt swap to prevent ping-pong loop
        }

        const newShot = catalog.getShot(newShotId);
        if (newShot) {
          // Find clip on timeline
          const clipToReplace = primaryTrack.clips.find((c) => c.name.includes(oldShotId) || c.assetId.includes(oldShotId));
          if (clipToReplace) {
            clipToReplace.assetId = newShot.assetId;
            clipToReplace.name = `Clip ${newShot.shotId} (Revised)`;
          }

          // Update decision
          targetDec.selectedCandidate.shotId = newShot.shotId;
          targetDec.selectedCandidate.assetId = newShot.assetId;
          targetDec.selectedCandidate.selectionRationale += ` [Revised per Critic: ${finding.recommendation}]`;

          const actionRecord: RevisionActionRecord = {
            findingId: finding.id,
            actionType: "EDITORIAL_SWAP",
            targetClipId: clipToReplace?.id || "clip_revised",
            replacedShotId: oldShotId,
            newShotId: newShot.shotId,
            reason: finding.recommendation,
            timestamp: Date.now(),
          };

          appliedActions.push(actionRecord);
          this.revisionHistory.push(actionRecord);
          this.seenCombinations.add(swapKey);
        }
      } else if (finding.actionType === "TIMELINE_MUTATION") {
        // Trim pacing
        for (const clip of primaryTrack.clips) {
          if (clip.timelineRange.duration > 120) {
            clip.timelineRange.duration = Math.round(clip.timelineRange.duration * 0.85);
          }
        }

        appliedActions.push({
          findingId: finding.id,
          actionType: "TIMELINE_MUTATION",
          targetClipId: primaryTrack.clips[0]?.id || "track_v1",
          reason: finding.recommendation,
          timestamp: Date.now(),
        });
      }
    }

    return {
      appliedActions,
      oscillationPrevented,
      status: appliedActions.length > 0 ? "REVISED" : "NO_CHANGE",
      summary: `Applied ${appliedActions.length} editorial revision(s). Anti-oscillation status: ${oscillationPrevented ? "ACTIVE_GUARDED" : "CLEAN"}.`,
    };
  }

  public getHistory(): RevisionActionRecord[] {
    return this.revisionHistory;
  }
}
