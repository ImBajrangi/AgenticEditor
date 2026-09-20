"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Play,
  Pause,
  Sliders,
  Maximize2,
  ChevronRight,
  Clock,
  Layers,
  Wand2,
  CheckCircle2,
  Scissors,
  Eye,
  RefreshCw,
  Zap,
  Volume2,
  Palette,
  Film,
} from "lucide-react";
import { TimelineClip, TimelineIR } from "@aetheredit/timeline-ir";

export interface StoryAct {
  id: string;
  name: string;
  category: "INTRO" | "SETUP" | "BUILD" | "HERO" | "END";
  startTime: number;
  endTime: number;
  duration: number;
  clipCount: number;
  purpose: string;
  confidence: number;
  color: string;
  energyLevel: number; // 0-100
  clips: Array<{
    id: string;
    name: string;
    duration: string;
    timeRange: string;
    thumbnailUrl?: string;
  }>;
}

interface SemanticStoryTimelineProps {
  timeline: TimelineIR;
  currentFrame: number;
  totalFrames: number;
  fps: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (frame: number) => void;
  onSelectClip?: (clip: TimelineClip | null) => void;
  selectedClip?: TimelineClip | null;
  onToggleProMode?: () => void;
  onDirectAction?: (action: string, context?: any) => void;
}

export const SAMPLE_STORY_ACTS: StoryAct[] = [
  {
    id: "act_1",
    name: "INTRO",
    category: "INTRO",
    startTime: 0,
    endTime: 5.2,
    duration: 5.2,
    clipCount: 2,
    purpose: "Hook viewer with atmospheric mood & ocean mist",
    confidence: 96,
    color: "#6366F1",
    energyLevel: 30,
    clips: [
      { id: "clip_intro_1", name: "Coastal Mist Drone", duration: "2.8s", timeRange: "0:00.0 — 0:02.8" },
      { id: "clip_intro_2", name: "Morning Sun Flare", duration: "2.4s", timeRange: "0:02.8 — 0:05.2" },
    ],
  },
  {
    id: "act_2",
    name: "SETUP",
    category: "SETUP",
    startTime: 5.2,
    endTime: 17.6,
    duration: 12.4,
    clipCount: 4,
    purpose: "Establish location & character anticipation",
    confidence: 94,
    color: "#3B82F6",
    energyLevel: 55,
    clips: [
      { id: "clip_setup_1", name: "Golden Hour Waves", duration: "3.2s", timeRange: "0:05.2 — 0:08.4" },
      { id: "clip_setup_2", name: "Subject Walk to Shore", duration: "3.0s", timeRange: "0:08.4 — 0:11.4" },
      { id: "clip_setup_3", name: "Board Wax Macro", duration: "2.6s", timeRange: "0:11.4 — 0:14.0" },
      { id: "clip_setup_4", name: "Cliffside Horizon", duration: "3.6s", timeRange: "0:14.0 — 0:17.6" },
    ],
  },
  {
    id: "act_3",
    name: "BUILD",
    category: "BUILD",
    startTime: 17.6,
    endTime: 32.0,
    duration: 14.4,
    clipCount: 5,
    purpose: "Accelerate rhythm & sync dynamic motion with beat",
    confidence: 91,
    color: "#EC4899",
    energyLevel: 80,
    clips: [
      { id: "clip_build_1", name: "Paddle Out Into Surf", duration: "2.8s", timeRange: "0:17.6 — 0:20.4" },
      { id: "clip_build_2", name: "Wave Crest Formation", duration: "2.2s", timeRange: "0:20.4 — 0:22.6" },
      { id: "clip_build_3", name: "Drop-In Action", duration: "3.1s", timeRange: "0:22.6 — 0:25.7" },
      { id: "clip_build_4", name: "Spray Kick & Turn", duration: "3.2s", timeRange: "0:25.7 — 0:28.9" },
      { id: "clip_build_5", name: "Water Housing POV", duration: "3.1s", timeRange: "0:28.9 — 0:32.0" },
    ],
  },
  {
    id: "act_4",
    name: "HERO",
    category: "HERO",
    startTime: 32.0,
    endTime: 41.5,
    duration: 9.5,
    clipCount: 3,
    purpose: "Peak emotional climax: Barrel ride hero shot",
    confidence: 98,
    color: "#10B981",
    energyLevel: 95,
    clips: [
      { id: "clip_hero_1", name: "Inside Barrel Hero Shot", duration: "4.5s", timeRange: "0:32.0 — 0:36.5" },
      { id: "clip_hero_2", name: "Exit Spit Wave", duration: "2.6s", timeRange: "0:36.5 — 0:39.1" },
      { id: "clip_hero_3", name: "Celebration Stance", duration: "2.4s", timeRange: "0:39.1 — 0:41.5" },
    ],
  },
  {
    id: "act_5",
    name: "END",
    category: "END",
    startTime: 41.5,
    endTime: 45.0,
    duration: 3.5,
    clipCount: 1,
    purpose: "Sunset resolve & memorable closing brand card",
    confidence: 97,
    color: "#F59E0B",
    energyLevel: 40,
    clips: [
      { id: "clip_end_1", name: "Sunset Beach Silhouette", duration: "3.5s", timeRange: "0:41.5 — 0:45.0" },
    ],
  },
];

