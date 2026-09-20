import { WorkflowGraph, WorkflowNode } from "./types";

export class DagValidator {
  /**
   * Sorts workflow nodes in topological order using Kahn's algorithm.
   * Throws an error if cycles are detected or if edges point to non-existent nodes.
   */
  public static topologicalSort(graph: WorkflowGraph): WorkflowNode[] {
    const nodeMap = new Map<string, WorkflowNode>();
    const inDegree = new Map<string, number>();
    const adjacencyList = new Map<string, string[]>();

    for (const node of graph.nodes) {
      nodeMap.set(node.id, node);
      inDegree.set(node.id, 0);
      adjacencyList.set(node.id, []);
    }

    for (const edge of graph.edges) {
      if (!nodeMap.has(edge.sourceNodeId)) {
        throw new Error(`Edge source node '${edge.sourceNodeId}' does not exist in graph.`);
      }
      if (!nodeMap.has(edge.targetNodeId)) {
        throw new Error(`Edge target node '${edge.targetNodeId}' does not exist in graph.`);
      }

      adjacencyList.get(edge.sourceNodeId)!.push(edge.targetNodeId);
      inDegree.set(edge.targetNodeId, (inDegree.get(edge.targetNodeId) || 0) + 1);
    }

    const queue: string[] = [];
    for (const [nodeId, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(nodeId);
      }
    }

    const sortedOrder: WorkflowNode[] = [];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      sortedOrder.push(nodeMap.get(currentId)!);

      const neighbors = adjacencyList.get(currentId) || [];
      for (const neighbor of neighbors) {
        const nextDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, nextDegree);
        if (nextDegree === 0) {
          queue.push(neighbor);
        }
      }
    }

    if (sortedOrder.length !== graph.nodes.length) {
      throw new Error(
        `Cyclic dependency detected in workflow graph! Graph contains ${graph.nodes.length} nodes, but topological sort resolved ${sortedOrder.length}.`
      );
    }

    return sortedOrder;
  }
}
