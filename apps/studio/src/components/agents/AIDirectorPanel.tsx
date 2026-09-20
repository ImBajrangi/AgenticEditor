"use client";

import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Play,
  Scissors,
  Layers,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Check,
  ChevronRight,
  Send,
  Sliders,
  Edit3,
  FileText,
  MessageSquare,
  Wand2,
  Film,
  Mic,
  Clock,
  RefreshCw,
  Cpu,
} from "lucide-react";
import { TimelineIR } from "@aetheredit/timeline-ir";
import { MediaAsset } from "@/lib/sample-data";
import { AgentRun } from "@/packages/agent-runtime/src/types";
import { computeTimelineDiff } from "@/lib/timeline-diff";

export interface AgentExecutionStep {
  agentName: "Vision Agent" | "Story Agent" | "Edit Agent" | "Visual Agent" | "Audio Agent" | "Resolve Agent";
  status: "COMPLETED" | "RUNNING" | "SKIPPED";
  action: string;
  detail?: string;
}

export interface AgentThinkingStep {
  agent: string;
  thought: string;
  action: string;
  timestampMs: number;
}

export interface ScriptScene {
  sceneNumber: number;
  title: string;
  timeRange: string;
  startSec: number;
  durationSec: number;
  startFrame: number;
  durationFrames: number;
  narration: string;
  visualCue: string;
  matchedAssetId: string;
  matchedAssetName: string;
  cameraMovement: string;
  mood: string;
}

export interface VideoScript {
  title: string;
  logline: string;
  targetDurationSec: number;
  scenes: ScriptScene[];
}

export interface ActiveAiRunInfo {
  agentName: string;
  modelUsed: string;
  reasoning: string;
  mutationsCount: number;
  timestamp: number;
  currentTimestampContext?: string;
  targetClipContext?: string;
  agentSteps?: AgentExecutionStep[];
  generatedScript?: VideoScript;
  thinkingTrace?: AgentThinkingStep[];
}

interface AIDirectorPanelProps {
  timeline: TimelineIR;
  timelineBefore?: TimelineIR | null;
  assets: MediaAsset[];
  creativeBrief: string;
  onUpdateCreativeBrief?: (brief: string) => void;
  onDirectPrompt: (prompt: string, script?: VideoScript) => void;
  isThinking: boolean;
  activeRun?: AgentRun | null;
  activeAiRun?: ActiveAiRunInfo | null;
  onReviewChanges?: () => void;
  onApproveChanges?: () => void;
  onRejectChanges?: () => void;
  hasPendingChanges?: boolean;
  currentFrame?: number;
  selectedClipName?: string;
}

