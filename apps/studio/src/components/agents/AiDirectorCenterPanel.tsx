"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Send,
  CheckCircle2,
  TrendingUp,
  Workflow,
  RotateCcw,
  Zap,
  ChevronDown,
  ChevronUp,
  Sliders,
  Check,
  Film,
  Play,
} from "lucide-react";
import { AgentRun } from "@/packages/agent-runtime/src/types";

interface AiDirectorCenterPanelProps {
  onDirectPrompt: (prompt: string) => void;
  isThinking: boolean;
  activeRun?: AgentRun | null;
  onOpenWorkflowGraph?: () => void;
  onOpenReviewDiff?: () => void;
  onDirectAction?: (action: string, data?: any) => void;
  aspectRatio: "16:9" | "9:16";
  onToggleAspectRatio: () => void;
}

export const AiDirectorCenterPanel: React.FC<AiDirectorCenterPanelProps> = ({
  onDirectPrompt,
  isThinking,
  activeRun,
  onOpenWorkflowGraph,
  onOpenReviewDiff,
  onDirectAction,
  aspectRatio,
  onToggleAspectRatio,
}) => {
  const [directorPrompt, setDirectorPrompt] = useState(
    "Make a 45s cinematic travel teaser. Start calm, build energy, end with the hero shot."
  );
  const [quickPrompt, setQuickPrompt] = useState("");
  const [showEvidenceDetails, setShowEvidenceDetails] = useState(false);
  const [decisionAccepted, setDecisionAccepted] = useState(false);

  const presetChips = [
    "45s Travel Teaser",
    "TikTok 9:16 Fast Cut",
    "Beat-Synced Action",
    "Clean Dialogue & Ducking",
  ];

  const handlePresetClick = (chip: string) => {
    let text = "";
    switch (chip) {
      case "45s Travel Teaser":
        text = "Make a 45s cinematic travel teaser. Start calm, build energy, end with the hero shot.";
        break;
      case "TikTok 9:16 Fast Cut":
        text = "Create a fast-paced 9:16 vertical edit with quick cuts, sound effects, and high energy.";
        break;
      case "Beat-Synced Action":
        text = "Sync all visual cut points to musical transients and drum drops with dynamic speed ramps.";
        break;
      case "Clean Dialogue & Ducking":
        text = "Detect dead air and remove awkward silence. Apply -14dB sidechain music ducking under speech.";
        break;
      default:
        text = chip;
    }
    setDirectorPrompt(text);
  };

  const handleRunDirector = () => {
    if (!directorPrompt.trim()) return;
    setDecisionAccepted(false);
    onDirectPrompt(directorPrompt);
  };

  const handleSendQuickFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPrompt.trim()) return;
    onDirectPrompt(quickPrompt);
    setQuickPrompt("");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        background: "#0F121B",
        color: "#F8FAFC",
        borderRight: "1px solid rgba(255, 255, 255, 0.08)",
        overflowY: "auto",
        padding: "16px 20px",
        gap: "14px",
      }}
    >
      {/* 1. Header & Creative Prompt Box (Obsidian Glass Card) */}
      <div
        style={{
          background: "rgba(22, 27, 40, 0.8)",
          border: "1px solid rgba(99, 102, 241, 0.3)",
          borderRadius: "var(--radius-lg)",
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle ambient accent glow */}
        <div
          style={{
            position: "absolute",
            top: "-40px",
            right: "-40px",
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "6px",
                background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 10px rgba(99, 102, 241, 0.5)",
              }}
            >
              <Sparkles size={13} />
            </div>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.2px" }}>
              What should we make?
            </span>
          </div>

          <button
            onClick={onToggleAspectRatio}
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "4px",
              padding: "2px 8px",
              fontSize: "11px",
              fontWeight: 600,
              color: "#94A3B8",
              cursor: "pointer",
            }}
            title="Toggle Format"
          >
            Format: {aspectRatio}
          </button>
        </div>

        {/* Prompt Input */}
        <div style={{ position: "relative" }}>
          <textarea
            value={directorPrompt}
            onChange={(e) => setDirectorPrompt(e.target.value)}
            rows={2}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: "12px",
              lineHeight: "1.4",
              background: "rgba(11, 14, 21, 0.85)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "8px",
              color: "#FFFFFF",
              resize: "none",
              outline: "none",
              fontFamily: "inherit",
              boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.5)",
            }}
            placeholder="Describe your vision (e.g. 45s travel teaser, high energy, focus on coastal surf moments)..."
          />
        </div>

        {/* Chips + Direct Action Button */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
            {presetChips.map((chip) => (
              <button
                key={chip}
                onClick={() => handlePresetClick(chip)}
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  padding: "3px 9px",
                  fontSize: "10px",
                  color: "#94A3B8",
                  cursor: "pointer",
                  transition: "all 0.12s ease",
                }}
              >
                {chip}
              </button>
            ))}
          </div>

          <button
            onClick={handleRunDirector}
            disabled={isThinking}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "6px",
              padding: "7px 18px",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.5px",
              cursor: isThinking ? "not-allowed" : "pointer",
              boxShadow: "0 0 16px rgba(99, 102, 241, 0.4)",
              transition: "all 0.15s ease",
            }}
          >
            <Sparkles size={13} />
            <span>{isThinking ? "DIRECTING..." : "DIRECT"}</span>
          </button>
        </div>
      </div>

      {/* 2. AI Status & Pipeline Progress */}
      <div
        style={{
          background: "rgba(22, 27, 40, 0.6)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "var(--radius-md)",
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "#94A3B8", letterSpacing: "0.5px" }}>
            AI Director Pipeline
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#38BDF8" }}>
              82% Complete
            </span>
            {onOpenWorkflowGraph && (
              <button
                onClick={onOpenWorkflowGraph}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94A3B8",
                  fontSize: "10px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                }}
                title="View underlying execution DAG"
              >
                <Workflow size={11} />
                <span>View Workflow</span>
              </button>
            )}
          </div>
        </div>

        {/* Pipeline Step Indicators */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#10B981", fontWeight: 600 }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981", boxShadow: "0 0 6px #10B981" }} />
            <span>Understanding</span>
          </div>
          <div style={{ color: "#475569" }}>→</div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#6366F1", fontWeight: 600 }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#6366F1", boxShadow: "0 0 6px #6366F1" }} />
            <span>Story Engine</span>
          </div>
          <div style={{ color: "#475569" }}>→</div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#64748B" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", border: "1px solid #64748B" }} />
            <span>Audio DSP</span>
          </div>
          <div style={{ color: "#475569" }}>→</div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#64748B" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", border: "1px solid #64748B" }} />
            <span>Final Review</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ width: "100%", height: "4px", background: "rgba(255, 255, 255, 0.08)", borderRadius: "2px", overflow: "hidden" }}>
          <div
            style={{
              width: isThinking ? "95%" : "82%",
              height: "100%",
              background: "linear-gradient(90deg, #6366F1 0%, #10B981 100%)",
              boxShadow: "0 0 8px rgba(99, 102, 241, 0.6)",
              transition: "width 0.3s ease",
            }}
          />
        </div>

        {/* Compact Terminal Activity Stream */}
        <div
          style={{
            background: "rgba(11, 14, 21, 0.75)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: "4px",
            padding: "6px 8px",
            fontSize: "10px",
            color: "#94A3B8",
            display: "flex",
            flexDirection: "column",
            gap: "3px",
            maxHeight: "70px",
            overflowY: "auto",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "#10B981" }}>●</span>
            <span>Analyzed 84 clips across media bins</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "#10B981" }}>●</span>
            <span>Identified 17 usable cinematic moments</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "#EF4444" }}>●</span>
            <span>Rejected 6 redundant shots</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "#6366F1" }}>●</span>
            <span>Selected Story Option B: Cinematic Journey Arc</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "#F59E0B" }}>●</span>
            <span>Cut dead air: 4.8s • Sidechain audio ducked</span>
          </div>
        </div>
      </div>

      {/* 3. CURRENT DECISION CARD (Decision Transparency) */}
      <div
        style={{
          background: "rgba(22, 27, 40, 0.8)",
          border: decisionAccepted ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(99, 102, 241, 0.35)",
          borderRadius: "var(--radius-md)",
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#818CF8" }}>
            CURRENT DECISION
          </span>

          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              padding: "1px 6px",
              borderRadius: "4px",
              background: decisionAccepted ? "rgba(16, 185, 129, 0.2)" : "rgba(99, 102, 241, 0.2)",
              color: decisionAccepted ? "#34D399" : "#A5B4FC",
            }}
          >
            {decisionAccepted ? "APPROVED" : "CONFIDENCE: 91%"}
          </span>
        </div>

        {/* Decision Detail */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#FFFFFF" }}>
            Using: &ldquo;Golden Hour Coastal Waves&rdquo;
          </div>
          <div style={{ fontSize: "11px", color: "#94A3B8", lineHeight: "1.3" }}>
            <strong style={{ color: "#CBD5E1", fontWeight: 500 }}>Rationale: </strong>Establishes geography and mood before transitioning into high-tempo surf action sequence.
          </div>
        </div>

        {/* Confidence Meter */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "10px", color: "#64748B", width: "60px" }}>Confidence</span>
          <div style={{ flex: 1, height: "4px", background: "rgba(255, 255, 255, 0.08)", borderRadius: "2px", overflow: "hidden" }}>
            <div style={{ width: "91%", height: "100%", background: "#6366F1", borderRadius: "2px", boxShadow: "0 0 6px #6366F1" }} />
          </div>
          <span style={{ fontSize: "10px", fontWeight: 700, color: "#F8FAFC" }}>91%</span>
        </div>

        {/* Accept / Change Buttons & Evidence Toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "2px" }}>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={() => setDecisionAccepted(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: decisionAccepted ? "linear-gradient(135deg, #10B981, #059669)" : "linear-gradient(135deg, #6366F1, #4F46E5)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "4px",
                padding: "5px 12px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: decisionAccepted ? "0 0 10px rgba(16, 185, 129, 0.4)" : "0 0 10px rgba(99, 102, 241, 0.4)",
              }}
            >
              <CheckCircle2 size={12} />
              <span>{decisionAccepted ? "Accepted" : "Accept"}</span>
            </button>

            <button
              onClick={() => {
                if (onDirectAction) onDirectAction("REQUEST_ALTERNATIVE", { decisionId: "dec_1" });
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#CBD5E1",
                borderRadius: "4px",
                padding: "5px 12px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <RotateCcw size={11} />
              <span>Alternative</span>
            </button>
          </div>

          <button
            onClick={() => setShowEvidenceDetails(!showEvidenceDetails)}
            style={{
              background: "transparent",
              border: "none",
              color: "#94A3B8",
              fontSize: "10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "2px",
            }}
          >
            <span>Evidence</span>
            {showEvidenceDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>

        {/* Evidence Breakdown (Why Chosen vs Why Rejected) */}
        {showEvidenceDetails && (
          <div
            style={{
              background: "rgba(11, 14, 21, 0.9)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "4px",
              padding: "8px 10px",
              fontSize: "10px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ fontWeight: 700, color: "#F87171" }}>
              Rejected Shot 23
            </div>
            <div style={{ color: "#94A3B8" }}>
              <strong>Reason: </strong>Redundant establishing shot with lower subject activity.
            </div>
            <div style={{ color: "#64748B" }}>
              <strong>Evidence: </strong>Same location (Beach North), same 35mm lens angle, 42% lower motion energy.
            </div>
            <div style={{ color: "#34D399", fontWeight: 600 }}>
              <strong>Selected Alternative: </strong>Shot 31 (Subject enters frame, creating forward narrative momentum).
            </div>
          </div>
        )}
      </div>

      {/* 4. Quick Direct Prompt / Feedback Bar ("Ask AI") */}
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
        <span style={{ fontSize: "10px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Ask AI / Adjust Direction
        </span>

        <form onSubmit={handleSendQuickFeedback} style={{ display: "flex", gap: "6px" }}>
          <input
            type="text"
            value={quickPrompt}
            onChange={(e) => setQuickPrompt(e.target.value)}
            placeholder='e.g. "Make the opening slower" or "Boost dialogue clarity"...'
            style={{
              flex: 1,
              padding: "6px 10px",
              fontSize: "11px",
              background: "rgba(11, 14, 21, 0.9)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "6px",
              color: "#FFFFFF",
              outline: "none",
            }}
          />
          <button
            type="submit"
            style={{
              background: "linear-gradient(135deg, #6366F1, #4F46E5)",
              border: "none",
              borderRadius: "6px",
              color: "#FFFFFF",
              padding: "0 12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 10px rgba(99, 102, 241, 0.4)",
            }}
            title="Send prompt"
          >
            <Send size={12} />
          </button>
        </form>

        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "2px" }}>
          {["Make opening slower", "Swap music track", "Match color grade"].map((hint) => (
            <button
              key={hint}
              type="button"
              onClick={() => setQuickPrompt(hint)}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "9px",
                color: "#64748B",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              &ldquo;{hint}&rdquo;
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
