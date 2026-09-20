"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Scissors,
  Film,
  Sparkles,
  Download,
  Settings,
  Workflow,
  Plus,
  Play,
  Volume2,
  X,
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (actionId: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const actions = [
    { id: "ai_dead_air", label: "Cut dead air & pauses over 400ms", category: "AI Director", icon: Sparkles },
    { id: "ai_cinematic", label: "Make timeline cinematic (ASL & 3D LUT)", category: "AI Director", icon: Sparkles },
    { id: "ai_reframe", label: "Auto-reframe to 9:16 vertical short", category: "AI Director", icon: Sparkles },
    { id: "split_clip", label: "Split clip at current playhead (C)", category: "Edit", icon: Scissors },
    { id: "switch_workflow", label: "Switch to Visual Workflow DAG", category: "View", icon: Workflow },
    { id: "switch_timeline", label: "Switch to NLE Multi-Track Timeline", category: "View", icon: Film },
    { id: "export_master", label: "Open Master Render & Export modal", category: "Export", icon: Download },
    { id: "audio_norm", label: "Apply EBU R128 (-23 LUFS) Loudness Normalization", category: "Audio", icon: Volume2 },
    { id: "open_settings", label: "Open AI Gateway & Engine Settings", category: "Settings", icon: Settings },
  ];

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase()) || a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="modal-overlay-backdrop" onClick={onClose}>
      <div
        className="modal-dialog-card"
        style={{ maxWidth: "580px", margin: "10vh auto 0", transform: "none" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--border)", gap: "10px" }}>
          <Search size={16} style={{ color: "var(--text-muted)" }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or natural language edit directive (⌘K)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: "14px",
              background: "transparent",
              color: "var(--text-primary)",
            }}
          />
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ maxHeight: "360px", overflowY: "auto", padding: "8px" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
              No commands found for &ldquo;{query}&rdquo;. Press Enter to send to AI Director.
            </div>
          ) : (
            filtered.map((action) => {
              const IconComp = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => {
                    onSelectAction(action.id);
                    onClose();
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    background: "transparent",
                    border: "none",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ color: "var(--accent)" }}>
                      <IconComp size={15} />
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>
                      {action.label}
                    </span>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", background: "var(--bg-subtle)", padding: "2px 6px", borderRadius: "4px" }}>
                    {action.category}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
