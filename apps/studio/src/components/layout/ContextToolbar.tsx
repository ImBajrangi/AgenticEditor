"use client";

import React from "react";
import {
  Scissors,
  Gauge,
  Crop,
  Move,
  ShieldCheck,
  Crosshair,
  Palette,
  Volume2,
  Wand2,
  Sparkles,
  Type,
  Maximize2,
} from "lucide-react";
import { TimelineClip } from "@aetheredit/timeline-ir";

interface ContextToolbarProps {
  selectedClip: TimelineClip | null;
  onOpenColor?: () => void;
  onOpenSpeed?: () => void;
  onOpenReframe?: () => void;
  onAiAction?: (action: string) => void;
}

export const ContextToolbar: React.FC<ContextToolbarProps> = ({
  selectedClip,
  onOpenColor,
  onOpenSpeed,
  onOpenReframe,
  onAiAction,
}) => {
  if (!selectedClip) {
    return (
      <div className="context-toolbar">
        <div className="context-tools-left">
          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
            Select a timeline clip or canvas element to inspect contextual editing tools
          </span>
        </div>
        <div className="context-tools-right">
          <button
            onClick={() => onAiAction?.("Make this cinematic")}
            className="context-pill-btn"
            title="Ask AI to analyze the overall project"
          >
            <Sparkles size={13} style={{ color: "var(--accent)" }} />
            <span>AI Director Auto-Edit</span>
          </button>
        </div>
      </div>
    );
  }

  const isVideo = !selectedClip.assetId.includes("music") && !selectedClip.name.toLowerCase().includes("audio");

  return (
    <div className="context-toolbar">
      {/* Left: Context Actions for Selected Clip */}
      <div className="context-tools-left">
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginRight: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>
            {selectedClip.name}
          </span>
          <span style={{ fontSize: "10px", background: "var(--bg-subtle)", padding: "2px 6px", borderRadius: "4px", color: "var(--text-secondary)" }}>
            {((selectedClip.timelineRange.duration) / 30).toFixed(1)}s
          </span>
        </div>

        <div className="divider-vert" style={{ height: "18px", margin: "0 4px" }} />

        {isVideo ? (
          <>
            <button className="context-pill-btn" title="Trim in/out points">
              <Scissors size={13} />
              <span>Trim</span>
            </button>
            <button onClick={onOpenSpeed} className="context-pill-btn" title="Adjust playback speed">
              <Gauge size={13} />
              <span>Speed ({selectedClip.speed}x)</span>
            </button>
            <button onClick={onOpenReframe} className="context-pill-btn" title="Smart 9:16 reframe / crop">
              <Crop size={13} />
              <span>Reframe</span>
            </button>
            <button className="context-pill-btn" title="Transform position & scale">
              <Move size={13} />
              <span>Transform</span>
            </button>
            <button onClick={onOpenColor} className="context-pill-btn" title="Color grading & 3D LUT">
              <Palette size={13} />
              <span>Color (LUT)</span>
            </button>
            <button className="context-pill-btn" title="Audio volume & ducking">
              <Volume2 size={13} />
              <span>Audio</span>
            </button>
            <button className="context-pill-btn" title="Effects & filters">
              <Wand2 size={13} />
              <span>Effects</span>
            </button>
          </>
        ) : (
          <>
            <button className="context-pill-btn">
              <Scissors size={13} />
              <span>Trim</span>
            </button>
            <button className="context-pill-btn">
              <Volume2 size={13} />
              <span>Gain / EQ</span>
            </button>
            <button className="context-pill-btn">
              <Sparkles size={13} />
              <span>EBU R128 Norm (-23 LUFS)</span>
            </button>
          </>
        )}
      </div>

      {/* Right: AI Quick Action for Selected Clip */}
      <div className="context-tools-right">
        <button
          onClick={() => onAiAction?.(`Enhance clip ${selectedClip.name}`)}
          className="context-pill-btn context-pill-btn-active"
        >
          <Sparkles size={13} />
          <span>AI Clip Action</span>
        </button>
      </div>
    </div>
  );
};
