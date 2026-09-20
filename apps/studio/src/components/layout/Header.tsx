"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Undo2,
  Redo2,
  Download,
  Settings,
  Activity,
  Layers,
  CheckCircle2,
  PlaySquare,
  Workflow,
  Share2,
  ChevronDown,
  Monitor,
  Check,
} from "lucide-react";

export type WorkspaceMode = "EDIT" | "WORKFLOW" | "REVIEW";

interface HeaderProps {
  mode: WorkspaceMode;
  setMode: (mode: WorkspaceMode) => void;
  projectName: string;
  onProjectChange?: (name: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenSystemStatus: () => void;
  onOpenRender: () => void;
  onOpenSettings: () => void;
  isRendering?: boolean;
  isAiThinking?: boolean;
  aspectRatio: "16:9" | "9:16" | "1:1";
  onAspectRatioChange: (ratio: "16:9" | "9:16" | "1:1") => void;
  timelineVersion?: number;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  setMode,
  projectName,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenSystemStatus,
  onOpenRender,
  onOpenSettings,
  isRendering = false,
  isAiThinking = false,
  aspectRatio,
  onAspectRatioChange,
  timelineVersion = 1,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showRatioMenu, setShowRatioMenu] = useState(false);

  return (
    <header className="top-bar-container" role="banner">
      {/* 1. Left: Project Info & Undo/Redo */}
      <div className="top-bar-left">
        <div className="brand-section">
          <div className="brand-icon-box" title="AetherEdit OS Studio">
            <Sparkles size={18} />
          </div>
          <div className="brand-meta">
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="brand-title">{projectName}</span>
              <span style={{ fontSize: "10px", background: "var(--accent-soft)", color: "var(--accent)", padding: "1px 6px", borderRadius: "4px", fontWeight: 600 }}>
                v{timelineVersion || 1}
              </span>
            </div>
            <div className="brand-sub-badge">
              <span className="save-indicator-dot" />
              <span>Auto-saved to Vault</span>
            </div>
          </div>
        </div>

        <div className="divider-vert" />

        {/* Undo / Redo */}
        <div className="history-btn-group">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="btn-icon-subtle"
            title="Undo (⌘Z)"
            aria-label="Undo"
          >
            <Undo2 size={15} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="btn-icon-subtle"
            title="Redo (⌘⇧Z)"
            aria-label="Redo"
          >
            <Redo2 size={15} />
          </button>
        </div>
      </div>

      {/* 2. Center: Mode Switcher [Edit | Workflow | Review] (Section 3 & 8) */}
      <div className="top-bar-center">
        <div className="mode-switcher-pill" role="tablist">
          <button
            onClick={() => setMode("EDIT")}
            className={`mode-tab-btn ${mode === "EDIT" ? "mode-tab-btn-active" : ""}`}
            role="tab"
            aria-selected={mode === "EDIT"}
          >
            <PlaySquare size={14} />
            <span>Edit</span>
          </button>

          <button
            onClick={() => setMode("WORKFLOW")}
            className={`mode-tab-btn ${mode === "WORKFLOW" ? "mode-tab-btn-active" : ""}`}
            role="tab"
            aria-selected={mode === "WORKFLOW"}
          >
            <Workflow size={14} />
            <span>Workflow</span>
          </button>

          <button
            onClick={() => setMode("REVIEW")}
            className={`mode-tab-btn ${mode === "REVIEW" ? "mode-tab-btn-active" : ""}`}
            role="tab"
            aria-selected={mode === "REVIEW"}
          >
            <CheckCircle2 size={14} />
            <span>Review</span>
          </button>
        </div>
      </div>

      {/* 3. Right: Status Indicators + Ratio + Settings + Export */}
      <div className="top-bar-right">
        {/* Status Indicators */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* AI Status */}
          <div className="status-chip" title="AI Director Execution State">
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: isAiThinking ? "var(--warning)" : "var(--accent)",
              }}
            />
            <span>{isAiThinking ? "AI Editing..." : "AI Ready"}</span>
          </div>

          {/* Render Status */}
          <div className="status-chip" title="Hardware Engine State">
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: isRendering ? "var(--warning)" : "var(--success)",
              }}
            />
            <span>{isRendering ? "Rendering..." : "Engine Idle"}</span>
          </div>
        </div>

        <div className="divider-vert" />

        {/* Aspect Ratio Selector */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowRatioMenu(!showRatioMenu)}
            className="btn-icon-subtle"
            style={{
              padding: "5px 8px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              fontSize: "12px",
              fontWeight: 600,
              gap: "4px",
            }}
            title="Aspect Ratio"
          >
            <Monitor size={14} />
            <span>{aspectRatio}</span>
            <ChevronDown size={12} />
          </button>

          {showRatioMenu && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "4px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-md)",
                padding: "4px",
                minWidth: "110px",
                zIndex: 60,
              }}
            >
              {(["16:9", "9:16", "1:1"] as const).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => {
                    onAspectRatioChange(ratio);
                    setShowRatioMenu(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "6px 10px",
                    fontSize: "12px",
                    fontWeight: 500,
                    background: aspectRatio === ratio ? "var(--accent-soft)" : "transparent",
                    color: aspectRatio === ratio ? "var(--accent)" : "var(--text-primary)",
                    border: "none",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                  }}
                >
                  <span>{ratio}</span>
                  {aspectRatio === ratio && <Check size={12} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* System Diagnostics */}
        <button
          onClick={onOpenSystemStatus}
          className="btn-icon-subtle"
          title="Hardware & Engine Diagnostics"
        >
          <Activity size={16} />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="btn-icon-subtle"
          title="Settings (API Keys & Engine)"
        >
          <Settings size={16} />
        </button>

        {/* Export Primary Action Button (Section 8) */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => onOpenRender()}
            className="export-primary-btn"
            title="Export Video"
          >
            <Download size={14} />
            <span>Export</span>
          </button>
        </div>
      </div>
    </header>
  );
};
