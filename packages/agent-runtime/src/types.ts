import { TimelineIR, TimelineMutationOp } from "@aetheredit/timeline-ir";

export type AgentRunState =
  | "PLANNING"
  | "OBSERVING"
  | "REASONING"
  | "ACTING"
  | "VERIFYING"
  | "REVISING"
  | "WAITING_FOR_USER"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type AgentRunStatus =
  | "CREATED"
  | "QUEUED"
  | "RUNNING"
  | "MODEL_REQUEST"
  | "MODEL_RESPONSE"
  | "TOOL_REQUESTED"
  | "TOOL_STARTED"
  | "TOOL_COMPLETED"
  | "TIMELINE_MUTATION"
  | "WAITING_FOR_APPROVAL"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type AgentEventType =
  | "RUN_CREATED"
  | "RUN_QUEUED"
  | "RUN_STARTED"
  | "MODEL_REQUEST"
  | "MODEL_RESPONSE"
  | "TOOL_REQUESTED"
  | "TOOL_STARTED"
  | "TOOL_COMPLETED"
  | "TIMELINE_MUTATION"
  | "WAITING_FOR_APPROVAL"
  | "STATE_UPDATED"
  | "STEP_RECORDED"
  | "RUN_COMPLETED"
  | "RUN_FAILED"
  | "RUN_CANCELLED";

export type AutonomyLevel =
  | "L0_SUGGEST_ONLY"
  | "L1_EXECUTE_WITH_APPROVAL"
  | "L2_EXECUTE_REVERSIBLE"
  | "L3_EXECUTE_CREATIVE"
  | "L4_FULLY_AUTONOMOUS";

export interface AgentBudget {
  maxIterations: number;
  maxToolCalls: number;
  maxVisionCalls: number;
  maxHighQualityVisionCalls: number;
  maxRenderAttempts: number;
  maxRuntimeMs: number;
}

export interface AgentStep {
  stepId: string;
  runId: string;
  state: AgentRunState;
  observation: string;
  reasoning: string;
  selectedTool?: string;
  toolInput?: Record<string, unknown>;
  toolResult?: unknown;
  decision?: string;
  timestamp: number;
}

export interface EditQualityScore {
  narrativeCoherence: number;
  continuity: number;
  pacing: number;
  dialogueCoverage: number;
  visualQuality: number;
  audioQuality: number;
  intentAlignment: number;
  revisionImprovement: number;
  overallScore: number;
}

export class EditQualityEvaluator {
  public static readonly WEIGHTS = {
    narrativeCoherence: 0.25,
    intentAlignment: 0.20,
    pacing: 0.15,
    continuity: 0.15,
    dialogueCoverage: 0.10,
    visualQuality: 0.08,
    audioQuality: 0.07,
  };

  public static calculateWeightedScore(score: {
    narrativeCoherence: number;
    intentAlignment: number;
    pacing: number;
    continuity: number;
    dialogueCoverage: number;
    visualQuality: number;
    audioQuality: number;
  }): number {
    return (
      score.narrativeCoherence * this.WEIGHTS.narrativeCoherence +
      score.intentAlignment * this.WEIGHTS.intentAlignment +
      score.pacing * this.WEIGHTS.pacing +
      score.continuity * this.WEIGHTS.continuity +
      score.dialogueCoverage * this.WEIGHTS.dialogueCoverage +
      score.visualQuality * this.WEIGHTS.visualQuality +
      score.audioQuality * this.WEIGHTS.audioQuality
    );
  }

  public static calculateDelta(before: EditQualityScore, after: EditQualityScore): number {
    return after.overallScore - before.overallScore;
  }
}

export type FailureLayer =
  | "MEDIA_UNDERSTANDING"
  | "RETRIEVAL"
  | "CONTEXT_COMPILER"
  | "STORY_PLANNER"
  | "ELIGIBILITY_FILTER"
  | "EDITORIAL_RANKER"
  | "VISION"
  | "AUDIO_DIRECTOR"
  | "COLOR_DIRECTOR"
  | "CRITIC"
  | "REVISION_PLANNER"
  | "MUTATION_SYSTEM"
  | "MODEL_ROUTER";

export interface EditorialProblem {
  id: string;
  problem: string;
  evidence: string;
  impact: string;
  recommendation: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  status: "OPEN" | "RESOLVED" | "DEFERRED";
  attributedLayer?: FailureLayer;
}