export const AIDirectorPanel: React.FC<AIDirectorPanelProps> = ({
  timeline,
  timelineBefore,
  assets,
  creativeBrief,
  onUpdateCreativeBrief,
  onDirectPrompt,
  isThinking,
  activeRun,
  activeAiRun,
  onReviewChanges,
  onApproveChanges,
  onRejectChanges,
  hasPendingChanges = false,
  currentFrame = 0,
  selectedClipName,
}) => {
  const [panelTab, setPanelTab] = useState<"DIRECTIVES" | "SCRIPT">("DIRECTIVES");
  const [promptInput, setPromptInput] = useState("");
  const [isEditingBrief, setIsEditingBrief] = useState(false);
  const [briefDraft, setBriefDraft] = useState(creativeBrief);

  // Script Generator States
  const [scriptTopic, setScriptTopic] = useState("");
  const [currentScript, setCurrentScript] = useState<VideoScript>(() => {
    return (
      activeAiRun?.generatedScript || {
        title: "The Call of the Ocean: Cinematic Travel Anthem",
        logline: "An exhilarating 3-act visual journey through ocean swells, high-speed barrel surfing, and sunset horizons.",
        targetDurationSec: 12.0,
        scenes: [
          {
            sceneNumber: 1,
            title: "Act I: The Hook — Dawn Horizon",
            timeRange: "00:00 - 00:04",
            startSec: 0,
            durationSec: 4.0,
            startFrame: 0,
            durationFrames: 120,
            narration: "They say the ocean remembers everything... But at dawn, the tides start fresh.",
            visualCue: "Wide aerial drone tracking shot sweeping over turquoise coastal swells.",
            matchedAssetId: "ast_beach_sunset",
            matchedAssetName: "Pacific Waves Hook",
            cameraMovement: "Sweeping Drone Push-in",
            mood: "Atmospheric & Anticipatory",
          },
          {
            sceneNumber: 2,
            title: "Act II: The Climax — Barrel Action",
            timeRange: "00:04 - 00:08",
            startSec: 4.0,
            durationSec: 4.0,
            startFrame: 120,
            durationFrames: 120,
            narration: "When the wave breaks, hesitation is your only enemy. Lock your line and ride.",
            visualCue: "High-speed telephoto lens tracking a surfer carving inside the heavy barrel.",
            matchedAssetId: "ast_surfer_action",
            matchedAssetName: "Surfer Barrel Wave Action",
            cameraMovement: "High-Speed Dynamic Pan",
            mood: "High Adrenaline Kinetic",
          },
          {
            sceneNumber: 3,
            title: "Act III: The Resolve — Sunset Vista",
            timeRange: "00:08 - 00:12",
            startSec: 8.0,
            durationSec: 4.0,
            startFrame: 240,
            durationFrames: 120,
            narration: "The sun dips below the horizon, but the rhythm of the swell never stops.",
            visualCue: "Golden hour sunset panoramic view across misty alpine coastline.",
            matchedAssetId: "ast_mountain_mist",
            matchedAssetName: "Alpine Misty Sunrise",
            cameraMovement: "Slow Floating Crane Pull-back",
            mood: "Warm Filmic Epilogue",
          },
        ],
      }
    );
  });

  // Sync with activeAiRun script updates if received
  React.useEffect(() => {
    if (activeAiRun?.generatedScript) {
      setCurrentScript(activeAiRun.generatedScript);
    }
  }, [activeAiRun?.generatedScript]);

  // Compute real dynamic timeline context
  const fps = Math.round(timeline.timebase.numerator / timeline.timebase.denominator) || 30;
  let maxFrame = 0;
  let clipCount = 0;
  timeline.tracks.forEach((t) => {
    t.clips.forEach((c) => {
      clipCount++;
      const end = c.timelineRange.start + c.timelineRange.duration;
      if (end > maxFrame) maxFrame = end;
    });
  });

  const totalSec = maxFrame / fps;
  const mins = Math.floor(totalSec / 60);
  const secs = Math.floor(totalSec % 60);
  const formattedDuration = `${mins}m ${String(secs).padStart(2, "0")}s`;

  // Compute real dynamic diff if previous timeline exists
  const diffResult = React.useMemo(
    () => computeTimelineDiff(timelineBefore || null, timeline),
    [timelineBefore, timeline]
  );

  const cutCount = diffResult.changes.filter((c) => c.category === "CUT" || c.category === "RIPPLE").length;
  const speedCount = diffResult.changes.filter((c) => c.category === "SPEED").length;
  const colorCount = diffResult.changes.filter((c) => c.category === "COLOR").length;
  const audioCount = diffResult.changes.filter((c) => c.category === "AUDIO").length;
  const otherCount = diffResult.changes.filter((c) => !["CUT", "RIPPLE", "SPEED", "COLOR", "AUDIO"].includes(c.category)).length;

  const quickActionChips = [
    "Split clip at playhead",
    "Trim start by 1s",
    "Speed up by 2x",
    "Reframe 9:16 vertical",
    "Write a 12s travel vlog script",
    "This shot is boring. Replace it with a better one.",
    "Make a cinematic 60s travel reel",
    "Make this scene more dramatic",
    "Add warm filmic 3D LUT",
    "Cut dead air & duck audio",
    "Delete selected clip",
  ];

  const scriptTemplates = [
    { label: "🌴 Coastal Travel Vlog", topic: "Write a high-energy travel vlog script about surfing at dawn" },
    { label: "📱 Viral TikTok Hook", topic: "Write a 15-second viral hook script for short-form social video" },
    { label: "💻 Tech Product Launch", topic: "Write an epic product review script with cinematic pacing" },
    { label: "⚡ High-Adrenaline Action", topic: "Write an adrenaline-fueled sports action sequence script" },
  ];

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptInput.trim() || isThinking) return;
    onDirectPrompt(promptInput);
    setPromptInput("");
  };

  const handleSaveBrief = () => {
    setIsEditingBrief(false);
    onUpdateCreativeBrief?.(briefDraft);
  };

  const handleGenerateScript = (topicToUse?: string) => {
    const query = topicToUse || scriptTopic || "Write a cinematic travel vlog script";
    onDirectPrompt(`Write script: ${query}`);
    setScriptTopic("");
  };

  const handleApplyScriptDirectly = () => {
    onDirectPrompt("Apply this script directly to timeline", currentScript);
  };

  const handleSceneNarrationChange = (sceneIndex: number, text: string) => {
    const updated = { ...currentScript };
    updated.scenes = [...updated.scenes];
    updated.scenes[sceneIndex] = { ...updated.scenes[sceneIndex], narration: text };
    setCurrentScript(updated);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg-surface)",
        color: "var(--text-primary)",
        overflowY: "auto",
      }}
    >
      {/* 1. Header & Live Status */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Sparkles size={16} style={{ color: "var(--accent)" }} />
          <span style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "-0.2px" }}>
            AI Director & Scriptwriter
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span className="save-indicator-dot" style={{ background: isThinking ? "var(--accent)" : "var(--success)" }} />
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 500 }}>
            {isThinking ? "Thinking & Editing..." : "AI Ready"}
          </span>
        </div>
      </div>

      {/* Mode Tabs: Directives vs Script & Storyboard */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-subtle)",
          padding: "4px 8px",
          gap: "4px",
        }}
      >
        <button
          onClick={() => setPanelTab("DIRECTIVES")}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: "6px 10px",
            fontSize: "11px",
            fontWeight: 600,
            borderRadius: "var(--radius-sm)",
            border: "none",
            cursor: "pointer",
            background: panelTab === "DIRECTIVES" ? "var(--bg-surface)" : "transparent",
            color: panelTab === "DIRECTIVES" ? "var(--accent)" : "var(--text-secondary)",
            boxShadow: panelTab === "DIRECTIVES" ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
          }}
        >
          <Sparkles size={13} />
          <span>Directives & Trace</span>
        </button>

        <button
          onClick={() => setPanelTab("SCRIPT")}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: "6px 10px",
            fontSize: "11px",
            fontWeight: 600,
            borderRadius: "var(--radius-sm)",
            border: "none",
            cursor: "pointer",
            background: panelTab === "SCRIPT" ? "var(--bg-surface)" : "transparent",
            color: panelTab === "SCRIPT" ? "var(--accent)" : "var(--text-secondary)",
            boxShadow: panelTab === "SCRIPT" ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
          }}
        >
          <FileText size={13} />
          <span>Script & Auto-Edit</span>
        </button>
      </div>

      {/* LIVE DEEP-THINKING STREAM INDICATOR */}
      {isThinking && (
        <div
          style={{
            margin: "12px 16px 0 16px",
            padding: "12px",
            background: "rgba(79, 115, 247, 0.08)",
            border: "1px solid var(--accent-border)",
            borderRadius: "var(--radius-md)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Cpu size={15} style={{ color: "var(--accent)", animation: "spin 3s linear infinite" }} />
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent)" }}>
              AI Multi-Agent Reasoning Chain...
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "var(--text-secondary)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)" }} />
              <span>Analyzing timeline clips & creative story brief...</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)" }} />
              <span>Computing blade cut timestamps & spoken voiceover script...</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)" }} />
              <span>Applying 3D LUT Kodak 5207 grade & -14dB audio ducking...</span>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 1: DIRECTIVES & MULTI-AGENT EXECUTION TRACE */}
      {/* ===================================================================== */}
      {panelTab === "DIRECTIVES" && (
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>
          {/* Project Context & Creative Brief */}
          <div
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                Project Context
              </span>
              <p style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: 500, marginTop: "2px" }}>
                {formattedDuration} • {clipCount} clips • {assets.length} footage items • {timeline.tracks.length} tracks
              </p>
            </div>

            <div style={{ height: "1px", background: "var(--border)" }} />

            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                  Creative Brief
                </span>
                <button
                  onClick={() => {
                    if (isEditingBrief) handleSaveBrief();
                    else setIsEditingBrief(true);
                  }}
                  style={{ background: "transparent", border: "none", color: "var(--accent)", fontSize: "11px", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: "2px" }}
                >
                  <Edit3 size={11} />
                  <span>{isEditingBrief ? "Done" : "Edit"}</span>
                </button>
              </div>

              {isEditingBrief ? (
                <textarea
                  value={briefDraft}
                  onChange={(e) => setBriefDraft(e.target.value)}
                  onBlur={handleSaveBrief}
                  rows={2}
                  className="control-input"
                  style={{ marginTop: "6px", fontSize: "12px", resize: "none" }}
                />
              ) : (
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "3px", fontStyle: "italic" }}>
                  &ldquo;{creativeBrief}&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* 6-Agent Execution Pipeline Trace */}
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                Agent Execution Pipeline Trace
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontFamily: "monospace" }}>
                Timeline v{timeline.version}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
              {activeAiRun ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--accent)", fontWeight: 700 }}>
                    <Sparkles size={14} />
                    <span>{activeAiRun.agentName}</span>
                    <span style={{ fontSize: "10px", background: "var(--accent-soft)", padding: "1px 6px", borderRadius: "4px" }}>
                      {activeAiRun.modelUsed}
                    </span>
                  </div>

                  <p style={{ fontSize: "12px", color: "var(--text-primary)", lineHeight: "1.4", background: "var(--bg-subtle)", padding: "8px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                    {activeAiRun.reasoning}
                  </p>

                  {/* Step-by-step agents telemetry */}
                  {activeAiRun.agentSteps && activeAiRun.agentSteps.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                      {activeAiRun.agentSteps.map((step, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "8px",
                            padding: "6px 8px",
                            background: "var(--bg-subtle)",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "11px",
                          }}
                        >
                          <CheckCircle2 size={13} style={{ color: "var(--success)", marginTop: "1px", flexShrink: 0 }} />
                          <div>
                            <span style={{ fontWeight: 700, color: "var(--text-primary)", marginRight: "4px" }}>
                              {step.agentName}:
                            </span>
                            <span style={{ color: "var(--text-secondary)" }}>{step.action}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "12px" }}>
                  Ready for editing directives. Type below or pick a quick action.
                </div>
              )}
            </div>
          </div>

          {/* Pending Changes / Diff Actions */}
          {hasPendingChanges && (
            <div
              style={{
                background: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                borderRadius: "var(--radius-md)",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--success)" }}>
                  ✓ AI Mutations Applied ({diffResult.changes.length} changes)
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                  {cutCount > 0 && `${cutCount} cuts `}
                  {speedCount > 0 && `${speedCount} speed `}
                  {colorCount > 0 && `${colorCount} color `}
                  {audioCount > 0 && `${audioCount} audio `}
                </span>
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                {onReviewChanges && (
                  <button
                    onClick={onReviewChanges}
                    style={{
                      flex: 1,
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                      padding: "6px 10px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Review Diff
                  </button>
                )}
                {onApproveChanges && (
                  <button
                    onClick={onApproveChanges}
                    className="export-primary-btn"
                    style={{ flex: 1, padding: "6px 10px", fontSize: "12px", justifyContent: "center" }}
                  >
                    Approve
                  </button>
                )}
                {onRejectChanges && (
                  <button
                    onClick={onRejectChanges}
                    style={{
                      background: "transparent",
                      border: "1px solid var(--border)",
                      color: "var(--danger)",
                      padding: "6px 10px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Quick Directives */}
          <div>
            <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
              Quick Directives
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
              {quickActionChips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => onDirectPrompt(chip)}
                  style={{
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "4px 8px",
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Input */}
          <form onSubmit={handleSend} style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="Ask AI Director (e.g. Split at playhead, speed up 2x, cut 1s)..."
                className="control-input"
                style={{ paddingRight: "36px", height: "38px" }}
                disabled={isThinking}
              />
              <button
                type="submit"
                disabled={isThinking || !promptInput.trim()}
                style={{
                  position: "absolute",
                  right: "6px",
                  top: "6px",
                  bottom: "6px",
                  width: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: promptInput.trim() ? "var(--accent)" : "transparent",
                  color: promptInput.trim() ? "#FFFFFF" : "var(--text-muted)",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  cursor: promptInput.trim() ? "pointer" : "default",
                }}
              >
                <Send size={13} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: AI SCRIPT & AUTOMATED DIRECT TIMELINE EDITING */}
      {/* ===================================================================== */}
      {panelTab === "SCRIPT" && (
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>
          {/* Script Generator Input */}
          <div
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Wand2 size={14} style={{ color: "var(--accent)" }} />
              <span style={{ fontSize: "12px", fontWeight: 700 }}>AI Script & Auto-Director</span>
            </div>

            <div style={{ display: "flex", gap: "6px" }}>
              <input
                type="text"
                value={scriptTopic}
                onChange={(e) => setScriptTopic(e.target.value)}
                placeholder="Enter topic (e.g. Travel vlog at sunrise, tech review)..."
                className="control-input"
                style={{ height: "34px", fontSize: "12px", flex: 1 }}
                disabled={isThinking}
                onKeyDown={(e) => e.key === "Enter" && handleGenerateScript()}
              />
              <button
                onClick={() => handleGenerateScript()}
                disabled={isThinking || !scriptTopic.trim()}
                className="export-primary-btn"
                style={{ padding: "0 12px", fontSize: "11px", whiteSpace: "nowrap" }}
              >
                <Sparkles size={12} />
                <span>Write Script</span>
              </button>
            </div>

            {/* Quick Templates */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "2px" }}>
              {scriptTemplates.map((t) => (
                <button
                  key={t.label}
                  onClick={() => handleGenerateScript(t.topic)}
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "3px 6px",
                    fontSize: "10px",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Current Script & Storyboard Breakdown */}
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  {currentScript.title}
                </h4>
                <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: "3px 0 0 0" }}>
                  {currentScript.logline} • {currentScript.targetDurationSec}s Target
                </p>
              </div>

              <button
                onClick={handleApplyScriptDirectly}
                disabled={isThinking}
                className="export-primary-btn"
                style={{
                  padding: "6px 12px",
                  fontSize: "11px",
                  background: "var(--accent)",
                  boxShadow: "0 2px 6px rgba(79, 115, 247, 0.3)",
                  whiteSpace: "nowrap",
                }}
                title="Directly cut video clips and add subtitle markers on timeline"
              >
                <Scissors size={12} />
                <span>Directly Edit Timeline</span>
              </button>
            </div>

            <div style={{ height: "1px", background: "var(--border)" }} />

            {/* Storyboard Scene Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {currentScript.scenes.map((scene, idx) => (
                <div
                  key={scene.sceneNumber || idx}
                  style={{
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          background: "var(--accent-soft)",
                          color: "var(--accent)",
                          padding: "1px 6px",
                          borderRadius: "3px",
                        }}
                      >
                        Scene {scene.sceneNumber}
                      </span>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                        {scene.title}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                      <Clock size={11} />
                      <span>{scene.timeRange}</span>
                    </div>
                  </div>

                  {/* Spoken Voiceover Narration (Editable) */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Mic size={10} /> Spoken Voiceover / Narration:
                    </span>
                    <textarea
                      value={scene.narration}
                      onChange={(e) => handleSceneNarrationChange(idx, e.target.value)}
                      rows={2}
                      className="control-input"
                      style={{ fontSize: "11px", resize: "vertical", background: "var(--bg-surface)" }}
                    />
                  </div>

                  {/* Visual Direction & Matched Footage */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "10px", color: "var(--text-secondary)", marginTop: "2px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Film size={11} style={{ color: "var(--accent)" }} />
                      <span>{scene.matchedAssetName}</span>
                    </div>
                    <span style={{ fontStyle: "italic", color: "var(--text-muted)" }}>
                      {scene.cameraMovement}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Direct Action Button */}
            <button
              onClick={handleApplyScriptDirectly}
              disabled={isThinking}
              style={{
                width: "100%",
                padding: "10px",
                background: "var(--accent)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "var(--radius-sm)",
                fontSize: "12px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(79, 115, 247, 0.3)",
              }}
            >
              <Scissors size={14} />
              <span>Directly Edit Timeline from This Script</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
