"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Send,
  Sparkles,
  Sliders,
  History,
  RotateCcw,
  RotateCw,
  CheckCircle2,
  Tv,
  Smartphone,
  Maximize2,
  Palette,
  Volume2,
  Scissors,
  Layers,
  Wand2,
  Zap,
  SplitSquareVertical,
} from "lucide-react";
import { MediaAsset } from "@/lib/sample-data";
import { TimelineIR, TimelineClip } from "@aetheredit/timeline-ir";

export interface VersionSnapshot {
  id: string;
  versionNumber: number;
  name: string;
  timestamp: string;
  prompt: string;
  operationSummary: string;
  timeline: TimelineIR;
  activeLut?: string;
  speedMultiplier?: number;
}

interface FinishedVideoFirstStageProps {
  timeline: TimelineIR;
  currentFrame: number;
  totalFrames: number;
  fps: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (frame: number) => void;
  aspectRatio: "16:9" | "9:16";
  onToggleAspectRatio: () => void;
  selectedAsset: MediaAsset | null;
  onNaturalRevision: (instruction: string, timestampSeconds: number, targetClip?: TimelineClip | null) => Promise<void>;
  isProcessingRevision: boolean;
  onToggleProMode?: () => void;
  onOpenExport?: () => void;
  onOpenSettings?: () => void;
}

