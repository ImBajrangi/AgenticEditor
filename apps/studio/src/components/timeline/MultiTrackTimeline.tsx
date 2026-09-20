"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Scissors,
  MousePointer,
  Volume2,
  VolumeX,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Bookmark,
  Magnet,
  Sparkles,
  Layers,
  ArrowRightLeft,
  ChevronsLeftRight,
  MoveHorizontal,
  FolderPlus,
  Compass,
} from "lucide-react";
import { TimelineIR, TimelineClip } from "@aetheredit/timeline-ir";

export type TimelineEditTool =
  | "SELECT"
  | "RAZOR"
  | "RIPPLE"
  | "ROLL"
  | "SLIP"
  | "SLIDE";

interface TimelineMarker {
  frame: number;
  label: string;
  color: string;
}

const DEFAULT_MARKERS: TimelineMarker[] = [
  { frame: 60, label: "Intro Hook", color: "#3B82F6" },
  { frame: 210, label: "A-Roll Climax", color: "#10B981" },
  { frame: 450, label: "Music Drop", color: "#F59E0B" },
];

interface MultiTrackTimelineProps {
  timeline: TimelineIR;
  currentFrame: number;
  onSeek: (frame: number) => void;
  selectedClipId: string | null;
  onSelectClip: (clip: TimelineClip) => void;
  onSplitClip: (clipId: string, frame: number) => void;
  activeTool: TimelineEditTool;
  setActiveTool: (tool: TimelineEditTool) => void;
  isSnapping: boolean;
  setIsSnapping: (snap: boolean) => void;
  isMagnetic?: boolean;
  setIsMagnetic?: (mag: boolean) => void;
  zoomLevel: number;
  setZoomLevel: (zoom: number) => void;
  onAddMarker?: (frame: number, label: string) => void;
  highlightedClipIds?: string[];
  inPoint?: number | null;
  outPoint?: number | null;
}

