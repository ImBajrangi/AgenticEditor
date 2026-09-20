"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  SplitSquareVertical,
  Music,
  Film,
  Monitor,
} from "lucide-react";
import { TimelineIR, TimelineClip } from "@aetheredit/timeline-ir";
import { MediaAsset } from "@/lib/sample-data";

export type PreviewDisplayMode =
  | "PROGRAM"
  | "SOURCE"
  | "SIDE_BY_SIDE"
  | "BEFORE_AFTER"
  | "AI_PREVIEW";

interface PreviewStageProps {
  timeline: TimelineIR;
  currentFrame: number;
  totalFrames: number;
  fps: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (frame: number) => void;
  aspectRatio: "16:9" | "9:16" | "1:1";
  selectedAsset: MediaAsset | null;
  selectedClip: TimelineClip | null;
  assets?: MediaAsset[];
}

export const PreviewStage: React.FC<PreviewStageProps> = ({
  timeline,
  currentFrame,
  totalFrames,
  fps,
  isPlaying,
  onTogglePlay,
  onSeek,
  aspectRatio,
  selectedAsset,
  selectedClip,
  assets = [],
}) => {
  const [displayMode, setDisplayMode] = useState<PreviewDisplayMode>("PROGRAM");
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [splitPos, setSplitPos] = useState(50);
  const [showSafeGuides, setShowSafeGuides] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Format Timecode as HH:MM:SS:FF
  const formatTimecode = (frames: number) => {
    const totalSec = Math.floor(frames / fps);
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const remFrames = frames % fps;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}:${String(remFrames).padStart(2, "0")}`;
  };

  // Find visible video tracks in layering priority (top video track has precedence)
  const videoTracks = timeline.tracks.filter((t) => t.type === "VIDEO" || t.type === "GRAPHICS");
  const hasAnySolo = videoTracks.some((t) => t.solo);
  let activeClip: TimelineClip | null = null;
  let activeTrackName: string = "V1";
  let isVideoOutputMuted = false;

  for (let i = videoTracks.length - 1; i >= 0; i--) {
    const track = videoTracks[i];
    if (hasAnySolo && !track.solo) continue;
    if (track.muted) {
      isVideoOutputMuted = true;
      continue;
    }
    const hit = track.clips.find(
      (c) => currentFrame >= c.timelineRange.start && currentFrame < c.timelineRange.start + c.timelineRange.duration
    );
    if (hit) {
      activeClip = hit;
      activeTrackName = track.name;
      isVideoOutputMuted = false;
      break;
    }
  }

  // Fallback: If no clip directly under playhead on video track, check selected clip if within range
  if (!activeClip && !isVideoOutputMuted && selectedClip) {
    const parentTrack = timeline.tracks.find((t) => t.clips.some((c) => c.id === selectedClip.id));
    if (parentTrack && !parentTrack.muted && (!hasAnySolo || parentTrack.solo)) {
      if (
        currentFrame >= selectedClip.timelineRange.start &&
        currentFrame < selectedClip.timelineRange.start + selectedClip.timelineRange.duration
      ) {
        activeClip = selectedClip;
        activeTrackName = parentTrack.name;
      }
    }
  }

  // Locate the underlying media asset for the active clip or selected asset
  const currentAsset: MediaAsset | null = useMemo(() => {
    if (displayMode === "SOURCE") {
      return selectedAsset || (activeClip ? assets.find((a) => a.id === activeClip?.assetId) || null : null);
    }
    if (activeClip) {
      return (
        assets.find((a) => a.id === activeClip?.assetId) ||
        (selectedAsset?.id === activeClip.assetId ? selectedAsset : null)
      );
    }
    return null;
  }, [displayMode, selectedAsset, activeClip, assets]);

  // Determine media URL and type
  const mediaUrl = currentAsset?.thumbnailUrl || "";
  const isVideoSource = Boolean(
    mediaUrl &&
      (currentAsset?.type === "VIDEO" ||
        mediaUrl.startsWith("blob:") ||
        /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(mediaUrl))
  );

  const isImageSource = Boolean(
    mediaUrl &&
      !isVideoSource &&
      (currentAsset?.type === "IMAGE" ||
        mediaUrl.startsWith("http") ||
        mediaUrl.startsWith("data:") ||
        mediaUrl.startsWith("blob:"))
  );

  const isAudioSource = currentAsset?.type === "AUDIO";

  // Calculate target playback time in seconds for scrubbing
  const targetSec = useMemo(() => {
    if (displayMode === "SOURCE") {
      return currentFrame / fps;
    }
    if (activeClip) {
      const clipStart = activeClip.timelineRange.start;
      const sourceIn = activeClip.sourceRange?.in || 0;
      const speed = activeClip.speed || 1.0;
      const relFrame = Math.max(0, currentFrame - clipStart);
      return (sourceIn + relFrame * speed) / fps;
    }
    return currentFrame / fps;
  }, [displayMode, currentFrame, fps, activeClip]);

  // Seek video only when paused / scrubbing to avoid interruption & lag during playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideoSource || isPlaying) return;
    if (Number.isFinite(targetSec)) {
      if (Math.abs(video.currentTime - targetSec) > 0.03) {
        video.currentTime = Math.max(0, targetSec);
      }
    }
  }, [targetSec, isPlaying, isVideoSource]);

  // Play / Pause control
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideoSource) return;

    video.volume = isMuted ? 0 : volume;

    if (isPlaying && !isVideoOutputMuted) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } else {
      video.pause();
    }
  }, [isPlaying, isMuted, volume, isVideoOutputMuted, isVideoSource]);

  // Master Clock sync: Video advances playhead smoothly without periodic lag
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideoSource || !isPlaying) return;

    let animId: number;
    const sync = () => {
      if (video && !video.paused && !video.ended) {
        const currentVideoTime = video.currentTime;
        const sourceIn = activeClip?.sourceRange?.in || 0;
        const clipStart = activeClip?.timelineRange?.start || 0;
        const speed = activeClip?.speed || 1.0;
        const calculatedFrame = Math.round(clipStart + ((currentVideoTime * fps - sourceIn) / speed));
        if (Number.isFinite(calculatedFrame) && calculatedFrame >= 0 && Math.abs(calculatedFrame - currentFrame) >= 1) {
          onSeek(calculatedFrame);
        }
      }
      if (isPlaying) {
        animId = requestAnimationFrame(sync);
      }
    };

    animId = requestAnimationFrame(sync);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isVideoSource, activeClip, fps, onSeek, currentFrame]);

  // Transform styling from clip IR
  const transformStyle: React.CSSProperties = useMemo(() => {
    if (!activeClip?.transform) return {};
    const { position, scale, rotation, opacity } = activeClip.transform;
    return {
      transform: `translate(${position?.x || 0}px, ${position?.y || 0}px) scale(${scale?.x ?? 1}, ${scale?.y ?? 1}) rotate(${rotation || 0}deg)`,
      opacity: opacity ?? 1.0,
      transition: isPlaying ? "none" : "transform 0.08s ease-out",
    };
  }, [activeClip?.transform, isPlaying]);

  // Dimensions based on aspect ratio
  const getCanvasDimensions = () => {
    switch (aspectRatio) {
      case "9:16":
        return { width: "260px", height: "462px", ratio: "9 / 16" };
      case "1:1":
        return { width: "360px", height: "360px", ratio: "1 / 1" };
      default:
        return { width: "100%", maxWidth: "680px", aspectRatio: "16 / 9" };
    }
  };

  const canvasStyle = getCanvasDimensions();

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        background: "#0E1015",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 1. Preview Stage Header & Mode Switcher */}
      <div
        style={{
          height: "36px",
          padding: "0 14px",
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {(["PROGRAM", "SOURCE", "SIDE_BY_SIDE", "BEFORE_AFTER", "AI_PREVIEW"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setDisplayMode(m)}
              style={{
                background: displayMode === m ? "var(--accent-soft)" : "transparent",
                color: displayMode === m ? "var(--accent)" : "var(--text-secondary)",
                border: displayMode === m ? "1px solid var(--accent-border)" : "1px solid transparent",
                borderRadius: "var(--radius-sm)",
                padding: "3px 8px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.12s ease",
              }}
            >
              {m.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "11px", color: "var(--text-secondary)" }}>
          <button
            onClick={() => setShowSafeGuides(!showSafeGuides)}
            style={{
              background: showSafeGuides ? "var(--accent-soft)" : "transparent",
              color: showSafeGuides ? "var(--accent)" : "var(--text-muted)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              padding: "2px 6px",
              fontSize: "10px",
              cursor: "pointer",
              fontWeight: 600,
            }}
            title="Toggle Safe Margins & Crosshair"
          >
            Guides
          </button>
          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{aspectRatio}</span>
          <span>•</span>
          <span>{fps} fps</span>
          <span>•</span>
          <span>Rec.709</span>
        </div>
      </div>

      {/* 2. Centered Video Canvas Surface */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          position: "relative",
          overflow: "hidden",
          background: "radial-gradient(ellipse at center, #151922 0%, #0B0D12 100%)",
        }}
      >
        <div
          style={{
            ...canvasStyle,
            background: "#000000",
            borderRadius: "var(--radius-sm)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* Safe Margins Overlay (Action Safe 90% and Title Safe 80%) */}
          {showSafeGuides && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                zIndex: 25,
              }}
            >
              {/* 90% Action Safe */}
              <div
                style={{
                  position: "absolute",
                  inset: "5%",
                  border: "1px dashed rgba(255, 255, 255, 0.25)",
                }}
              />
              {/* 80% Title Safe */}
              <div
                style={{
                  position: "absolute",
                  inset: "10%",
                  border: "1px dashed rgba(79, 115, 247, 0.4)",
                }}
              />
              {/* Center Crosshair */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: "16px",
                  height: "1px",
                  background: "rgba(255,255,255,0.4)",
                  transform: "translate(-50%, -50%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: "1px",
                  height: "16px",
                  background: "rgba(255,255,255,0.4)",
                  transform: "translate(-50%, -50%)",
                }}
              />
            </div>
          )}

          {/* REAL MEDIA RENDERING LAYER */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              ...transformStyle,
            }}
          >
            {/* Always keep the video element mounted for flicker-free playback */}
            {mediaUrl && (
              <video
                ref={videoRef}
                src={isVideoSource ? mediaUrl : undefined}
                playsInline
                preload="auto"
                muted={isMuted || volume === 0 || isVideoOutputMuted}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: isVideoSource && !isVideoOutputMuted ? "block" : "none",
                }}
              />
            )}

            {/* Real Image Render */}
            {isImageSource && mediaUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl}
                alt={activeClip?.name || currentAsset?.title || "Preview"}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: isVideoOutputMuted ? "none" : "block",
                }}
              />
            )}

            {/* Audio Waveform Spectrum */}
            {isAudioSource && !isVideoSource && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                  color: "var(--accent)",
                  width: "80%",
                }}
              >
                <Music size={36} style={{ opacity: 0.9 }} />
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF" }}>
                  {activeClip?.name || currentAsset?.title || "Audio Track"}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "3px", height: "40px" }}>
                  {Array.from({ length: 28 }).map((_, idx) => {
                    const barHeight = isPlaying
                      ? Math.round(Math.max(6, Math.sin((currentFrame + idx * 4) * 0.2) * 20 + 20))
                      : 8 + (idx % 5) * 4;
                    return (
                      <div
                        key={idx}
                        style={{
                          width: "4px",
                          height: `${barHeight}px`,
                          background: "var(--accent)",
                          borderRadius: "2px",
                          opacity: 0.85,
                          transition: "height 0.05s ease",
                        }}
                      />
                    );
                  })}
                </div>
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", fontFamily: "monospace" }}>
                  Stereo 48kHz • -14.2 LUFS Target
                </span>
              </div>
            )}

            {/* Generator/Title Clip fallback */}
            {!isVideoSource && !isImageSource && !isAudioSource && activeClip && (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(135deg, #182234 0%, #0F141E 100%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "24px",
                  gap: "10px",
                }}
              >
                <Film size={32} style={{ color: "var(--accent)" }} />
                <div style={{ textAlign: "center" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF" }}>
                    {activeClip?.name || "Timeline Clip"}
                  </h3>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>
                    Track: {activeTrackName} • Range: {activeClip?.timelineRange.start} -{" "}
                    {(activeClip?.timelineRange.start || 0) + (activeClip?.timelineRange.duration || 0)} frames
                  </p>
                </div>
              </div>
            )}

            {/* Idle Monitor (No Clip at Playhead) */}
            {!activeClip && !currentAsset && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, #090B10 0%, #050608 100%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent)",
                  }}
                >
                  <Monitor size={20} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.5px" }}>
                    {displayMode === "SOURCE" ? "SOURCE MONITOR READY" : "PROGRAM MONITOR"}
                  </span>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
                    {displayMode === "SOURCE"
                      ? "Select an asset from the media pool to inspect"
                      : "No clip active at current playhead"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Top Left: Real Active Clip / Track Badge Overlay */}
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              zIndex: 30,
            }}
          >
            <span
              style={{
                fontSize: "11px",
                background: isVideoOutputMuted
                  ? "rgba(220, 38, 38, 0.85)"
                  : activeClip
                  ? "rgba(15, 23, 42, 0.75)"
                  : "rgba(0,0,0,0.6)",
                backdropFilter: "blur(6px)",
                color: "#FFFFFF",
                padding: "3px 8px",
                borderRadius: "4px",
                fontWeight: 600,
                border: "1px solid rgba(255,255,255,0.1)",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              {isVideoOutputMuted ? (
                "Video Track Muted"
              ) : activeClip ? (
                <>
                  <span style={{ color: "var(--accent)" }}>[{activeTrackName.split(":")[0]}]</span>
                  <span>{activeClip.name}</span>
                </>
              ) : displayMode === "SOURCE" && selectedAsset ? (
                <>
                  <span style={{ color: "var(--accent)" }}>[SOURCE]</span>
                  <span>{selectedAsset.title}</span>
                </>
              ) : (
                "Master Timeline"
              )}
            </span>

            {activeClip?.speed && activeClip.speed !== 1.0 && (
              <span
                style={{
                  fontSize: "10px",
                  background: "rgba(79, 115, 247, 0.85)",
                  color: "#FFFFFF",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  fontWeight: 700,
                }}
              >
                {activeClip.speed}x
              </span>
            )}
          </div>

          {/* Top Right: Real Resolution & Format Badge */}
          <div
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              zIndex: 30,
            }}
          >
            <span
              style={{
                fontSize: "9px",
                background: "rgba(0, 0, 0, 0.65)",
                backdropFilter: "blur(6px)",
                color: "rgba(255,255,255,0.8)",
                padding: "3px 7px",
                borderRadius: "4px",
                border: "1px solid rgba(255,255,255,0.08)",
                fontWeight: 600,
                fontFamily: "monospace",
              }}
            >
              {currentAsset?.resolution || (aspectRatio === "9:16" ? "1080x1920" : "1920x1080")} • {fps} FPS
            </span>
          </div>

          {/* Split Comparison Line in BEFORE_AFTER mode */}
          {displayMode === "BEFORE_AFTER" && (
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${splitPos}%`,
                width: "2px",
                background: "#FFFFFF",
                boxShadow: "0 0 8px rgba(0,0,0,0.8)",
                zIndex: 40,
              }}
            >
              <div
                onMouseDown={(e) => {
                  const handleMove = (ev: MouseEvent) => {
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (rect) {
                      const next = Math.max(5, Math.min(95, ((ev.clientX - rect.left) / rect.width) * 100));
                      setSplitPos(next);
                    }
                  };
                  const handleUp = () => {
                    window.removeEventListener("mousemove", handleMove);
                    window.removeEventListener("mouseup", handleUp);
                  };
                  window.addEventListener("mousemove", handleMove);
                  window.addEventListener("mouseup", handleUp);
                }}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "-12px",
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: "#FFFFFF",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "ew-resize",
                }}
              >
                <SplitSquareVertical size={12} style={{ color: "#202124" }} />
              </div>
            </div>
          )}

          {/* Bottom Right: Playhead Timecode overlay */}
          <div
            style={{
              position: "absolute",
              bottom: "8px",
              right: "8px",
              zIndex: 30,
            }}
          >
            <span
              style={{
                fontSize: "10px",
                background: "rgba(0,0,0,0.65)",
                backdropFilter: "blur(6px)",
                color: "rgba(255,255,255,0.75)",
                padding: "2px 6px",
                borderRadius: "3px",
                fontFamily: "monospace",
                fontWeight: 600,
              }}
            >
              {formatTimecode(currentFrame)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Transport Control Bar */}
      <div
        style={{
          height: "46px",
          background: "var(--bg-surface)",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          zIndex: 10,
        }}
      >
        {/* Left: Frame-accurate tabular timecode */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            className="tabular-nums"
            style={{
              fontFamily: "monospace",
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--accent)",
              background: "var(--accent-soft)",
              padding: "3px 8px",
              borderRadius: "var(--radius-sm)",
            }}
          >
            {formatTimecode(currentFrame)}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace" }}>
            / {formatTimecode(totalFrames)}
          </span>
        </div>

        {/* Center: Transport Controls (Play/Pause, Step, Loop) */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            onClick={() => onSeek(Math.max(0, currentFrame - 1))}
            className="btn-icon-subtle"
            title="Step Back 1 Frame (←)"
          >
            <SkipBack size={15} />
          </button>

          <button
            onClick={onTogglePlay}
            className="export-primary-btn"
            style={{
              width: "32px",
              height: "32px",
              padding: 0,
              borderRadius: "50%",
              justifyContent: "center",
            }}
            title="Play / Pause (Space)"
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: "2px" }} />}
          </button>

          <button
            onClick={() => onSeek(Math.min(totalFrames, currentFrame + 1))}
            className="btn-icon-subtle"
            title="Step Forward 1 Frame (→)"
          >
            <SkipForward size={15} />
          </button>

          <button
            onClick={() => setIsLooping(!isLooping)}
            className="btn-icon-subtle"
            style={{ color: isLooping ? "var(--accent)" : "var(--text-muted)" }}
            title={isLooping ? "Looping Enabled" : "Looping Disabled"}
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Right: Audio Volume Slider & Fullscreen */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="btn-icon-subtle"
              title={isMuted ? "Unmute Audio" : "Mute Audio"}
            >
              {isMuted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                setIsMuted(false);
              }}
              style={{ width: "64px", accentColor: "var(--accent)", cursor: "pointer" }}
            />
          </div>

          <div className="divider-vert" style={{ height: "16px" }} />

          <button
            onClick={() => {
              if (containerRef.current) {
                if (!document.fullscreenElement) {
                  containerRef.current.requestFullscreen?.();
                } else {
                  document.exitFullscreen?.();
                }
              }
            }}
            className="btn-icon-subtle"
            title="Toggle Fullscreen"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
