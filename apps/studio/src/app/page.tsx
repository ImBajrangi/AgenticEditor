"use client";

import React, { useState, useEffect, useRef } from "react";
import { Header, WorkspaceMode } from "@/components/layout/Header";
import { ToolRail, ToolRailSection } from "@/components/layout/ToolRail";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { SystemStatusModal } from "@/components/layout/SystemStatusModal";
import { DualMonitor } from "@/components/monitors/DualMonitor";
import { SemanticStoryTimeline } from "@/components/timeline/SemanticStoryTimeline";
import { MultiTrackTimeline, TimelineEditTool } from "@/components/timeline/MultiTrackTimeline";
import { AiDirectorCenterPanel } from "@/components/agents/AiDirectorCenterPanel";
import { ReviewDiffPanel } from "@/components/agents/ReviewDiffPanel";
import { InspectorPanel } from "@/components/inspector/InspectorPanel";
import { MediaBin } from "@/components/assets/MediaBin";
import { VisualNodeGraph } from "@/components/graph/VisualNodeGraph";
import { AgentCopilot } from "@/components/agents/AgentCopilot";
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
} from "@aetheredit/timeline-ir";
import {
  WorkflowGraph,
  WorkflowNode,
  WorkflowExecutionState,
} from "@aetheredit/workflow-engine";
import { AgentRun } from "@/packages/agent-runtime/src/types";
import { browserCache } from "@/lib/cache/browser-cache";
import { X, Workflow, Sparkles, FolderKanban } from "lucide-react";