export const FinishedVideoFirstStage: React.FC<FinishedVideoFirstStageProps> = ({
  timeline,
  currentFrame,
  totalFrames,
  fps,
  isPlaying,
  onTogglePlay,
  onSeek,
  aspectRatio,
  onToggleAspectRatio,
  selectedAsset,
  onNaturalRevision,
  isProcessingRevision,
  onToggleProMode,
  onOpenExport,
  onOpenSettings,
}) => {
  const [revisionInput, setRevisionInput] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "CLIPS" | "AUDIO" | "COLOR" | "GRAPHICS">("ALL");
  const [splitCompareActive, setSplitCompareActive] = useState(false);
  const [splitPosition, setSplitPosition] = useState(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Version History State (Points #11, #12)
  const [versions, setVersions] = useState<VersionSnapshot[]>([
    {
      id: "v1",
      versionNumber: 1,
      name: "Version 1: AI first edit",
      timestamp: "12:00:10",
      prompt: "Create a cinematic travel reel from these clips. Make it emotional and energetic.",
      operationSummary: "Assembled 5 acts, applied Kodak 5207 LUT, ducked audio -14dB",
      timeline,
      activeLut: "Kodak 5207 Filmic",
      speedMultiplier: 1.0,
    },
  ]);
  const [activeVersionIndex, setActiveVersionIndex] = useState(0);

  const currentSeconds = currentFrame / fps;
  const totalSeconds = totalFrames > 0 ? totalFrames / fps : 45.0;
  const playheadPercent = Math.min(100, (currentSeconds / totalSeconds) * 100);

  // Identify current clip based on timestamp
  const allClips = timeline.tracks.flatMap((t) => t.clips);
  const currentClip = allClips.find(
    (c) => currentFrame >= c.timelineRange.start && currentFrame < c.timelineRange.start + c.timelineRange.duration
  ) || allClips[0] || null;

  // Format Timecode 00:18.43
  const formatTimecode = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
  };

  // Timestamp-Based Contextual Quick Actions (Point #7)
  const timestampQuickActions = [
    { label: "Make colors warmer", instruction: `Warm up the color temperature for "${currentClip?.name || "this clip"}" at ${formatTimecode(currentSeconds)}` },
    { label: "Remove this shot", instruction: `Cut and remove "${currentClip?.name || "this shot"}" at ${formatTimecode(currentSeconds)} and ripple downstream` },
    { label: "Make this part faster", instruction: `Increase playback speed by 1.3x for "${currentClip?.name || "this shot"}"` },
    { label: "Add zoom effect", instruction: `Add slow cinematic push-in zoom on subject at ${formatTimecode(currentSeconds)}` },
    { label: "Change transition", instruction: `Replace hard cut with smooth 18-frame film dissolve at ${formatTimecode(currentSeconds)}` },
    { label: "Improve audio ducking", instruction: `Duck background music -16dB under dialogue at ${formatTimecode(currentSeconds)}` },
  ];

  const handleSendRevision = async (instructionText: string) => {
    if (!instructionText.trim() || isProcessingRevision) return;

    // Trigger revision
    await onNaturalRevision(instructionText, currentSeconds, currentClip);

    // Save as new version snapshot
    const newVersionNum = versions.length + 1;
    let versionName = `Version ${newVersionNum}: `;
    if (instructionText.toLowerCase().includes("faster") || instructionText.toLowerCase().includes("speed")) {
      versionName += "Faster pacing";
    } else if (instructionText.toLowerCase().includes("warm") || instructionText.toLowerCase().includes("color")) {
      versionName += "Warmer colors";
    } else if (instructionText.toLowerCase().includes("remove") || instructionText.toLowerCase().includes("cut")) {
      versionName += "Removed shot";
    } else if (instructionText.toLowerCase().includes("shot") || instructionText.toLowerCase().includes("better")) {
      versionName += "Changed hero shot";
    } else {
      versionName += "Refined edit";
    }

    const newSnapshot: VersionSnapshot = {
      id: `v${newVersionNum}`,
      versionNumber: newVersionNum,
      name: versionName,
      timestamp: new Date().toLocaleTimeString(),
      prompt: instructionText,
      operationSummary: `Targeted timestamp ${formatTimecode(currentSeconds)} (${currentClip?.name || "Sequence"})`,
      timeline,
      activeLut: instructionText.toLowerCase().includes("warm") ? "Warm Sunset Filmic" : versions[activeVersionIndex].activeLut,
    };

    setVersions((prev) => [...prev, newSnapshot]);
    setActiveVersionIndex(versions.length);
    setRevisionInput("");
  };

  const handleUndoVersion = () => {
    if (activeVersionIndex > 0) {
      setActiveVersionIndex(activeVersionIndex - 1);
    }
  };

  const handleRedoVersion = () => {
    if (activeVersionIndex < versions.length - 1) {
      setActiveVersionIndex(activeVersionIndex + 1);
    }
  };

  const handleSplitMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingSplit || !viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(5, Math.min(95, Math.round((x / rect.width) * 100)));
    setSplitPosition(pct);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        background: "var(--bg-app)",
        color: "#F8FAFC",
        overflow: "hidden",
      }}
    >
      {/* ========================================================
          AREA 1: Minimalist Header Bar (Logo, Versions, Export)
         ======================================================== */}
      <div
        style={{
          height: "52px",
          padding: "0 20px",
          background: "rgba(18, 21, 30, 0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 40,
        }}
      >
        {/* Brand & Active Version */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                boxShadow: "0 0 12px rgba(99, 102, 241, 0.4)",
              }}
            >
              <Sparkles size={15} />
            </div>
            <span style={{ fontSize: "14px", fontWeight: 800, letterSpacing: "-0.2px", color: "#FFFFFF" }}>
              AETHEREDIT
            </span>
          </div>

          <div style={{ width: "1px", height: "18px", background: "rgba(255, 255, 255, 0.1)" }} />

          {/* Version Switcher Pill (Point #12) */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <select
              value={activeVersionIndex}
              onChange={(e) => setActiveVersionIndex(Number(e.target.value))}
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "6px",
                padding: "3px 8px",
                fontSize: "11px",
                fontWeight: 600,
                color: "#A5B4FC",
                outline: "none",
                cursor: "pointer",
              }}
            >
              {versions.map((v, i) => (
                <option key={v.id} value={i} style={{ background: "#12151E", color: "#F8FAFC" }}>
                  {v.name} ({v.timestamp})
                </option>
              ))}
            </select>

            {/* Undo / Redo / Compare */}
            <div style={{ display: "flex", gap: "2px" }}>
              <button
                onClick={handleUndoVersion}
                disabled={activeVersionIndex === 0}
                style={{
                  background: "transparent",
                  border: "none",
                  color: activeVersionIndex === 0 ? "#475569" : "#94A3B8",
                  padding: "4px",
                  cursor: activeVersionIndex === 0 ? "not-allowed" : "pointer",
                }}
                title="Undo AI Action (⌘Z)"
              >
                <RotateCcw size={13} />
              </button>
              <button
                onClick={handleRedoVersion}
                disabled={activeVersionIndex === versions.length - 1}
                style={{
                  background: "transparent",
                  border: "none",
                  color: activeVersionIndex === versions.length - 1 ? "#475569" : "#94A3B8",
                  padding: "4px",
                  cursor: activeVersionIndex === versions.length - 1 ? "not-allowed" : "pointer",
                }}
                title="Redo AI Action (⌘⇧Z)"
              >
                <RotateCw size={13} />
              </button>
              <button
                onClick={() => setSplitCompareActive(!splitCompareActive)}
                style={{
                  background: splitCompareActive ? "rgba(99, 102, 241, 0.25)" : "transparent",
                  border: "none",
                  color: splitCompareActive ? "#A5B4FC" : "#94A3B8",
                  padding: "4px",
                  borderRadius: "3px",
                  cursor: "pointer",
                }}
                title="Compare Version A/B"
              >
                <SplitSquareVertical size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Controls: Format, Pro Studio Toggle, Export */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Format Toggle */}
          <button
            onClick={onToggleAspectRatio}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#E2E8F0",
              padding: "4px 10px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {aspectRatio === "16:9" ? <Tv size={12} /> : <Smartphone size={12} />}
            <span>{aspectRatio}</span>
          </button>

          {/* Optional Pro Studio Switch (Progressive Disclosure) */}
          {onToggleProMode && (
            <button
              onClick={onToggleProMode}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#94A3B8",
                padding: "4px 10px",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
              }}
              title="Open full DaVinci Resolve-style NLE multi-track controls"
            >
              <Sliders size={12} />
              <span>Pro Studio</span>
            </button>
          )}

          {/* Export Master Button */}
          {onOpenExport && (
            <button
              onClick={onOpenExport}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "4px",
                padding: "5px 14px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 0 14px rgba(99, 102, 241, 0.4)",
              }}
            >
              <span>Export</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================
          AREA 2: Dominant Finished Video Preview
         ======================================================== */}
      <div
        style={{
          flex: "1 1 auto",
          minHeight: "260px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#07080C",
          padding: "12px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          ref={viewportRef}
          onMouseMove={handleSplitMouseMove}
          onMouseUp={() => setIsDraggingSplit(false)}
          onMouseLeave={() => setIsDraggingSplit(false)}
          style={{
            height: "100%",
            aspectRatio: aspectRatio === "9:16" ? "9/16" : "16/9",
            maxHeight: "100%",
            borderRadius: "10px",
            overflow: "hidden",
            position: "relative",
            background: "#000000",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.8), 0 0 1px rgba(255, 255, 255, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          onClick={onTogglePlay}
        >
          {/* Main Video Display */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedAsset?.thumbnailUrl || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1400&auto=format&fit=crop&q=80"}
            alt="Finished Output Preview"
            style={{
              width: "100%",
              height: "100%",
              objectFit: aspectRatio === "9:16" ? "cover" : "contain",
              filter: versions[activeVersionIndex]?.activeLut?.includes("Warm")
                ? "contrast(1.2) saturate(1.3) sepia(0.18)"
                : "contrast(1.15) saturate(1.22) sepia(0.06)",
            }}
          />

          {/* A/B Compare Overlay if Split Active */}
          {splitCompareActive && (
            <>
              {/* Left Side: Original/Before */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedAsset?.thumbnailUrl || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1400&auto=format&fit=crop&q=80"}
                alt="Before Compare"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: aspectRatio === "9:16" ? "cover" : "contain",
                  filter: "none",
                  clipPath: `polygon(0 0, ${splitPosition}% 0, ${splitPosition}% 100%, 0 100%)`,
                }}
              />
              <div
                onMouseDown={() => setIsDraggingSplit(true)}
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: `${splitPosition}%`,
                  width: "3px",
                  background: "#6366F1",
                  boxShadow: "0 0 10px #6366F1",
                  zIndex: 20,
                  transform: "translateX(-50%)",
                }}
              />
              <span style={{ position: "absolute", top: "10px", left: "10px", fontSize: "9px", background: "rgba(0,0,0,0.7)", padding: "2px 6px", borderRadius: "3px" }}>
                Before
              </span>
              <span style={{ position: "absolute", top: "10px", right: "10px", fontSize: "9px", background: "rgba(99,102,241,0.85)", padding: "2px 6px", borderRadius: "3px" }}>
                After (Current Version)
              </span>
            </>
          )}

          {/* Center Play Overlay Icon when paused */}
          {!isPlaying && (
            <div
              style={{
                position: "absolute",
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(6px)",
                border: "2px solid rgba(255, 255, 255, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                boxShadow: "0 0 20px rgba(0, 0, 0, 0.6)",
                pointerEvents: "none",
              }}
            >
              <Play size={26} style={{ marginLeft: "3px" }} />
            </div>
          )}

          {/* Current Timestamp & Clip Identifier Badge */}
          <div
            style={{
              position: "absolute",
              bottom: "12px",
              left: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(0, 0, 0, 0.75)",
              backdropFilter: "blur(8px)",
              padding: "4px 10px",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              pointerEvents: "none",
            }}
          >
            <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "12px", fontWeight: 700, color: "#38BDF8" }}>
              {formatTimecode(currentSeconds)}
            </span>
            <span style={{ fontSize: "11px", color: "#CBD5E1" }}>
              • {currentClip?.name || "Coastal Surf Sequence"}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================
          AREA 3: Minimal Scrubbable Timeline (Point #10)
         ======================================================== */}
      <div
        style={{
          background: "rgba(14, 17, 24, 0.95)",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "10px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {/* Timecode & Playback Control Strip */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={onTogglePlay}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
                border: "none",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 0 10px rgba(99, 102, 241, 0.4)",
              }}
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} style={{ marginLeft: "1px" }} />}
            </button>

            <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "12px", fontWeight: 700, color: "#FFFFFF" }}>
              {formatTimecode(currentSeconds)} / {formatTimecode(totalSeconds)}
            </span>
          </div>

          {/* Small Optional Control Pills (Point #10) */}
          <div style={{ display: "flex", gap: "4px" }}>
            {(["ALL", "CLIPS", "AUDIO", "COLOR", "GRAPHICS"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: activeTab === tab ? "rgba(99, 102, 241, 0.2)" : "transparent",
                  border: activeTab === tab ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid transparent",
                  color: activeTab === tab ? "#A5B4FC" : "#64748B",
                  fontSize: "10px",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Minimal Timeline Scrubber Line: ━━━━━━━━●━━━━━━━━━━━━━━━━ */}
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            onSeek(Math.floor(clickRatio * totalFrames));
          }}
          style={{
            position: "relative",
            width: "100%",
            height: "8px",
            background: "rgba(255, 255, 255, 0.08)",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {/* Active progress fill */}
          <div
            style={{
              width: `${playheadPercent}%`,
              height: "100%",
              background: "linear-gradient(90deg, #6366F1 0%, #38BDF8 100%)",
              borderRadius: "4px",
              boxShadow: "0 0 8px rgba(56, 189, 248, 0.5)",
            }}
          />

          {/* Scrubber Knob Indicator */}
          <div
            style={{
              position: "absolute",
              top: "-4px",
              left: `calc(${playheadPercent}% - 8px)`,
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              background: "#FFFFFF",
              border: "3px solid #6366F1",
              boxShadow: "0 0 10px rgba(99, 102, 241, 0.8)",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>

      {/* ========================================================
          AREA 4: "✦ What would you like to change?" (Points #7, #8)
         ======================================================== */}
      <div
        style={{
          background: "rgba(18, 22, 32, 0.95)",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "16px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {/* Header Title + Current Timestamp Hint */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Sparkles size={14} style={{ color: "#818CF8" }} />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF" }}>
              What would you like to change?
            </span>
          </div>

          <span style={{ fontSize: "11px", color: "#94A3B8" }}>
            Paused at <strong style={{ color: "#38BDF8", fontFamily: "monospace" }}>{formatTimecode(currentSeconds)}</strong>
          </span>
        </div>

        {/* Natural Language Instruction Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendRevision(revisionInput);
          }}
          style={{ display: "flex", gap: "8px" }}
        >
          <input
            type="text"
            value={revisionInput}
            onChange={(e) => setRevisionInput(e.target.value)}
            disabled={isProcessingRevision}
            placeholder='Type naturally (e.g. "Make the opening slower", "Use a better shot here", or "Colors are too warm")...'
            style={{
              flex: 1,
              padding: "10px 14px",
              fontSize: "13px",
              background: "rgba(11, 14, 21, 0.85)",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              borderRadius: "8px",
              color: "#FFFFFF",
              outline: "none",
              boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.5)",
            }}
          />
          <button
            type="submit"
            disabled={isProcessingRevision || !revisionInput.trim()}
            style={{
              background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              padding: "0 18px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: 700,
              fontSize: "12px",
              cursor: isProcessingRevision || !revisionInput.trim() ? "not-allowed" : "pointer",
              boxShadow: "0 0 14px rgba(99, 102, 241, 0.4)",
            }}
          >
            <span>{isProcessingRevision ? "AI Editing..." : "Send"}</span>
            <Send size={13} />
          </button>
        </form>

        {/* Timestamp-Based Quick Action Chips (Point #7) */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
            Suggestions for {formatTimecode(currentSeconds)}:
          </span>
          {timestampQuickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => handleSendRevision(action.instruction)}
              disabled={isProcessingRevision}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "14px",
                padding: "3px 10px",
                fontSize: "11px",
                color: "#CBD5E1",
                cursor: "pointer",
                transition: "all 0.12s ease",
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
