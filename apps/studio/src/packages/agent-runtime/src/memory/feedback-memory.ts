export type UserFeedbackAction =
  | "REJECT_SHOT"
  | "PREFER_SHOT"
  | "REJECT_MUSIC"
  | "PREFER_STYLE"
  | "CHANGE_DURATION"
  | "APPROVE_DECISION";

export interface UserFeedbackEvent {
  id: string;
  target: string; // shotId, assetId, musicId, styleId
  action: UserFeedbackAction;
  reason: string;
  contextConstraint?: string;
  timestamp: number;
  scope: "SESSION" | "PROJECT" | "GLOBAL";
}

export class UserFeedbackMemory {
  private events: UserFeedbackEvent[] = [];

  public recordFeedback(event: Omit<UserFeedbackEvent, "id" | "timestamp">): UserFeedbackEvent {
    const fullEvent: UserFeedbackEvent = {
      ...event,
      id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };
    this.events.push(fullEvent);
    return fullEvent;
  }

  public getEvents(): UserFeedbackEvent[] {
    return this.events;
  }

  /**
   * Evaluates a candidate shot against learned user feedback with context awareness.
   * e.g. A shaky shot rejected for general montage can still be used if it is the unique source for an emotional climax.
   */
  public evaluateShot(shotId: string, beatRole: string): { allowed: boolean; penalty: number; reason?: string } {
    const rejectEvent = this.events.find((e) => e.target === shotId && e.action === "REJECT_SHOT");

    if (!rejectEvent) {
      const preferEvent = this.events.find((e) => e.target === shotId && e.action === "PREFER_SHOT");
      if (preferEvent) {
        return { allowed: true, penalty: -2.0, reason: `User preferred shot: ${preferEvent.reason}` };
      }
      return { allowed: true, penalty: 0 };
    }

    // Contextual Reasoning:
    // If rejected for "shaky" but beat is CLIMAX and contextConstraint permits stabilization:
    if (rejectEvent.reason.includes("shaky") && beatRole === "CLIMAX") {
      return {
        allowed: true,
        penalty: 0.5, // Minor penalty, but allowed with digital stabilization
        reason: "Shot was flagged as shaky by user, but permitted for climactic moment with software stabilization.",
      };
    }

    return {
      allowed: false,
      penalty: 10.0,
      reason: `User explicitly rejected shot '${shotId}': ${rejectEvent.reason}`,
    };
  }
}
