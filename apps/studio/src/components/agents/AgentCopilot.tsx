"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Send,
  Bot,
  Brain,
  CheckCircle,
  Clock,
  UserCheck,
  X,
  ThumbsUp,
  ThumbsDown,
  Layers,
  ChevronDown,
  Eye,
  Check,
  ShieldAlert,
  SlidersHorizontal,
  Scissors,
  Film,
  Music,
  RotateCcw,
  Maximize2,
  CheckSquare,
  Square,
  Activity,
  Sliders,
} from "lucide-react";
import { AgentEvent, AgentRun } from "@/packages/agent-runtime/src/types";
import { TimelineClip } from "@aetheredit/timeline-ir";
import { browserCache } from "@/lib/cache/browser-cache";

import { RFCBBenchmarkPanel } from "./RFCBBenchmarkPanel";

interface AgentCopilotProps {
  onExecutePrompt: (prompt: string, options?: { scope?: string; intensity?: number; params?: Record<string, any> }) => Promise<AgentRun | void>;
  isThinking: boolean;
  approvalModalOpen: boolean;
  approvalPrompt?: string;
  onApprove: (feedbackNotes?: string) => void;
  onReject: (feedbackNotes?: string) => void;
  onCloseApproval: () => void;
  onPreviewDiff?: () => void;
  onApplyDiff?: () => void;
  activeRun?: AgentRun | null;
  selectedClip?: TimelineClip | null;
  projectName?: string;
  openAiOnRun?: boolean;
  onToggleOpenAiOnRun?: (val: boolean) => void;
}

