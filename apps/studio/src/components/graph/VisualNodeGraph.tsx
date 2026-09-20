"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  UserCheck,
  Plus,
  Trash2,
  X,
  Workflow as WorkflowIcon,
} from "lucide-react";
import {
  WorkflowGraph,
  WorkflowNode,
  WorkflowEdge,
  WorkflowExecutionState,
  NodeCategory,
  DagValidator,
} from "@aetheredit/workflow-engine";

export interface VisualNodeGraphProps {
  graph: WorkflowGraph;
  executionState: WorkflowExecutionState | null;
  isRunning: boolean;
  onRunWorkflow: () => void;
  onResetWorkflow: () => void;
  selectedNodeId: string | null;
  onSelectNode: (node: WorkflowNode | null) => void;
  onOpenApproval: () => void;
  onUpdateGraph?: (graph: WorkflowGraph) => void;
  onDeleteNode?: (nodeId: string) => void;
  onExecuteNode?: (nodeId: string) => void;
  onLoadPreset?: (presetId: string) => void;
}

interface NodeTemplate {
  type: string;
  label: string;
  category: NodeCategory;
  description: string;
  parameters: Record<string, unknown>;
  inputs: Array<{ name: string; type: string }>;
  outputs: Array<{ name: string; type: string }>;
}