export const SemanticStoryTimeline: React.FC<SemanticStoryTimelineProps> = ({
  timeline,
  currentFrame,
  totalFrames,
  fps,
  isPlaying,
  onTogglePlay,
  onSeek,
  onSelectClip,
  selectedClip,
  onToggleProMode,
  onDirectAction,
}) => {
  const [activeActId, setActiveActId] = useState<string>("act_2");
  const [selectedStoryClipId, setSelectedStoryClipId] = useState<string | null>("clip_setup_1");
  const [showClipActionsPopover, setShowClipActionsPopover] = useState(false);

  const totalDurationSeconds = totalFrames > 0 ? totalFrames / fps : 45.0;
  const currentSeconds = currentFrame / fps;
  const playheadPercent = Math.min(100, (currentSeconds / totalDurationSeconds) * 100);

  const activeAct = SAMPLE_STORY_ACTS.find((a) => a.id === activeActId) || SAMPLE_STORY_ACTS[1];
  const activeClip = activeAct.clips.find((c) => c.id === selectedStoryClipId) || activeAct.clips[0];

  const handleActClick = (act: StoryAct) => {
    setActiveActId(act.id);
    setSelectedStoryClipId(act.clips[0]?.id || null);
    onSeek(Math.floor(act.startTime * fps));
  };

  const handleClipClick = (clipId: string, startTimeOffset: number) => {
    setSelectedStoryClipId(clipId);
    setShowClipActionsPopover(true);
    onSeek(Math.floor(startTimeOffset * fps));
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = (secs % 60).toFixed(1);
    return `${mins}:${s.padStart(4, "0")}`;
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        background: "var(--bg-dark-timeline)",
        color: "#F8FAFC",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        position: "relative",
        userSelect: "none",
      }}
    >
      {/* 1. Timeline Top Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 16px",
          background: "rgba(15, 23, 42, 0.75)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px", color: "var(--accent)" }}>
              STORY TIMELINE
            </span>
            <span style={{ fontSize: "11px", color: "#94A3B8" }}>
              • {SAMPLE_STORY_ACTS.length} Semantic Acts • {totalDurationSeconds.toFixed(1)}s Total
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "rgba(255, 255, 255, 0.06)",
              padding: "2px 8px",
              borderRadius: "12px",
              fontSize: "10px",
              color: "#38BDF8",
            }}
          >
            <Zap size={11} />
            <span>AI Paced: Dynamic Arc</span>
          </div>
        </div>

        {/* Center: Playhead Time */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={onTogglePlay}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#FFFFFF",
              borderRadius: "50%",
              width: "24px",
              height: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} style={{ marginLeft: "1px" }} />}
          </button>
          <span style={{ fontFamily: "monospace", fontSize: "12px", fontWeight: 600, color: "#FFFFFF" }}>
            {formatTime(currentSeconds)} / {formatTime(totalDurationSeconds)}
          </span>
        </div>

        {/* Right: Switch to Multi-Track NLE */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {onToggleProMode && (
            <button
              onClick={onToggleProMode}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                color: "#E2E8F0",
                fontSize: "11px",
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title="Open full DaVinci multi-track NLE view with color grading and Fairlight audio"
            >
              <Sliders size={12} style={{ color: "var(--accent)" }} />
              <span>Switch to Multi-Track NLE</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Story Tracks Container */}
      <div
        style={{
          flex: 1,
          padding: "10px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          position: "relative",
          overflowX: "auto",
        }}
      >
        {/* Playhead Scrubber Bar */}
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            onSeek(Math.floor(clickRatio * totalFrames));
          }}
          style={{
            position: "relative",
            width: "100%",
            height: "18px",
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: "4px",
            cursor: "pointer",
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          {/* Time markers */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4px", fontSize: "9px", color: "#64748B", fontFamily: "monospace" }}>
            <span>0:00</span>
            <span>0:10</span>
            <span>0:20</span>
            <span>0:30</span>
            <span>0:40</span>
            <span>0:45</span>
          </div>

          {/* Red Playhead line */}
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: "-60px",
              left: `${playheadPercent}%`,
              width: "2px",
              background: "#EF4444",
              zIndex: 30,
              pointerEvents: "none",
              boxShadow: "0 0 6px rgba(239, 68, 68, 0.8)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-2px",
                left: "-4px",
                width: "10px",
                height: "10px",
                background: "#EF4444",
                transform: "rotate(45deg)",
              }}
            />
          </div>
        </div>

        {/* Semantic Story Blocks Row (INTRO -> SETUP -> BUILD -> HERO -> END) */}
        <div style={{ display: "flex", gap: "6px", width: "100%", height: "54px" }}>
          {SAMPLE_STORY_ACTS.map((act) => {
            const widthPct = (act.duration / totalDurationSeconds) * 100;
            const isSelected = act.id === activeActId;

            return (
              <div
                key={act.id}
                onClick={() => handleActClick(act)}
                style={{
                  width: `${widthPct}%`,
                  height: "100%",
                  background: isSelected
                    ? `linear-gradient(180deg, ${act.color}40 0%, ${act.color}20 100%)`
                    : "rgba(255, 255, 255, 0.04)",
                  border: isSelected ? `2px solid ${act.color}` : "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "6px",
                  padding: "6px 8px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  position: "relative",
                  transition: "all 0.15s ease",
                  boxShadow: isSelected ? `0 4px 14px ${act.color}30` : "none",
                }}
              >
                {/* Act Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: act.color,
                      }}
                    />
                    <span style={{ fontSize: "11px", fontWeight: 700, color: isSelected ? "#FFFFFF" : "#CBD5E1", letterSpacing: "0.5px" }}>
                      {act.name}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: 600,
                      background: "rgba(0, 0, 0, 0.4)",
                      padding: "1px 4px",
                      borderRadius: "3px",
                      color: "#94A3B8",
                      fontFamily: "monospace",
                    }}
                  >
                    {act.duration.toFixed(1)}s
                  </span>
                </div>

                {/* Act Subtitle: Clips count & Energy mini bar */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "9px", color: isSelected ? "#E2E8F0" : "#64748B" }}>
                    {act.clipCount} clips
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                    <span style={{ fontSize: "8px", color: "#10B981", fontWeight: 600 }}>{act.confidence}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. Selected Act Drilldown & Contextual Clip Strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "6px",
            padding: "8px 12px",
            marginTop: "2px",
          }}
        >
          {/* Left: Act Purpose & AI Confidence */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: activeAct.color }}>
                  {activeAct.name} SECTION
                </span>
                <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                  • {activeAct.clipCount} clips ({activeAct.duration.toFixed(1)}s)
                </span>
              </div>
              <div style={{ fontSize: "11px", color: "#CBD5E1" }}>
                <strong style={{ color: "#94A3B8", fontWeight: 500 }}>Purpose: </strong>
                {activeAct.purpose}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
                paddingLeft: "12px",
              }}
            >
              <div style={{ fontSize: "9px", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700 }}>
                AI Confidence
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{ width: "60px", height: "4px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ width: `${activeAct.confidence}%`, height: "100%", background: "#10B981" }} />
                </div>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#10B981" }}>{activeAct.confidence}%</span>
              </div>
            </div>
          </div>

          {/* Center / Right: Act Actions [ Improve ] [ Replace ] [ Inspect ] */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              onClick={() => onDirectAction && onDirectAction("IMPROVE_ACT", activeAct)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: "rgba(79, 115, 247, 0.15)",
                border: "1px solid rgba(79, 115, 247, 0.35)",
                color: "var(--accent)",
                padding: "4px 10px",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Wand2 size={12} />
              <span>Improve Pacing</span>
            </button>

            <button
              onClick={() => onDirectAction && onDirectAction("REPLACE_ACT", activeAct)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#E2E8F0",
                padding: "4px 10px",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <RefreshCw size={12} />
              <span>Replace Clips</span>
            </button>

            <button
              onClick={() => onToggleProMode && onToggleProMode()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#94A3B8",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "11px",
                cursor: "pointer",
              }}
              title="Inspect exact edit points in MultiTrack view"
            >
              <Eye size={12} />
              <span>Inspect</span>
            </button>
          </div>
        </div>

        {/* 4. Clip Strip inside the Active Act */}
        <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "2px" }}>
          {activeAct.clips.map((clip, idx) => {
            const isClipSelected = clip.id === selectedStoryClipId;
            return (
              <div
                key={clip.id}
                onClick={() => handleClipClick(clip.id, activeAct.startTime + idx * 3.0)}
                style={{
                  flex: 1,
                  background: isClipSelected ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.04)",
                  border: isClipSelected ? "1px solid var(--accent)" : "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "4px",
                  padding: "6px 8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.1s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
                  <Film size={12} style={{ color: isClipSelected ? "var(--accent)" : "#64748B", flexShrink: 0 }} />
                  <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#FFFFFF", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                      {clip.name}
                    </span>
                    <span style={{ fontSize: "9px", color: "#94A3B8", fontFamily: "monospace" }}>
                      {clip.timeRange}
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: "9px", color: "#CBD5E1", background: "rgba(0,0,0,0.3)", padding: "1px 4px", borderRadius: "3px" }}>
                  {clip.duration}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Contextual Clip Action Popover (Progressive Disclosure) */}
      {showClipActionsPopover && activeClip && (
        <div
          style={{
            position: "absolute",
            bottom: "80px",
            right: "20px",
            background: "#1E293B",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "8px",
            padding: "12px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
            zIndex: 100,
            width: "320px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "6px" }}>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#FFFFFF" }}>{activeClip.name}</div>
              <div style={{ fontSize: "10px", color: "#94A3B8", fontFamily: "monospace" }}>{activeClip.timeRange}</div>
            </div>
            <button
              onClick={() => setShowClipActionsPopover(false)}
              style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: "13px" }}
            >
              ✕
            </button>
          </div>

          {/* AI Suggestions */}
          <div>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", marginBottom: "6px" }}>
              AI Quick Actions
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
              <button
                onClick={() => {
                  if (onDirectAction) onDirectAction("SHORTEN_CLIP", activeClip);
                  setShowClipActionsPopover(false);
                }}
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#E2E8F0",
                  padding: "5px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Scissors size={11} style={{ color: "#F59E0B" }} />
                <span>Shorten</span>
              </button>

              <button
                onClick={() => {
                  if (onDirectAction) onDirectAction("REFRAME_CLIP", activeClip);
                  setShowClipActionsPopover(false);
                }}
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#E2E8F0",
                  padding: "5px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Maximize2 size={11} style={{ color: "#38BDF8" }} />
                <span>Reframe 9:16</span>
              </button>

              <button
                onClick={() => {
                  if (onDirectAction) onDirectAction("MATCH_COLOR", activeClip);
                  setShowClipActionsPopover(false);
                }}
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#E2E8F0",
                  padding: "5px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Palette size={11} style={{ color: "#EC4899" }} />
                <span>Match Color</span>
              </button>

              <button
                onClick={() => {
                  if (onDirectAction) onDirectAction("REPLACE_CLIP", activeClip);
                  setShowClipActionsPopover(false);
                }}
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#E2E8F0",
                  padding: "5px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <RefreshCw size={11} style={{ color: "#10B981" }} />
                <span>Replace</span>
              </button>
            </div>
          </div>

          {/* Manual NLE Controls Section */}
          <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)", paddingTop: "8px" }}>
            <button
              onClick={() => {
                if (onToggleProMode) onToggleProMode();
                setShowClipActionsPopover(false);
              }}
              style={{
                width: "100%",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#94A3B8",
                padding: "6px",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
              }}
            >
              <Sliders size={12} />
              <span>Open Manual NLE Controls (Color / Speed / Transform)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