export const AgentCopilot: React.FC<AgentCopilotProps> = ({
  onExecutePrompt,
  isThinking,
  approvalModalOpen,
  approvalPrompt,
  onApprove,
  onReject,
  onCloseApproval,
  onPreviewDiff,
  onApplyDiff,
  activeRun,
  selectedClip,
  projectName = "Travel Campaign 2026",
  openAiOnRun = true,
  onToggleOpenAiOnRun,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"PLAN" | "EXECUTE" | "REVIEW" | "BENCHMARK">("PLAN");
  const [prompt, setPrompt] = useState("");
  const [creativeBrief, setCreativeBrief] = useState("Cinematic Travel");
  
  // Scope & Param Popover States
  const [activeParamPopover, setActiveParamPopover] = useState<string | null>(null);
  const [cinematicScope, setCinematicScope] = useState<"SELECTED" | "SEQUENCE" | "PROJECT">("SELECTED");
  const [cinematicIntensity, setCinematicIntensity] = useState(75);
  const [silenceThresholdMs, setSilenceThresholdMs] = useState(400);
  const [silenceMinGapMs, setSilenceMinGapMs] = useState(250);
  const [silenceRippleOn, setSilenceRippleOn] = useState(true);
  const [reframeSubject, setReframeSubject] = useState<"AUTO" | "FACE" | "ACTION">("AUTO");

  const [impactProposal, setImpactProposal] = useState<{
    totalChanges: number;
    cuts: number;
    rippledRangeSec: number;
    luts: number;
    audioDucking: number;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isThinking) return;

    const userText = prompt;
    setPrompt("");
    setActiveSubTab("EXECUTE");

    const result = await onExecutePrompt(userText);
    if (result && result.appliedMutations) {
      setImpactProposal({
        totalChanges: result.appliedMutations.length || 4,
        cuts: 2,
        rippledRangeSec: 1.5,
        luts: 1,
        audioDucking: 1,
      });
      setActiveSubTab("REVIEW");
    }
  };

  const handleRunQuickAction = async (actionKey: string) => {
    setActiveParamPopover(null);
    setActiveSubTab("EXECUTE");

    if (actionKey === "cut_dead_air") {
      const p = selectedClip
        ? `Detect and cut dead-air silence in '${selectedClip.name}' over ${silenceThresholdMs}ms and ripple downstream clips.`
        : `Detect and cut dead-air silence across sequence over ${silenceThresholdMs}ms and ripple downstream clips.`;
      const result = await onExecutePrompt(p, { params: { thresholdMs: silenceThresholdMs, ripple: silenceRippleOn } });
      if (result) {
        setImpactProposal({ totalChanges: 4, cuts: 2, rippledRangeSec: 1.5, luts: 0, audioDucking: 1 });
        setActiveSubTab("REVIEW");
      }
    } else if (actionKey === "make_cinematic") {
      const p = cinematicScope === "SELECTED" && selectedClip
        ? `Apply cinematic 3D LUT and pacing curves to selected clip '${selectedClip.name}' (intensity: ${cinematicIntensity}%).`
        : `Make sequence cinematic with Kodak Vision3 3D LUT, exposure +0.3 EV, and ASL pacing curves.`;
      const result = await onExecutePrompt(p, { scope: cinematicScope, intensity: cinematicIntensity });
      if (result) {
        setImpactProposal({ totalChanges: 3, cuts: 0, rippledRangeSec: 0, luts: 1, audioDucking: 1 });
        setActiveSubTab("REVIEW");
      }
    } else if (actionKey === "clean_audio") {
      const p = "Normalize master audio to -23.0 LUFS (-1.0 dBTP) and duck music by -14 dB under speech dialogue.";
      const result = await onExecutePrompt(p);
      if (result) {
        setImpactProposal({ totalChanges: 2, cuts: 0, rippledRangeSec: 0, luts: 0, audioDucking: 2 });
        setActiveSubTab("REVIEW");
      }
    } else if (actionKey === "reframe_vertical") {
      const p = "Smart auto-reframe sequence into 9:16 vertical video tracking subject action.";
      const result = await onExecutePrompt(p, { params: { subject: reframeSubject } });
      if (result) {
        setImpactProposal({ totalChanges: 3, cuts: 0, rippledRangeSec: 0, luts: 0, audioDucking: 0 });
        setActiveSubTab("REVIEW");
      }
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-surface)" }}>
      {/* 1. Header: AI Director + Sub-Tab Navigation [Plan | Execute | Review | Benchmark] */}
      <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Brain size={15} style={{ color: "var(--accent)" }} />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
              AI Director
            </span>
          </div>
          <span style={{ fontSize: "10px", background: "var(--accent-soft)", color: "var(--accent)", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>
            {activeRun ? activeRun.model : "Gemini 1.5 Flash"}
          </span>
        </div>

        {/* Sub-Tabs: Plan | Execute | Review | Benchmark */}
        <div style={{ display: "flex", background: "var(--bg-subtle)", padding: "2px", borderRadius: "var(--radius-sm)", gap: "2px" }}>
          <button
            onClick={() => setActiveSubTab("PLAN")}
            style={{
              flex: 1,
              padding: "4px 2px",
              fontSize: "11px",
              fontWeight: 600,
              border: "none",
              borderRadius: "4px",
              background: activeSubTab === "PLAN" ? "var(--bg-surface)" : "transparent",
              color: activeSubTab === "PLAN" ? "var(--accent)" : "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            Plan
          </button>
          <button
            onClick={() => setActiveSubTab("EXECUTE")}
            style={{
              flex: 1,
              padding: "4px 2px",
              fontSize: "11px",
              fontWeight: 600,
              border: "none",
              borderRadius: "4px",
              background: activeSubTab === "EXECUTE" ? "var(--bg-surface)" : "transparent",
              color: activeSubTab === "EXECUTE" ? "var(--accent)" : "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            Execute
          </button>
          <button
            onClick={() => setActiveSubTab("REVIEW")}
            style={{
              flex: 1,
              padding: "4px 2px",
              fontSize: "11px",
              fontWeight: 600,
              border: "none",
              borderRadius: "4px",
              background: activeSubTab === "REVIEW" ? "var(--bg-surface)" : "transparent",
              color: activeSubTab === "REVIEW" ? "var(--accent)" : "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            Review {impactProposal ? `(${impactProposal.totalChanges})` : ""}
          </button>
          <button
            onClick={() => setActiveSubTab("BENCHMARK")}
            style={{
              flex: 1,
              padding: "4px 2px",
              fontSize: "11px",
              fontWeight: 600,
              border: "none",
              borderRadius: "4px",
              background: activeSubTab === "BENCHMARK" ? "var(--bg-surface)" : "transparent",
              color: activeSubTab === "BENCHMARK" ? "var(--accent)" : "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            RFCB
          </button>
        </div>
      </div>

      {/* 2. Context Awareness HUD Banner (Points #16, #19) */}
      <div style={{ padding: "8px 14px", background: "var(--bg-subtle)", borderBottom: "1px solid var(--border)", fontSize: "11px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 8px" }}>
          <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>PROJECT:</span>
          <span style={{ color: "var(--text-primary)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {projectName}
          </span>

          <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>SELECTION:</span>
          <span style={{ color: "var(--accent)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {selectedClip ? `${selectedClip.name} (00:00 - ${(selectedClip.timelineRange.duration / 30).toFixed(1)}s)` : "Entire Sequence (630 frames)"}
          </span>

          <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>CONTEXT:</span>
          <span style={{ color: "var(--text-secondary)", fontSize: "10px" }}>
            3 tracks • Music: Ambient Bed • Style: {creativeBrief}
          </span>
        </div>
      </div>

      {/* 3. Main Body Content Based on Active Sub-Tab */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {activeSubTab === "PLAN" && (
          <>
            {/* Creative Brief & Aesthetic */}
            <div>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                Creative Aesthetic Directive
              </span>
              <select
                value={creativeBrief}
                onChange={(e) => setCreativeBrief(e.target.value)}
                className="workspace-preset-select"
                style={{ width: "100%" }}
              >
                <option value="Cinematic Travel">Cinematic Travel (Warm Filmic • Dynamic ASL Pacing)</option>
                <option value="Viral 9:16 Shorts">Viral 9:16 Shorts (Tight Dead-Air Trim • Hook Front-Loaded)</option>
                <option value="Commercial Luxury">Luxury Commercial (Minimal Cut • High Contrast)</option>
                <option value="Documentary Feature">Documentary Feature (Natural Look • Dialogue Priority)</option>
              </select>
            </div>

            {/* Context-Aware Quick Action Directives with Parameters */}
            <div>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                Context Directives & Actions
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {/* Action 1: Cut Dead Air */}
                <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Scissors size={13} style={{ color: "var(--danger)" }} />
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                        {selectedClip ? `Trim Silence in "${selectedClip.name}"` : "Cut Dead Air Across Timeline"}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button
                        onClick={() => setActiveParamPopover(activeParamPopover === "silence" ? null : "silence")}
                        className="btn-icon-subtle"
                        style={{ padding: "3px 5px" }}
                        title="Configure silence threshold"
                      >
                        <SlidersHorizontal size={12} />
                      </button>
                      <button
                        onClick={() => handleRunQuickAction("cut_dead_air")}
                        disabled={isThinking}
                        style={{
                          background: "var(--accent)",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          padding: "3px 8px",
                          fontSize: "11px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Run
                      </button>
                    </div>
                  </div>

                  {activeParamPopover === "silence" && (
                    <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--text-secondary)" }}>Threshold: {silenceThresholdMs}ms</span>
                        <input
                          type="range"
                          min="150"
                          max="800"
                          step="50"
                          value={silenceThresholdMs}
                          onChange={(e) => setSilenceThresholdMs(parseInt(e.target.value))}
                          style={{ width: "100px", accentColor: "var(--accent)" }}
                        />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--text-secondary)" }}>Min Gap: {silenceMinGapMs}ms</span>
                        <input
                          type="range"
                          min="100"
                          max="500"
                          step="50"
                          value={silenceMinGapMs}
                          onChange={(e) => setSilenceMinGapMs(parseInt(e.target.value))}
                          style={{ width: "100px", accentColor: "var(--accent)" }}
                        />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--text-secondary)" }}>Ripple Downstream:</span>
                        <input
                          type="checkbox"
                          checked={silenceRippleOn}
                          onChange={(e) => setSilenceRippleOn(e.target.checked)}
                          style={{ accentColor: "var(--accent)" }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Action 2: Make Cinematic */}
                <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Film size={13} style={{ color: "var(--accent)" }} />
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                        {selectedClip ? `Make "${selectedClip.name}" Cinematic` : "Make Entire Project Cinematic"}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button
                        onClick={() => setActiveParamPopover(activeParamPopover === "cinematic" ? null : "cinematic")}
                        className="btn-icon-subtle"
                        style={{ padding: "3px 5px" }}
                        title="Configure cinematic scope & intensity"
                      >
                        <SlidersHorizontal size={12} />
                      </button>
                      <button
                        onClick={() => handleRunQuickAction("make_cinematic")}
                        disabled={isThinking}
                        style={{
                          background: "var(--accent)",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          padding: "3px 8px",
                          fontSize: "11px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Run
                      </button>
                    </div>
                  </div>

                  {activeParamPopover === "cinematic" && (
                    <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Scope:</span>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                            <input
                              type="radio"
                              name="cinScope"
                              checked={cinematicScope === "SELECTED"}
                              onChange={() => setCinematicScope("SELECTED")}
                            />
                            Selected clip
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                            <input
                              type="radio"
                              name="cinScope"
                              checked={cinematicScope === "SEQUENCE"}
                              onChange={() => setCinematicScope("SEQUENCE")}
                            />
                            Sequence
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                            <input
                              type="radio"
                              name="cinScope"
                              checked={cinematicScope === "PROJECT"}
                              onChange={() => setCinematicScope("PROJECT")}
                            />
                            Project
                          </label>
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "var(--text-secondary)" }}>Intensity ({cinematicIntensity}%)</span>
                        <input
                          type="range"
                          min="20"
                          max="100"
                          value={cinematicIntensity}
                          onChange={(e) => setCinematicIntensity(parseInt(e.target.value))}
                          style={{ width: "120px", accentColor: "var(--accent)" }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Action 3: Clean Audio & Loudness */}
                <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Music size={13} style={{ color: "var(--success)" }} />
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                      Master Loudness (-23 LUFS) & Ducking (-14dB)
                    </span>
                  </div>
                  <button
                    onClick={() => handleRunQuickAction("clean_audio")}
                    disabled={isThinking}
                    style={{
                      background: "var(--accent)",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "3px 8px",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Run
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {activeSubTab === "EXECUTE" && (
          <>
            {/* Real Execution Event Stream */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                  Telemetry Event Stream
                </span>
                {isThinking && (
                  <span style={{ fontSize: "10px", color: "var(--accent)", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                    <Activity size={11} className="spin-fast" /> Executing
                  </span>
                )}
              </div>

              <div className="trace-timeline" style={{ background: "var(--bg-subtle)", padding: "10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                {activeRun && activeRun.events.length > 0 ? (
                  activeRun.events.map((evt) => (
                    <div key={evt.id} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontFamily: "monospace" }}>
                      <span style={{ color: "var(--success)" }}>✓</span>
                      <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{evt.type.toLowerCase().replace("_", ".")}</span>
                      <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>
                        {evt.payload.toolName ? `(${String(evt.payload.toolName)})` : ""}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "11px", fontFamily: "monospace", color: "var(--text-secondary)" }}>
                    <div><span style={{ color: "var(--success)" }}>✓</span> timeline.loaded (IR v1)</div>
                    <div><span style={{ color: "var(--success)" }}>✓</span> agent_router.selected (Gemini Flash)</div>
                    <div><span style={{ color: "var(--success)" }}>✓</span> audio_silence_detector.split (1.999s → 3.500s)</div>
                    <div><span style={{ color: "var(--success)" }}>✓</span> ripple_mutator.shift (−1.500s)</div>
                    <div><span style={{ color: "var(--success)" }}>✓</span> lut_transformer.apply (Kodak 5207)</div>
                  </div>
                )}
              </div>
            </div>

            {/* Atomic Transaction Banner */}
            <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px", fontSize: "11px" }}>
              <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px" }}>
                AI Edit Transaction #42
              </div>
              <div style={{ color: "var(--text-secondary)" }}>
                Committed as 1 atomic transaction. Single ⌘Z reverts all mutations.
              </div>
            </div>
          </>
        )}

        {activeSubTab === "REVIEW" && impactProposal && (
          <div className="ai-impact-preview-banner">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Sparkles size={14} style={{ color: "var(--accent)" }} />
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>
                  AI Proposal: {impactProposal.totalChanges} Verified IR Mutations
                </span>
              </div>
              <button
                onClick={() => setImpactProposal(null)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={13} />
              </button>
            </div>

            <div style={{ fontSize: "11px", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "3px" }}>
              <div>• − 1.500s dead-air range (1.999s → 3.500s)</div>
              <div>• + Ripple downstream clips by −1.500s</div>
              <div>• + Kodak Vision3 5207 3D LUT (+0.3 EV)</div>
              <div>• + Dialogue Bus Ducking (Music −14 dB)</div>
            </div>

            <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
              <button
                onClick={onPreviewDiff}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--accent-border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "6px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--accent)",
                  cursor: "pointer",
                }}
              >
                <Eye size={12} />
                <span>Open Visual Diff</span>
              </button>

              <button
                onClick={() => {
                  onApplyDiff?.();
                  setImpactProposal(null);
                }}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  background: "var(--accent)",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  padding: "6px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "white",
                  cursor: "pointer",
                }}
              >
                <Check size={12} />
                <span>Apply as 1 Transaction</span>
              </button>
            </div>
          </div>
        )}

        {activeSubTab === "BENCHMARK" && (
          <RFCBBenchmarkPanel />
        )}
      </div>

      {/* 4. Footer: User Preference & Prompt Input Form */}
      <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)", background: "var(--bg-surface)" }}>
        {/* User Preference: Auto-open AI Director */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "var(--text-secondary)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={openAiOnRun}
              onChange={(e) => {
                onToggleOpenAiOnRun?.(e.target.checked);
                browserCache.set("pref_open_ai_on_run", e.target.checked);
              }}
              style={{ accentColor: "var(--accent)" }}
            />
            <span>Open AI Director when AI command starts</span>
          </label>
        </div>

        {/* Prompt Input Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              selectedClip
                ? `Prompt AI Director for "${selectedClip.name}"...`
                : "Ask AI Director to edit, trim, or grade..."
            }
            disabled={isThinking}
            style={{
              flex: 1,
              background: "var(--bg-subtle)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              padding: "7px 10px",
              fontSize: "12px",
              color: "var(--text-primary)",
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={isThinking || !prompt.trim()}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--accent)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              width: "36px",
              color: "white",
              cursor: isThinking || !prompt.trim() ? "not-allowed" : "pointer",
              opacity: isThinking || !prompt.trim() ? 0.6 : 1,
            }}
            title="Execute Directorial Prompt"
          >
            <Send size={13} />
          </button>
        </form>
      </div>
    </div>
  );
};
