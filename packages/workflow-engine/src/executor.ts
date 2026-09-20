import {
  WorkflowGraph,
  WorkflowExecutionState,
  NodeExecutionContext,
  WorkflowNode,
} from "./types";
import { DagValidator } from "./dag";
import { ContentAddressableCache } from "./cache";

export type NodeHandler = (
  context: NodeExecutionContext
) => Promise<Record<string, unknown>>;

export class WorkflowExecutor {
  private cache: ContentAddressableCache;
  private handlers = new Map<string, NodeHandler>();

  constructor(cache?: ContentAddressableCache) {
    this.cache = cache || new ContentAddressableCache();
  }

  public registerHandler(nodeType: string, handler: NodeHandler): void {
    this.handlers.set(nodeType, handler);
  }

  /**
   * Executes a workflow graph from start or resumes from a checkpoint.
   */
  public async execute(
    graph: WorkflowGraph,
    initialContext: Record<string, unknown> = {},
    existingState?: WorkflowExecutionState
  ): Promise<WorkflowExecutionState> {
    const sortedNodes = DagValidator.topologicalSort(graph);

    const state: WorkflowExecutionState = existingState || {
      executionId: `exec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      workflowId: graph.id,
      status: "RUNNING",
      nodeStates: {},
      contextData: { ...initialContext },
      startedAt: Date.now(),
    };

    // Initialize uninitialized node records
    for (const node of sortedNodes) {
      if (!state.nodeStates[node.id]) {
        state.nodeStates[node.id] = {
          nodeId: node.id,
          status: "IDLE",
        };
      }
    }

    state.status = "RUNNING";

    for (const node of sortedNodes) {
      const nodeRecord = state.nodeStates[node.id];

      // If already succeeded, skip
      if (nodeRecord.status === "SUCCESS") {
        continue;
      }

      // Collect inputs from incoming edges
      const incomingEdges = graph.edges.filter((e) => e.targetNodeId === node.id);
      const nodeInputs: Record<string, unknown> = {};

      for (const edge of incomingEdges) {
        const sourceOutput = state.nodeStates[edge.sourceNodeId]?.outputs;
        if (sourceOutput && edge.sourceOutputPort in sourceOutput) {
          nodeInputs[edge.targetInputPort] = sourceOutput[edge.sourceOutputPort];
        }
      }

      nodeRecord.inputs = nodeInputs;
      nodeRecord.status = "RUNNING";
      nodeRecord.startedAt = Date.now();

      // Check Content-Addressable Cache
      const fingerprint = ContentAddressableCache.computeFingerprint(
        node.type,
        nodeInputs,
        node.parameters
      );
      nodeRecord.cacheFingerprint = fingerprint;

      const cachedOutput = this.cache.get(fingerprint);
      if (cachedOutput) {
        nodeRecord.outputs = cachedOutput;
        nodeRecord.isCached = true;
        nodeRecord.status = "SUCCESS";
        nodeRecord.finishedAt = Date.now();
        continue;
      }

      // Special handling for Human Approval Gate
      if (node.type === "CONTROL_HUMAN_APPROVAL") {
        state.status = "SUSPENDED_FOR_APPROVAL";
        state.suspendedNodeId = node.id;
        state.approvalPrompt =
          (node.parameters.prompt as string) || "Human approval required to proceed.";
        nodeRecord.status = "SUSPENDED";
        return state; // Suspend execution and yield control
      }

      // Execute registered node handler
      const handler = this.handlers.get(node.type);
      if (!handler) {
        // Default pass-through mock handler for unknown nodes
        nodeRecord.outputs = { ...nodeInputs, ...node.parameters, processedAt: Date.now() };
        nodeRecord.status = "SUCCESS";
        nodeRecord.finishedAt = Date.now();
        this.cache.set(fingerprint, nodeRecord.outputs);
        continue;
      }

      let suspended = false;
      const context: NodeExecutionContext = {
        executionId: state.executionId,
        nodeId: node.id,
        inputs: nodeInputs,
        parameters: node.parameters,
        globalContext: state.contextData,
        log: (msg, meta) => {
          // Can pipe to OpenTelemetry / Logger
        },
        suspendForHumanApproval: (prompt) => {
          suspended = true;
          state.status = "SUSPENDED_FOR_APPROVAL";
          state.suspendedNodeId = node.id;
          state.approvalPrompt = prompt;
          nodeRecord.status = "SUSPENDED";
        },
      };

      try {
        const output = await handler(context);
        if (suspended) {
          return state;
        }
        nodeRecord.outputs = output;
        nodeRecord.status = "SUCCESS";
        nodeRecord.finishedAt = Date.now();
        this.cache.set(fingerprint, output);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        nodeRecord.status = "FAILED";
        nodeRecord.error = errorMessage;
        nodeRecord.finishedAt = Date.now();
        state.status = "FAILED";
        return state;
      }
    }

    state.status = "COMPLETED";
    state.finishedAt = Date.now();
    return state;
  }

  /**
   * Resumes a suspended workflow execution after human review.
   */
  public async resume(
    graph: WorkflowGraph,
    state: WorkflowExecutionState,
    approvalDecision: "APPROVED" | "REJECTED",
    feedbackNotes?: string
  ): Promise<WorkflowExecutionState> {
    if (state.status !== "SUSPENDED_FOR_APPROVAL" || !state.suspendedNodeId) {
      throw new Error("Cannot resume workflow: not currently suspended for approval.");
    }

    const nodeRecord = state.nodeStates[state.suspendedNodeId];

    if (approvalDecision === "REJECTED") {
      state.status = "FAILED";
      nodeRecord.status = "FAILED";
      nodeRecord.error = `Rejected by human reviewer: ${feedbackNotes || "No notes provided"}`;
      return state;
    }

    // Approved: mark approval node as successful and continue downstream execution
    nodeRecord.status = "SUCCESS";
    nodeRecord.outputs = { approved: true, feedbackNotes, approvedAt: Date.now() };
    nodeRecord.finishedAt = Date.now();
    state.suspendedNodeId = undefined;
    state.approvalPrompt = undefined;

    return this.execute(graph, state.contextData, state);
  }
}
