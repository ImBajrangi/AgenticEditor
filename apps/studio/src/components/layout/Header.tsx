"use client";

import React from "react";
import {
  Film,
  Workflow,
  CheckCircle2,
  Undo2,
  Redo2,
  Download,
  Settings,
  Activity,
  Layers,
  Layout,
  Sparkles,
  Sliders,
} from "lucide-react";

export type WorkspaceMode = "CREATE" | "REVIEW" | "EXPORT";
export type WorkspacePreset =
  | "CREATE"
  | "REVIEW"
  | "EXPORT"
  | "PRO_STUDIO";

interface HeaderProps {
  mode: WorkspaceMode;
  setMode: (mode: WorkspaceMode) => void;
  isProMode: boolean;
  onToggleProMode: () => void;
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
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  setMode,
  isProMode,
  onToggleProMode,
  projectName,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenSystemStatus,
  onOpenRender,
  onOpenSettings,
  isRendering,
}) => {
  return (
    <header className="top-bar-container" role="banner">
      {/* 1. Left: Brand & Document Meta */}
      <div className="top-bar-left">
        <div className="brand-section">
          <div className="brand-icon-box" title="AetherEdit OS — Autonomous AI Video Director">
            <Sparkles size={18} />
          </div>
          <div className="brand-meta">
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="brand-title">{projectName}</span>
              <span style={{ fontSize: "10px", background: "var(--accent-soft)", color: "var(--accent)", padding: "1px 6px", borderRadius: "4px", fontWeight: 700 }}>
                AI DIRECTOR
              </span>
            </div>
            <div className="brand-sub-badge">
              <span className="save-indicator-dot" />
              <span>Autosaved • Ready for direction</span>
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
            title="Undo Last AI Edit (⌘Z)"
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

      {/* 2. Center: 3 Primary Modes [Create | Review | Export] */}
      <div className="top-bar-center">
        <div className="mode-switcher-pill" role="tablist">
          <button
            onClick={() => setMode("CREATE")}
            className={`mode-tab-btn ${mode === "CREATE" ? "mode-tab-btn-active" : ""}`}
            role="tab"
            aria-selected={mode === "CREATE"}
          >
            <Sparkles size={14} />
            <span>Create</span>
          </button>

          <button
            onClick={() => setMode("REVIEW")}
            className={`mode-tab-btn ${mode === "REVIEW" ? "mode-tab-btn-active" : ""}`}
            role="tab"
            aria-selected={mode === "REVIEW"}
          >
            <CheckCircle2 size={14} />
            <span>Review Diff</span>
          </button>

          <button
            onClick={() => {
              setMode("EXPORT");
              onOpenRender();
            }}
            className={`mode-tab-btn ${mode === "EXPORT" ? "mode-tab-btn-active" : ""}`}
            role="tab"
            aria-selected={mode === "EXPORT"}
          >
            <Download size={14} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* 3. Right: Pro Mode Toggle + System Diagnostics + Settings + Render */}
      <div className="top-bar-right">
        {/* Pro NLE Mode Toggle (Progressive Disclosure) */}
        <button
          onClick={onToggleProMode}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            background: isProMode ? "var(--bg-active)" : "var(--bg-subtle)",
            border: isProMode ? "1px solid var(--accent)" : "1px solid var(--border)",
            color: isProMode ? "var(--accent)" : "var(--text-secondary)",
            padding: "5px 10px",
            borderRadius: "var(--radius-sm)",
            fontSize: "11px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          title="Toggle between AI-First Director view and full Pro NLE Multi-Track view"
        >
          <Sliders size={13} />
          <span>{isProMode ? "Pro Studio: ON" : "Pro Studio"}</span>
        </button>

        {/* System Diagnostics Trigger */}
        <button
          onClick={onOpenSystemStatus}
          className="btn-icon-subtle"
          style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "7px" }}
          title="System Diagnostics & Engine Status"
        >
          <Activity size={15} style={{ color: "var(--accent)" }} />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="btn-icon-subtle"
          style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "7px" }}
          title="System & AI Settings"
        >
          <Settings size={15} />
        </button>

        {/* Quick Export Button */}
        <button
          onClick={onOpenRender}
          disabled={isRendering}
          className="export-primary-btn"
        >
          <Download size={14} />
          <span>{isRendering ? "Compiling..." : "Export"}</span>
        </button>
      </div>
    </header>
  );
};