const NODE_TEMPLATES: NodeTemplate[] = [
  {
    type: "TRIGGER_UPLOAD",
    label: "Raw Camera & Drone Ingest",
    category: "TRIGGER",
    description: "Ingests raw media assets and initializes timeline timebase",
    parameters: { autoTranscodeProxy: true, targetFps: 30 },
    inputs: [],
    outputs: [{ name: "rawMedia", type: "MediaAsset[]" }],
  },
  {
    type: "MEDIA_PROXY_GEN",
    label: "ProRes Proxy Transcoder",
    category: "MEDIA",
    description: "Generates lightweight 540p proxies for zero-lag scrubbing",
    parameters: { resolution: "960x540", codec: "ProRes Proxy" },
    inputs: [{ name: "rawMedia", type: "MediaAsset[]" }],
    outputs: [{ name: "proxyMedia", type: "MediaAsset[]" }],
  },
  {
    type: "ANALYSIS_SCENE_DETECTION",
    label: "TransNetV2 Cut Detector",
    category: "ANALYSIS",
    description: "Neural scene boundary detection and visual aesthetic scoring",
    parameters: { model: "TransNetV2-CUDA", embeddingDim: 512, minShotSec: 1.5 },
    inputs: [{ name: "rawMedia", type: "MediaAsset[]" }],
    outputs: [{ name: "scenes", type: "SceneCatalog" }],
  },
  {
    type: "ANALYSIS_SILENCE_DETECTION",
    label: "Silence & Dead Air Trimmer",
    category: "ANALYSIS",
    description: "Analyzes audio waveform and trims dead pauses >300ms",
    parameters: { thresholdDb: -30, minDurationMs: 400, autoRipple: true },
    inputs: [{ name: "rawMedia", type: "MediaAsset[]" }],
    outputs: [{ name: "cleanedMedia", type: "MediaAsset[]" }],
  },
  {
    type: "ANALYSIS_BEAT_TRACKING",
    label: "Music Beat Synchronizer",
    category: "ANALYSIS",
    description: "Detects musical downbeats and creates tempo snap markers",
    parameters: { sensitivity: 0.85, quantizeBeats: true },
    inputs: [{ name: "musicTrack", type: "AudioTrack" }],
    outputs: [{ name: "beatGrid", type: "BeatGrid" }],
  },
  {
    type: "AI_AGENT_STORY",
    label: "Narrative Story Arc Agent",
    category: "AI",
    description: "Assembles scenes into hook, build, climax, and resolution",
    parameters: { targetDurationSec: 90, tone: "Mysterious to Epic Peak" },
    inputs: [{ name: "scenes", type: "SceneCatalog" }],
    outputs: [{ name: "productionPlan", type: "ProductionPlan" }],
  },
  {
    type: "AI_AGENT_PACING",
    label: "Dynamic Shot Pacing",
    category: "AI",
    description: "Controls cut frequency and visual momentum curves",
    parameters: { targetShotSec: 2.4, curve: "Exponential Acceleration" },
    inputs: [{ name: "productionPlan", type: "ProductionPlan" }],
    outputs: [{ name: "pacedPlan", type: "ProductionPlan" }],
  },
  {
    type: "AI_AGENT_CAPTIONING",
    label: "Whisper Auto-Captions",
    category: "AI",
    description: "Generates word-by-word animated subtitles from dialogue",
    parameters: { model: "Whisper-Large-v3", style: "Karaoke Word Highlight" },
    inputs: [{ name: "timelineIr", type: "TimelineIR" }],
    outputs: [{ name: "subtitledTimeline", type: "TimelineIR" }],
  },
  {
    type: "CREATIVE_COLOR_GRADE",
    label: "Filmic 3D LUT Grade",
    category: "CREATIVE",
    description: "Applies Kodak 5207 or filmic LUT with skin tone protection",
    parameters: { lut: "Warm_Filmic_5207.cube", intensity: 0.85, skinToneProtect: true },
    inputs: [{ name: "approvedPlan", type: "ProductionPlan" }],
    outputs: [{ name: "timelineIr", type: "TimelineIR" }],
  },
  {
    type: "CREATIVE_SPEED_RAMP",
    label: "Action Motion Speed Ramping",
    category: "CREATIVE",
    description: "Smooth bezier speed curve acceleration on motion shots",
    parameters: { factor: 1.25, opticalFlow: true },
    inputs: [{ name: "timelineIr", type: "TimelineIR" }],
    outputs: [{ name: "rampedTimeline", type: "TimelineIR" }],
  },
  {
    type: "AUDIO_DUCKING_SIDECHAIN",
    label: "Sidechain Dialogue Ducking",
    category: "CREATIVE",
    description: "Automatically attenuates background music when dialogue speaks",
    parameters: { duckingDb: -14, attackMs: 25, releaseMs: 350 },
    inputs: [{ name: "dialogueAudio", type: "AudioTrack" }],
    outputs: [{ name: "duckedMusic", type: "AudioTrack" }],
  },
  {
    type: "AUDIO_LOUDNESS_NORM",
    label: "EBU R128 Loudness Normalizer",
    category: "CREATIVE",
    description: "Normalizes master audio to broadcast standard -23 LUFS",
    parameters: { targetLufs: -23, truePeakDbtp: -1.0 },
    inputs: [{ name: "masterAudio", type: "AudioTrack" }],
    outputs: [{ name: "normalizedAudio", type: "AudioTrack" }],
  },
  {
    type: "CONTROL_HUMAN_APPROVAL",
    label: "Director Creative Sign-off",
    category: "CONTROL",
    description: "Safety gate that pauses execution for human review and sign-off",
    parameters: { prompt: "Review proposed shot pacing and cut points before rendering." },
    inputs: [{ name: "productionPlan", type: "ProductionPlan" }],
    outputs: [{ name: "approvedPlan", type: "ProductionPlan" }],
  },
  {
    type: "OUTPUT_RENDER_MASTER",
    label: "FFmpeg Hardware Master",
    category: "OUTPUT",
    description: "Compiles Timeline IR into hardware-accelerated video master",
    parameters: { codec: "VIDEOTOOLBOX_H264", crf: 18, preset: "hq" },
    inputs: [{ name: "timelineIr", type: "TimelineIR" }],
    outputs: [{ name: "videoMasterUrl", type: "string" }],
  },
];