export default function StudioPage() {
  // 1. Studio Mode: 3 Primary Modes [CREATE | REVIEW | EXPORT]
  const [mode, setMode] = useState<WorkspaceMode>("CREATE");
  const [isProMode, setIsProMode] = useState<boolean>(false);
  const [activeRailSection, setActiveRailSection] = useState<ToolRailSection | null>(null);

  // Workflow Drawer / Modal
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);

  // Modals & Panels
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [systemStatusOpen, setSystemStatusOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [renderModalOpen, setRenderModalOpen] = useState(false);

  // Project Metadata & Engine Policy
  const [projectName, setProjectName] = useState("Travel Campaign 2026");
  const [modelPolicy, setModelPolicy] = useState<"AUTO" | "CLOUD" | "LOCAL">("AUTO");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");
  const [isProxyMode, setIsProxyMode] = useState(true);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [localEndpoint, setLocalEndpoint] = useState("http://localhost:11434/v1");

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

  // 4. Selections
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(SAMPLE_ASSETS[0]);
  const [selectedClip, setSelectedClip] = useState<TimelineClip | null>(
    SAMPLE_TIMELINE_TRAVEL.tracks[0].clips[0] || null
  );
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(
    SAMPLE_WORKFLOW_TRAVEL.nodes[0] || null
  );

  // 5. Pro Timeline Tools
  const [activeTool, setActiveTool] = useState<TimelineEditTool>("SELECT");
  const [isSnapping, setIsSnapping] = useState(true);
  const [isMagnetic, setIsMagnetic] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1.0);

  // 6. Workflow Engine Execution
  const [workflow, setWorkflow] = useState<WorkflowGraph>(SAMPLE_WORKFLOW_TRAVEL);
  const [executionState, setExecutionState] = useState<WorkflowExecutionState | null>(null);
  const [isWorkflowRunning, setIsWorkflowRunning] = useState(false);

  // 7. AI Copilot State
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [activeAgentRun, setActiveAgentRun] = useState<AgentRun | null>(null);

  // 8. Render Engine State
  const [isRendering, setIsRendering] = useState(false);
  const [renderResult, setRenderResult] = useState<{
    success: boolean;
    downloadUrl?: string;
    command?: string;
    fileSizeBytes?: number;
    hardwareAccel?: string;
  } | null>(null);

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
  }, []);

  const updateHistoryState = () => {
    setCanUndo(historyRef.current.canUndo());
    setCanRedo(historyRef.current.canRedo());
  };

  // Playhead animation loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentFrame((prev) => {
          const maxFrames = 630;
          const endLimit = outPoint !== null ? outPoint : maxFrames;
          if (prev >= endLimit) {
            setIsPlaying(false);
            return inPoint !== null ? inPoint : 0;
          }
          return prev + 1;
        });
      }, 1000 / fps);
    }
    return () => clearInterval(interval);
  }, [isPlaying, fps, inPoint, outPoint]);

  // Global Keyboard Shortcuts (J-K-L, Space, ⌘Z, ⌘K, I/O)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Space: Play / Pause
      if (e.code === "Space") {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
      // Undo / Redo: ⌘Z / ⌘⇧Z
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
      // J-K-L Shuttle Controls
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
      else if ((e.key === "i" || e.key === "I") && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setInPoint(currentFrame);
      } else if ((e.key === "o" || e.key === "O") && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOutPoint(currentFrame);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canUndo, canRedo, currentFrame, inPoint, outPoint]);

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

  // Direct AI Execution
  const handleExecuteAiPrompt = async (promptText: string) => {
    setIsAiThinking(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          timeline,
          assets: SAMPLE_ASSETS,
          modelPolicy,
        }),
      });

      const data = await res.json();
      if (data.success && data.run) {
        setActiveAgentRun(data.run);
        if (data.run.mutations && data.run.mutations.length > 0) {
          let updated = timeline;
          for (const mut of data.run.mutations) {
            updated = historyRef.current.pushMutation(mut);
          }
          setTimeline(updated);
          browserCache.set("active_timeline", updated);
          updateHistoryState();
        }
      }
    } catch (err) {
      console.error("AI Direct error:", err);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Handle ToolRail Section Clicks
  const handleRailSectionSelect = (section: ToolRailSection) => {
    if (section === "REVIEW") {
      setMode("REVIEW");
      setActiveRailSection(null);
    } else if (activeRailSection === section) {
      setActiveRailSection(null);
    } else {
      setActiveRailSection(section);
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

  return (
    <div className="studio-root">
      {/* 1. Clean Top Bar (64px) with 3 Primary Modes [Create | Review | Export] + Pro Toggle */}
      <Header
        mode={mode}
        setMode={setMode}
        isProMode={isProMode}
        onToggleProMode={() => setIsProMode(!isProMode)}
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
      <div className="studio-body-layout" style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Simplified Tool Rail (4 Items: PROJECT, ASSETS, AI, REVIEW) */}
        <ToolRail
          activeSection={activeRailSection}
          onSelectSection={handleRailSectionSelect}
          isProMode={isProMode}
          onToggleProMode={() => setIsProMode(!isProMode)}
        />

        {/* Left Contextual Drawer (320px) */}
        {activeRailSection === "ASSETS" && (
          <div className="left-drawer-panel" style={{ width: "320px", flexShrink: 0, borderRight: "1px solid var(--border)" }}>
            <MediaBin
              assets={SAMPLE_ASSETS}
              selectedAssetId={selectedAsset?.id || null}
              onSelectAsset={setSelectedAsset}
              onInsertToTimeline={(asset) => setSelectedAsset(asset)}
              isProxyMode={isProxyMode}
              onToggleProxyMode={setIsProxyMode}
            />
          </div>
        )}

        {activeRailSection === "PROJECT" && (
          <div className="left-drawer-panel" style={{ width: "320px", flexShrink: 0, padding: "16px", borderRight: "1px solid var(--border)", background: "var(--bg-surface)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", paddingBottom: "8px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <FolderKanban size={16} style={{ color: "var(--accent)" }} />
                <span style={{ fontSize: "13px", fontWeight: 700 }}>Project Settings</span>
              </div>
              <button onClick={() => setActiveRailSection(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={14} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px" }}>
              <div>
                <label style={{ display: "block", color: "var(--text-secondary)", marginBottom: "4px" }}>Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  style={{ width: "100%", padding: "6px 8px", border: "1px solid var(--border)", borderRadius: "4px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", color: "var(--text-secondary)", marginBottom: "4px" }}>Target Platform & Format</label>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => setAspectRatio("16:9")}
                    style={{ flex: 1, padding: "6px", border: aspectRatio === "16:9" ? "1px solid var(--accent)" : "1px solid var(--border)", background: aspectRatio === "16:9" ? "var(--accent-soft)" : "var(--bg-surface)", borderRadius: "4px", fontWeight: 600 }}
                  >
                    16:9 Cinema / YT
                  </button>
                  <button
                    onClick={() => setAspectRatio("9:16")}
                    style={{ flex: 1, padding: "6px", border: aspectRatio === "9:16" ? "1px solid var(--accent)" : "1px solid var(--border)", background: aspectRatio === "9:16" ? "var(--accent-soft)" : "var(--bg-surface)", borderRadius: "4px", fontWeight: 600 }}
                  >
                    9:16 TikTok / Reels
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeRailSection === "AI" && (
          <div className="left-drawer-panel" style={{ width: "360px", flexShrink: 0, borderRight: "1px solid var(--border)" }}>
            <AgentCopilot
              onExecutePrompt={handleExecuteAiPrompt}
              isThinking={isAiThinking}
              approvalModalOpen={false}
              onApprove={() => {}}
              onReject={() => {}}
              onCloseApproval={() => {}}
              activeRun={activeAgentRun}
              selectedClip={selectedClip}
              projectName={projectName}
            />
          </div>
        )}

        {/* Main Center Work Area */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg-app)" }}>
          {/* ========================================================
              MODE 1: CREATE (AI Director First, Monitor, Timeline)
             ======================================================== */}
          {mode === "CREATE" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* Upper Section: 60% AI Director + 25-40% Program Monitor */}
              <div style={{ flex: "1 1 65%", display: "flex", overflow: "hidden", minHeight: "340px" }}>
                {/* Left/Center: AI Director Flagship Centerpiece (60%) */}
                <div style={{ flex: "0 0 60%", height: "100%", overflowY: "auto" }}>
                  <AiDirectorCenterPanel
                    onDirectPrompt={handleExecuteAiPrompt}
                    isThinking={isAiThinking}
                    activeRun={activeAgentRun}
                    onOpenWorkflowGraph={() => setShowWorkflowModal(true)}
                    onOpenReviewDiff={() => setMode("REVIEW")}
                    aspectRatio={aspectRatio}
                    onToggleAspectRatio={() => setAspectRatio((prev) => (prev === "16:9" ? "9:16" : "16:9"))}
                  />
                </div>

                {/* Right: Program Monitor (40%) */}
                <div style={{ flex: "0 0 40%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg-dark-stage)" }}>
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
                </div>
              </div>

              {/* Lower Section: 15-35% Timeline */}
              <div style={{ flex: "0 0 35%", minHeight: "220px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {isProMode ? (
                  /* Pro Multi-Track Timeline */
                  <MultiTrackTimeline
                    timeline={timeline}
                    currentFrame={currentFrame}
                    onSeek={setCurrentFrame}
                    selectedClipId={selectedClip?.id || null}
                    onSelectClip={setSelectedClip}
                    onSplitClip={(clipId, frame) => {
                      const next = historyRef.current.pushMutation({
                        type: "SPLIT_CLIP",
                        trackId: "trk_v1_primary",
                        clipId,
                        splitFrame: frame,
                      });
                      setTimeline(next);
                      updateHistoryState();
                    }}
                    activeTool={activeTool}
                    setActiveTool={setActiveTool}
                    isSnapping={isSnapping}
                    setIsSnapping={setIsSnapping}
                    isMagnetic={isMagnetic}
                    setIsMagnetic={setIsMagnetic}
                    zoomLevel={zoomLevel}
                    setZoomLevel={setZoomLevel}
                    inPoint={inPoint}
                    outPoint={outPoint}
                  />
                ) : (
                  /* Default AI Semantic Story Timeline */
                  <SemanticStoryTimeline
                    timeline={timeline}
                    currentFrame={currentFrame}
                    totalFrames={630}
                    fps={fps}
                    isPlaying={isPlaying}
                    onTogglePlay={() => setIsPlaying(!isPlaying)}
                    onSeek={setCurrentFrame}
                    onSelectClip={setSelectedClip}
                    selectedClip={selectedClip}
                    onToggleProMode={() => setIsProMode(true)}
                    onDirectAction={(action, data) => {
                      if (action === "IMPROVE_ACT") {
                        handleExecuteAiPrompt(`Improve pacing and cut transitions for ${data.name} section.`);
                      } else if (action === "SHORTEN_CLIP") {
                        handleExecuteAiPrompt(`Shorten clip "${data.name}" by 15% and tighten pacing.`);
                      } else if (action === "REFRAME_CLIP") {
                        setAspectRatio("9:16");
                        handleExecuteAiPrompt(`Auto-reframe clip "${data.name}" to 9:16 vertical tracking.`);
                      } else if (action === "MATCH_COLOR") {
                        handleExecuteAiPrompt(`Match cinematic Kodak color grade for clip "${data.name}".`);
                      } else if (action === "REPLACE_CLIP") {
                        handleExecuteAiPrompt(`Find and replace clip "${data.name}" with highest quality alternate angle.`);
                      }
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              MODE 2: REVIEW (Prominent Review Diff & Quality Impact)
             ======================================================== */}
          {mode === "REVIEW" && (
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
              <div style={{ flex: 1, height: "100%", overflowY: "auto" }}>
                <ReviewDiffPanel
                  timelineVersionBefore={timeline.version}
                  timelineVersionAfter={timeline.version + 1}
                  diffState={isAiThinking ? "PREVIEWING" : "PROPOSED"}
                  onAcceptAll={() => {
                    setMode("CREATE");
                  }}
                  onRejectAll={() => {
                    handleUndo();
                    setMode("CREATE");
                  }}
                  onUndoAiChanges={() => {
                    handleUndo();
                    setMode("CREATE");
                  }}
                />
              </div>

              {/* Side Monitor for quick review inspection */}
              <div style={{ width: "380px", borderLeft: "1px solid var(--border)", background: "var(--bg-dark-stage)", display: "flex", flexDirection: "column" }}>
                <DualMonitor
                  selectedAsset={selectedAsset}
                  isPlaying={isPlaying}
                  onTogglePlay={() => setIsPlaying(!isPlaying)}
                  currentFrame={currentFrame}
                  totalFrames={630}
                  fps={fps}
                  aspectRatio={aspectRatio}
                  onToggleAspectRatio={() => setAspectRatio((prev) => (prev === "16:9" ? "9:16" : "16:9"))}
                  onSeek={setCurrentFrame}
                />
              </div>
            </div>
          )}

          {/* ========================================================
              MODE 3: EXPORT (Render modal & presets)
             ======================================================== */}
          {mode === "EXPORT" && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "32px", maxWidth: "600px", width: "100%", boxShadow: "var(--shadow-lg)", textAlign: "center" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px" }}>Export & Delivery</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "20px" }}>
                  Export your timeline in full resolution with hardware-accelerated video & audio rendering.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
                  <button
                    onClick={() => {
                      setAspectRatio("9:16");
                      setRenderModalOpen(true);
                    }}
                    style={{ padding: "16px", border: "1px solid var(--border)", borderRadius: "8px", background: "var(--bg-subtle)", cursor: "pointer", textAlign: "left" }}
                  >
                    <div style={{ fontWeight: 700, fontSize: "13px" }}>TikTok / Reels 9:16</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>1080x1920 • 30fps H.264</div>
                  </button>
                  <button
                    onClick={() => {
                      setAspectRatio("16:9");
                      setRenderModalOpen(true);
                    }}
                    style={{ padding: "16px", border: "1px solid var(--border)", borderRadius: "8px", background: "var(--bg-subtle)", cursor: "pointer", textAlign: "left" }}
                  >
                    <div style={{ fontWeight: 700, fontSize: "13px" }}>YouTube 4K 16:9</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>3840x2160 • 60fps ProRes / H.265</div>
                  </button>
                </div>
                <button
                  onClick={() => setRenderModalOpen(true)}
                  style={{ background: "var(--accent)", color: "#FFFFFF", border: "none", borderRadius: "6px", padding: "10px 24px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
                >
                  Configure & Start Render
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Pro Studio Mode Right Inspector Panel (Shown only when isProMode is enabled) */}
        {isProMode && (
          <aside className="right-inspector-panel" style={{ width: "360px", flexShrink: 0, borderLeft: "1px solid var(--border)", background: "var(--bg-surface)", overflowY: "auto" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent)" }}>PRO NLE CONTROLS</span>
              <button
                onClick={() => setIsProMode(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "11px", cursor: "pointer" }}
              >
                Close Pro Panel
              </button>
            </div>
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
          </aside>
        )}
      </div>

      {/* Workflow DAG Modal (Progressive Disclosure) */}
      {showWorkflowModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            style={{
              width: "90vw",
              height: "85vh",
              background: "var(--bg-surface)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "var(--shadow-float)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 18px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Workflow size={16} style={{ color: "var(--accent)" }} />
                <span style={{ fontSize: "14px", fontWeight: 700 }}>Technical Execution DAG</span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>• Inspect nodes & dependencies</span>
              </div>
              <button
                onClick={() => setShowWorkflowModal(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, overflow: "hidden" }}>
              <VisualNodeGraph
                graph={workflow}
                executionState={executionState}
                isRunning={isWorkflowRunning}
                onRunWorkflow={async () => {}}
                onResetWorkflow={() => setExecutionState(null)}
                selectedNodeId={selectedNode?.id || null}
                onSelectNode={setSelectedNode}
                onOpenApproval={() => {}}
              />
            </div>
          </div>
        </div>
      )}

      {/* Export & Master Render Modal */}
      <RenderModal
        isOpen={renderModalOpen}
        onClose={() => setRenderModalOpen(false)}
        onStartRender={handleStartRender}
        isRendering={isRendering}
        renderResult={renderResult}
      />

      {/* System Diagnostics Modal */}
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
        onSelectAction={(actionId) => {
          if (actionId === "ai_cinematic") {
            handleExecuteAiPrompt("Make this more cinematic with 3D LUT and ASL dynamic pacing.");
          } else if (actionId === "ai_dead_air") {
            handleExecuteAiPrompt("Cut dead air over 400 milliseconds and ripple downstream clips.");
          } else if (actionId === "export_master") {
            setRenderModalOpen(true);
          } else if (actionId === "open_settings") {
            setSettingsModalOpen(true);
          }
        }}
      />
    </div>
  );
}