export const MultiTrackTimeline: React.FC<MultiTrackTimelineProps> = ({
  timeline,
  currentFrame,
  onSeek,
  selectedClipId,
  onSelectClip,
  onSplitClip,
  activeTool,
  setActiveTool,
  isSnapping,
  setIsSnapping,
  isMagnetic = true,
  setIsMagnetic,
  zoomLevel,
  setZoomLevel,
  onAddMarker,
  highlightedClipIds = [],
  inPoint = null,
  outPoint = null,
}) => {
  const rulerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [soloTracks, setSoloTracks] = useState<Record<string, boolean>>({});
  const [mutedTracks, setMutedTracks] = useState<Record<string, boolean>>({});
  const [lockedTracks, setLockedTracks] = useState<Record<string, boolean>>({});
  const [targetTrackId, setTargetTrackId] = useState<string>("trk_v1_primary");
  const [markers, setMarkers] = useState<TimelineMarker[]>(DEFAULT_MARKERS);
  const [isScrubbingRuler, setIsScrubbingRuler] = useState(false);
  const [hoveredFrame, setHoveredFrame] = useState<number | null>(null);

  const fps = Math.round(timeline.timebase.numerator / timeline.timebase.denominator) || 30;

  let maxFrame = 900;
  timeline.tracks.forEach((t) => {
    t.clips.forEach((c) => {
      const end = c.timelineRange.start + c.timelineRange.duration;
      if (end > maxFrame) maxFrame = end;
    });
  });

  const pixelsPerFrame = 1.3 * zoomLevel;
  const totalTimelineWidth = Math.max(1400, maxFrame * pixelsPerFrame + 300);

  const calculateFrameFromX = (clientX: number): number => {
    if (!rulerRef.current) return 0;
    const rect = rulerRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    let targetFrame = Math.max(0, Math.round(clickX / pixelsPerFrame));

    if (isSnapping) {
      // Snap to nearest clip edge within 6 frames
      for (const track of timeline.tracks) {
        for (const clip of track.clips) {
          const start = clip.timelineRange.start;
          const end = start + clip.timelineRange.duration;
          if (Math.abs(targetFrame - start) <= 6) {
            targetFrame = start;
            break;
          }
          if (Math.abs(targetFrame - end) <= 6) {
            targetFrame = end;
            break;
          }
        }
      }
    }
    return targetFrame;
  };

  const handleRulerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsScrubbingRuler(true);
    const targetFrame = calculateFrameFromX(e.clientX);
    onSeek(targetFrame);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isScrubbingRuler) {
        const targetFrame = calculateFrameFromX(e.clientX);
        onSeek(targetFrame);
      }
    };
    const handleMouseUp = () => {
      if (isScrubbingRuler) setIsScrubbingRuler(false);
    };

    if (isScrubbingRuler) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isScrubbingRuler, pixelsPerFrame, isSnapping, timeline]);

  const handleAddMarker = (frame: number, label?: string) => {
    const newMarker: TimelineMarker = {
      frame,
      label: label || `Marker @ ${frame}`,
      color: "#8B5CF6",
    };
    setMarkers((prev) => [...prev.filter((m) => m.frame !== frame), newMarker]);
    if (onAddMarker) onAddMarker(frame, newMarker.label);
  };

  const handleZoomFit = () => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.clientWidth;
      const neededZoom = (containerWidth - 100) / (maxFrame * 1.3);
      setZoomLevel(Math.max(0.4, Math.min(2.5, parseFloat(neededZoom.toFixed(2)))));
    }
  };

  const handleClipClick = (e: React.MouseEvent, clip: TimelineClip, trackId: string) => {
    e.stopPropagation();
    if (lockedTracks[trackId]) return; // Protected track

    if (activeTool === "RAZOR") {
      const clipStart = clip.timelineRange.start;
      const clipEnd = clipStart + clip.timelineRange.duration;
      let splitAt = currentFrame;

      if (splitAt <= clipStart || splitAt >= clipEnd) {
        splitAt = Math.round(clipStart + clip.timelineRange.duration / 2);
      }
      onSplitClip(clip.id, splitAt);
    } else {
      onSelectClip(clip);
    }
  };

  const toggleSolo = (trackId: string) => {
    setSoloTracks((prev) => ({ ...prev, [trackId]: !prev[trackId] }));
  };

  const toggleMute = (trackId: string) => {
    setMutedTracks((prev) => ({ ...prev, [trackId]: !prev[trackId] }));
  };

  const toggleLock = (trackId: string) => {
    setLockedTracks((prev) => ({ ...prev, [trackId]: !prev[trackId] }));
  };

  return (
    <div className="timeline-bottom-panel" role="region" aria-label="Professional Multi-Track Timeline">
      {/* 1. Professional Timeline Header & Editing Modes Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "38px",
          padding: "0 14px",
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* Left: Professional Toolset (Selection, Razor, Ripple, Roll, Slip, Slide, Snap, Magnetic, Marker) */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <button
            onClick={() => setActiveTool("SELECT")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 7px",
              borderRadius: "var(--radius-sm)",
              border: activeTool === "SELECT" ? "1px solid var(--accent-border)" : "1px solid transparent",
              background: activeTool === "SELECT" ? "var(--accent-soft)" : "transparent",
              color: activeTool === "SELECT" ? "var(--accent)" : "var(--text-secondary)",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
            }}
            title="Selection Tool (V)"
            aria-label="Selection Tool (V)"
          >
            <MousePointer size={13} />
            <span>Select (V)</span>
          </button>

          <button
            onClick={() => setActiveTool("RAZOR")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 7px",
              borderRadius: "var(--radius-sm)",
              border: activeTool === "RAZOR" ? "1px solid var(--accent-border)" : "1px solid transparent",
              background: activeTool === "RAZOR" ? "var(--accent-soft)" : "transparent",
              color: activeTool === "RAZOR" ? "var(--accent)" : "var(--text-secondary)",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
            }}
            title="Razor Blade Tool (C)"
            aria-label="Razor Blade Tool (C)"
          >
            <Scissors size={13} />
            <span>Razor (C)</span>
          </button>

          <button
            onClick={() => setActiveTool("RIPPLE")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 7px",
              borderRadius: "var(--radius-sm)",
              border: activeTool === "RIPPLE" ? "1px solid var(--accent-border)" : "1px solid transparent",
              background: activeTool === "RIPPLE" ? "var(--accent-soft)" : "transparent",
              color: activeTool === "RIPPLE" ? "var(--accent)" : "var(--text-secondary)",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
            }}
            title="Ripple Edit Tool (B)"
            aria-label="Ripple Edit Tool (B)"
          >
            <ChevronsLeftRight size={13} />
            <span>Ripple (B)</span>
          </button>

          <button
            onClick={() => setActiveTool("ROLL")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 7px",
              borderRadius: "var(--radius-sm)",
              border: activeTool === "ROLL" ? "1px solid var(--accent-border)" : "1px solid transparent",
              background: activeTool === "ROLL" ? "var(--accent-soft)" : "transparent",
              color: activeTool === "ROLL" ? "var(--accent)" : "var(--text-secondary)",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
            }}
            title="Roll Edit Tool (N)"
            aria-label="Roll Edit Tool (N)"
          >
            <ArrowRightLeft size={13} />
            <span>Roll (N)</span>
          </button>

          <button
            onClick={() => setActiveTool("SLIP")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 7px",
              borderRadius: "var(--radius-sm)",
              border: activeTool === "SLIP" ? "1px solid var(--accent-border)" : "1px solid transparent",
              background: activeTool === "SLIP" ? "var(--accent-soft)" : "transparent",
              color: activeTool === "SLIP" ? "var(--accent)" : "var(--text-secondary)",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
            }}
            title="Slip Clip Tool (Y)"
            aria-label="Slip Clip Tool (Y)"
          >
            <MoveHorizontal size={13} />
            <span>Slip (Y)</span>
          </button>

          <div className="divider-vert" style={{ height: "16px", margin: "0 4px" }} />

          {/* Snap Mode Toggle (Point #3) */}
          <button
            onClick={() => setIsSnapping(!isSnapping)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 7px",
              borderRadius: "var(--radius-sm)",
              border: isSnapping ? "1px solid var(--accent-border)" : "1px solid transparent",
              background: isSnapping ? "var(--accent-soft)" : "transparent",
              color: isSnapping ? "var(--accent)" : "var(--text-muted)",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
            }}
            title="Snap to Edges & Playhead (S)"
            aria-label="Snap to Edges (S)"
          >
            <Magnet size={13} />
            <span>Snap: {isSnapping ? "ON" : "OFF"}</span>
          </button>

          {/* Magnetic Timeline Toggle (Point #3) */}
          <button
            onClick={() => setIsMagnetic?.(!isMagnetic)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 7px",
              borderRadius: "var(--radius-sm)",
              border: isMagnetic ? "1px solid var(--accent-border)" : "1px solid transparent",
              background: isMagnetic ? "var(--accent-soft)" : "transparent",
              color: isMagnetic ? "var(--accent)" : "var(--text-muted)",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
            }}
            title="Magnetic Ripple Editing (Closes Gaps Automatically)"
            aria-label="Magnetic Timeline"
          >
            <Compass size={13} />
            <span>Magnetic: {isMagnetic ? "ON" : "OFF"}</span>
          </button>

          <button
            onClick={handleAddMarker ? () => handleAddMarker(currentFrame, "Scene Marker") : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 7px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid transparent",
              background: "transparent",
              color: "var(--text-secondary)",
              fontSize: "11px",
              fontWeight: 500,
              cursor: "pointer",
            }}
            title="Add Timeline Marker at Playhead (M)"
            aria-label="Add Marker (M)"
          >
            <Bookmark size={13} />
            <span>Marker (M)</span>
          </button>
        </div>

        {/* Center: Timeline Track Metadata */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "var(--text-secondary)" }}>
          <span>Target: <strong style={{ color: "var(--accent)" }}>{targetTrackId.replace("trk_", "").toUpperCase().slice(0, 2)}</strong></span>
          <span>•</span>
          <span>{timeline.tracks.length} Tracks</span>
          <span>•</span>
          <span>{timeline.tracks.reduce((acc, t) => acc + t.clips.length, 0)} Clips</span>
          {inPoint !== null && outPoint !== null && (
            <>
              <span>•</span>
              <span style={{ color: "var(--accent)", fontWeight: 600, fontFamily: "monospace" }}>
                In/Out: {Math.max(0, (outPoint - inPoint) / fps).toFixed(1)}s
              </span>
            </>
          )}
        </div>

        {/* Right: Zoom Level & Fit Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            onClick={handleZoomFit}
            className="btn-icon-subtle"
            style={{ padding: "3px 6px", fontSize: "10px", fontWeight: 700, borderRadius: "3px", border: "1px solid var(--border)" }}
            title="Fit Entire Timeline in View (Shift+Z)"
          >
            Fit (⇧Z)
          </button>
          <button
            onClick={() => setZoomLevel(Math.max(0.4, parseFloat((zoomLevel - 0.2).toFixed(2))))}
            className="btn-icon-subtle"
            style={{ padding: "4px 6px" }}
            title="Zoom Out (Cmd -)"
            aria-label="Zoom Out"
          >
            <ZoomOut size={13} />
          </button>
          <span style={{ fontSize: "11px", fontFamily: "monospace", color: "var(--text-muted)", minWidth: "32px", textAlign: "center" }}>
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel(Math.min(3.0, parseFloat((zoomLevel + 0.2).toFixed(2))))}
            className="btn-icon-subtle"
            style={{ padding: "4px 6px" }}
            title="Zoom In (Cmd +)"
            aria-label="Zoom In"
          >
            <ZoomIn size={13} />
          </button>
        </div>
      </div>

      {/* 2. Track Headers Column + Scrollable Timeline Lanes */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Independent Track Headers Column */}
        <div
          style={{
            width: "210px",
            background: "var(--bg-surface)",
            borderRight: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            zIndex: 10,
          }}
        >
          <div style={{ height: "26px", borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)", padding: "0 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Tracks
            </span>
            <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>M / S / 🔒</span>
          </div>
          {timeline.tracks.map((track) => {
            const isTarget = targetTrackId === track.id;
            const isSolo = !!soloTracks[track.id];
            const isMuted = !!mutedTracks[track.id];
            const isLocked = !!lockedTracks[track.id];

            return (
              <div
                key={track.id}
                onClick={() => setTargetTrackId(track.id)}
                style={{
                  height: "48px",
                  padding: "0 8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid var(--border)",
                  background: isTarget ? "var(--accent-soft)" : "transparent",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: isTarget ? "var(--accent)" : "var(--text-primary)",
                      fontFamily: "monospace",
                    }}
                  >
                    {track.id.replace("trk_", "").toUpperCase().slice(0, 2)}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      color: isLocked ? "var(--text-muted)" : "var(--text-secondary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "75px",
                    }}
                  >
                    {track.name}
                  </span>
                </div>

                {/* Track Mute, Solo, Lock Controls */}
                <div style={{ display: "flex", alignItems: "center", gap: "3px" }} onClick={(e) => e.stopPropagation()}>
                  {/* Lock Toggle */}
                  <button
                    onClick={() => toggleLock(track.id)}
                    className="btn-icon-subtle"
                    style={{ padding: "2px 4px", color: isLocked ? "var(--warning)" : "var(--text-muted)" }}
                    title={isLocked ? "Unlock Track" : "Lock Track (Protect from Edits)"}
                  >
                    {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                  </button>

                  {/* Solo Toggle */}
                  <button
                    onClick={() => toggleSolo(track.id)}
                    style={{
                      padding: "2px 4px",
                      fontSize: "9px",
                      fontWeight: 700,
                      borderRadius: "3px",
                      border: isSolo ? "1px solid var(--warning)" : "1px solid var(--border)",
                      background: isSolo ? "rgba(245, 158, 11, 0.2)" : "transparent",
                      color: isSolo ? "var(--warning)" : "var(--text-muted)",
                      cursor: "pointer",
                    }}
                    title={`Solo Track (${track.name}) - Shortcut: ⇧S`}
                  >
                    S
                  </button>

                  {/* Mute Toggle */}
                  <button
                    onClick={() => toggleMute(track.id)}
                    className="btn-icon-subtle"
                    style={{ padding: "2px 4px" }}
                    title={isMuted ? "Unmute Track Audio/Video" : "Mute Track Audio/Video"}
                  >
                    {isMuted ? <VolumeX size={12} style={{ color: "var(--danger)" }} /> : <Volume2 size={12} style={{ color: "var(--text-muted)" }} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Scrollable Tracks & Timeline Lanes */}
        <div ref={scrollContainerRef} style={{ flex: 1, overflowX: "auto", overflowY: "auto", position: "relative" }}>
          <div style={{ width: `${totalTimelineWidth}px`, position: "relative", minHeight: "100%" }}>
            {/* Timecode Ruler */}
            <div
              ref={rulerRef}
              onMouseDown={handleRulerMouseDown}
              style={{
                height: "26px",
                background: "var(--bg-subtle)",
                borderBottom: "1px solid var(--border)",
                position: "relative",
                cursor: "pointer",
              }}
            >
              {/* In/Out Selected Shaded Region on Ruler */}
              {inPoint !== null && outPoint !== null && outPoint > inPoint && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: `${inPoint * pixelsPerFrame}px`,
                    width: `${(outPoint - inPoint) * pixelsPerFrame}px`,
                    background: "rgba(79, 115, 247, 0.18)",
                    borderLeft: "2px solid var(--accent)",
                    borderRight: "2px solid var(--accent)",
                    pointerEvents: "none",
                    zIndex: 2,
                  }}
                >
                  <span style={{ position: "absolute", top: "2px", left: "4px", fontSize: "8px", fontWeight: 700, color: "var(--accent)" }}>[ IN</span>
                  <span style={{ position: "absolute", top: "2px", right: "4px", fontSize: "8px", fontWeight: 700, color: "var(--accent)" }}>OUT ]</span>
                </div>
              )}

              {/* Timecode Ticks */}
              {Array.from({ length: Math.ceil(maxFrame / 30) + 5 }).map((_, i) => {
                const f = i * 30;
                const left = f * pixelsPerFrame;
                const totalSec = Math.floor(f / fps);
                const mm = Math.floor(totalSec / 60);
                const ss = totalSec % 60;
                const label = `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;

                return (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: `${left}px`,
                      top: 0,
                      bottom: 0,
                      borderLeft: "1px solid var(--border)",
                      paddingLeft: "4px",
                      fontSize: "9px",
                      fontFamily: "monospace",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      userSelect: "none",
                    }}
                  >
                    {label}
                  </div>
                );
              })}

              {/* Visual Marker Pins on Ruler */}
              {markers.map((marker, idx) => (
                <div
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeek(marker.frame);
                  }}
                  style={{
                    position: "absolute",
                    left: `${marker.frame * pixelsPerFrame}px`,
                    top: 0,
                    bottom: 0,
                    width: "12px",
                    transform: "translateX(-50%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    cursor: "pointer",
                    zIndex: 25,
                  }}
                  title={`${marker.label} (Frame ${marker.frame})`}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      background: marker.color,
                      clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                      marginTop: "2px",
                    }}
                  />
                  <div style={{ width: "1px", flex: 1, background: marker.color, opacity: 0.7 }} />
                </div>
              ))}
            </div>

            {/* Playhead Vertical Red Needle Line */}
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${currentFrame * pixelsPerFrame}px`,
                width: "2px",
                background: "var(--danger)",
                zIndex: 30,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "-4px",
                  width: "10px",
                  height: "10px",
                  background: "var(--danger)",
                  clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                }}
              />
            </div>

            {/* Multi-Track Clip Lanes */}
            {timeline.tracks.map((track) => {
              const isTrackMuted = !!mutedTracks[track.id];
              const isTrackLocked = !!lockedTracks[track.id];
              const hasAnySolo = Object.values(soloTracks).some(Boolean);
              const isTrackSoloed = !!soloTracks[track.id];
              const isTrackDimmed = isTrackMuted || (hasAnySolo && !isTrackSoloed);

              return (
                <div
                  key={track.id}
                  style={{
                    height: "48px",
                    borderBottom: "1px solid var(--border)",
                    position: "relative",
                    background: isTrackLocked
                      ? "repeating-linear-gradient(45deg, rgba(0,0,0,0.03), rgba(0,0,0,0.03) 10px, transparent 10px, transparent 20px)"
                      : track.type === "AUDIO"
                      ? "rgba(16, 185, 129, 0.02)"
                      : "transparent",
                    opacity: isTrackDimmed ? 0.38 : 1.0,
                    transition: "opacity 0.15s ease",
                  }}
                >
                  {track.clips.map((clip) => {
                    const left = clip.timelineRange.start * pixelsPerFrame;
                    const width = clip.timelineRange.duration * pixelsPerFrame;
                    const isSelected = selectedClipId === clip.id;
                    const isAiHighlighted = highlightedClipIds.includes(clip.id);
                    const isAudio = track.type === "AUDIO";
                    const isNarrow = width < 45;

                    return (
                      <div
                        key={clip.id}
                        onClick={(e) => handleClipClick(e, clip, track.id)}
                        style={{
                          position: "absolute",
                          left: `${left}px`,
                          width: `${Math.max(18, width)}px`,
                          top: "3px",
                          bottom: "3px",
                          borderRadius: "var(--radius-sm)",
                          background: isAudio ? "#10B981" : isSelected ? "var(--accent)" : "#3B82F6",
                          color: "white",
                          padding: isNarrow ? "2px 4px" : "3px 6px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          cursor: isTrackLocked ? "not-allowed" : activeTool === "RAZOR" ? "crosshair" : "pointer",
                          boxShadow: isAiHighlighted
                            ? "0 0 0 2px #EC4899, 0 0 12px rgba(236, 72, 153, 0.6)"
                            : isSelected
                            ? "0 0 0 2px white, 0 0 0 3px var(--accent)"
                            : "var(--shadow-xs)",
                          userSelect: "none",
                          overflow: "hidden",
                          zIndex: isSelected ? 20 : isAiHighlighted ? 19 : 5,
                          transition: "box-shadow 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "3px", minWidth: 0 }}>
                          <span style={{ fontSize: isNarrow ? "10px" : "11px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0, lineHeight: 1.2 }}>
                            {clip.name}
                          </span>
                          {isAiHighlighted && (
                            <span style={{ fontSize: "7px", background: "#EC4899", color: "white", padding: "1px 3px", borderRadius: "2px", fontWeight: 700, flexShrink: 0, lineHeight: 1 }}>
                              AI AFFECTED
                            </span>
                          )}
                          {clip.effects.length > 0 && !isAiHighlighted && (
                            <span style={{ fontSize: "8px", background: "rgba(0,0,0,0.3)", padding: "1px 3px", borderRadius: "2px", fontWeight: 600, flexShrink: 0, lineHeight: 1 }}>
                              FX
                            </span>
                          )}
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", opacity: 0.85, fontFamily: "monospace", lineHeight: 1 }}>
                          <span>{(clip.timelineRange.duration / 30).toFixed(1)}s</span>
                          {clip.speed !== 1.0 && !isNarrow && <span>{clip.speed}x</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
