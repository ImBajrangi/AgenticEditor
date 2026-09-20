"use client";

import React, { useState, useRef } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Volume2,
  Maximize2,
  Smartphone,
  Tv,
  Square,
  ShieldCheck,
} from "lucide-react";
import { MediaAsset } from "@/lib/sample-data";

interface DualMonitorProps {
  selectedAsset: MediaAsset | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentFrame: number;
  totalFrames: number;
  fps: number;
  aspectRatio: "16:9" | "9:16";
  onToggleAspectRatio: () => void;
  activeClipTitle?: string;
  activeLut?: string;
  onSeek?: (frame: number) => void;
  inPoint?: number | null;
  outPoint?: number | null;
  onSetInPoint?: (frame: number | null) => void;
  onSetOutPoint?: (frame: number | null) => void;
}

export const DualMonitor: React.FC<DualMonitorProps> = ({
  selectedAsset,
  isPlaying,
  onTogglePlay,
  currentFrame,
  totalFrames,
  fps,
  aspectRatio,
  onToggleAspectRatio,
  activeClipTitle,
  activeLut,
  onSeek,
  inPoint = null,
  outPoint = null,
  onSetInPoint,
  onSetOutPoint,
}) => {
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [showSafeZone, setShowSafeZone] = useState(true);
  const [stageView, setStageView] = useState<"PROGRAM" | "SOURCE" | "SPLIT">("PROGRAM");
  const [splitPosition, setSplitPosition] = useState(50); // percentage for A/B split wipe
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  const formatTimecode = (frame: number) => {
    const totalSeconds = Math.floor(frame / fps);
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const f = frame % fps;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}:${String(f).padStart(2, "0")}`;
  };

  const stepFrame = (delta: number) => {
    if (onSeek) {
      const next = Math.max(0, Math.min(totalFrames, currentFrame + delta));
      onSeek(next);
    }
  };

  const jumpToStart = () => {
    if (onSeek) onSeek(inPoint !== null && inPoint !== undefined ? inPoint : 0);
  };

  const jumpToEnd = () => {
    if (onSeek) onSeek(outPoint !== null && outPoint !== undefined ? outPoint : totalFrames);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      viewportRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
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
    <div className="preview-stage-box" role="region" aria-label="Playback Stage Monitor">
      {/* 1. Top Preview Controls Bar (DaVinci Resolve Style Mode Switcher & Guides) */}
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "10px",
          padding: "0 8px",
        }}
      >
        {/* Left: View Modes (Program, Source, A/B Split Comparison) */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ display: "flex", background: "var(--bg-subtle)", padding: "2px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
            <button
              onClick={() => setStageView("PROGRAM")}
              style={{
                padding: "3px 8px",
                border: "none",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 600,
                background: stageView === "PROGRAM" ? "var(--bg-surface)" : "transparent",
                color: stageView === "PROGRAM" ? "var(--accent)" : "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title="Program Monitor View"
            >
              Program
            </button>
            <button
              onClick={() => setStageView("SOURCE")}
              style={{
                padding: "3px 8px",
                border: "none",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 600,
                background: stageView === "SOURCE" ? "var(--bg-surface)" : "transparent",
                color: stageView === "SOURCE" ? "var(--accent)" : "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title="Source Media View"
            >
              Source
            </button>
            <button
              onClick={() => setStageView("SPLIT")}
              style={{
                padding: "3px 8px",
                border: "none",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 600,
                background: stageView === "SPLIT" ? "var(--bg-surface)" : "transparent",
                color: stageView === "SPLIT" ? "var(--accent)" : "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title="A/B Split Screen Comparison (Original Log vs Graded)"
            >
              A/B Split
            </button>
          </div>

          {activeClipTitle && (
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", marginLeft: "6px" }}>
              Clip: <strong style={{ color: "var(--text-primary)" }}>{activeClipTitle}</strong>
            </span>
          )}
        </div>

        {/* Right: Aspect Ratio & Safe Zone Guides */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {activeLut && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                background: "var(--warning-soft)",
                color: "var(--warning)",
                padding: "2px 6px",
                borderRadius: "4px",
                border: "1px solid rgba(217, 145, 0, 0.2)",
                fontFamily: "monospace",
              }}
            >
              3D LUT: 5207 Filmic
            </span>
          )}

          <button
            onClick={() => setShowSafeZone(!showSafeZone)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: showSafeZone ? "var(--accent-soft)" : "var(--bg-subtle)",
              border: showSafeZone ? "1px solid var(--accent-border)" : "1px solid var(--border)",
              color: showSafeZone ? "var(--accent)" : "var(--text-secondary)",
              padding: "3px 8px",
              borderRadius: "var(--radius-sm)",
              fontSize: "11px",
              fontWeight: 500,
              cursor: "pointer",
            }}
            title="Toggle Safe Margins / Guides"
          >
            <ShieldCheck size={12} />
            <span>Guides</span>
          </button>

          <button
            onClick={onToggleAspectRatio}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              padding: "3px 8px",
              borderRadius: "var(--radius-sm)",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "var(--shadow-xs)",
            }}
            title="Toggle 16:9 Landscape / 9:16 Vertical Reframe"
          >
            {aspectRatio === "16:9" ? <Tv size={12} /> : <Smartphone size={12} />}
            <span>{aspectRatio}</span>
          </button>
        </div>
      </div>

      {/* 2. Main Video Canvas Viewport */}
      <div
        ref={viewportRef}
        className={`canvas-viewport ${aspectRatio === "9:16" ? "canvas-viewport-9-16" : ""}`}
        onMouseMove={handleSplitMouseMove}
        onMouseUp={() => setIsDraggingSplit(false)}
        onMouseLeave={() => setIsDraggingSplit(false)}
        style={{ position: "relative", overflow: "hidden", userSelect: "none" }}
      >
        {stageView === "SPLIT" ? (
          /* DaVinci Resolve Color Page A/B Split Screen Wipe */
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            {/* Left: Original Ungraded Base */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedAsset?.thumbnailUrl || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1400&auto=format&fit=crop&q=80"}
              alt="Ungraded Original"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: aspectRatio === "9:16" ? "cover" : "contain",
                filter: "none",
              }}
            />

            {/* Right: 3D LUT Graded Overlay with Clip-Path */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedAsset?.thumbnailUrl || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1400&auto=format&fit=crop&q=80"}
              alt="Color Graded Output"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: aspectRatio === "9:16" ? "cover" : "contain",
                filter: "contrast(1.18) saturate(1.25) sepia(0.12)",
                clipPath: `polygon(${splitPosition}% 0, 100% 0, 100% 100%, ${splitPosition}% 100%)`,
              }}
            />

            {/* Draggable Divider Line */}
            <div
              onMouseDown={() => setIsDraggingSplit(true)}
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${splitPosition}%`,
                width: "4px",
                background: "var(--accent)",
                cursor: "ew-resize",
                zIndex: 10,
                transform: "translateX(-50%)",
                boxShadow: "0 0 8px rgba(79, 115, 247, 0.8)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "var(--accent)",
                  border: "2px solid white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
                }}
              >
                <div style={{ width: "6px", height: "1px", background: "white" }} />
              </div>
            </div>

            {/* Badges for Split Sides */}
            <span style={{ position: "absolute", top: "10px", left: "10px", fontSize: "10px", background: "rgba(0,0,0,0.7)", color: "white", padding: "2px 6px", borderRadius: "3px", fontWeight: 600, pointerEvents: "none" }}>
              Original (Log/Rec.709)
            </span>
            <span style={{ position: "absolute", top: "10px", right: "10px", fontSize: "10px", background: "rgba(79, 115, 247, 0.85)", color: "white", padding: "2px 6px", borderRadius: "3px", fontWeight: 600, pointerEvents: "none" }}>
              Graded (3D LUT CUBE)
            </span>
          </div>
        ) : (
          /* Normal Program / Source View */
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={
              stageView === "SOURCE" && selectedAsset
                ? selectedAsset.thumbnailUrl
                : "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1400&auto=format&fit=crop&q=80"
            }
            alt="Playback Monitor"
            style={{
              width: "100%",
              height: "100%",
              objectFit: aspectRatio === "9:16" ? "cover" : "contain",
              filter: activeLut ? "contrast(1.15) saturate(1.22) sepia(0.08)" : "none",
            }}
          />
        )}

        {/* 9:16 Reels / TikTok Safe Zone Guide */}
        {aspectRatio === "9:16" && showSafeZone && (
          <div
            style={{
              position: "absolute",
              inset: "16px 12px",
              border: "1px dashed rgba(255, 255, 255, 0.4)",
              pointerEvents: "none",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              paddingBottom: "8px",
            }}
          >
            <span
              style={{
                fontSize: "9px",
                color: "white",
                background: "rgba(0, 0, 0, 0.7)",
                padding: "2px 6px",
                borderRadius: "3px",
              }}
            >
              Shorts / Reels Safe Zone
            </span>
          </div>
        )}

        {/* Realtime Canvas HUD (Timecode & Color Space) */}
        <div
          style={{
            position: "absolute",
            bottom: "8px",
            left: "8px",
            right: "8px",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "10px",
            fontFamily: "monospace",
            color: "rgba(255, 255, 255, 0.9)",
            background: "rgba(0, 0, 0, 0.65)",
            padding: "3px 8px",
            borderRadius: "4px",
            pointerEvents: "none",
            backdropFilter: "blur(4px)",
          }}
        >
          <span style={{ fontWeight: 600 }}>{formatTimecode(currentFrame)}</span>
          <span>{fps} FPS • Rec.709 D65 • Hardware 60Hz</span>
        </div>
      </div>

      {/* 3. DaVinci Resolve Professional Playback Transport Bar */}
      <div className="playback-hud-bar">
        {/* Left: Transport Buttons (Jump Start, Step Back, Play/Pause, Step Forward, Jump End, Loop) */}
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <button
            className="btn-icon-subtle"
            style={{ padding: "5px" }}
            onClick={jumpToStart}
            title="Jump to Start / In Point (Home / Shift+I)"
            aria-label="Jump to Start"
          >
            <SkipBack size={13} style={{ fill: "currentColor" }} />
          </button>

          <button
            className="btn-icon-subtle"
            style={{ padding: "5px" }}
            onClick={() => stepFrame(-1)}
            title="Step Back 1 Frame (Left Arrow / J)"
            aria-label="Step Back 1 Frame"
          >
            <SkipBack size={13} />
          </button>

          {/* Master Play/Pause Button */}
          <button
            onClick={() => onTogglePlay()}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "var(--accent)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(79, 115, 247, 0.4)",
              transition: "transform 0.1s ease",
            }}
            title={isPlaying ? "Pause (Space / K)" : "Play (Space / L)"}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} style={{ marginLeft: "2px" }} />}
          </button>

          <button
            className="btn-icon-subtle"
            style={{ padding: "5px" }}
            onClick={() => stepFrame(1)}
            title="Step Forward 1 Frame (Right Arrow / L)"
            aria-label="Step Forward 1 Frame"
          >
            <SkipForward size={13} />
          </button>

          <button
            className="btn-icon-subtle"
            style={{ padding: "5px" }}
            onClick={jumpToEnd}
            title="Jump to End / Out Point (End / Shift+O)"
            aria-label="Jump to End"
          >
            <SkipForward size={13} style={{ fill: "currentColor" }} />
          </button>

          {/* Loop Toggle */}
          <button
            onClick={() => setIsLooping(!isLooping)}
            className="btn-icon-subtle"
            style={{
              padding: "5px",
              color: isLooping ? "var(--accent)" : "var(--text-secondary)",
              background: isLooping ? "var(--accent-soft)" : "transparent",
              borderRadius: "var(--radius-xs)",
            }}
            title={isLooping ? "Looping: ON (Cmd+L)" : "Looping: OFF (Cmd+L)"}
            aria-label="Loop Playback"
          >
            <Repeat size={13} />
          </button>

          {/* In & Out Point Controls */}
          <div style={{ display: "flex", gap: "2px", marginLeft: "4px", borderLeft: "1px solid var(--border)", paddingLeft: "6px" }}>
            <button
              onClick={() => onSetInPoint?.(currentFrame)}
              className="btn-icon-subtle"
              style={{ padding: "3px 6px", fontSize: "10px", fontWeight: 700, borderRadius: "3px" }}
              title="Mark In Point (I)"
            >
              [ IN
            </button>
            <button
              onClick={() => onSetOutPoint?.(currentFrame)}
              className="btn-icon-subtle"
              style={{ padding: "3px 6px", fontSize: "10px", fontWeight: 700, borderRadius: "3px" }}
              title="Mark Out Point (O)"
            >
              OUT ]
            </button>
          </div>
        </div>

        {/* Center: Frame-accurate Tabular Timecode Display (SMPTE Drop-Frame Standard) */}
        <div className="timecode-chip" style={{ letterSpacing: "0.5px", fontVariantNumeric: "tabular-nums" }}>
          <span>{formatTimecode(currentFrame)}</span>
          <span style={{ color: "var(--text-muted)", margin: "0 4px" }}>/</span>
          <span style={{ color: "var(--text-secondary)" }}>{formatTimecode(totalFrames)}</span>
        </div>

        {/* Right: Audio Volume Slider & Fullscreen Monitor */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="btn-icon-subtle"
              style={{ padding: "4px" }}
              title={isMuted ? "Unmute Monitor Audio" : "Mute Monitor Audio"}
            >
              <Volume2 size={13} style={{ color: isMuted ? "var(--danger)" : "var(--text-secondary)" }} />
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(Number(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              style={{ width: "55px", accentColor: "var(--accent)", cursor: "pointer" }}
              title={`Monitor Volume: ${isMuted ? "0%" : `${volume}%`}`}
            />
          </div>

          <button
            onClick={toggleFullscreen}
            className="btn-icon-subtle"
            style={{ padding: "5px" }}
            title="Toggle Cinema Fullscreen (F)"
            aria-label="Fullscreen Preview"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
