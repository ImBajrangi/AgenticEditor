"use client";

import React, { useState, useMemo } from "react";
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
  Check,
  AlertCircle,
} from "lucide-react";
import { TimelineIR } from "@aetheredit/timeline-ir";
import { computeTimelineDiff, ComputedDiffItem } from "@/lib/timeline-diff";

interface ReviewDiffPanelProps {
  timelineBefore: TimelineIR | null;
  timelineAfter: TimelineIR;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onUndoAiChanges?: () => void;
  onApplySelected?: (selectedIds: string[]) => void;
}

export const ReviewDiffPanel: React.FC<ReviewDiffPanelProps> = ({
  timelineBefore,
  timelineAfter,
  onAcceptAll,
  onRejectAll,
  onUndoAiChanges,
  onApplySelected,
}) => {
  // Compute real, dynamic timeline diff
  const diffResult = useMemo(() => {
    return computeTimelineDiff(timelineBefore, timelineAfter);
  }, [timelineBefore, timelineAfter]);

  const [selectedChangeIds, setSelectedChangeIds] = useState<string[]>(
    diffResult.changes.map((c) => c.id)
  );

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
        return <Palette size={13} style={{ color: "#8B5CF6" }} />;
      case "REFRAME":
        return <Maximize2 size={13} style={{ color: "#0284C7" }} />;
      default:
        return <Sparkles size={13} style={{ color: "var(--accent)" }} />;
    }
  };

  if (!diffResult.hasChanges) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          padding: "40px 20px",
          background: "var(--bg-app)",
          color: "var(--text-secondary)",
          textAlign: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: "var(--accent-soft)",
            color: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CheckCircle2 size={24} />
        </div>
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
            Timeline Up to Date
          </h3>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
            Current Version: v{timelineAfter.version} • No uncommitted AI mutations pending review.
          </p>
        </div>
        <button
          onClick={onAcceptAll}
          className="export-primary-btn"
          style={{ marginTop: "8px", fontSize: "12px", padding: "6px 16px" }}
        >
          Return to Studio Edit
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        background: "var(--bg-app)",
        color: "var(--text-primary)",
        padding: "20px 24px",
        overflowY: "auto",
        gap: "16px",
      }}
    >
      {/* 1. Header with Version Bump & Actions (Section 22 & 23) */}
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
            <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.2px" }}>
              Timeline Diff Review
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                background: "var(--accent-soft)",
                color: "var(--accent)",
                padding: "2px 8px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--accent-border)",
              }}
            >
              v{diffResult.versionBefore} → v{diffResult.versionAfter}
            </span>
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            {diffResult.changes.length} dynamic mutations calculated from timeline change history
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
              transition: "all 0.15s ease",
            }}
          >
            <XCircle size={14} />
            <span>Reject All</span>
          </button>

          <button
            onClick={onAcceptAll}
            className="export-primary-btn"
            style={{ padding: "7px 18px", fontSize: "12px" }}
          >
            <CheckCircle2 size={14} />
            <span>Accept All ({diffResult.changes.length})</span>
          </button>
        </div>
      </div>

      {/* 2. Calculated Quality Impact Matrix */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <TrendingUp size={15} style={{ color: "var(--accent)" }} />
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.3px" }}>
              Computed Metric Changes
            </span>
          </div>
          <span style={{ fontSize: "12px", color: "var(--success)", fontWeight: 700 }}>
            {diffResult.summary.clipsAdded} added • {diffResult.summary.clipsRemoved} removed • {diffResult.summary.clipsModified} modified
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
          {diffResult.qualityDeltas.map((qd) => (
            <div
              key={qd.metric}
              style={{
                background: "var(--bg-subtle)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                gap: "2px",
              }}
            >
              <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 500 }}>
                {qd.metric}
              </span>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <span style={{ fontSize: "16px", fontWeight: 700, color: qd.color }}>
                  {qd.delta}
                </span>
                <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                  {qd.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Dynamic Changed Operations List (Section 23) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.3px" }}>
            Computed Timeline Changes ({selectedChangeIds.length} of {diffResult.changes.length})
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Select individual items to accept
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {diffResult.changes.map((chg) => {
            const isSelected = selectedChangeIds.includes(chg.id);
            return (
              <div
                key={chg.id}
                onClick={() => toggleSelectChange(chg.id)}
                style={{
                  background: isSelected ? "var(--accent-soft)" : "var(--bg-surface)",
                  border: isSelected ? "1px solid var(--accent-border)" : "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
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
                      style={{ accentColor: "var(--accent)", cursor: "pointer" }}
                    />
                    {getCategoryIcon(chg.category)}
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: chg.typeSign === "-" ? "var(--danger)" : "var(--text-primary)",
                      }}
                    >
                      {chg.title}
                    </span>
                  </div>

                  <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    {chg.category}
                  </span>
                </div>

                <div style={{ paddingLeft: "26px", display: "flex", flexDirection: "column" }}>
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
            <RotateCcw size={11} />
            <span>Revert to Previous Timeline Checkpoint</span>
          </button>
        </div>
      )}
    </div>
  );
};
