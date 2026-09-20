"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Header, WorkspaceMode, WorkspacePreset } from "@/components/layout/Header";
import { ToolRail, ToolRailSection } from "@/components/layout/ToolRail";
import { ContextToolbar } from "@/components/layout/ContextToolbar";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { SystemStatusModal } from "@/components/layout/SystemStatusModal";
import { DualMonitor } from "@/components/monitors/DualMonitor";
import { MultiTrackTimeline, TimelineEditTool } from "@/components/timeline/MultiTrackTimeline";
import { VisualNodeGraph } from "@/components/graph/VisualNodeGraph";
import { MediaBin } from "@/components/assets/MediaBin";
import { AgentCopilot } from "@/components/agents/AgentCopilot";
import { ReviewDiffPanel } from "@/components/agents/ReviewDiffPanel";
import { InspectorPanel } from "@/components/inspector/InspectorPanel";
import { RenderModal } from "@/components/render/RenderModal";
import { SettingsModal } from "@/components/settings/SettingsModal";
import {
  SAMPLE_ASSETS,
  SAMPLE_TIMELINE_TRAVEL,
  SAMPLE_WORKFLOW_TRAVEL,
  MediaAsset,
} from "@/lib/sample-data";
import {
  TimelineIR,
  TimelineClip,
  TimelineHistoryManager,
  TimelineMutator,
} from "@aetheredit/timeline-ir";
import {
  WorkflowGraph,
  WorkflowNode,
  WorkflowExecutionState,
} from "@aetheredit/workflow-engine";
import { AgentRun } from "@/packages/agent-runtime/src/types";
import { browserCache } from "@/lib/cache/browser-cache";
import { Sliders, Sparkles, CheckCircle2, GripVertical, GripHorizontal } from "lucide-react";

