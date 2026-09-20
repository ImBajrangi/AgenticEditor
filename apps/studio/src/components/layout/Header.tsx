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
} from "lucide-react";

export type WorkspaceMode = "EDIT" | "WORKFLOW" | "REVIEW";
export type WorkspacePreset =
  | "EDITING"
  | "AI_EDITING"
  | "COLOR"
  | "AUDIO"
  | "WORKFLOW"
  | "REVIEW";

interface HeaderProps {
  mode: WorkspaceMode;
  setMode: (mode: WorkspaceMode) => void;
  workspacePreset: WorkspacePreset;
  onSelectWorkspacePreset: (preset: WorkspacePreset) => void;
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
  workspacePreset,
  onSelectWorkspacePreset,
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
      {/* 1. Left: Document / Project & Undo / Redo */}
      <div className="top-bar-left">
        <div className="brand-section">
          <div className="brand-icon-box" title="AetherEdit OS Studio">
            <Layers size={18} />
          </div>
          <div className="brand-meta">
            <span className="brand-title">{projectName}</span>
            <div className="brand-sub-badge">
              <span className="save-indicator-dot" />
              <span>Autosaved 2s ago</span>
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

      {/* 2. Center: Mode Switcher [Edit | Workflow | Review] */}
      <div className="top-bar-center">
        <div className="mode-switcher-pill" role="tablist">
          <button
            onClick={() => setMode("EDIT")}
            className={`mode-tab-btn ${mode === "EDIT" ? "mode-tab-btn-active" : ""}`}
            role="tab"
            aria-selected={mode === "EDIT"}
          >
            <Film size={14} />
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
            <span>Review Diff</span>
          </button>
        </div>
      </div>

      {/* 3. Right: Workspace Preset + Diagnostics + Export */}
      <div className="top-bar-right">
        {/* Workspace Preset Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Layout size={13} style={{ color: "var(--text-secondary)" }} />
          <select
            value={workspacePreset}
            onChange={(e) => onSelectWorkspacePreset(e.target.value as WorkspacePreset)}
            className="workspace-preset-select"
            title="Switch Workspace Preset Layout"
          >
            <option value="EDITING">Workspace: Editing</option>
            <option value="AI_EDITING">Workspace: AI Editing</option>
            <option value="COLOR">Workspace: Color Grading</option>
            <option value="AUDIO">Workspace: Audio Mastering</option>
            <option value="WORKFLOW">Workspace: Workflow DAG</option>
            <option value="REVIEW">Workspace: Review Diff</option>
          </select>
        </div>

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

        {/* Export Video */}
        <button
          onClick={onOpenRender}
          disabled={isRendering}
          className="export-primary-btn"
        >
          <Download size={14} />
          <span>{isRendering ? "Compiling..." : "Export Video"}</span>
        </button>
      </div>
    </header>
  );
};
