"use client";

import React from "react";
import {
  Scissors,
  Gauge,
  Crop,
  Move,
  ShieldCheck,
  Palette,
  Volume2,
  Wand2,
  Sparkles,
  Type,
  RefreshCw,
  GitBranch,
  ArrowRight,
  Layers,
  Trash2,
} from "lucide-react";
import { TimelineClip } from "@aetheredit/timeline-ir";

interface ContextToolbarProps {
  selectedClip: TimelineClip | null;
  onOpenColor?: () => void;
  onOpenSpeed?: () => void;
  onOpenReframe?: () => void;
  onAiAction?: (action: string) => void;
  onDeleteClip?: (clipId: string) => void;
  onUpdateSpeed?: (clipId: string, speed: number) => void;
  onTrimQuick?: (clipId: string, deltaFrames: number) => void;
  aspectRatio?: string;
  currentFrame?: number;
  fps?: number;
}

export const ContextToolbar: React.FC<ContextToolbarProps> = ({
  selectedClip,
  onOpenColor,
  onOpenSpeed,
  onOpenReframe,
  onAiAction,
  onDeleteClip,
  onUpdateSpeed,
  onTrimQuick,
  aspectRatio = "16:9",
  currentFrame = 0,
  fps = 30,
}) => {
  const [inlinePrompt, setInlinePrompt] = React.useState("");

  const totalSecs = currentFrame / (fps || 30);
  const mins = Math.floor(totalSecs / 60);
  const secs = Math.floor(totalSecs % 60);
  const sub = Math.floor((totalSecs % 1) * 10);
  const timecodeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${sub}`;

  const handleInlineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlinePrompt.trim()) return;
    onAiAction?.(inlinePrompt.trim());
    setInlinePrompt("");
  };

  if (!selectedClip) {
    return (
      <div className="context-toolbar">
        <div className="context-tools-left">
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ color: "var(--accent)", fontFamily: "monospace", fontWeight: 700 }}>📍 {timecodeStr}</span>
            <span>• {aspectRatio}</span>
          </span>
          <div className="divider-vert" style={{ height: "16px", margin: "0 4px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              onClick={() => onAiAction?.("Split clip at playhead")}
              className="context-pill-btn"
              title="Split clip at active playhead position (Blade tool)"
              style={{ color: "var(--accent)", borderColor: "var(--accent-border)", fontWeight: 600 }}
            >
              <Scissors size={13} />
              <span>Split at Playhead</span>
            </button>
            <button
              onClick={() => onAiAction?.("This shot is boring. Replace it with a better one.")}
              className="context-pill-btn"
              title="Replace shot under playhead with best matching B-roll"
            >
              <Sparkles size={13} />
              <span>Replace Boring Shot</span>
            </button>
            <button
              onClick={() => onAiAction?.("Make this scene more dramatic")}
              className="context-pill-btn"
              title="Enhance scene drama, color contrast, and tempo"
            >
              <Sparkles size={13} />
              <span>Make Dramatic</span>
            </button>
            <button
              onClick={() => onAiAction?.("Make a cinematic 60s travel reel")}
              className="context-pill-btn"
              title="Generate 60s 3-act cinematic travel reel"
            >
              <Layers size={13} />
              <span>60s Travel Reel</span>
            </button>
            <button
              onClick={() => onAiAction?.("Cut dead air & duck audio")}
              className="context-pill-btn"
              title="Cut silence / dead air across timeline"
            >
              <Scissors size={13} />
              <span>Cut Dead Air</span>
            </button>
          </div>
        </div>

        <div className="context-tools-right">
          <form onSubmit={handleInlineSubmit} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Sparkles size={12} style={{ position: "absolute", left: "8px", color: "var(--accent)", pointerEvents: "none" }} />
              <input
                type="text"
                value={inlinePrompt}
                onChange={(e) => setInlinePrompt(e.target.value)}
                placeholder="✦ Ask AI (e.g. Split at playhead, speed up 2x)..."
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  fontSize: "11px",
                  padding: "4px 8px 4px 24px",
                  width: "230px",
                  outline: "none",
                }}
              />
            </div>
            <button
              type="submit"
              disabled={!inlinePrompt.trim()}
              className="context-pill-btn context-pill-btn-active"
              style={{ padding: "4px 8px", fontSize: "11px", opacity: inlinePrompt.trim() ? 1 : 0.6 }}
            >
              Ask
            </button>
          </form>
        </div>
      </div>
    );
  }

  const isAudio = selectedClip.assetId.includes("music") || selectedClip.name.toLowerCase().includes("audio");
  const isAiGenerated = selectedClip.name.toLowerCase().includes("ai") || selectedClip.assetId.includes("gen");

  return (
    <div className="context-toolbar">
      {/* Left: Context Actions for Selected Clip */}
      <div className="context-tools-left">
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginRight: "4px", flexShrink: 0, minWidth: 0, maxWidth: "200px" }}>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text-primary)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={selectedClip.name}
          >
            {selectedClip.name}
          </span>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              fontFamily: "monospace",
              background: "var(--bg-subtle)",
              border: "1px solid var(--border)",
              padding: "1px 5px",
              borderRadius: "3px",
              color: "var(--text-secondary)",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            {((selectedClip.timelineRange.duration) / 30).toFixed(1)}s
          </span>
        </div>

        <div className="divider-vert" style={{ height: "18px", margin: "0 2px" }} />

        {isAiGenerated ? (
          // AI Clip Toolbar Controls (Section 12)
          <>
            <button onClick={() => onAiAction?.("Regenerate clip")} className="context-pill-btn" title="Regenerate">
              <RefreshCw size={12} />
              <span>Regenerate</span>
            </button>
            <button onClick={() => onAiAction?.("Generate variation")} className="context-pill-btn" title="Variation">
              <GitBranch size={12} />
              <span>Variation</span>
            </button>
            <button onClick={() => onAiAction?.("Extend clip")} className="context-pill-btn" title="Extend">
              <ArrowRight size={12} />
              <span>Extend</span>
            </button>
            <button onClick={onOpenReframe} className="context-pill-btn" title="Smart Reframe">
              <Crop size={12} />
              <span>Reframe</span>
            </button>
            <button onClick={onOpenColor} className="context-pill-btn" title="Restyle / Color">
              <Palette size={12} />
              <span>Color</span>
            </button>
          </>
        ) : !isAudio ? (
          // Video Clip Toolbar Controls (Section 12)
          <>
            <button
              onClick={() => onTrimQuick?.(selectedClip.id, -15)}
              className="context-pill-btn"
              title="Quick trim 15 frames (-0.5s) from end"
            >
              <Scissors size={12} />
              <span>Trim -0.5s</span>
            </button>
            <button
              onClick={() => {
                const speeds = [1.0, 1.25, 1.5, 2.0, 0.8];
                const cur = selectedClip.speed || 1.0;
                const nextIdx = (speeds.indexOf(cur) + 1) % speeds.length;
                onUpdateSpeed?.(selectedClip.id, speeds[nextIdx]);
                onOpenSpeed?.();
              }}
              className="context-pill-btn"
              title="Cycle playback speed (1.0x -> 1.25x -> 1.5x -> 2.0x -> 0.8x)"
            >
              <Gauge size={12} />
              <span>Speed {selectedClip.speed}x</span>
            </button>
            <button onClick={onOpenReframe} className="context-pill-btn" title="Toggle 16:9 / 9:16 Aspect Ratio">
              <Crop size={12} />
              <span>Reframe</span>
            </button>
            <button
              onClick={() => onAiAction?.(`Apply filmic Kodak 5207 color grade to ${selectedClip.name}`)}
              className="context-pill-btn"
              title="Apply Kodak 5207 Filmic Look"
            >
              <Palette size={12} />
              <span>Color</span>
            </button>
            <button
              onClick={() => onDeleteClip?.(selectedClip.id)}
              className="context-pill-btn"
              style={{ color: "var(--danger)", borderColor: "rgba(239, 68, 68, 0.3)" }}
              title="Delete selected clip from timeline (Backspace / Delete)"
            >
              <Trash2 size={12} />
              <span>Delete</span>
            </button>
          </>
        ) : (
          // Audio Clip Toolbar Controls
          <>
            <button
              onClick={() => onAiAction?.(`Normalize volume for ${selectedClip.name}`)}
              className="context-pill-btn"
              title="Normalize audio volume"
            >
              <Volume2 size={12} />
              <span>Gain 0 dB</span>
            </button>
            <button
              onClick={() => onAiAction?.(`Apply smart ducking to ${selectedClip.name}`)}
              className="context-pill-btn"
              title="Smart Voice Ducking"
            >
              <Layers size={12} />
              <span>Ducking</span>
            </button>
            <button
              onClick={() => onDeleteClip?.(selectedClip.id)}
              className="context-pill-btn"
              style={{ color: "var(--danger)" }}
              title="Delete audio clip (Backspace / Delete)"
            >
              <Trash2 size={12} />
              <span>Delete</span>
            </button>
          </>
        )}
      </div>

      {/* Right: AI Quick Action for this clip */}
      <div className="context-tools-right">
        <button
          onClick={() => onAiAction?.("This shot is boring. Replace it with a better one.")}
          className="context-pill-btn"
          style={{ color: "var(--accent)", borderColor: "var(--accent-border)", fontWeight: 600 }}
          title="Replace this clip with better matching B-roll"
        >
          <Sparkles size={12} />
          <span>Replace Shot</span>
        </button>
        <button
          onClick={() => onAiAction?.("Make this scene more dramatic")}
          className="context-pill-btn"
          title="Make this scene more dramatic"
        >
          <Sparkles size={12} />
          <span>Make Dramatic</span>
        </button>
        <form onSubmit={handleInlineSubmit} style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Sparkles size={12} style={{ position: "absolute", left: "8px", color: "var(--accent)", pointerEvents: "none" }} />
            <input
              type="text"
              value={inlinePrompt}
              onChange={(e) => setInlinePrompt(e.target.value)}
              placeholder="✦ Ask AI about this clip..."
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-primary)",
                fontSize: "11px",
                padding: "4px 8px 4px 24px",
                width: "165px",
                outline: "none",
                whiteSpace: "nowrap",
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!inlinePrompt.trim()}
            className="context-pill-btn context-pill-btn-active"
            style={{ padding: "0 10px", height: "28px", fontSize: "11px", opacity: inlinePrompt.trim() ? 1 : 0.6 }}
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  );
};
