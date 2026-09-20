"use client";

import React, { useState, useRef } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Volume2,
  VolumeX,
  Maximize2,
  Smartphone,
  Tv,
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
  const [splitPosition, setSplitPosition] = useState(50);
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        background: "var(--bg-dark-stage)",
        padding: "10px 14px",
        overflow: "hidden",
        justifyContent: "space-between",
      }}
      role="region"
      aria-label="Playback Stage Monitor"
    >
      {/* 1. Top Preview Controls Bar */}
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "8px",
        }}
      >
        {/* Left: View Modes (Program, Source, A/B Split Comparison) */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              display: "flex",
              background: "rgba(255, 255, 255, 0.05)",
              padding: "2px",
              borderRadius: "4px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <button
              onClick={() => setStageView("PROGRAM")}
              style={{
                padding: "2px 8px",
                border: "none",
                borderRadius: "3px",
                fontSize: "11px",
                fontWeight: 600,
                background: stageView === "PROGRAM" ? "rgba(99, 102, 241, 0.25)" : "transparent",
                color: stageView === "PROGRAM" ? "#A5B4FC" : "#94A3B8",
                cursor: "pointer",
                transition: "all 0.12s ease",
              }}
              title="Program Monitor"
            >
              Program
            </button>
            <button
              onClick={() => setStageView("SOURCE")}
              style={{
                padding: "2px 8px",
                border: "none",
                borderRadius: "3px",
                fontSize: "11px",
                fontWeight: 600,
                background: stageView === "SOURCE" ? "rgba(99, 102, 241, 0.25)" : "transparent",
                color: stageView === "SOURCE" ? "#A5B4FC" : "#94A3B8",
                cursor: "pointer",
                transition: "all 0.12s ease",
              }}
              title="Source Media"
            >
              Source
            </button>
            <button
              onClick={() => setStageView("SPLIT")}
              style={{
                padding: "2px 8px",
                border: "none",
                borderRadius: "3px",
                fontSize: "11px",
                fontWeight: 600,
                background: stageView === "SPLIT" ? "rgba(99, 102, 241, 0.25)" : "transparent",
                color: stageView === "SPLIT" ? "#A5B4FC" : "#94A3B8",
                cursor: "pointer",
                transition: "all 0.12s ease",
              }}
              title="A/B Split Screen"
            >
              A/B Split
            </button>
          </div>

          {activeClipTitle && (
            <span style={{ fontSize: "11px", color: "#94A3B8", marginLeft: "4px" }}>
              Clip: <strong style={{ color: "#F8FAFC" }}>{activeClipTitle}</strong>
            </span>
          )}
        </div>

        {/* Right: Aspect Ratio & Safe Zone Guides */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            onClick={() => setShowSafeZone(!showSafeZone)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "3px",
              background: showSafeZone ? "rgba(99, 102, 241, 0.2)" : "rgba(255, 255, 255, 0.05)",
              border: showSafeZone ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid rgba(255, 255, 255, 0.08)",
              color: showSafeZone ? "#A5B4FC" : "#94A3B8",
              padding: "3px 8px",
              borderRadius: "4px",
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
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#F8FAFC",
              padding: "3px 8px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
            }}
            title="Toggle Format"
          >
            {aspectRatio === "16:9" ? <Tv size={12} /> : <Smartphone size={12} />}
            <span>{aspectRatio}</span>
          </button>
        </div>
      </div>

      {/* 2. Main Video Canvas Viewport */}
      <div
        ref={viewportRef}
        onMouseMove={handleSplitMouseMove}
        onMouseUp={() => setIsDraggingSplit(false)}
        onMouseLeave={() => setIsDraggingSplit(false)}
        style={{
          flex: 1,
          width: "100%",
          maxHeight: "calc(100% - 54px)",
          position: "relative",
          borderRadius: "8px",
          overflow: "hidden",
          userSelect: "none",
          background: "#000000",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {stageView === "SPLIT" ? (
          /* A/B Split Screen Wipe */
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
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

            {/* Divider Line */}
            <div
              onMouseDown={() => setIsDraggingSplit(true)}
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${splitPosition}%`,
                width: "3px",
                background: "#6366F1",
                cursor: "ew-resize",
                zIndex: 10,
                transform: "translateX(-50%)",
                boxShadow: "0 0 10px rgba(99, 102, 241, 0.8)",
              }}
            />

            {/* Badges */}
            <span style={{ position: "absolute", top: "8px", left: "8px", fontSize: "9px", background: "rgba(0,0,0,0.75)", color: "white", padding: "2px 6px", borderRadius: "3px", fontWeight: 600 }}>
              Original
            </span>
            <span style={{ position: "absolute", top: "8px", right: "8px", fontSize: "9px", background: "rgba(99, 102, 241, 0.85)", color: "white", padding: "2px 6px", borderRadius: "3px", fontWeight: 600 }}>
              Graded (3D LUT)
            </span>
          </div>
        ) : (
          /* Normal Monitor View */
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

        {/* 9:16 Guide */}
        {aspectRatio === "9:16" && showSafeZone && (
          <div
            style={{
              position: "absolute",
              inset: "14px 10px",
              border: "1px dashed rgba(255, 255, 255, 0.35)",
              pointerEvents: "none",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              paddingBottom: "6px",
            }}
          >
            <span style={{ fontSize: "9px", color: "white", background: "rgba(0, 0, 0, 0.7)", padding: "1px 5px", borderRadius: "3px" }}>
              Reels Safe Zone
            </span>
          </div>
        )}

        {/* Clean Monitor HUD Timecode */}
        <div
          style={{
            position: "absolute",
            bottom: "8px",
            left: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "10px",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
            color: "#FFFFFF",
            background: "rgba(0, 0, 0, 0.7)",
            padding: "2px 8px",
            borderRadius: "4px",
            backdropFilter: "blur(4px)",
            pointerEvents: "none",
          }}
        >
          <span style={{ fontWeight: 700 }}>{formatTimecode(currentFrame)}</span>
          <span style={{ color: "#94A3B8" }}>• {fps} FPS</span>
        </div>
      </div>

      {/* 3. Sleek Dark Obsidian Transport Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          marginTop: "8px",
          background: "rgba(18, 21, 30, 0.8)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "6px",
          padding: "5px 12px",
        }}
      >
        {/* Left: J-K-L Shuttle & Stepping */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <button
            onClick={jumpToStart}
            style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer", padding: "4px" }}
            title="Jump to Start (Home)"
          >
            <SkipBack size={13} />
          </button>
          <button
            onClick={() => stepFrame(-1)}
            style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer", padding: "4px", fontSize: "11px", fontWeight: 700 }}
            title="Step Back 1 Frame (←)"
          >
            -1f
          </button>

          {/* Big Play / Pause Button */}
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
              margin: "0 2px",
            }}
            title={isPlaying ? "Pause (Space / K)" : "Play (Space / L)"}
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} style={{ marginLeft: "1px" }} />}
          </button>

          <button
            onClick={() => stepFrame(1)}
            style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer", padding: "4px", fontSize: "11px", fontWeight: 700 }}
            title="Step Forward 1 Frame (→)"
          >
            +1f
          </button>
          <button
            onClick={jumpToEnd}
            style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer", padding: "4px" }}
            title="Jump to End (End)"
          >
            <SkipForward size={13} />
          </button>
        </div>

        {/* Center: In / Out Markers */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            onClick={() => onSetInPoint && onSetInPoint(currentFrame)}
            style={{
              background: inPoint !== null ? "rgba(99, 102, 241, 0.2)" : "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: inPoint !== null ? "#A5B4FC" : "#94A3B8",
              padding: "2px 6px",
              borderRadius: "3px",
              fontSize: "10px",
              fontWeight: 600,
              cursor: "pointer",
            }}
            title="Set In Point (I)"
          >
            [ IN
          </button>
          <button
            onClick={() => onSetOutPoint && onSetOutPoint(currentFrame)}
            style={{
              background: outPoint !== null ? "rgba(99, 102, 241, 0.2)" : "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: outPoint !== null ? "#A5B4FC" : "#94A3B8",
              padding: "2px 6px",
              borderRadius: "3px",
              fontSize: "10px",
              fontWeight: 600,
              cursor: "pointer",
            }}
            title="Set Out Point (O)"
          >
            OUT ]
          </button>
        </div>

        {/* Right: Timecode Display & Fullscreen */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
              fontSize: "11px",
              fontWeight: 600,
              color: "#F8FAFC",
              background: "rgba(11, 14, 21, 0.9)",
              padding: "3px 8px",
              borderRadius: "4px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            {formatTimecode(currentFrame)} / {formatTimecode(totalFrames)}
          </div>

          <button
            onClick={toggleFullscreen}
            style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer", padding: "2px" }}
            title="Toggle Fullscreen"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