export default function StudioPage() {
  // 1. Studio Mode & Workspace Presets
  const [mode, setMode] = useState<WorkspaceMode>("EDIT");
  const [workspacePreset, setWorkspacePreset] = useState<WorkspacePreset>("EDITING");
  const [activeRailSection, setActiveRailSection] = useState<ToolRailSection | null>("MEDIA");
  const [rightTab, setRightTab] = useState<"PROPERTIES" | "AI_DIRECTOR" | "REVIEW">("PROPERTIES");
  const [rightPanelWidth, setRightPanelWidth] = useState<number>(340);
  const [workflowSplitRatio, setWorkflowSplitRatio] = useState<number>(50); // 50% graph / 50% timeline
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [isResizingWorkflow, setIsResizingWorkflow] = useState(false);

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [systemStatusOpen, setSystemStatusOpen] = useState(false);

  const [projectName, setProjectName] = useState("Travel Campaign 2026");
  const [modelPolicy, setModelPolicy] = useState<"AUTO" | "CLOUD" | "LOCAL">("AUTO");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");
  const [isProxyMode, setIsProxyMode] = useState(true);
  const [openAiOnRun, setOpenAiOnRun] = useState(true);

  // 2. Timeline & History
  const [timeline, setTimeline] = useState<TimelineIR>(SAMPLE_TIMELINE_TRAVEL);
  const historyRef = useRef(new TimelineHistoryManager(SAMPLE_TIMELINE_TRAVEL));
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // 3. Playhead & Playback
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [inPoint, setInPoint] = useState<number | null>(null);
  const [outPoint, setOutPoint] = useState<number | null>(null);
  const fps = 30;

  // 4. Selections & Highlighting
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(SAMPLE_ASSETS[0]);
  const [selectedClip, setSelectedClip] = useState<TimelineClip | null>(
    SAMPLE_TIMELINE_TRAVEL.tracks[0].clips[0] || null
  );
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(
    SAMPLE_WORKFLOW_TRAVEL.nodes[0] || null
  );

  // 5. Tools & Snapping
  const [activeTool, setActiveTool] = useState<TimelineEditTool>("SELECT");
  const [isSnapping, setIsSnapping] = useState(true);
  const [isMagnetic, setIsMagnetic] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1.0);

  // 6. Workflow Engine Execution
  const [workflow, setWorkflow] = useState<WorkflowGraph>(SAMPLE_WORKFLOW_TRAVEL);
  const [executionState, setExecutionState] = useState<WorkflowExecutionState | null>(null);
  const [isWorkflowRunning, setIsWorkflowRunning] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);

  // 7. AI Copilot State
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [activeAgentRun, setActiveAgentRun] = useState<AgentRun | null>(null);

  // 8. Render Engine State
  const [renderModalOpen, setRenderModalOpen] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderResult, setRenderResult] = useState<{
    success: boolean;
    downloadUrl?: string;
    command?: string;
    fileSizeBytes?: number;
    hardwareAccel?: string;
  } | null>(null);

  // 9. Settings State
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [localEndpoint, setLocalEndpoint] = useState("http://localhost:11434/v1");

  // Cache restoration on mount
  useEffect(() => {
    const cachedTimeline = browserCache.get<TimelineIR>("active_timeline");
    if (cachedTimeline) {
      setTimeline(cachedTimeline);
      historyRef.current = new TimelineHistoryManager(cachedTimeline);
    }
    const cachedApiKey = browserCache.get<string>("gemini_api_key");
    if (cachedApiKey) setGeminiApiKey(cachedApiKey);
    const cachedEndpoint = browserCache.get<string>("local_ai_endpoint");
    if (cachedEndpoint) setLocalEndpoint(cachedEndpoint);

    const cachedOpenAiPref = browserCache.get<boolean>("pref_open_ai_on_run");
    if (cachedOpenAiPref !== null && cachedOpenAiPref !== undefined) {
      setOpenAiOnRun(cachedOpenAiPref);
    }
  }, []);

  const updateHistoryState = () => {
    setCanUndo(historyRef.current.canUndo());
    setCanRedo(historyRef.current.canRedo());
  };

  // Compute highlighted clip IDs from workflow node selection (Point #7)
  const getHighlightedClipIdsForNode = (node: WorkflowNode | null): string[] => {
    if (!node) return [];
    const id = node.id.toLowerCase();
    const cat = node.category.toLowerCase();
    const allClips = timeline.tracks.flatMap((t) => t.clips);

    if (id.includes("silence") || id.includes("cut") || id.includes("voice")) {
      return allClips.filter((c) => c.name.toLowerCase().includes("interview") || c.name.toLowerCase().includes("dialogue")).map((c) => c.id);
    }
    if (id.includes("lut") || id.includes("color") || id.includes("grade")) {
      return allClips.filter((c) => c.assetId.includes("drone") || c.assetId.includes("surf") || c.assetId.includes("beach")).map((c) => c.id);
    }
    if (id.includes("audio") || id.includes("duck") || id.includes("norm")) {
      return allClips.filter((c) => c.assetId.includes("audio") || c.name.toLowerCase().includes("music") || c.name.toLowerCase().includes("dialogue")).map((c) => c.id);
    }
    if (id.includes("reframe") || id.includes("social")) {
      return allClips.slice(0, 2).map((c) => c.id);
    }
    return [allClips[0]?.id].filter(Boolean) as string[];
  };

  const highlightedClipIds = getHighlightedClipIdsForNode(selectedNode);

  // Playhead loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      if (isPlaying) {
        const deltaSec = (time - lastTime) / 1000;
        if (deltaSec >= 1 / fps) {
          setCurrentFrame((prev) => {
            if (outPoint !== null && prev >= outPoint) {
              return inPoint !== null ? inPoint : 0;
            }
            return prev >= 630 ? 0 : prev + 1;
          });
          lastTime = time;
        }
      }
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, fps, inPoint, outPoint]);

  // Global DaVinci Resolve-Class Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      // Space: Toggle Play / Pause
      if (e.code === "Space") {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
      // Cmd/Ctrl + Z: Undo / Redo
      else if (e.key === "z" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (e.key === "z" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
      // Cmd/Ctrl + K: Command Palette
      else if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      // J-K-L Shuttle Controls (DaVinci Standard)
      else if ((e.key === "j" || e.key === "J") && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsPlaying(false);
        setCurrentFrame((prev) => Math.max(0, prev - (e.shiftKey ? 15 : 5)));
      } else if ((e.key === "k" || e.key === "K") && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsPlaying(false);
      } else if ((e.key === "l" || e.key === "L") && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsPlaying(true);
      }
      // Arrow Keys: Frame by Frame Nudge
      else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentFrame((prev) => Math.max(0, prev - (e.shiftKey ? 10 : 1)));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setCurrentFrame((prev) => Math.min(630, prev + (e.shiftKey ? 10 : 1)));
      }
      // In & Out Mark Points (I / O)
      else if ((e.key === "i" || e.key === "I") && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        setInPoint(currentFrame);
      } else if ((e.key === "o" || e.key === "O") && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        setOutPoint(currentFrame);
      } else if ((e.key === "x" || e.key === "X") && (e.altKey || e.metaKey)) {
        e.preventDefault();
        setInPoint(null);
        setOutPoint(null);
      }
      // Home / End: Jump to Start / End
      else if (e.key === "Home" || (e.key === "ArrowUp" && e.shiftKey)) {
        e.preventDefault();
        setCurrentFrame(inPoint !== null ? inPoint : 0);
      } else if (e.key === "End" || (e.key === "ArrowDown" && e.shiftKey)) {
        e.preventDefault();
        setCurrentFrame(outPoint !== null ? outPoint : 630);
      }
      // Tool Shortcuts: V (Select), C (Razor), B (Ripple), N (Roll), Y (Slip)
      else if (e.key === "c" || e.key === "C") {
        setActiveTool("RAZOR");
      } else if (e.key === "v" || e.key === "V") {
        setActiveTool("SELECT");
      } else if (e.key === "b" || e.key === "B") {
        setActiveTool("RIPPLE");
      } else if (e.key === "n" || e.key === "N") {
        setActiveTool("ROLL");
      } else if (e.key === "y" || e.key === "Y") {
        setActiveTool("SLIP");
      } else if (e.key === "S" && e.shiftKey) {
        console.log("Track solo toggled via Shift+S");
      } else if ((e.key === "s" || e.key === "S") && !e.shiftKey) {
        setIsSnapping((prev) => !prev);
      } else if (e.key === "m" || e.key === "M") {
        console.log("Marker added at frame:", currentFrame);
      }
      // Zoom Shortcuts: Shift + Z (Fit), Cmd + / Cmd -
      else if (e.key === "Z" && e.shiftKey && !e.metaKey) {
        setZoomLevel(1.0);
      } else if ((e.key === "=" || e.key === "+") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setZoomLevel((prev) => Math.min(3.0, parseFloat((prev + 0.25).toFixed(2))));
      } else if (e.key === "-" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setZoomLevel((prev) => Math.max(0.4, parseFloat((prev - 0.25).toFixed(2))));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canUndo, canRedo, currentFrame, inPoint, outPoint]);

  // Workspace Preset Switcher Logic with Real Layout State (Point #13)
  const handleSelectWorkspacePreset = (preset: WorkspacePreset) => {
    setWorkspacePreset(preset);
    if (preset === "EDITING") {
      setMode("EDIT");
      setRightTab("PROPERTIES");
      setRightPanelWidth(320);
      setZoomLevel(1.0);
      setActiveRailSection("MEDIA");
      setActiveTool("SELECT");
    } else if (preset === "AI_EDITING") {
      setMode("EDIT");
      setRightTab("AI_DIRECTOR");
      setRightPanelWidth(380);
      setZoomLevel(1.25);
      setActiveRailSection("MEDIA");
      setActiveTool("SELECT");
    } else if (preset === "COLOR") {
      setMode("EDIT");
      setRightTab("PROPERTIES");
      setRightPanelWidth(420);
      setZoomLevel(1.0);
    } else if (preset === "AUDIO") {
      setMode("EDIT");
      setRightTab("PROPERTIES");
      setRightPanelWidth(380);
      setZoomLevel(1.5);
    } else if (preset === "WORKFLOW") {
      setMode("WORKFLOW");
      setWorkflowSplitRatio(50);
      setRightTab("PROPERTIES");
    } else if (preset === "REVIEW") {
      setMode("REVIEW");
      setRightTab("REVIEW");
      setRightPanelWidth(380);
      setActiveRailSection(null);
    }
  };

  // Mouse drag handlers for Right Panel resizing (Point #4)
  const handleRightResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingRight(true);
  };

  // Mouse drag handlers for Workflow split view resizing (Point #6)
  const handleWorkflowResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingWorkflow(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingRight) {
        const newWidth = Math.min(480, Math.max(300, window.innerWidth - e.clientX));
        setRightPanelWidth(newWidth);
      }
      if (isResizingWorkflow) {
        const container = document.querySelector(".center-workspace-stage");
        if (container) {
          const rect = container.getBoundingClientRect();
          const offsetY = e.clientY - rect.top;
          const ratio = Math.min(80, Math.max(20, Math.round((offsetY / rect.height) * 100)));
          setWorkflowSplitRatio(ratio);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizingRight(false);
      setIsResizingWorkflow(false);
    };

    if (isResizingRight || isResizingWorkflow) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingRight, isResizingWorkflow]);

  // Undo / Redo Handlers (Single ⌘Z reverts entire AI edit transaction!)
  const handleUndo = () => {
    const prev = historyRef.current.undo();
    if (prev) {
      setTimeline(prev);
      browserCache.set("active_timeline", prev);
      updateHistoryState();
    }
  };

  const handleRedo = () => {
    const next = historyRef.current.redo();
    if (next) {
      setTimeline(next);
      browserCache.set("active_timeline", next);
      updateHistoryState();
    }
  };

  // Split Clip
  const handleSplitClip = (clipId: string, splitFrame: number) => {
    try {
      const next = historyRef.current.pushMutation({
        type: "SPLIT_CLIP",
        trackId: "trk_v1_primary",
        clipId,
        splitFrame,
      });
      setTimeline(next);
      browserCache.set("active_timeline", next);
      updateHistoryState();
    } catch (err) {
      console.warn("Split error:", err);
    }
  };

  // Insert Asset to Timeline
  const handleInsertAsset = (asset: MediaAsset) => {
    const track = timeline.tracks.find((t) => (asset.type === "AUDIO" ? t.type === "AUDIO" : t.type === "VIDEO"));
    if (!track) return;

    const newClip: TimelineClip = {
      id: `clip_${Date.now()}`,
      assetId: asset.id,
      name: asset.title,
      timelineRange: { start: currentFrame, duration: Math.min(240, asset.durationFrames) },
      sourceRange: { in: 0, out: Math.min(240, asset.durationFrames) },
      speed: 1.0,
      transform: { position: { x: 0, y: 0 }, scale: { x: 1, y: 1 }, rotation: 0, opacity: 1 },
      effects: [],
    };

    const next = historyRef.current.pushMutation({
      type: "INSERT_CLIP",
      trackId: track.id,
      clip: newClip,
    });
    setTimeline(next);
    browserCache.set("active_timeline", next);
    updateHistoryState();
    setSelectedClip(newClip);
  };

  // AI Prompt Execution (Point #5: Auto-open based on user preference, Point #20: 1-Stroke Atomic Transaction Undo)
  const handleExecuteAiPrompt = async (
    promptText: string,
    options?: { scope?: string; intensity?: number; params?: Record<string, any> }
  ): Promise<AgentRun | void> => {
    setIsAiThinking(true);
    if (openAiOnRun) {
      setRightTab("AI_DIRECTOR");
    }

    try {
      const res = await fetch("/api/ai/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: "proj_travel_01",
          prompt: promptText,
          timeline,
          provider: modelPolicy,
          options,
        }),
      });

      const data = await res.json();
      if (data.success && data.run) {
        setActiveAgentRun(data.run);

        // Atomic Transaction Push: Entire batch is committed into 1 undo step!
        if (data.run.appliedMutations && data.run.appliedMutations.length > 0) {
          const next = historyRef.current.pushTransaction(
            data.run.appliedMutations,
            `AI Directorial Transaction: ${promptText}`
          );
          setTimeline(next);
          browserCache.set("active_timeline", next);
          updateHistoryState();
        } else if (data.run.currentTimeline) {
          const next = historyRef.current.pushSnapshot(
            data.run.currentTimeline,
            `AI Directorial Edit: ${promptText}`
          );
          setTimeline(next);
          browserCache.set("active_timeline", next);
          updateHistoryState();
        }
        return data.run;
      }
    } catch (err) {
      console.error("AI execution error:", err);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Workflow DAG Execution
  const handleRunWorkflow = async () => {
    setIsWorkflowRunning(true);
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ graph: workflow, action: "RUN" }),
      });

      const data = await res.json();
      if (data.success && data.state) {
        setExecutionState(data.state);
        if (data.state.status === "SUSPENDED_FOR_APPROVAL") {
          setApprovalModalOpen(true);
        }
      }
    } catch (err) {
      console.error("Workflow error:", err);
    } finally {
      setIsWorkflowRunning(false);
    }
  };

  // Workflow Resume on Approval
  const handleApprovalResume = async (decision: "APPROVED" | "REJECTED", notes?: string) => {
    setApprovalModalOpen(false);
    if (!executionState) return;

    setIsWorkflowRunning(true);
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          graph: workflow,
          action: "RESUME",
          existingState: executionState,
          decision,
          feedbackNotes: notes,
        }),
      });

      const data = await res.json();
      if (data.success && data.state) {
        setExecutionState(data.state);
      }
    } catch (err) {
      console.error("Approval resume error:", err);
    } finally {
      setIsWorkflowRunning(false);
    }
  };

  // Render Master Compilation
  const handleStartRender = async (settings: { format: "MP4" | "MOV"; resolution: { width: number; height: number } }) => {
    setIsRendering(true);
    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeline, resolution: settings.resolution }),
      });

      const data = await res.json();
      if (data.success) {
        setRenderResult({
          success: true,
          downloadUrl: data.downloadUrl,
          command: data.compiledCommand || data.command,
          hardwareAccel: data.hardwareAccel,
          fileSizeBytes: data.fileSizeBytes,
        });
      }
    } catch (err) {
      console.error("Render error:", err);
    } finally {
      setIsRendering(false);
    }
  };

  const handleCommandAction = (actionId: string) => {
    if (actionId === "ai_dead_air") {
      handleExecuteAiPrompt("Cut dead air over 400 milliseconds and ripple downstream clips.");
    } else if (actionId === "ai_cinematic") {
      handleExecuteAiPrompt("Make this more cinematic with 3D LUT and ASL dynamic pacing.");
    } else if (actionId === "ai_reframe") {
      setAspectRatio("9:16");
      handleExecuteAiPrompt("Auto-reframe timeline into 9:16 vertical video tracking subject.");
    } else if (actionId === "split_clip") {
      if (selectedClip) handleSplitClip(selectedClip.id, currentFrame);
    } else if (actionId === "switch_workflow") {
      setMode("WORKFLOW");
    } else if (actionId === "switch_timeline") {
      setMode("EDIT");
    } else if (actionId === "export_master") {
      setRenderModalOpen(true);
    } else if (actionId === "open_settings") {
      setSettingsModalOpen(true);
    }
  };

  return (
    <div className="studio-root">
      {/* 1. Clean Top Bar (64px) */}
      <Header
        mode={mode}
        setMode={setMode}
        workspacePreset={workspacePreset}
        onSelectWorkspacePreset={handleSelectWorkspacePreset}
        projectName={projectName}
        onProjectChange={setProjectName}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenSystemStatus={() => setSystemStatusOpen(true)}
        onOpenRender={() => {
          setRenderResult(null);
          setRenderModalOpen(true);
        }}
        onOpenSettings={() => setSettingsModalOpen(true)}
        isRendering={isRendering}
      />

      {/* 2. Main Studio Workspace Body */}
      <div className="studio-body-layout">
        {/* Narrow Tool Rail (88px) */}
        <ToolRail
          activeSection={activeRailSection}
          onSelectSection={(sec) => setActiveRailSection(activeRailSection === sec ? null : sec)}
        />

        {/* Left Drawer / Media Browser (300px) */}
        {activeRailSection && (
          <div className="left-drawer-panel">
            <MediaBin
              assets={SAMPLE_ASSETS}
              selectedAssetId={selectedAsset?.id || null}
              onSelectAsset={setSelectedAsset}
              onInsertToTimeline={handleInsertAsset}
              isProxyMode={isProxyMode}
              onToggleProxyMode={setIsProxyMode}
            />
          </div>
        )}

        {/* Center Workspace Stage */}
        <main className="center-workspace-stage">
          {mode === "WORKFLOW" ? (
            /* Split View: Visual DAG on Top + Live Timeline on Bottom with Draggable Divider (Point #6, #7) */
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", height: "100%" }}>
              {/* Top: Visual Node Graph */}
              <div style={{ height: `${workflowSplitRatio}%`, overflow: "hidden", minHeight: "160px" }}>
                <VisualNodeGraph
                  graph={workflow}
                  executionState={executionState}
                  isRunning={isWorkflowRunning}
                  onRunWorkflow={handleRunWorkflow}
                  onResetWorkflow={() => setExecutionState(null)}
                  selectedNodeId={selectedNode?.id || null}
                  onSelectNode={setSelectedNode}
                  onOpenApproval={() => setApprovalModalOpen(true)}
                />
              </div>

              {/* Draggable Divider with Quick Ratio Buttons */}
              <div
                onMouseDown={handleWorkflowResizeMouseDown}
                style={{
                  height: "8px",
                  background: isResizingWorkflow ? "var(--accent)" : "var(--border)",
                  cursor: "row-resize",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  zIndex: 20,
                  transition: "background 0.1s ease",
                }}
                title="Drag to resize Graph / Timeline split view"
              >
                <div style={{ display: "flex", gap: "2px", background: "var(--bg-surface)", padding: "1px 6px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "9px", color: "var(--text-muted)", pointerEvents: "none" }}>
                  <span>{workflowSplitRatio}% Graph</span>
                  <span>/</span>
                  <span>{100 - workflowSplitRatio}% Timeline</span>
                </div>
              </div>

              {/* Bottom: Live Multi-Track Timeline in Workflow Mode with Node Highlight (Point #7) */}
              <div style={{ height: `${100 - workflowSplitRatio}%`, overflow: "hidden", minHeight: "160px" }}>
                <MultiTrackTimeline
                  timeline={timeline}
                  currentFrame={currentFrame}
                  onSeek={setCurrentFrame}
                  selectedClipId={selectedClip?.id || null}
                  onSelectClip={setSelectedClip}
                  onSplitClip={handleSplitClip}
                  activeTool={activeTool}
                  setActiveTool={setActiveTool}
                  isSnapping={isSnapping}
                  setIsSnapping={setIsSnapping}
                  isMagnetic={isMagnetic}
                  setIsMagnetic={setIsMagnetic}
                  zoomLevel={zoomLevel}
                  setZoomLevel={setZoomLevel}
                  highlightedClipIds={highlightedClipIds}
                  inPoint={inPoint}
                  outPoint={outPoint}
                />
              </div>
            </div>
          ) : (
            <>
              {/* Contextual Toolbar (50px) */}
              <ContextToolbar
                selectedClip={selectedClip}
                onOpenSpeed={() => setRightTab("PROPERTIES")}
                onOpenColor={() => setRightTab("PROPERTIES")}
                onOpenReframe={() => setAspectRatio((prev) => (prev === "16:9" ? "9:16" : "16:9"))}
                onAiAction={(act) => handleExecuteAiPrompt(act)}
              />

              {/* Central Preview Stage */}
              <DualMonitor
                selectedAsset={selectedAsset}
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying(!isPlaying)}
                currentFrame={currentFrame}
                totalFrames={630}
                fps={fps}
                aspectRatio={aspectRatio}
                onToggleAspectRatio={() => setAspectRatio((prev) => (prev === "16:9" ? "9:16" : "16:9"))}
                activeClipTitle={selectedClip?.name}
                activeLut={selectedClip?.effects.find((e) => e.pluginId.includes("lut"))?.parameters.lut as string}
                onSeek={setCurrentFrame}
                inPoint={inPoint}
                outPoint={outPoint}
                onSetInPoint={setInPoint}
                onSetOutPoint={setOutPoint}
              />

              {/* Bottom Multi-Track Timeline (280px) */}
              <MultiTrackTimeline
                timeline={timeline}
                currentFrame={currentFrame}
                onSeek={setCurrentFrame}
                selectedClipId={selectedClip?.id || null}
                onSelectClip={setSelectedClip}
                onSplitClip={handleSplitClip}
                activeTool={activeTool}
                setActiveTool={setActiveTool}
                isSnapping={isSnapping}
                setIsSnapping={setIsSnapping}
                isMagnetic={isMagnetic}
                setIsMagnetic={setIsMagnetic}
                zoomLevel={zoomLevel}
                setZoomLevel={setZoomLevel}
                highlightedClipIds={highlightedClipIds}
                inPoint={inPoint}
                outPoint={outPoint}
              />
            </>
          )}
        </main>

        {/* Resizer Handle for Right Inspector Panel (Point #4) */}
        <div
          onMouseDown={handleRightResizeMouseDown}
          style={{
            width: "5px",
            cursor: "col-resize",
            background: isResizingRight ? "var(--accent)" : "transparent",
            position: "relative",
            zIndex: 15,
            transition: "background 0.1s ease",
          }}
          title="Drag to resize Inspector panel (300px - 480px)"
        />

        {/* Right Inspector & AI Director Panel (Resizable 300px - 480px) */}
        <aside className="right-inspector-panel" style={{ width: `${rightPanelWidth}px`, flexShrink: 0 }}>
          {/* Tabs Header */}
          <div className="inspector-tabs-header">
            <button
              onClick={() => setRightTab("PROPERTIES")}
              className={`inspector-tab-item ${rightTab === "PROPERTIES" ? "inspector-tab-item-active" : ""}`}
            >
              <Sliders size={13} />
              <span>Properties</span>
            </button>

            <button
              onClick={() => setRightTab("AI_DIRECTOR")}
              className={`inspector-tab-item ${rightTab === "AI_DIRECTOR" ? "inspector-tab-item-active" : ""}`}
            >
              <Sparkles size={13} />
              <span>AI Director</span>
            </button>

            <button
              onClick={() => setRightTab("REVIEW")}
              className={`inspector-tab-item ${rightTab === "REVIEW" ? "inspector-tab-item-active" : ""}`}
            >
              <CheckCircle2 size={13} />
              <span>Review Diff</span>
            </button>
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            {rightTab === "PROPERTIES" ? (
              <InspectorPanel
                selectedClip={selectedClip}
                selectedNode={selectedNode}
                mode={mode}
                onUpdateClipSpeed={(clipId, speed) => {
                  if (!selectedClip) return;
                  const next = historyRef.current.pushMutation({
                    type: "TRIM_CLIP",
                    trackId: "trk_v1_primary",
                    clipId,
                  });
                  selectedClip.speed = speed;
                  setTimeline({ ...next });
                }}
              />
            ) : rightTab === "AI_DIRECTOR" ? (
              <AgentCopilot
                onExecutePrompt={handleExecuteAiPrompt}
                isThinking={isAiThinking}
                approvalModalOpen={approvalModalOpen}
                approvalPrompt={executionState?.approvalPrompt}
                onApprove={(notes) => handleApprovalResume("APPROVED", notes)}
                onReject={(notes) => handleApprovalResume("REJECTED", notes)}
                onCloseApproval={() => setApprovalModalOpen(false)}
                onPreviewDiff={() => setRightTab("REVIEW")}
                onApplyDiff={() => {
                  setRightTab("PROPERTIES");
                }}
                activeRun={activeAgentRun}
                selectedClip={selectedClip}
                projectName={projectName}
                openAiOnRun={openAiOnRun}
                onToggleOpenAiOnRun={(val) => {
                  setOpenAiOnRun(val);
                  browserCache.set("pref_open_ai_on_run", val);
                }}
              />
            ) : (
              <ReviewDiffPanel
                timelineVersionBefore={timeline.version}
                timelineVersionAfter={timeline.version + 1}
                diffState={isAiThinking ? "PREVIEWING" : "PROPOSED"}
                onAcceptAll={() => {
                  setRightTab("PROPERTIES");
                }}
                onRejectAll={() => {
                  handleUndo();
                  setRightTab("PROPERTIES");
                }}
                onUndoAiChanges={() => {
                  handleUndo();
                  setRightTab("PROPERTIES");
                }}
              />
            )}
          </div>
        </aside>
      </div>

      {/* Export & Master Render Modal */}
      <RenderModal
        isOpen={renderModalOpen}
        onClose={() => setRenderModalOpen(false)}
        onStartRender={handleStartRender}
        isRendering={isRendering}
        renderResult={renderResult}
      />

      {/* System Diagnostics Modal (AI Router, CAC, GPU, Storage Vault) */}
      <SystemStatusModal
        isOpen={systemStatusOpen}
        onClose={() => setSystemStatusOpen(false)}
        modelPolicy={modelPolicy}
        setModelPolicy={setModelPolicy}
      />

      {/* System Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        geminiApiKey={geminiApiKey}
        onSaveGeminiApiKey={(key) => {
          setGeminiApiKey(key);
          browserCache.set("gemini_api_key", key);
        }}
        localEndpoint={localEndpoint}
        onSaveLocalEndpoint={(ep) => {
          setLocalEndpoint(ep);
          browserCache.set("local_ai_endpoint", ep);
        }}
      />

      {/* ⌘K Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectAction={handleCommandAction}
      />
    </div>
  );
}
