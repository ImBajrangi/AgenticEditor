"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Send,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  Sliders,
  Film,
  Music,
  Maximize2,
  Workflow,
  Check,
  RotateCcw,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  Scissors,
  Layers,
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
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border)",
        overflowY: "auto",
        padding: "18px 24px",
        gap: "18px",
      }}
    >
      {/* 1. Header & Creative Prompt Box */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(79, 115, 247, 0.04) 0%, rgba(255, 255, 255, 0.9) 100%)",
          border: "1px solid var(--accent-border)",
          borderRadius: "var(--radius-lg)",
          padding: "16px 18px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "6px",
                background: "var(--accent)",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={15} />
            </div>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
              What should we make?
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              onClick={onToggleAspectRatio}
              style={{
                background: "var(--bg-subtle)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                padding: "3px 8px",
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                cursor: "pointer",
              }}
              title="Toggle Aspect Ratio"
            >
              Format: {aspectRatio}
            </button>
          </div>
        </div>

        {/* Prompt Input */}
        <div style={{ position: "relative" }}>
          <textarea
            value={directorPrompt}
            onChange={(e) => setDirectorPrompt(e.target.value)}
            rows={2}
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: "13px",
              lineHeight: "1.4",
              background: "#FFFFFF",
              border: "1px solid var(--border-strong)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-primary)",
              resize: "none",
              outline: "none",
              fontFamily: "inherit",
            }}
            placeholder="Describe your vision (e.g. 45s travel teaser, high energy, focus on coastal surf moments)..."
          />
        </div>

        {/* Chips + Direct Button */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {presetChips.map((chip) => (
              <button
                key={chip}
                onClick={() => handlePresetClick(chip)}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "14px",
                  padding: "4px 10px",
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.1s ease",
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
              background: "linear-gradient(135deg, #4F73F7 0%, #3B82F6 100%)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "var(--radius-md)",
              padding: "8px 20px",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.5px",
              cursor: isThinking ? "not-allowed" : "pointer",
              boxShadow: "0 4px 12px rgba(79, 115, 247, 0.35)",
              transition: "all 0.15s ease",
            }}
          >
            <Sparkles size={14} />
            <span>{isThinking ? "DIRECTING..." : "DIRECT"}</span>
          </button>
        </div>
      </div>

      {/* 2. AI Status & Pipeline Progress */}
      <div
        style={{
          background: "var(--bg-subtle)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.5px" }}>
              AI Director Status
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent)" }}>
              82% Complete
            </span>
            {onOpenWorkflowGraph && (
              <button
                onClick={onOpenWorkflowGraph}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-secondary)",
                  fontSize: "11px",
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--success)", fontWeight: 600 }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--success)" }} />
            <span>Understanding footage</span>
          </div>
          <div style={{ color: "var(--text-muted)" }}>→</div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--accent)", fontWeight: 600 }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--accent)" }} />
            <span>Building story</span>
          </div>
          <div style={{ color: "var(--text-muted)" }}>→</div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-muted)" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", border: "1px solid var(--text-muted)" }} />
            <span>Audio polish</span>
          </div>
          <div style={{ color: "var(--text-muted)" }}>→</div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-muted)" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", border: "1px solid var(--text-muted)" }} />
            <span>Final review</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ width: "100%", height: "5px", background: "var(--border)", borderRadius: "3px", overflow: "hidden" }}>
          <div
            style={{
              width: isThinking ? "95%" : "82%",
              height: "100%",
              background: "linear-gradient(90deg, #4F73F7 0%, #10B981 100%)",
              transition: "width 0.3s ease",
            }}
          />
        </div>

        {/* Compact Activity Stream */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            padding: "8px 10px",
            fontSize: "11px",
            color: "var(--text-secondary)",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            maxHeight: "85px",
            overflowY: "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "var(--success)" }}>●</span>
            <span>Analyzed 84 clips across media bins</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "var(--success)" }}>●</span>
            <span>Identified 17 usable cinematic moments</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "var(--danger)" }}>●</span>
            <span>Rejected 6 redundant shots</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "var(--accent)" }}>●</span>
            <span>Built 3 narrative arc options → Selected Option B</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "var(--warning)" }}>●</span>
            <span>Cut dead air: 4.8s • Sidechain audio ducked</span>
          </div>
        </div>
      </div>

      {/* 3. CURRENT DECISION CARD (Decision Transparency) */}
      <div
        style={{
          background: "#FFFFFF",
          border: decisionAccepted ? "1px solid var(--success)" : "1px solid var(--border-strong)",
          borderRadius: "var(--radius-lg)",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--accent)" }}>
              CURRENT DECISION
            </span>
          </div>

          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "4px",
              background: decisionAccepted ? "rgba(16, 185, 129, 0.1)" : "rgba(79, 115, 247, 0.1)",
              color: decisionAccepted ? "var(--success)" : "var(--accent)",
            }}
          >
            {decisionAccepted ? "APPROVED" : "CONFIDENCE: 91%"}
          </span>
        </div>

        {/* Decision Detail */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
            Using: &ldquo;Golden Hour Coastal Waves&rdquo;
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
            <strong>Rationale: </strong>Establishes geography and mood before transitioning into high-tempo surf action sequence.
          </div>
        </div>

        {/* Confidence Meter */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", width: "70px" }}>Confidence</span>
          <div style={{ flex: 1, height: "6px", background: "var(--bg-subtle)", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ width: "91%", height: "100%", background: "var(--accent)", borderRadius: "3px" }} />
          </div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-primary)" }}>91%</span>
        </div>

        {/* Accept / Change Buttons & Evidence Toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "4px" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setDecisionAccepted(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: decisionAccepted ? "var(--success)" : "var(--accent)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "var(--radius-sm)",
                padding: "6px 14px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.1s ease",
              }}
            >
              <CheckCircle2 size={13} />
              <span>{decisionAccepted ? "Accepted" : "Accept"}</span>
            </button>

            <button
              onClick={() => {
                if (onDirectAction) onDirectAction("REQUEST_ALTERNATIVE", { decisionId: "dec_1" });
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                borderRadius: "var(--radius-sm)",
                padding: "6px 14px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <RotateCcw size={12} />
              <span>Change / Alternative</span>
            </button>
          </div>

          <button
            onClick={() => setShowEvidenceDetails(!showEvidenceDetails)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              fontSize: "11px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "3px",
            }}
          >
            <span>Decision Evidence</span>
            {showEvidenceDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {/* Evidence Breakdown (Why Chosen vs Why Rejected) */}
        {showEvidenceDetails && (
          <div
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              padding: "10px",
              fontSize: "11px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div style={{ fontWeight: 700, color: "var(--danger)" }}>
              Rejected Shot 23
            </div>
            <div style={{ color: "var(--text-secondary)" }}>
              <strong>Reason: </strong>Redundant establishing shot with lower subject activity.
            </div>
            <div style={{ color: "var(--text-muted)" }}>
              <strong>Evidence: </strong>Same location (Beach North), same 35mm lens angle, 42% lower motion energy.
            </div>
            <div style={{ color: "var(--success)", fontWeight: 600 }}>
              <strong>Selected Alternative: </strong>Shot 31 (Subject enters frame, creating forward narrative momentum).
            </div>
          </div>
        )}
      </div>

      {/* 4. Quick Direct Prompt / Feedback Bar ("Ask AI") */}
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Ask AI / Adjust Direction
        </span>

        <form onSubmit={handleSendQuickFeedback} style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            value={quickPrompt}
            onChange={(e) => setQuickPrompt(e.target.value)}
            placeholder='e.g. "Make the opening slower" or "Boost dialogue clarity"...'
            style={{
              flex: 1,
              padding: "8px 12px",
              fontSize: "12px",
              background: "#FFFFFF",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-primary)",
              outline: "none",
            }}
          />
          <button
            type="submit"
            style={{
              background: "var(--accent)",
              border: "none",
              borderRadius: "var(--radius-md)",
              color: "#FFFFFF",
              padding: "0 14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Send prompt"
          >
            <Send size={13} />
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
                fontSize: "10px",
                color: "var(--text-muted)",
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
