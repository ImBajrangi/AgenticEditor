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
  TrendingUp,
  Maximize2,
  RefreshCw,
  Film,
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
  category: "CUT" | "RIPPLE" | "SPEED" | "AUDIO" | "COLOR" | "EFFECT" | "REFRAME";
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
  timelineVersionBefore = 1,
  timelineVersionAfter = 2,
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
  const [activeVisualTab, setActiveVisualTab] = useState<"QUALITY_IMPACT" | "VISUAL_DIFF" | "LIST">("QUALITY_IMPACT");

  // Semantic timeline changes reflecting real Timeline IR mutations
  const proposedChanges: DiffChangeItem[] = [
    {
      id: "chg_1",
      category: "CUT",
      title: "+ Added 2.4s opening sequence",
      detail: "Atmospheric establishing shot (Coastal Mist Drone) smoothly sets tone",
      target: "Track V1 (0:00 — 0:02.4)",
      typeSign: "+",
    },
    {
      id: "chg_2",
      category: "CUT",
      title: "− Removed 1.5s dead air & awkward silence",
      detail: "Detected speech pause at 0:01:29 → Split & ripple left by -45 frames",
      target: "Track V1 & A1 (Dialogue)",
      typeSign: "-",
    },
    {
      id: "chg_3",
      category: "EFFECT",
      title: "+ Replaced drone shot with Dynamic Surf POV",
      detail: "Higher motion energy score (+42%) at key narrative build transition",
      target: "Track V2 (B-Roll Action)",
      typeSign: "+",
    },
    {
      id: "chg_4",
      category: "EFFECT",
      title: "+ Added reaction shot during barrel wave",
      detail: "Spectator excitement on shore establishes audience connection",
      target: "Track V2 (Cutaway)",
      typeSign: "+",
    },
    {
      id: "chg_5",
      category: "AUDIO",
      title: "− Duck music −4 dB during dialogue",
      detail: "Dynamic sidechain compressor ensures clean vocal intelligibility",
      target: "Dialogue Bus → Music Bus",
      typeSign: "-",
    },
    {
      id: "chg_6",
      category: "REFRAME",
      title: "+ Reframed 16:9 → 9:16 smart subject tracking",
      detail: "Surfer centered dynamically across vertical mobile viewport",
      target: "Master Transform Geometry",
      typeSign: "+",
    },
  ];

  const qualityDeltas = [
    { metric: "Narrative Coherence", delta: "+0.18", score: "9.2 / 10", color: "#6366F1", positive: true },
    { metric: "Pacing & Rhythm", delta: "+0.31", score: "9.4 / 10", color: "#10B981", positive: true },
    { metric: "Visual Coverage", delta: "+0.08", score: "8.9 / 10", color: "#3B82F6", positive: true },
    { metric: "Audio Balance & LUFS", delta: "+0.12", score: "9.5 / 10", color: "#F59E0B", positive: true },
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
      case "REFRAME":
        return <Maximize2 size={13} style={{ color: "#38BDF8" }} />;
      default:
        return <Sparkles size={13} style={{ color: "var(--accent)" }} />;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        background: "var(--bg-surface)",
        padding: "20px 24px",
        overflowY: "auto",
        gap: "16px",
      }}
    >
      {/* 1. Header with Version Bump & Title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "14px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)" }}>
              AI EDIT #17 REVIEW
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                background: "var(--accent-soft)",
                color: "var(--accent)",
                padding: "2px 8px",
                borderRadius: "4px",
              }}
            >
              v{timelineVersionBefore} → v{timelineVersionAfter}
            </span>
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            Inspect AI mutations, measured quality delta, and approve changes in 1 stroke
          </span>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={onRejectAll}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              color: "var(--danger)",
              borderRadius: "var(--radius-sm)",
              padding: "7px 14px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <XCircle size={14} />
            <span>Revert</span>
          </button>

          <button
            onClick={onAcceptAll}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "var(--radius-sm)",
              padding: "7px 18px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
            }}
          >
            <CheckCircle2 size={14} />
            <span>Keep Changes</span>
          </button>
        </div>
      </div>

      {/* 2. Quality Impact Matrix (ΔQuality) */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(79, 115, 247, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)",
          border: "1px solid var(--accent-border)",
          borderRadius: "var(--radius-md)",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <TrendingUp size={16} style={{ color: "var(--accent)" }} />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Quality Impact (ΔQuality Benchmark)
            </span>
          </div>
          <span style={{ fontSize: "11px", color: "var(--success)", fontWeight: 700 }}>
            Overall Gain: +0.21 ΔQuality
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
          {qualityDeltas.map((qd) => (
            <div
              key={qd.metric}
              style={{
                background: "#FFFFFF",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                boxShadow: "var(--shadow-xs)",
              }}
            >
              <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 500 }}>
                {qd.metric}
              </span>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <span style={{ fontSize: "18px", fontWeight: 800, color: qd.color }}>
                  {qd.delta}
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                  Score {qd.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Changed Mutations List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.5px" }}>
            Changed Operations ({selectedChangeIds.length} of {proposedChanges.length})
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Click item to toggle inclusion
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
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
                  padding: "10px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "3px",
                  cursor: "pointer",
                  boxShadow: isSelected ? "var(--shadow-xs)" : "none",
                  transition: "all 0.1s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      style={{ accentColor: "var(--accent)" }}
                    />
                    {getCategoryIcon(chg.category)}
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: chg.typeSign === "-" ? "var(--danger)" : "var(--text-primary)",
                      }}
                    >
                      {chg.title}
                    </span>
                  </div>

                  <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    {chg.category}
                  </span>
                </div>

                <div style={{ paddingLeft: "26px", display: "flex", flexDirection: "column", gap: "1px" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
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
      </div>

      {/* 4. Bottom Quick Revert / Undo Section */}
      {onUndoAiChanges && (
        <div style={{ marginTop: "auto", paddingTop: "12px", borderTop: "1px solid var(--border)", textAlign: "center" }}>
          <button
            onClick={onUndoAiChanges}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "11px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <RotateCcw size={12} />
            <span>Revert Entire AI Session to Checkpoint 0</span>
          </button>
        </div>
      )}
    </div>
  );
};