export const VisualNodeGraph: React.FC<VisualNodeGraphProps> = ({
  graph,
  executionState,
  isRunning,
  onRunWorkflow,
  onResetWorkflow,
  selectedNodeId,
  onSelectNode,
  onOpenApproval,
  onUpdateGraph,
  onDeleteNode,
  onExecuteNode,
  onLoadPreset,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Dragging Node State
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; nodeX: number; nodeY: number } | null>(null);

  // Connecting Port State
  const [connectingFrom, setConnectingFrom] = useState<{
    nodeId: string;
    portName: string;
    portType: string;
    startX: number;
    startY: number;
  } | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Add Node Modal
  const [isAddNodeOpen, setIsAddNodeOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");

  // Hovered Edge for deletion
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "TRIGGER":
        return "#D99100";
      case "MEDIA":
        return "#0284C7";
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

  // 1. Keyboard shortcuts: Delete key to delete selected node
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Backspace" || e.key === "Delete") && selectedNodeId) {
        // Only if not inside an input/textarea
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== "input" && tag !== "textarea") {
          e.preventDefault();
          handleDeleteNode(selectedNodeId);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodeId, graph]);

  // 2. Mouse move handler for dragging nodes and rubberband connections
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left + containerRef.current.scrollLeft;
    const currentY = e.clientY - rect.top + containerRef.current.scrollTop;

    // Handle port connection rubberband
    if (connectingFrom) {
      setCursorPos({ x: currentX, y: currentY });
    }

    // Handle node dragging
    if (draggingNodeId && dragStartRef.current) {
      const deltaX = e.clientX - dragStartRef.current.mouseX;
      const deltaY = e.clientY - dragStartRef.current.mouseY;

      // Snap to 10px grid
      const rawX = dragStartRef.current.nodeX + deltaX;
      const rawY = dragStartRef.current.nodeY + deltaY;
      const newX = Math.max(20, Math.round(rawX / 10) * 10);
      const newY = Math.max(20, Math.round(rawY / 10) * 10);

      const updatedNodes = graph.nodes.map((n) =>
        n.id === draggingNodeId ? { ...n, position: { x: newX, y: newY } } : n
      );

      if (onUpdateGraph) {
        onUpdateGraph({
          ...graph,
          nodes: updatedNodes,
        });
      }
    }
  };

  // 3. Mouse up handler
  const handleMouseUp = () => {
    if (draggingNodeId) {
      setDraggingNodeId(null);
      dragStartRef.current = null;
    }
    if (connectingFrom) {
      setConnectingFrom(null);
    }
  };

  // 4. Start dragging a node
  const handleStartDragNode = (e: React.MouseEvent, node: WorkflowNode) => {
    e.stopPropagation();
    onSelectNode(node);
    setDraggingNodeId(node.id);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      nodeX: node.position.x,
      nodeY: node.position.y,
    };
  };

  // 5. Start connecting from an output port
  const handleStartConnect = (e: React.MouseEvent, node: WorkflowNode, portName: string, portType: string) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const startX = node.position.x + 230;
    const startY = node.position.y + 60;

    setConnectingFrom({
      nodeId: node.id,
      portName,
      portType,
      startX,
      startY,
    });
    setCursorPos({
      x: e.clientX - rect.left + containerRef.current.scrollLeft,
      y: e.clientY - rect.top + containerRef.current.scrollTop,
    });
  };

  // 6. Complete connection to an input port
  const handleCompleteConnect = (e: React.MouseEvent, targetNode: WorkflowNode, targetPortName: string) => {
    e.stopPropagation();
    if (!connectingFrom) return;

    // Disallow self-loops
    if (connectingFrom.nodeId === targetNode.id) {
      setConnectingFrom(null);
      return;
    }

    // Check if edge already exists
    const exists = graph.edges.some(
      (edge) =>
        edge.sourceNodeId === connectingFrom.nodeId &&
        edge.targetNodeId === targetNode.id &&
        edge.sourceOutputPort === connectingFrom.portName &&
        edge.targetInputPort === targetPortName
    );
    if (exists) {
      setConnectingFrom(null);
      return;
    }

    // Check for acyclic validity
    const draftEdge: WorkflowEdge = {
      id: `edge_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sourceNodeId: connectingFrom.nodeId,
      sourceOutputPort: connectingFrom.portName,
      targetNodeId: targetNode.id,
      targetInputPort: targetPortName,
    };

    const draftGraph: WorkflowGraph = {
      ...graph,
      edges: [...graph.edges, draftEdge],
    };

    try {
      DagValidator.topologicalSort(draftGraph);
      // Valid! Commit edge
      if (onUpdateGraph) {
        onUpdateGraph(draftGraph);
      }
    } catch (err) {
      console.warn("Cannot create cyclic edge connection:", err);
    } finally {
      setConnectingFrom(null);
    }
  };

  // 7. Delete Node
  const handleDeleteNode = (nodeId: string) => {
    if (onDeleteNode) {
      onDeleteNode(nodeId);
      return;
    }
    const updatedNodes = graph.nodes.filter((n) => n.id !== nodeId);
    const updatedEdges = graph.edges.filter(
      (e) => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId
    );
    if (onUpdateGraph) {
      onUpdateGraph({
        ...graph,
        nodes: updatedNodes,
        edges: updatedEdges,
        version: graph.version + 1,
      });
    }
    if (selectedNodeId === nodeId) {
      onSelectNode(null);
    }
  };

  // 8. Delete Edge
  const handleDeleteEdge = (edgeId: string) => {
    const updatedEdges = graph.edges.filter((e) => e.id !== edgeId);
    if (onUpdateGraph) {
      onUpdateGraph({
        ...graph,
        edges: updatedEdges,
        version: graph.version + 1,
      });
    }
  };

  // 9. Add Node from Template
  const handleAddNodeFromTemplate = (tmpl: NodeTemplate) => {
    // Find an empty spot to avoid overlapping
    const maxX = graph.nodes.reduce((max, n) => Math.max(max, n.position.x), 100);
    const avgY = 180;
    const newId = `node_${tmpl.type.toLowerCase()}_${Date.now().toString().slice(-4)}`;

    const newNode: WorkflowNode = {
      id: newId,
      type: tmpl.type,
      label: tmpl.label,
      category: tmpl.category,
      position: { x: maxX + 270, y: avgY },
      parameters: { ...tmpl.parameters },
      inputs: [...tmpl.inputs],
      outputs: [...tmpl.outputs],
    };

    // Auto-connect to previous node if compatible
    const lastNode = graph.nodes[graph.nodes.length - 1];
    const newEdges = [...graph.edges];
    if (lastNode && lastNode.outputs.length > 0 && newNode.inputs.length > 0) {
      newEdges.push({
        id: `edge_${Date.now()}`,
        sourceNodeId: lastNode.id,
        sourceOutputPort: lastNode.outputs[0].name,
        targetNodeId: newNode.id,
        targetInputPort: newNode.inputs[0].name,
      });
    }

    if (onUpdateGraph) {
      onUpdateGraph({
        ...graph,
        nodes: [...graph.nodes, newNode],
        edges: newEdges,
        version: graph.version + 1,
      });
    }

    onSelectNode(newNode);
    setIsAddNodeOpen(false);
  };

  // Format parameter preview string for display inside card
  const getParamSummary = (node: WorkflowNode) => {
    const p = node.parameters;
    if (node.type === "CREATIVE_COLOR_GRADE") {
      const lut = String(p.lut || "Warm Kodak 5207").replace(".cube", "");
      const intensity = Math.round(((p.intensity as number) ?? 0.85) * 100);
      return `LUT: ${lut} • ${intensity}%`;
    }
    if (node.type === "ANALYSIS_SILENCE_DETECTION") {
      return `Threshold: ${p.thresholdDb || -30}dB • Min: ${p.minDurationMs || 400}ms`;
    }
    if (node.type === "ANALYSIS_SCENE_DETECTION") {
      return `Model: ${p.model || "TransNetV2-CUDA"}`;
    }
    if (node.type === "AI_AGENT_STORY") {
      return `Dur: ${p.targetDurationSec || 90}s • ${p.tone || "Epic"}`;
    }
    if (node.type === "AUDIO_DUCKING_SIDECHAIN") {
      return `Ducking: ${p.duckingDb || -14}dB on Music Bus`;
    }
    if (node.type === "CREATIVE_SPEED_RAMP") {
      return `Speed: ${p.factor || 1.25}x • Bezier Ramping`;
    }
    if (node.type === "OUTPUT_RENDER_MASTER") {
      return `Codec: ${p.codec || "VideoToolbox H.264"}`;
    }
    if (node.type === "CONTROL_HUMAN_APPROVAL") {
      return `Gate: Human Sign-off Required`;
    }
    return Object.entries(p)
      .slice(0, 2)
      .map(([k, v]) => `${k}: ${String(v)}`)
      .join(" • ") || "Default config";
  };

  const filteredTemplates = NODE_TEMPLATES.filter((tmpl) => {
    const matchCat = selectedCategoryFilter === "ALL" || tmpl.category === selectedCategoryFilter;
    const matchSearch =
      tmpl.label.toLowerCase().includes(searchFilter.toLowerCase()) ||
      tmpl.type.toLowerCase().includes(searchFilter.toLowerCase()) ||
      tmpl.description.toLowerCase().includes(searchFilter.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        background: "var(--bg-app)",
        position: "relative",
        userSelect: draggingNodeId ? "none" : "auto",
      }}
      onMouseUp={handleMouseUp}
    >
      {/* 1. TOP CONTROLS TOOLBAR */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 20px",
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border)",
          zIndex: 20,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <WorkflowIcon size={14} style={{ color: "var(--accent)" }} />
            </div>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
              {graph.name}
            </span>
          </div>

          <span
            style={{
              fontSize: "10px",
              background: "var(--bg-subtle)",
              border: "1px solid var(--border)",
              padding: "3px 8px",
              borderRadius: "5px",
              color: "var(--text-secondary)",
              fontWeight: 600,
              fontFamily: "monospace",
            }}
          >
            v{graph.version}.0 • {graph.nodes.length} Nodes • {graph.edges.length} Wires
          </span>

          {/* Quick Presets Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "6px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 500 }}>Template:</span>
            <select
              className="pro-select"
              style={{ width: "190px", fontSize: "11px", padding: "4px 24px 4px 8px" }}
              onChange={(e) => {
                if (onLoadPreset) onLoadPreset(e.target.value);
              }}
              defaultValue="travel"
            >
              <option value="travel">Cinematic Travel (90s)</option>
              <option value="shorts">Viral Vertical Shorts (9:16)</option>
              <option value="commercial">Commercial / Ad Spot (15s)</option>
              <option value="documentary">Documentary Story (180s)</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* + Add Node Button */}
          <button
            onClick={() => setIsAddNodeOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "var(--accent-soft)",
              border: "1px solid var(--accent-border)",
              color: "var(--accent)",
              padding: "6px 14px",
              borderRadius: "var(--radius-sm)",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <Plus size={13} />
            <span>Add Node</span>
          </button>

          {/* Human Approval Required Alert */}
          {executionState?.status === "SUSPENDED_FOR_APPROVAL" && (
            <button
              onClick={onOpenApproval}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "#FEF3C7",
                border: "1px solid #F59E0B",
                color: "#B45309",
                padding: "6px 14px",
                borderRadius: "var(--radius-sm)",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                animation: "pulse 1.8s infinite",
              }}
            >
              <UserCheck size={13} />
              <span>Sign-off Required</span>
            </button>
          )}

          {/* Reset Workflow */}
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
              fontSize: "11px",
              fontWeight: 500,
              cursor: isRunning ? "not-allowed" : "pointer",
              transition: "background 0.12s ease",
            }}
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>

          {/* Execute Workflow */}
          <button
            onClick={onRunWorkflow}
            disabled={isRunning}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: isRunning ? "var(--text-muted)" : "linear-gradient(135deg, #4F73F7 0%, #3B5CD8 100%)",
              border: "none",
              color: "white",
              padding: "6px 16px",
              borderRadius: "var(--radius-sm)",
              fontSize: "11px",
              fontWeight: 600,
              cursor: isRunning ? "not-allowed" : "pointer",
              boxShadow: isRunning ? "none" : "0 2px 8px rgba(79, 115, 247, 0.35)",
              transition: "all 0.15s ease",
            }}
          >
            {isRunning ? (
              <>
                <Clock size={12} className="animate-spin" />
                <span>Executing DAG...</span>
              </>
            ) : (
              <>
                <Play size={12} fill="white" />
                <span>Execute Workflow</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. MAIN 2D INTERACTIVE CANVAS */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onClick={() => onSelectNode(null)}
        style={{
          flex: 1,
          position: "relative",
          overflow: "auto",
          background: "radial-gradient(circle, var(--border) 1.2px, transparent 1.2px)",
          backgroundSize: "20px 20px",
          minWidth: "1800px",
          minHeight: "700px",
        }}
      >
        {/* SVG Connectors Layer */}
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        >
          <defs>
            <linearGradient id="edgeActiveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4F73F7" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
          </defs>

          {/* Render Committed Edges */}
          {graph.edges.map((edge) => {
            const source = graph.nodes.find((n) => n.id === edge.sourceNodeId);
            const target = graph.nodes.find((n) => n.id === edge.targetNodeId);
            if (!source || !target) return null;

            const x1 = source.position.x + 230;
            const y1 = source.position.y + 60;
            const x2 = target.position.x;
            const y2 = target.position.y + 60;
            const dx = Math.abs(x2 - x1) * 0.5;

            const path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
            const isSourceSuccess = executionState?.nodeStates[source.id]?.status === "SUCCESS";
            const isTargetRunning = executionState?.nodeStates[target.id]?.status === "RUNNING";
            const isHovered = hoveredEdgeId === edge.id;

            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            return (
              <g key={edge.id} style={{ pointerEvents: "all" }}>
                {/* Thick invisible hover target */}
                <path
                  d={path}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="16"
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHoveredEdgeId(edge.id)}
                  onMouseLeave={() => setHoveredEdgeId(null)}
                />

                {/* Visible spline line */}
                <path
                  d={path}
                  fill="none"
                  stroke={
                    isHovered
                      ? "#EF4444"
                      : isTargetRunning
                      ? "url(#edgeActiveGrad)"
                      : isSourceSuccess
                      ? "var(--accent)"
                      : "var(--border-strong)"
                  }
                  strokeWidth={isHovered ? "3" : isTargetRunning ? "2.5" : isSourceSuccess ? "2" : "1.5"}
                  strokeDasharray={isTargetRunning ? "6 3" : isSourceSuccess ? "none" : "4 4"}
                  style={{
                    transition: "stroke 0.15s ease, stroke-width 0.15s ease",
                    animation: isTargetRunning ? "dash 1s linear infinite" : "none",
                  }}
                />

                {/* Edge Delete Button on Hover */}
                {isHovered && (
                  <g
                    transform={`translate(${midX}, ${midY})`}
                    style={{ cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEdge(edge.id);
                    }}
                  >
                    <circle r="10" fill="#EF4444" />
                    <text
                      x="0"
                      y="3.5"
                      fill="white"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      ×
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Render Active Rubberband Connection while dragging */}
          {connectingFrom && (
            <path
              d={`M ${connectingFrom.startX} ${connectingFrom.startY} C ${
                connectingFrom.startX + Math.abs(cursorPos.x - connectingFrom.startX) * 0.5
              } ${connectingFrom.startY}, ${
                cursorPos.x - Math.abs(cursorPos.x - connectingFrom.startX) * 0.5
              } ${cursorPos.y}, ${cursorPos.x} ${cursorPos.y}`}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.5"
              strokeDasharray="4 4"
            />
          )}
        </svg>

        {/* Nodes Layer */}
        {graph.nodes.map((node) => {
          const nodeStatus = executionState?.nodeStates[node.id]?.status || "IDLE";
          const isSelected = selectedNodeId === node.id;
          const isCached = executionState?.nodeStates[node.id]?.isCached;
          const color = getCategoryColor(node.category);
          const isDraggingThis = draggingNodeId === node.id;

          return (
            <div
              key={node.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectNode(node);
              }}
              style={{
                position: "absolute",
                left: `${node.position.x}px`,
                top: `${node.position.y}px`,
                width: "236px",
                background: "var(--bg-surface)",
                border: isSelected
                  ? "1.5px solid var(--accent)"
                  : nodeStatus === "RUNNING"
                  ? "1.5px solid #3B82F6"
                  : "1px solid var(--border)",
                borderRadius: "10px",
                boxShadow: isSelected
                  ? "0 0 0 2px rgba(79, 115, 247, 0.2), 0 8px 24px rgba(79, 115, 247, 0.15)"
                  : isDraggingThis
                  ? "0 12px 28px rgba(0, 0, 0, 0.12)"
                  : "0 2px 6px rgba(0, 0, 0, 0.04)",
                cursor: "pointer",
                overflow: "hidden",
                zIndex: isSelected ? 15 : isDraggingThis ? 14 : 5,
                transition: isDraggingThis ? "none" : "box-shadow 0.15s ease, border-color 0.15s ease, transform 0.12s ease",
              }}
            >
              {/* Category Color Accent Strip */}
              <div style={{ height: "3.5px", background: color }} />

              {/* Node Card Header (Draggable Handle) */}
              <div
                onMouseDown={(e) => handleStartDragNode(e, node)}
                style={{
                  padding: "7px 10px",
                  background: isSelected ? "var(--accent-soft)" : "var(--bg-subtle)",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "grab",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      color,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      background: `${color}15`,
                      padding: "1px 5px",
                      borderRadius: "3px",
                    }}
                  >
                    {node.category}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {/* Status Indicator */}
                  {nodeStatus === "RUNNING" && (
                    <span
                      style={{
                        color: "var(--accent)",
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                        fontSize: "9px",
                        fontWeight: 700,
                        background: "var(--accent-soft)",
                        padding: "1px 5px",
                        borderRadius: "3px",
                      }}
                    >
                      <Clock size={10} className="animate-spin" /> Running
                    </span>
                  )}
                  {nodeStatus === "SUCCESS" && (
                    <span
                      style={{
                        color: "var(--success)",
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                        fontSize: "9px",
                        fontWeight: 700,
                        background: "var(--success-soft)",
                        padding: "1px 5px",
                        borderRadius: "3px",
                      }}
                    >
                      <CheckCircle2 size={10} /> {isCached ? "Cached" : "Done"}
                    </span>
                  )}
                  {nodeStatus === "SUSPENDED" && (
                    <span
                      style={{
                        color: "#D97706",
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                        fontSize: "9px",
                        fontWeight: 700,
                        background: "#FEF3C7",
                        padding: "1px 5px",
                        borderRadius: "3px",
                      }}
                    >
                      <UserCheck size={10} /> Gate
                    </span>
                  )}
                  {nodeStatus === "IDLE" && (
                    <span style={{ color: "var(--text-muted)", fontSize: "9px", fontWeight: 500 }}>Idle</span>
                  )}

                  {/* Node Quick Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNode(node.id);
                    }}
                    title="Delete Node (⌫)"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: "2px",
                      borderRadius: "3px",
                      display: "flex",
                      alignItems: "center",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>

              {/* Node Card Body */}
              <div style={{ padding: "8px 10px" }}>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginBottom: "1px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {node.label}
                </div>
                <div
                  style={{
                    fontSize: "9px",
                    color: "var(--text-muted)",
                    fontFamily: "monospace",
                    marginBottom: "6px",
                  }}
                >
                  {node.type}
                </div>

                {/* Parameter Summary Badge */}
                <div
                  style={{
                    fontSize: "10px",
                    color: "var(--text-secondary)",
                    background: "var(--bg-subtle)",
                    padding: "3px 6px",
                    borderRadius: "4px",
                    border: "1px solid var(--border)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    marginBottom: "6px",
                    fontFamily: "monospace",
                  }}
                  title={getParamSummary(node)}
                >
                  {getParamSummary(node)}
                </div>

                {/* Ports Bar */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "6px",
                    borderTop: "1px solid var(--border)",
                    fontSize: "10px",
                    color: "var(--text-secondary)",
                  }}
                >
                  {/* IN Port */}
                  <div
                    onMouseUp={(e) => handleCompleteConnect(e, node, node.inputs[0]?.name || "in")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      cursor: connectingFrom ? "crosshair" : "default",
                      padding: "2px 4px",
                      borderRadius: "4px",
                      background: connectingFrom ? "#EEF2FF" : "transparent",
                      transition: "background 0.12s ease",
                    }}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: node.inputs.length > 0 ? "var(--accent)" : "var(--border)",
                        border: "1.5px solid white",
                        boxShadow: node.inputs.length > 0 ? "0 0 4px rgba(79, 115, 247, 0.4)" : "none",
                      }}
                    />
                    <span style={{ fontSize: "9px", fontWeight: 500 }}>{node.inputs[0]?.name || "In"}</span>
                  </div>

                  {/* OUT Port */}
                  <div
                    onMouseDown={(e) =>
                      handleStartConnect(
                        e,
                        node,
                        node.outputs[0]?.name || "out",
                        node.outputs[0]?.type || "any"
                      )
                    }
                    title="Drag to connect"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      cursor: "crosshair",
                      padding: "2px 4px",
                      borderRadius: "4px",
                      transition: "background 0.12s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ fontSize: "9px", fontWeight: 500 }}>{node.outputs[0]?.name || "Out"}</span>
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "var(--accent)",
                        border: "1.5px solid white",
                        boxShadow: "0 0 4px rgba(79, 115, 247, 0.4)",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. ADD NODE MODAL / POPOVER */}
      {isAddNodeOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            backdropFilter: "blur(2px)",
          }}
          onClick={() => setIsAddNodeOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "560px",
              maxHeight: "80vh",
              background: "var(--bg-surface)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
              boxShadow: "0 12px 32px rgba(0, 0, 0, 0.15)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "14px 18px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <WorkflowIcon size={16} style={{ color: "var(--accent)" }} />
                <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                  Add Node to Workflow DAG
                </span>
              </div>
              <button
                onClick={() => setIsAddNodeOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div
              style={{
                padding: "10px 18px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <input
                type="text"
                placeholder="Search nodes (e.g., silence, color, lut, story, ducking)..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                autoFocus
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)",
                  fontSize: "12px",
                  background: "var(--bg-subtle)",
                  outline: "none",
                  color: "var(--text-primary)",
                }}
              />

              {/* Category Pills */}
              <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
                {["ALL", "TRIGGER", "ANALYSIS", "AI", "CREATIVE", "CONTROL", "OUTPUT"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoryFilter(cat)}
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: "12px",
                      border: "none",
                      background:
                        selectedCategoryFilter === cat ? "var(--accent)" : "var(--bg-subtle)",
                      color: selectedCategoryFilter === cat ? "white" : "var(--text-secondary)",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Node Templates List */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "12px 18px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {filteredTemplates.map((tmpl) => {
                const color = getCategoryColor(tmpl.category);
                return (
                  <div
                    key={tmpl.type}
                    onClick={() => handleAddNodeFromTemplate(tmpl)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border)",
                      background: "var(--bg-surface)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      transition: "all 0.12s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--accent)";
                      e.currentTarget.style.background = "var(--bg-subtle)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.background = "var(--bg-surface)";
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span
                          style={{
                            fontSize: "9px",
                            fontWeight: 700,
                            color,
                            background: `${color}18`,
                            padding: "1px 5px",
                            borderRadius: "3px",
                            textTransform: "uppercase",
                          }}
                        >
                          {tmpl.category}
                        </span>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>
                          {tmpl.label}
                        </span>
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                        {tmpl.description}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--accent)" }}>
                      <Plus size={14} />
                      <span style={{ fontSize: "11px", fontWeight: 600 }}>Add</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
