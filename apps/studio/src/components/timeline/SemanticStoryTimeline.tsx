"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Play,
  Pause,
  Sliders,
  Maximize2,
  Wand2,
  Scissors,
  Eye,
  RefreshCw,
  Zap,
  Palette,
  Film,
  X,
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
    purpose: "Hook viewer with atmospheric ocean mist",
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
    purpose: "Establish geography & character anticipation",
    confidence: 94,
    color: "#38BDF8",
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
    purpose: "Accelerate rhythm & sync motion to beat",
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
    purpose: "Climax: Inside barrel ride hero moment",
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
    purpose: "Sunset resolve & closing brand title",
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
  const [activeActId, setActiveActId] = useState<string>("act_3");
  const [selectedStoryClipId, setSelectedStoryClipId] = useState<string | null>("clip_build_3");
  const [showClipActionsModal, setShowClipActionsModal] = useState(false);

  const totalDurationSeconds = totalFrames > 0 ? totalFrames / fps : 45.0;
  const currentSeconds = currentFrame / fps;
  const playheadPercent = Math.min(100, (currentSeconds / totalDurationSeconds) * 100);

  const activeAct = SAMPLE_STORY_ACTS.find((a) => a.id === activeActId) || SAMPLE_STORY_ACTS[2];
  const activeClip = activeAct.clips.find((c) => c.id === selectedStoryClipId) || activeAct.clips[0];

  const handleActClick = (act: StoryAct) => {
    setActiveActId(act.id);
    setSelectedStoryClipId(act.clips[0]?.id || null);
    onSeek(Math.floor(act.startTime * fps));
  };

  const handleClipClick = (clipId: string, startTimeOffset: number) => {
    setSelectedStoryClipId(clipId);
    setShowClipActionsModal(true);
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
        background: "#090C12",
        color: "#F8FAFC",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        position: "relative",
        userSelect: "none",
        overflow: "hidden",
      }}
    >
      {/* 1. Timeline Top Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 14px",
          background: "rgba(18, 22, 32, 0.9)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px", color: "#818CF8" }}>
            STORY TIMELINE
          </span>
          <span style={{ fontSize: "11px", color: "#64748B" }}>
            • {SAMPLE_STORY_ACTS.length} Acts • {totalDurationSeconds.toFixed(1)}s Total
          </span>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "3px",
              background: "rgba(56, 189, 248, 0.12)",
              border: "1px solid rgba(56, 189, 248, 0.25)",
              padding: "2px 7px",
              borderRadius: "10px",
              fontSize: "10px",
              color: "#38BDF8",
            }}
          >
            <Zap size={10} />
            <span>AI Paced: Dynamic Arc</span>
          </div>
        </div>

        {/* Center: Playhead Time */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            onClick={onTogglePlay}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#FFFFFF",
              borderRadius: "50%",
              width: "22px",
              height: "22px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
          >
            {isPlaying ? <Pause size={10} /> : <Play size={10} style={{ marginLeft: "1px" }} />}
          </button>
          <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "11px", fontWeight: 600, color: "#FFFFFF" }}>
            {formatTime(currentSeconds)} / {formatTime(totalDurationSeconds)}
          </span>
        </div>

        {/* Right: Switch to Multi-Track NLE */}
        {onToggleProMode && (
          <button
            onClick={onToggleProMode}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#E2E8F0",
              fontSize: "11px",
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "all 0.12s ease",
            }}
            title="Open DaVinci-grade Multi-Track view"
          >
            <Sliders size={11} style={{ color: "#818CF8" }} />
            <span>Switch to Multi-Track NLE</span>
          </button>
        )}
      </div>

      {/* 2. Main Story Tracks Container */}
      <div
        style={{
          flex: 1,
          padding: "8px 14px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          position: "relative",
          overflowY: "auto",
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
            height: "16px",
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: "3px",
            cursor: "pointer",
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          {/* Time markers */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4px", fontSize: "8px", color: "#64748B", fontFamily: "monospace" }}>
            <span>0:00</span>
            <span>0:10</span>
            <span>0:20</span>
            <span>0:30</span>
            <span>0:40</span>
            <span>0:45</span>
          </div>

          {/* Red Playhead Laser Line */}
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: "-80px",
              left: `${playheadPercent}%`,
              width: "2px",
              background: "#EF4444",
              zIndex: 30,
              pointerEvents: "none",
              boxShadow: "0 0 8px rgba(239, 68, 68, 0.9)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "-3px",
                width: "8px",
                height: "8px",
                background: "#EF4444",
                borderRadius: "50%",
              }}
            />
          </div>
        </div>

        {/* Semantic Story Blocks Row (INTRO -> SETUP -> BUILD -> HERO -> END) */}
        <div style={{ display: "flex", gap: "6px", width: "100%", height: "46px" }}>
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
                    ? `linear-gradient(180deg, ${act.color}35 0%, ${act.color}15 100%)`
                    : "rgba(255, 255, 255, 0.03)",
                  border: isSelected ? `2px solid ${act.color}` : "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "5px",
                  padding: "4px 6px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  position: "relative",
                  transition: "all 0.12s ease",
                  boxShadow: isSelected ? `0 0 12px ${act.color}40` : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <div
                      style={{
                        width: "5px",
                        height: "5px",
                        borderRadius: "50%",
                        background: act.color,
                        boxShadow: `0 0 6px ${act.color}`,
                      }}
                    />
                    <span style={{ fontSize: "10px", fontWeight: 700, color: isSelected ? "#FFFFFF" : "#CBD5E1", letterSpacing: "0.3px" }}>
                      {act.name}
                    </span>
                  </div>

                  <span style={{ fontSize: "8px", fontWeight: 600, color: "#94A3B8", fontFamily: "monospace" }}>
                    {act.duration.toFixed(1)}s
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "8px", color: isSelected ? "#E2E8F0" : "#64748B" }}>
                    {act.clipCount} clips
                  </span>
                  <span style={{ fontSize: "8px", color: "#10B981", fontWeight: 700 }}>{act.confidence}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. Selected Act Drilldown & Actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(18, 22, 32, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "5px",
            padding: "6px 10px",
          }}
        >
          {/* Left: Act Purpose & AI Confidence */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: activeAct.color }}>
                  {activeAct.name} SECTION
                </span>
                <span style={{ fontSize: "10px", color: "#94A3B8" }}>
                  • {activeAct.clipCount} clips ({activeAct.duration.toFixed(1)}s)
                </span>
              </div>
              <div style={{ fontSize: "10px", color: "#CBD5E1" }}>
                <strong style={{ color: "#94A3B8", fontWeight: 500 }}>Purpose: </strong>
                {activeAct.purpose}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
                paddingLeft: "10px",
              }}
            >
              <div style={{ fontSize: "8px", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700 }}>
                AI Confidence
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "45px", height: "3px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ width: `${activeAct.confidence}%`, height: "100%", background: "#10B981" }} />
                </div>
                <span style={{ fontSize: "9px", fontWeight: 700, color: "#10B981" }}>{activeAct.confidence}%</span>
              </div>
            </div>
          </div>

          {/* Right: Act Actions [ Improve Pacing ] [ Replace Clips ] [ Inspect ] */}
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <button
              onClick={() => onDirectAction && onDirectAction("IMPROVE_ACT", activeAct)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "3px",
                background: "rgba(99, 102, 241, 0.2)",
                border: "1px solid rgba(99, 102, 241, 0.4)",
                color: "#A5B4FC",
                padding: "3px 8px",
                borderRadius: "3px",
                fontSize: "10px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Wand2 size={10} />
              <span>Improve Pacing</span>
            </button>

            <button
              onClick={() => onDirectAction && onDirectAction("REPLACE_ACT", activeAct)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "3px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#CBD5E1",
                padding: "3px 8px",
                borderRadius: "3px",
                fontSize: "10px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <RefreshCw size={10} />
              <span>Replace Clips</span>
            </button>

            <button
              onClick={() => onToggleProMode && onToggleProMode()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "3px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#94A3B8",
                padding: "3px 6px",
                borderRadius: "3px",
                fontSize: "10px",
                cursor: "pointer",
              }}
              title="Inspect in MultiTrack view"
            >
              <Eye size={10} />
              <span>Inspect</span>
            </button>
          </div>
        </div>

        {/* 4. Clip Strip inside the Active Act */}
        <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
          {activeAct.clips.map((clip, idx) => {
            const isClipSelected = clip.id === selectedStoryClipId;
            return (
              <div
                key={clip.id}
                onClick={() => handleClipClick(clip.id, activeAct.startTime + idx * 3.0)}
                style={{
                  flex: 1,
                  background: isClipSelected ? "rgba(99, 102, 241, 0.18)" : "rgba(255, 255, 255, 0.04)",
                  border: isClipSelected ? "1px solid #6366F1" : "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "4px",
                  padding: "4px 6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.1s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "4px", overflow: "hidden" }}>
                  <Film size={10} style={{ color: isClipSelected ? "#A5B4FC" : "#64748B", flexShrink: 0 }} />
                  <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <span style={{ fontSize: "10px", fontWeight: 600, color: "#FFFFFF", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                      {clip.name}
                    </span>
                    <span style={{ fontSize: "8px", color: "#94A3B8", fontFamily: "monospace" }}>
                      {clip.timeRange}
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: "8px", color: "#CBD5E1", background: "rgba(0,0,0,0.4)", padding: "1px 3px", borderRadius: "2px" }}>
                  {clip.duration}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Clean Docked Contextual Clip Action Modal (Zero Clipping) */}
      {showClipActionsModal && activeClip && (
        <div
          style={{
            position: "absolute",
            bottom: "8px",
            right: "14px",
            background: "rgba(18, 22, 32, 0.95)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(99, 102, 241, 0.4)",
            borderRadius: "6px",
            padding: "8px 12px",
            boxShadow: "0 8px 25px rgba(0, 0, 0, 0.7)",
            zIndex: 100,
            width: "300px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "4px" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#FFFFFF" }}>{activeClip.name}</div>
              <div style={{ fontSize: "9px", color: "#94A3B8", fontFamily: "monospace" }}>{activeClip.timeRange}</div>
            </div>
            <button
              onClick={() => setShowClipActionsModal(false)}
              style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer", padding: "2px" }}
            >
              <X size={12} />
            </button>
          </div>

          {/* AI Suggestions Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
            <button
              onClick={() => {
                if (onDirectAction) onDirectAction("SHORTEN_CLIP", activeClip);
                setShowClipActionsModal(false);
              }}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#E2E8F0",
                padding: "4px 6px",
                borderRadius: "3px",
                fontSize: "10px",
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              <Scissors size={10} style={{ color: "#F59E0B" }} />
              <span>Shorten</span>
            </button>

            <button
              onClick={() => {
                if (onDirectAction) onDirectAction("REFRAME_CLIP", activeClip);
                setShowClipActionsModal(false);
              }}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#E2E8F0",
                padding: "4px 6px",
                borderRadius: "3px",
                fontSize: "10px",
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              <Maximize2 size={10} style={{ color: "#38BDF8" }} />
              <span>Reframe 9:16</span>
            </button>

            <button
              onClick={() => {
                if (onDirectAction) onDirectAction("MATCH_COLOR", activeClip);
                setShowClipActionsModal(false);
              }}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#E2E8F0",
                padding: "4px 6px",
                borderRadius: "3px",
                fontSize: "10px",
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              <Palette size={10} style={{ color: "#EC4899" }} />
              <span>Match Color</span>
            </button>

            <button
              onClick={() => {
                if (onDirectAction) onDirectAction("REPLACE_CLIP", activeClip);
                setShowClipActionsModal(false);
              }}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#E2E8F0",
                padding: "4px 6px",
                borderRadius: "3px",
                fontSize: "10px",
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              <RefreshCw size={10} style={{ color: "#10B981" }} />
              <span>Replace</span>
            </button>
          </div>

          {/* Manual NLE Controls trigger */}
          <button
            onClick={() => {
              if (onToggleProMode) onToggleProMode();
              setShowClipActionsModal(false);
            }}
            style={{
              width: "100%",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#94A3B8",
              padding: "4px",
              borderRadius: "3px",
              fontSize: "10px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
            }}
          >
            <Sliders size={10} />
            <span>Open Manual Controls in Pro Studio</span>
          </button>
        </div>
      )}
    </div>
  );
};
