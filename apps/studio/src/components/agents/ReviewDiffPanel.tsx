"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Scissors,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  RotateCcw,
  Volume2,
  Palette,
  Gauge,
  Check,
  Layers,
  ArrowDownRight,
  TrendingDown,
} from "lucide-react";

export type AiDiffState =
  | "PROPOSED"
  | "PREVIEWING"
  | "APPROVED"
  | "APPLYING"
  | "APPLIED"
  | "REJECTED"
  | "ROLLED_BACK";

interface DiffChangeItem {
  id: string;
  category: "CUT" | "RIPPLE" | "SPEED" | "AUDIO" | "COLOR" | "EFFECT";
  title: string;
  detail: string;
  target: string;
  typeSign: "-" | "+";
}

interface ReviewDiffPanelProps {
  timelineVersionBefore: number;
  timelineVersionAfter: number;
  diffState?: AiDiffState;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onUndoAiChanges?: () => void;
  onApplySelected?: (selectedIds: string[]) => void;
}

export const ReviewDiffPanel: React.FC<ReviewDiffPanelProps> = ({
  timelineVersionBefore,
  timelineVersionAfter,
  diffState = "PROPOSED",
  onAcceptAll,
  onRejectAll,
  onUndoAiChanges,
  onApplySelected,
}) => {
  const [selectedChangeIds, setSelectedChangeIds] = useState<string[]>([
    "chg_1",
    "chg_2",
    "chg_3",
    "chg_4",
    "chg_5",
    "chg_6",
  ]);
  const [activeVisualTab, setActiveVisualTab] = useState<"VISUAL_DIFF" | "LIST">("VISUAL_DIFF");

  // Semantic timeline changes reflecting real Timeline IR mutations
  const proposedChanges: DiffChangeItem[] = [
    {
      id: "chg_1",
      category: "CUT",
      title: "− 1.500s dead-air range (1.999s → 3.500s)",
      detail: "Detect silence at 1.999s → Split at 1.999s → Split at 3.500s → Remove 1.500s range",
      target: "Track: V1 Primary (Interview Speech)",
      typeSign: "-",
    },
    {
      id: "chg_2",
      category: "RIPPLE",
      title: "+ Ripple downstream clips by −1.500s",
      detail: "Clips shift left from 3.500s to 1.999s maintaining frame sync",
      target: "Track: V1 Primary & A1 Dialogue",
      typeSign: "+",
    },
    {
      id: "chg_3",
      category: "SPEED",
      title: "+ Speed Ramp: 1.0x → 1.25x (+0.25x)",
      detail: "Dynamic ASL pacing curve into climax boundary",
      target: "Track: V2 B-Roll (Drone Mist Clip)",
      typeSign: "+",
    },
    {
      id: "chg_4",
      category: "AUDIO",
      title: "− Sidechain Ducking: Music −14 dB",
      detail: "Automatic speech ducking when dialogue is active on A1",
      target: "Dialogue Bus → Music Bus",
      typeSign: "-",
    },
    {
      id: "chg_5",
      category: "AUDIO",
      title: "+ EBU R128 Master Normalization",
      detail: "Master Bus targeted to -23.0 LUFS (True Peak -1.0 dBTP)",
      target: "Master Audio Bus",
      typeSign: "+",
    },
    {
      id: "chg_6",
      category: "COLOR",
      title: "+ 3D LUT: Kodak Vision3 5207",
      detail: "Rec.709 → Log-C Film Emulation, Exposure +0.3 EV",
      target: "Primary Video Grade",
      typeSign: "+",
    },
  ];

  const toggleSelectChange = (id: string) => {
    setSelectedChangeIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "CUT":
        return <Scissors size={13} style={{ color: "var(--danger)" }} />;
      case "RIPPLE":
        return <ArrowDownRight size={13} style={{ color: "var(--accent)" }} />;
      case "SPEED":
        return <Gauge size={13} style={{ color: "var(--warning)" }} />;
      case "AUDIO":
        return <Volume2 size={13} style={{ color: "var(--success)" }} />;
      case "COLOR":
        return <Palette size={13} style={{ color: "#EC4899" }} />;
      default:
        return <Sparkles size={13} style={{ color: "var(--accent)" }} />;
    }
  };

  const getStateBadgeStyle = (state: AiDiffState) => {
    switch (state) {
      case "PROPOSED":
        return { background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid var(--accent-border)" };
      case "PREVIEWING":
        return { background: "rgba(245, 158, 11, 0.12)", color: "var(--warning)", border: "1px solid rgba(245, 158, 11, 0.3)" };
      case "APPROVED":
      case "APPLIED":
        return { background: "rgba(16, 185, 129, 0.12)", color: "var(--success)", border: "1px solid rgba(16, 185, 129, 0.3)" };
      case "REJECTED":
      case "ROLLED_BACK":
        return { background: "rgba(239, 68, 68, 0.12)", color: "var(--danger)", border: "1px solid rgba(239, 68, 68, 0.3)" };
      default:
        return { background: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border)" };
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-surface)", padding: "14px" }}>
      {/* 1. Header with Version Bump & Explicit State Badge */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid var(--border)" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
              TIMELINE v{timelineVersionBefore} → v{timelineVersionAfter}
            </span>
          </div>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
            {selectedChangeIds.length} of {proposedChanges.length} changes selected
          </span>
        </div>

        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: "4px",
            letterSpacing: "0.5px",
            ...getStateBadgeStyle(diffState),
          }}
        >
          {diffState}
        </span>
      </div>

      {/* 2. Visual Diff vs List Tab Switcher */}
      <div style={{ display: "flex", gap: "6px", margin: "10px 0 6px 0" }}>
        <button
          onClick={() => setActiveVisualTab("VISUAL_DIFF")}
          style={{
            flex: 1,
            padding: "5px",
            fontSize: "11px",
            fontWeight: 600,
            borderRadius: "var(--radius-sm)",
            border: activeVisualTab === "VISUAL_DIFF" ? "1px solid var(--accent-border)" : "1px solid var(--border)",
            background: activeVisualTab === "VISUAL_DIFF" ? "var(--accent-soft)" : "var(--bg-surface)",
            color: activeVisualTab === "VISUAL_DIFF" ? "var(--accent)" : "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          Visual Timeline Overlay
        </button>
        <button
          onClick={() => setActiveVisualTab("LIST")}
          style={{
            flex: 1,
            padding: "5px",
            fontSize: "11px",
            fontWeight: 600,
            borderRadius: "var(--radius-sm)",
            border: activeVisualTab === "LIST" ? "1px solid var(--accent-border)" : "1px solid var(--border)",
            background: activeVisualTab === "LIST" ? "var(--accent-soft)" : "var(--bg-surface)",
            color: activeVisualTab === "LIST" ? "var(--accent)" : "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          IR Mutation List ({proposedChanges.length})
        </button>
      </div>

      {/* 3. Tab Content */}
      {activeVisualTab === "VISUAL_DIFF" ? (
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", padding: "4px 0" }}>
          {/* Visual Timeline Comparison Overlay (Point #8) */}
          <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                Timeline Version Comparison
              </span>
              <span style={{ fontSize: "10px", color: "var(--danger)", fontWeight: 600 }}>
                −1.500s removed
              </span>
            </div>

            {/* Timeline v1 (Before) */}
            <div style={{ marginBottom: "8px" }}>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "3px", fontFamily: "monospace" }}>
                Timeline v{timelineVersionBefore} (Original 21.0s)
              </div>
              <div style={{ display: "flex", height: "22px", borderRadius: "3px", overflow: "hidden", background: "#E2E8F0", border: "1px solid var(--border)" }}>
                <div style={{ width: "35%", background: "var(--accent)", opacity: 0.85, color: "white", fontSize: "9px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
                  Dialogue (00:00 - 01:29)
                </div>
                {/* Highlighted dead air silence */}
                <div style={{ width: "20%", background: "rgba(239, 68, 68, 0.8)", color: "white", fontSize: "9px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, borderLeft: "1px dashed white", borderRight: "1px dashed white" }}>
                  Dead Air (1.5s)
                </div>
                <div style={{ width: "45%", background: "var(--accent)", opacity: 0.85, color: "white", fontSize: "9px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
                  Dialogue Part 2 (03:15 - 07:00)
                </div>
              </div>
            </div>

            {/* Downward ripple arrow */}
            <div style={{ textAlign: "center", margin: "-2px 0 2px 0", color: "var(--accent)", fontSize: "11px", fontWeight: 700 }}>
              ↓ AI Applied Split & Ripple (−1.500s)
            </div>

            {/* Timeline v2 (After) */}
            <div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "3px", fontFamily: "monospace" }}>
                Timeline v{timelineVersionAfter} (Proposed 19.5s)
              </div>
              <div style={{ display: "flex", height: "22px", borderRadius: "3px", overflow: "hidden", background: "#E2E8F0", border: "1px solid var(--border)" }}>
                <div style={{ width: "35%", background: "var(--accent)", opacity: 0.9, color: "white", fontSize: "9px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
                  Dialogue (00:00 - 01:29)
                </div>
                <div style={{ width: "65%", background: "#10B981", color: "white", fontSize: "9px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
                  Dialogue Part 2 [Rippled to 01:29]
                </div>
              </div>
            </div>
          </div>

          {/* Semantic Before vs After Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div style={{ background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "var(--radius-sm)", padding: "8px" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--danger)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                BEFORE
              </span>
              <div style={{ fontSize: "11px", color: "var(--text-primary)", fontWeight: 600 }}>
                1.500s Silence Gap
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                Awkward pause at 00:01:29 between spoken phrases.
              </div>
            </div>

            <div style={{ background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "var(--radius-sm)", padding: "8px" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--success)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                AFTER
              </span>
              <div style={{ fontSize: "11px", color: "var(--text-primary)", fontWeight: 600 }}>
                Seamless Dialogue
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                Clean 120ms natural breath cadence, rippled sync.
              </div>
            </div>
          </div>

          {/* IR Summary Table */}
          <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
              Timeline IR Execution Summary
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px", fontSize: "11px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Trimmed Dead-Air</span>
                <span style={{ fontWeight: 600, color: "var(--danger)" }}>−1.500s (45 frames)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Downstream Ripple</span>
                <span style={{ fontWeight: 600, color: "var(--accent)" }}>−45 frames (tracks V1, A1)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Audio Ducking</span>
                <span style={{ fontWeight: 600, color: "var(--success)" }}>Music Bus −14 dB</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>3D LUT Applied</span>
                <span style={{ fontWeight: 600, color: "#EC4899" }}>Kodak Vision3 5207</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Structured Diff Items List */
        <div style={{ flex: 1, overflowY: "auto", padding: "6px 0", display: "flex", flexDirection: "column", gap: "8px" }}>
          {proposedChanges.map((chg) => {
            const isSelected = selectedChangeIds.includes(chg.id);
            return (
              <div
                key={chg.id}
                onClick={() => toggleSelectChange(chg.id)}
                style={{
                  background: isSelected ? "var(--bg-surface)" : "var(--bg-subtle)",
                  border: isSelected ? "1px solid var(--accent-border)" : "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "8px 10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "3px",
                  cursor: "pointer",
                  boxShadow: isSelected ? "var(--shadow-xs)" : "none",
                  transition: "all 0.1s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      style={{ accentColor: "var(--accent)" }}
                    />
                    {getCategoryIcon(chg.category)}
                    <span style={{ fontSize: "12px", fontWeight: 600, color: chg.typeSign === "-" ? "var(--danger)" : "var(--text-primary)" }}>
                      {chg.title}
                    </span>
                  </div>
                  <span style={{ fontSize: "9px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    {chg.category}
                  </span>
                </div>

                <div style={{ paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "1px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    {chg.detail}
                  </span>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                    {chg.target}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Action Buttons [Undo AI Changes] [Reject All] [Accept Selected] [Accept All] */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingTop: "10px", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            onClick={onRejectAll}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              padding: "7px",
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--danger)",
              cursor: "pointer",
            }}
          >
            <XCircle size={13} />
            <span>Reject All</span>
          </button>

          <button
            onClick={() => onApplySelected ? onApplySelected(selectedChangeIds) : onAcceptAll()}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              background: "var(--accent)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              padding: "7px",
              fontSize: "11px",
              fontWeight: 600,
              color: "white",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(79, 115, 247, 0.3)",
            }}
          >
            <CheckCircle2 size={13} />
            <span>Accept Selected ({selectedChangeIds.length})</span>
          </button>
        </div>

        {onUndoAiChanges && (
          <button
            onClick={onUndoAiChanges}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              fontSize: "11px",
              cursor: "pointer",
              padding: "4px",
            }}
            title="Revert entire AI transaction in 1 stroke"
          >
            <RotateCcw size={12} />
            <span>Undo Entire AI Transaction (⌘Z)</span>
          </button>
        )}
      </div>
    </div>
  );
};
