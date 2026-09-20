"use client";

import React from "react";
import {
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  Sparkles,
} from "lucide-react";
import {
  WorkflowGraph,
  WorkflowNode,
  WorkflowExecutionState,
} from "@aetheredit/workflow-engine";

interface VisualNodeGraphProps {
  graph: WorkflowGraph;
  executionState: WorkflowExecutionState | null;
  isRunning: boolean;
  onRunWorkflow: () => void;
  onResetWorkflow: () => void;
  selectedNodeId: string | null;
  onSelectNode: (node: WorkflowNode) => void;
  onOpenApproval: () => void;
}

export const VisualNodeGraph: React.FC<VisualNodeGraphProps> = ({
  graph,
  executionState,
  isRunning,
  onRunWorkflow,
  onResetWorkflow,
  selectedNodeId,
  onSelectNode,
  onOpenApproval,
}) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "TRIGGER":
        return "#D99100";
      case "ANALYSIS":
        return "#4F73F7";
      case "AI":
        return "#7C3AED";
      case "CONTROL":
        return "#22A06B";
      case "CREATIVE":
        return "#EC4899";
      case "OUTPUT":
        return "#EA580C";
      default:
        return "#687076";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", background: "var(--bg-app)", position: "relative" }}>
      {/* 1. Top Controls Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 18px",
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border)",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
            {graph.name}
          </span>
          <span style={{ fontSize: "10px", background: "var(--bg-subtle)", padding: "2px 6px", borderRadius: "4px", color: "var(--text-muted)" }}>
            v{graph.version}.0 • Topological DAG Verified
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {executionState?.status === "SUSPENDED_FOR_APPROVAL" && (
            <button
              onClick={onOpenApproval}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: "var(--warning-soft)",
                border: "1px solid var(--warning)",
                color: "var(--warning)",
                padding: "6px 12px",
                borderRadius: "var(--radius-sm)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <UserCheck size={14} />
              <span>Review Required</span>
            </button>
          )}

          <button
            onClick={onResetWorkflow}
            disabled={isRunning}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              padding: "6px 12px",
              borderRadius: "var(--radius-sm)",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>

          <button
            onClick={onRunWorkflow}
            disabled={isRunning}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "var(--accent)",
              border: "none",
              color: "white",
              padding: "7px 16px",
              borderRadius: "var(--radius-sm)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(79, 115, 247, 0.3)",
            }}
          >
            <Play size={13} />
            <span>{isRunning ? "Executing DAG..." : "Execute Workflow"}</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive SVG Canvas */}
      <div style={{ flex: 1, position: "relative", overflow: "auto", background: "radial-gradient(circle, var(--border) 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
          {graph.edges.map((edge) => {
            const source = graph.nodes.find((n) => n.id === edge.sourceNodeId);
            const target = graph.nodes.find((n) => n.id === edge.targetNodeId);
            if (!source || !target) return null;

            const x1 = source.position.x + 220;
            const y1 = source.position.y + 50;
            const x2 = target.position.x;
            const y2 = target.position.y + 50;
            const dx = Math.abs(x2 - x1) * 0.5;

            const path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
            const isSourceSuccess = executionState?.nodeStates[source.id]?.status === "SUCCESS";

            return (
              <path
                key={edge.id}
                d={path}
                fill="none"
                stroke={isSourceSuccess ? "var(--accent)" : "var(--border-strong)"}
                strokeWidth={isSourceSuccess ? "2.5" : "1.5"}
                strokeDasharray={isSourceSuccess ? "none" : "4 4"}
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {graph.nodes.map((node) => {
          const nodeStatus = executionState?.nodeStates[node.id]?.status || "IDLE";
          const isSelected = selectedNodeId === node.id;
          const isCached = executionState?.nodeStates[node.id]?.isCached;
          const color = getCategoryColor(node.category);

          return (
            <div
              key={node.id}
              onClick={() => onSelectNode(node)}
              style={{
                position: "absolute",
                left: `${node.position.x}px`,
                top: `${node.position.y}px`,
                width: "220px",
                background: "var(--bg-surface)",
                border: isSelected ? "2px solid var(--accent)" : "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                boxShadow: isSelected ? "0 0 0 1px var(--accent), 0 4px 12px rgba(79, 115, 247, 0.2)" : "var(--shadow-sm)",
                cursor: "pointer",
                overflow: "hidden",
                transition: "all 0.12s ease",
              }}
            >
              {/* Category Color Bar */}
              <div style={{ height: "4px", background: color }} />

              <div style={{ padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color, textTransform: "uppercase" }}>
                    {node.category}
                  </span>

                  {/* Status Badge */}
                  <div style={{ fontSize: "10px", fontWeight: 600 }}>
                    {nodeStatus === "RUNNING" && (
                      <span style={{ color: "var(--accent)", display: "flex", alignItems: "center", gap: "3px" }}>
                        <Clock size={11} className="animate-spin" /> Running
                      </span>
                    )}
                    {nodeStatus === "SUCCESS" && (
                      <span style={{ color: "var(--success)", display: "flex", alignItems: "center", gap: "3px" }}>
                        <CheckCircle2 size={11} /> {isCached ? "Cached" : "Done"}
                      </span>
                    )}
                    {nodeStatus === "IDLE" && (
                      <span style={{ color: "var(--text-muted)" }}>Idle</span>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "2px" }}>
                  {node.label}
                </div>
                <div style={{ fontSize: "10px", color: "var(--text-secondary)", fontFamily: "monospace" }}>
                  {node.type}
                </div>

                {/* Ports */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", paddingTop: "6px", borderTop: "1px solid var(--border)", fontSize: "10px", color: "var(--text-muted)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)" }} />
                    In
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                    Out
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)" }} />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
