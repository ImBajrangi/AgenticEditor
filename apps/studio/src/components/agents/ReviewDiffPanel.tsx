"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Scissors,
  Sparkles,
  RotateCcw,
  Volume2,
  Palette,
  Gauge,
  ArrowDownRight,
  TrendingUp,
  Maximize2,
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
  timelineVersionBefore?: number;
  timelineVersionAfter?: number;
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
    { metric: "Narrative Coherence", delta: "+0.18", score: "9.2 / 10", color: "#818CF8" },
    { metric: "Pacing & Rhythm", delta: "+0.31", score: "9.4 / 10", color: "#34D399" },
    { metric: "Visual Coverage", delta: "+0.08", score: "8.9 / 10", color: "#38BDF8" },
    { metric: "Audio Balance & LUFS", delta: "+0.12", score: "9.5 / 10", color: "#FBBF24" },
  ];

  const toggleSelectChange = (id: string) => {
    setSelectedChangeIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "CUT":
        return <Scissors size={13} style={{ color: "#EF4444" }} />;
      case "RIPPLE":
        return <ArrowDownRight size={13} style={{ color: "#6366F1" }} />;
      case "SPEED":
        return <Gauge size={13} style={{ color: "#F59E0B" }} />;
      case "AUDIO":
        return <Volume2 size={13} style={{ color: "#10B981" }} />;
      case "COLOR":
        return <Palette size={13} style={{ color: "#EC4899" }} />;
      case "REFRAME":
        return <Maximize2 size={13} style={{ color: "#38BDF8" }} />;
      default:
        return <Sparkles size={13} style={{ color: "#6366F1" }} />;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        background: "#0B0D13",
        color: "#F8FAFC",
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
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "16px", fontWeight: 800, color: "#FFFFFF", letterSpacing: "0.2px" }}>
              AI EDIT #17 REVIEW
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                background: "rgba(99, 102, 241, 0.2)",
                color: "#A5B4FC",
                padding: "2px 8px",
                borderRadius: "4px",
                border: "1px solid rgba(99, 102, 241, 0.35)",
              }}
            >
              v{timelineVersionBefore} → v{timelineVersionAfter}
            </span>
          </div>
          <span style={{ fontSize: "12px", color: "#94A3B8" }}>
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
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#F87171",
              borderRadius: "4px",
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <XCircle size={13} />
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
              borderRadius: "4px",
              padding: "6px 16px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 0 14px rgba(16, 185, 129, 0.4)",
              transition: "all 0.15s ease",
            }}
          >
            <CheckCircle2 size={13} />
            <span>Keep Changes</span>
          </button>
        </div>
      </div>

      {/* 2. Quality Impact Matrix (ΔQuality) */}
      <div
        style={{
          background: "rgba(22, 27, 40, 0.7)",
          border: "1px solid rgba(99, 102, 241, 0.25)",
          borderRadius: "8px",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <TrendingUp size={15} style={{ color: "#818CF8" }} />
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Quality Impact (ΔQuality Benchmark)
            </span>
          </div>
          <span style={{ fontSize: "11px", color: "#34D399", fontWeight: 700 }}>
            Overall Gain: +0.21 ΔQuality
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
          {qualityDeltas.map((qd) => (
            <div
              key={qd.metric}
              style={{
                background: "rgba(11, 14, 21, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "6px",
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                gap: "3px",
              }}
            >
              <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 500 }}>
                {qd.metric}
              </span>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <span style={{ fontSize: "18px", fontWeight: 800, color: qd.color }}>
                  {qd.delta}
                </span>
                <span style={{ fontSize: "10px", color: "#64748B", fontFamily: "monospace" }}>
                  Score {qd.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Changed Mutations List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#94A3B8", letterSpacing: "0.5px" }}>
            Changed Operations ({selectedChangeIds.length} of {proposedChanges.length})
          </span>
          <span style={{ fontSize: "11px", color: "#64748B" }}>
            Click item to toggle inclusion
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {proposedChanges.map((chg) => {
            const isSelected = selectedChangeIds.includes(chg.id);
            return (
              <div
                key={chg.id}
                onClick={() => toggleSelectChange(chg.id)}
                style={{
                  background: isSelected ? "rgba(22, 27, 40, 0.8)" : "rgba(255, 255, 255, 0.02)",
                  border: isSelected ? "1px solid rgba(99, 102, 241, 0.35)" : "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "6px",
                  padding: "10px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                  cursor: "pointer",
                  transition: "all 0.1s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      style={{ accentColor: "#6366F1" }}
                    />
                    {getCategoryIcon(chg.category)}
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: chg.typeSign === "-" ? "#F87171" : "#FFFFFF",
                      }}
                    >
                      {chg.title}
                    </span>
                  </div>

                  <span style={{ fontSize: "9px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                    {chg.category}
                  </span>
                </div>

                <div style={{ paddingLeft: "26px", display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                    {chg.detail}
                  </span>
                  <span style={{ fontSize: "9px", color: "#64748B", fontFamily: "monospace" }}>
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
        <div style={{ marginTop: "auto", paddingTop: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.08)", textAlign: "center" }}>
          <button
            onClick={onUndoAiChanges}
            style={{
              background: "transparent",
              border: "none",
              color: "#64748B",
              fontSize: "11px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <RotateCcw size={11} />
            <span>Revert Entire AI Session to Checkpoint 0</span>
          </button>
        </div>
      )}
    </div>
  );
};
