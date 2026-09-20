"use client";

import React from "react";
import {
  FolderKanban,
  FolderOpen,
  Sparkles,
  CheckCircle2,
  Sliders,
} from "lucide-react";

export type ToolRailSection =
  | "PROJECT"
  | "ASSETS"
  | "AI"
  | "REVIEW";

interface ToolRailProps {
  activeSection: ToolRailSection | null;
  onSelectSection: (section: ToolRailSection) => void;
  isProMode?: boolean;
  onToggleProMode?: () => void;
}

const RAIL_ITEMS: Array<{ id: ToolRailSection; label: string; icon: React.FC<{ size?: number }> }> = [
  { id: "PROJECT", label: "Project", icon: FolderKanban },
  { id: "ASSETS", label: "Assets", icon: FolderOpen },
  { id: "AI", label: "AI Director", icon: Sparkles },
  { id: "REVIEW", label: "Review", icon: CheckCircle2 },
];

export const ToolRail: React.FC<ToolRailProps> = ({
  activeSection,
  onSelectSection,
  isProMode = false,
  onToggleProMode,
}) => {
  return (
    <aside className="tool-rail-container" aria-label="Simplified AI Tool Rail">
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
        {RAIL_ITEMS.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`rail-item-btn ${isActive ? "rail-item-active" : ""}`}
              title={`${item.label} Panel`}
              aria-pressed={isActive}
            >
              <IconComponent size={19} />
              <span className="rail-item-label">{item.label}</span>
            </button>
          );
        })}
      </div>

      {onToggleProMode && (
        <div style={{ marginTop: "auto", width: "100%", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
          <button
            onClick={onToggleProMode}
            className={`rail-item-btn ${isProMode ? "rail-item-active" : ""}`}
            style={{
              color: isProMode ? "var(--accent)" : "var(--text-muted)",
              background: isProMode ? "var(--accent-soft)" : "transparent",
            }}
            title={isProMode ? "Pro Studio Mode: Enabled" : "Switch to Pro Studio NLE controls"}
            aria-pressed={isProMode}
          >
            <Sliders size={18} />
            <span className="rail-item-label">Pro</span>
          </button>
        </div>
      )}
    </aside>
  );
};
