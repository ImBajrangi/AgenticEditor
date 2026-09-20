export type NodeExecutionStatus =
  | "IDLE"
  | "QUEUED"
  | "RUNNING"
  | "SUSPENDED"
  | "SUCCESS"
  | "FAILED"
  | "SKIPPED";

export type NodeCategory =
  | "TRIGGER"
  | "MEDIA"
  | "AI"
  | "ANALYSIS"
  | "CREATIVE"
  | "CONTROL"
  | "OUTPUT";

export interface WorkflowNode {
  id: string;
  type: string;
  label: string;
  category: NodeCategory;
  position: { x: number; y: number };
  parameters: Record<string, unknown>;
  inputs: Array<{ name: string; type: string }>;
  outputs: Array<{ name: string; type: string }>;
}

export interface WorkflowEdge {
  id: string;
  sourceNodeId: string;
  sourceOutputPort: string;
  targetNodeId: string;
  targetInputPort: string;
}

export interface WorkflowGraph {
  id: string;
  name: string;
  version: number;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface NodeExecutionRecord {
  nodeId: string;
  status: NodeExecutionStatus;
  startedAt?: number;
  finishedAt?: number;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  error?: string;
  cacheFingerprint?: string;
  isCached?: boolean;
}

export interface WorkflowExecutionState {
  executionId: string;
  workflowId: string;
  status: "RUNNING" | "SUSPENDED_FOR_APPROVAL" | "COMPLETED" | "FAILED";
  nodeStates: Record<string, NodeExecutionRecord>;
  suspendedNodeId?: string;
  approvalPrompt?: string;
  contextData: Record<string, unknown>;
  startedAt: number;
  finishedAt?: number;
}

export interface NodeExecutionContext {
  executionId: string;
  nodeId: string;
  inputs: Record<string, unknown>;
  parameters: Record<string, unknown>;
  globalContext: Record<string, unknown>;
  log: (message: string, meta?: Record<string, unknown>) => void;
  suspendForHumanApproval: (prompt: string) => void;
}