export interface CreativeConstraint {
  type: "MUST_INCLUDE" | "MUST_AVOID" | "DURATION" | "ASPECT_RATIO" | "BRAND";
  target: string;
  description: string;
}

export interface CreativeIntent {
  goal: string;
  targetDurationSec: number;
  aspectRatio: "16:9" | "9:16" | "1:1";
  editingIntent: string;
  pacingProfile: string;
  visualStyle: string;
}

export interface EvidenceItem {
  type: "MEDIA" | "VISION" | "AUDIO" | "TRANSCRIPT" | "CONTINUITY";
  sourceId: string;
  content: string;
  confidence: number;
}

export interface VisionEvidenceItem {
  shotId: string;
  frameSampleCount: number;
  temporalClipInspected?: boolean;
  subjectTrajectory: string;
  facialExpressionTrajectory: string;
  motionEnergy: number;
  continuityFidelity: number;
  notes: string;
}

export interface DecisionAudit {
  decisionId: string;
  objective: string;
  candidates: string[];
  selectedCandidate: string;
  rejectedCandidates: Array<{ shotId: string; reason: string }>;
  evidenceUsed: string[];
  constraintsUsed: string[];
  visionEvidenceUsed: string[];
  counterfactualSensitivity?: string;
  uncertainty: string[];
  confidence: number;
  attributedLayer?: FailureLayer;
}

export interface TimelineSnapshot {
  version: number;
  clipCount: number;
  totalDurationFrames: number;
  tracksSummary: Array<{ id: string; type: string; clipCount: number }>;
}

export interface DirectorState {
  projectIntent: CreativeIntent;
  currentObjective: string;
  activeBeatId?: string;
  activeBeat?: Record<string, unknown>;
  narrativePlan?: Record<string, unknown>;
  observedEvidence: EvidenceItem[];
  visionEvidence: VisionEvidenceItem[];
  editorialDecisions: Record<string, unknown>[];
  decisionAudits: DecisionAudit[];
  timelineSnapshot?: TimelineSnapshot;
  unresolvedProblems: EditorialProblem[];
  constraints: CreativeConstraint[];
  autonomyLevel: AutonomyLevel;
  iteration: number;
  confidence: number;
  lastMaterialChange?: string;
  qualityBefore?: EditQualityScore;
  qualityAfter?: EditQualityScore;
  qualityHistory: EditQualityScore[];
  budgetUsage?: {
    iterations: number;
    toolCalls: number;
    visionCalls: number;
    highQualityVisionCalls: number;
    renderAttempts: number;
    elapsedMs: number;
  };
  terminationReason?:
    | "QUALITY_TARGET_MET"
    | "QUALITY_DELTA_BELOW_THRESHOLD"
    | "NO_UNRESOLVED_PROBLEMS"
    | "ANTI_OSCILLATION_TRIGGERED"
    | "BUDGET_EXHAUSTED"
    | "APPROVAL_REQUIRED"
    | "COMPLETED";
}

export interface AgentEvent {
  id: string;
  runId: string;
  type: AgentEventType;
  timestamp: number;
  payload: Record<string, unknown>;
}

export interface AgentToolCallRecord {
  toolName: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  error?: string;
  startedAt: number;
  finishedAt?: number;
}

export interface AgentRun {
  id: string;
  projectId: string;
  prompt: string;
  provider: string;
  model: string;
  status: AgentRunStatus;
  state: AgentRunState;
  directorState?: DirectorState;
  steps: AgentStep[];
  timelineVersionBefore: number;
  timelineVersionAfter?: number;
  currentTimeline: TimelineIR;
  toolCalls: AgentToolCallRecord[];
  appliedMutations: TimelineMutationOp[];
  reasoningSummary: string;
  events: AgentEvent[];
  startedAt: number;
  finishedAt?: number;
  error?: string;
}

export interface AgentTool<TInput = Record<string, unknown>, TOutput = unknown> {
  name: string;
  category?: "OBSERVE" | "PLAN" | "ACT" | "CRITIQUE";
  description: string;
  schema: Record<string, unknown>;
  execute: (input: TInput, context: AgentToolContext) => Promise<TOutput>;
}

export interface AgentToolContext {
  runId: string;
  projectId: string;
  timeline: TimelineIR;
  emitEvent: (type: AgentEventType, payload: Record<string, unknown>) => void;
  recordStep?: (step: Omit<AgentStep, "stepId" | "runId" | "timestamp">) => void;
}
