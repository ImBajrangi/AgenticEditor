"use client";

import React, { useState, useEffect, useRef } from "react";
import { Header, WorkspaceMode } from "@/components/layout/Header";
import { ToolRail, ToolRailSection } from "@/components/layout/ToolRail";
import { LeftDrawer } from "@/components/layout/LeftDrawer";
import { ContextToolbar } from "@/components/layout/ContextToolbar";
import { PreviewStage } from "@/components/player/PreviewStage";
import { MultiTrackTimeline, TimelineEditTool } from "@/components/timeline/MultiTrackTimeline";
import { InspectorPanel } from "@/components/inspector/InspectorPanel";
import { VisualNodeGraph } from "@/components/graph/VisualNodeGraph";
import { ReviewDiffPanel } from "@/components/agents/ReviewDiffPanel";
import { RenderModal } from "@/components/render/RenderModal";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { SystemStatusModal } from "@/components/layout/SystemStatusModal";
import { CommandPalette } from "@/components/layout/CommandPalette";
import {
  SAMPLE_ASSETS,
  SAMPLE_TIMELINE_TRAVEL,
  SAMPLE_WORKFLOW_TRAVEL,
  MediaAsset,
} from "@/lib/sample-data";
import {
  TimelineIR,
  TimelineTrack,
  TimelineClip,
  TimelineHistoryManager,
  TimelineMutationOp,
  TimelineMutator,
  TrackType,
} from "@aetheredit/timeline-ir";
import {
  WorkflowGraph,
  WorkflowNode,
  WorkflowExecutionState,
} from "@aetheredit/workflow-engine";
import { AgentRun } from "@/packages/agent-runtime/src/types";
import { ActiveAiRunInfo } from "@/components/agents/AIDirectorPanel";
import { browserCache } from "@/lib/cache/browser-cache";

export const createEmptyTimeline = (): TimelineIR => ({
  timelineId: `tl_project_${Date.now().toString(36)}`,
  version: 1,
  timebase: { numerator: 30, denominator: 1 },
  canvas: {
    width: 1920,
    height: 1080,
    pixelAspectRatio: "1:1",
    colorSpace: "Rec.709",
  },
  markers: [],
  tracks: [
    {
      id: "trk_v1_primary",
      type: "VIDEO",
      name: "V1: Primary Video",
      index: 0,
      muted: false,
      locked: false,
      clips: [],
      transitions: [],
    },
    {
      id: "trk_v2_broll",
      type: "VIDEO",
      name: "V2: B-Roll & Titles",
      index: 1,
      muted: false,
      locked: false,
      clips: [],
      transitions: [],
    },
    {
      id: "trk_a1_primary",
      type: "AUDIO",
      name: "A1: Dialogue & Sync",
      index: 2,
      muted: false,
      locked: false,
      volume: 0,
      clips: [],
      transitions: [],
    },
    {
      id: "trk_a2_music",
      type: "AUDIO",
      name: "A2: Music & Ambience",
      index: 3,
      muted: false,
      locked: false,
      volume: -3,
      clips: [],
      transitions: [],
    },
  ],
});

export default function StudioPage() {
  // 1. Workspace Mode: [EDIT | WORKFLOW | REVIEW] (Section 3 & 8)
  const [mode, setMode] = useState<WorkspaceMode>("EDIT");
  const [activeRailSection, setActiveRailSection] = useState<ToolRailSection | null>(null);

  // 2. Modals & Popovers
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [systemStatusOpen, setSystemStatusOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [renderModalOpen, setRenderModalOpen] = useState(false);

  // 3. Project Metadata & Aspect Ratio (Section 8 & 11)
  const [projectName, setProjectName] = useState("Travel Campaign");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [isProxyMode, setIsProxyMode] = useState(true);
  const [modelPolicy, setModelPolicy] = useState<"AUTO" | "CLOUD" | "LOCAL">("AUTO");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [localEndpoint, setLocalEndpoint] = useState("http://localhost:11434/v1");

  // 4. Timeline IR & History Management (Section 14-18)
  const [timeline, setTimeline] = useState<TimelineIR>(SAMPLE_TIMELINE_TRAVEL);
  const historyRef = useRef(new TimelineHistoryManager(SAMPLE_TIMELINE_TRAVEL));
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // 5. Playhead & Playback Transport
  const [currentFrame, setCurrentFrame] = useState(240); // 00:08:00
  const [isPlaying, setIsPlaying] = useState(false);
  const fps = 30;

  // 6. Media Asset Pool (Dynamic Uploads + Cache)
  const [assets, setAssets] = useState<MediaAsset[]>(SAMPLE_ASSETS);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(SAMPLE_ASSETS[0]);
  const [selectedClip, setSelectedClip] = useState<TimelineClip | null>(
    SAMPLE_TIMELINE_TRAVEL.tracks[0].clips[0] || null
  );
  const [selectedClipIds, setSelectedClipIds] = useState<string[]>([
    SAMPLE_TIMELINE_TRAVEL.tracks[0].clips[0]?.id || "",
  ].filter(Boolean));
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(
    SAMPLE_WORKFLOW_TRAVEL.nodes[0] || null
  );

  // 7. Timeline Edit Tools (Section 14)
  const [activeTool, setActiveTool] = useState<TimelineEditTool>("SELECT");
  const [isSnapping, setIsSnapping] = useState(true);
  const [isMagnetic, setIsMagnetic] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1.0);

  // 8. Workflow Engine State (Section 24-26)
  const [workflow, setWorkflow] = useState<WorkflowGraph>(SAMPLE_WORKFLOW_TRAVEL);
  const [executionState, setExecutionState] = useState<WorkflowExecutionState | null>(null);
  const [isWorkflowRunning, setIsWorkflowRunning] = useState(false);

  // 9. AI Director State (Section 19-22)
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [hasPendingAiChanges, setHasPendingAiChanges] = useState(false);
  const [activeAgentRun, setActiveAgentRun] = useState<AgentRun | null>(null);
  const [activeAiRun, setActiveAiRun] = useState<ActiveAiRunInfo | null>(null);
  const [timelineBefore, setTimelineBefore] = useState<TimelineIR | null>(null);
  const [creativeBrief, setCreativeBrief] = useState(
    "Cinematic travel montage with natural pacing, organic color, and atmospheric sound design"
  );

  // 10. Hardware Render State (Section 31-32)
  const [isRendering, setIsRendering] = useState(false);
  const [renderResult, setRenderResult] = useState<{
    success: boolean;
    downloadUrl?: string;
    command?: string;
    fileSizeBytes?: number;
    hardwareAccel?: string;
  } | null>(null);

  // Dynamic asset pool management
  const handleAddAssets = (newAssets: MediaAsset[]) => {
    setAssets((prev) => {
      const updated = [...newAssets, ...prev];
      browserCache.set("user_assets", updated);
      return updated;
    });
    if (newAssets.length > 0) {
      setSelectedAsset(newAssets[0]);
    }
  };

  const handleDeleteAsset = (assetId: string) => {
    setAssets((prev) => {
      const updated = prev.filter((a) => a.id !== assetId);
      browserCache.set("user_assets", updated);
      return updated;
    });
    if (selectedAsset?.id === assetId) {
      setSelectedAsset(null);
    }
  };

  // Restore cached timeline and settings on mount (User rule: cache system)
  useEffect(() => {
    const cachedAssets = browserCache.get<MediaAsset[]>("user_assets");
    if (cachedAssets && cachedAssets.length > 0) {
      setAssets(cachedAssets);
      setSelectedAsset(cachedAssets[0]);
    }
    const cachedTimeline = browserCache.get<TimelineIR>("active_timeline");
    if (cachedTimeline) {
      setTimeline(cachedTimeline);
      historyRef.current = new TimelineHistoryManager(cachedTimeline);
    }
    const cachedApiKey = browserCache.get<string>("gemini_api_key");
    if (cachedApiKey) setGeminiApiKey(cachedApiKey);
    const cachedEndpoint = browserCache.get<string>("local_ai_endpoint");
    if (cachedEndpoint) setLocalEndpoint(cachedEndpoint);
    const cachedRatio = browserCache.get<"16:9" | "9:16" | "1:1">("aspect_ratio");
    if (cachedRatio) setAspectRatio(cachedRatio);
  }, []);

  const updateHistoryState = () => {
    setCanUndo(historyRef.current.canUndo());
    setCanRedo(historyRef.current.canRedo());
  };

  // Calculate dynamic project total duration (min 300 frames)
  const projectDurationFrames = Math.max(
    300,
    ...timeline.tracks.flatMap((t) => t.clips.map((c) => c.timelineRange.start + c.timelineRange.duration))
  );

  // Playhead animation loop for non-video regions & smooth transport
  useEffect(() => {
    if (!isPlaying) return;
    let lastTime = performance.now();
    let animId: number;

    const tick = (now: number) => {
      const elapsed = (now - lastTime) / 1000;
      if (elapsed >= 1 / fps) {
        lastTime = now - (elapsed % (1 / fps));
        setCurrentFrame((prev) => {
          if (prev >= projectDurationFrames) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, fps, projectDurationFrames]);

  // Keep active refs for keyboard events
  const selectedClipRef = useRef(selectedClip);
  useEffect(() => {
    selectedClipRef.current = selectedClip;
  }, [selectedClip]);

  const selectedClipIdsRef = useRef(selectedClipIds);
  useEffect(() => {
    selectedClipIdsRef.current = selectedClipIds;
  }, [selectedClipIds]);

  const currentFrameRef = useRef(currentFrame);
  useEffect(() => {
    currentFrameRef.current = currentFrame;
  }, [currentFrame]);

  // Global Keyboard Shortcuts (Space, ⌘Z, ⌘K, C, V, S, M, Backspace/Delete, ⌘A, Esc, ⌘B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Space: Play / Pause
      if (e.code === "Space") {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
      // Undo / Redo: ⌘Z / ⌘⇧Z
      else if (e.key === "z" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (e.key === "z" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
      // ⌘K: Command Palette
      else if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      // Backspace / Delete: Delete selected clip(s)
      else if (e.key === "Backspace" || e.key === "Delete") {
        if (selectedClipIdsRef.current.length > 1) {
          e.preventDefault();
          handleDeleteClips(selectedClipIdsRef.current);
        } else if (selectedClipRef.current) {
          e.preventDefault();
          handleDeleteClip(selectedClipRef.current.id, undefined, e.shiftKey);
        }
      }
      // ⌘A / Ctrl+A: Select all clips
      else if (e.key === "a" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const allClips = timeline.tracks.flatMap((t) => t.clips);
        const allIds = allClips.map((c) => c.id);
        setSelectedClipIds(allIds);
        if (allClips.length > 0) {
          setSelectedClip(allClips[0]);
          selectedClipRef.current = allClips[0];
        }
      }
      // Escape: Deselect all clips
      else if (e.key === "Escape") {
        e.preventDefault();
        setSelectedClipIds([]);
        setSelectedClip(null);
        selectedClipRef.current = null;
      }
      // ⌘B / Ctrl+B: Split clip at playhead
      else if (e.key === "b" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (selectedClipRef.current) {
          handleSplitClip(selectedClipRef.current.id, currentFrameRef.current);
        } else {
          // Find clip under playhead on primary video track or any track
          const primaryTrack = timeline.tracks.find((t) => t.id === "trk_v1_primary") || timeline.tracks[0];
          const clipUnderPlayhead = primaryTrack?.clips.find(
            (c) =>
              currentFrameRef.current > c.timelineRange.start + 2 &&
              currentFrameRef.current < c.timelineRange.start + c.timelineRange.duration - 2
          );
          if (clipUnderPlayhead) {
            handleSplitClip(clipUnderPlayhead.id, currentFrameRef.current, primaryTrack.id);
          }
        }
      }
      // V: Selection Tool
      else if (e.key === "v" && !e.metaKey && !e.ctrlKey) {
        setActiveTool("SELECT");
      }
      // C: Razor Blade Tool
      else if (e.key === "c" && !e.metaKey && !e.ctrlKey) {
        setActiveTool("RAZOR");
      }
      // S: Snap Toggle
      else if (e.key === "s" && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
        setIsSnapping((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [timeline]);

  const handleUndo = () => {
    if (!historyRef.current.canUndo()) return;
    const prev = historyRef.current.undo();
    if (prev) {
      setTimeline(prev);
      browserCache.set("active_timeline", prev);
      updateHistoryState();
    }
  };

  const handleRedo = () => {
    if (!historyRef.current.canRedo()) return;
    const next = historyRef.current.redo();
    if (next) {
      setTimeline(next);
      browserCache.set("active_timeline", next);
      updateHistoryState();
    }
  };

  // Timeline Clip Interactive Handlers
  const handleSplitClip = (clipId: string, frame: number, trackId?: string) => {
    const effectiveTrackId =
      trackId ||
      timeline.tracks.find((t) => t.clips.some((c) => c.id === clipId))?.id ||
      "trk_v1_primary";
    const track = timeline.tracks.find((t) => t.id === effectiveTrackId);
    const clip = track?.clips.find((c) => c.id === clipId);
    if (!clip) return;

    const clipStart = clip.timelineRange.start;
    const clipEnd = clipStart + clip.timelineRange.duration;
    if (frame <= clipStart + 2 || frame >= clipEnd - 2) return;

    const next = historyRef.current.pushMutation({
      type: "SPLIT_CLIP",
      trackId: effectiveTrackId,
      clipId,
      splitFrame: frame,
    });
    setTimeline(next);
    browserCache.set("active_timeline", next);
    updateHistoryState();

    // Select the newly created segment under playhead or part 2
    const updatedTrack = next.tracks.find((t) => t.id === effectiveTrackId);
    const matchingClips = updatedTrack?.clips.filter((c) => c.id.startsWith(clipId)) || [];
    const targetClip =
      matchingClips.find(
        (c) => frame >= c.timelineRange.start && frame <= c.timelineRange.start + c.timelineRange.duration
      ) ||
      matchingClips[matchingClips.length - 1] ||
      null;

    if (targetClip) {
      setSelectedClip(targetClip);
      selectedClipRef.current = targetClip;
    }
  };

  const handleSplitClips = (splits: { clipId: string; frame: number; trackId: string }[]) => {
    if (!splits || splits.length === 0) return;
    let next = timeline;
    for (const s of splits) {
      const track = next.tracks.find((t) => t.id === s.trackId);
      const clip = track?.clips.find((c) => c.id === s.clipId);
      if (!clip) continue;
      const clipStart = clip.timelineRange.start;
      const clipEnd = clipStart + clip.timelineRange.duration;
      if (s.frame <= clipStart + 2 || s.frame >= clipEnd - 2) continue;

      next = historyRef.current.pushMutation({
        type: "SPLIT_CLIP",
        trackId: s.trackId,
        clipId: s.clipId,
        splitFrame: s.frame,
      });
    }
    setTimeline(next);
    browserCache.set("active_timeline", next);
    updateHistoryState();
  };

  const handleSelectClip = (clip: TimelineClip | null) => {
    setSelectedClip(clip);
    selectedClipRef.current = clip;
    if (clip) {
      setSelectedClipIds([clip.id]);
    } else {
      setSelectedClipIds([]);
    }
  };

  const handleSelectClips = (clips: TimelineClip[], isAdditive = false) => {
    const incomingIds = clips.map((c) => c.id);
    setSelectedClipIds((prev) => {
      let next: string[];
      if (isAdditive) {
        const set = new Set(prev);
        incomingIds.forEach((id) => {
          if (set.has(id)) {
            set.delete(id);
          } else {
            set.add(id);
          }
        });
        next = Array.from(set);
      } else {
        next = incomingIds;
      }
      return next;
    });

    if (clips.length > 0) {
      setSelectedClip(clips[clips.length - 1]);
      selectedClipRef.current = clips[clips.length - 1];
    } else if (!isAdditive) {
      setSelectedClip(null);
      selectedClipRef.current = null;
    }
  };

  const handleMoveClip = (
    clipId: string,
    newStart: number,
    sourceTrackId: string,
    targetTrackId?: string
  ) => {
    const finalTrackId = targetTrackId || sourceTrackId;

    if (finalTrackId !== sourceTrackId) {
      // Cross-track move: Remove from sourceTrackId and Insert into finalTrackId
      const sourceTrack = timeline.tracks.find((t) => t.id === sourceTrackId);
      const clip = sourceTrack?.clips.find((c) => c.id === clipId);
      if (!clip) return;

      const updatedClip: TimelineClip = {
        ...clip,
        timelineRange: { ...clip.timelineRange, start: Math.max(0, newStart) },
      };

      const mutations: TimelineMutationOp[] = [
        { type: "REMOVE_CLIP", trackId: sourceTrackId, clipId },
        { type: "INSERT_CLIP", trackId: finalTrackId, clip: updatedClip },
      ];

      const next = historyRef.current.pushTransaction(
        mutations,
        `Move clip ${clip.name} from ${sourceTrackId} to ${finalTrackId}`
      );
      setTimeline(next);
      browserCache.set("active_timeline", next);
      setSelectedClip(updatedClip);
      selectedClipRef.current = updatedClip;
      updateHistoryState();
    } else {
      // Same-track move
      const next = historyRef.current.pushMutation({
        type: "TRIM_CLIP",
        trackId: sourceTrackId,
        clipId,
        newTimelineRange: { start: Math.max(0, newStart) },
      });
      setTimeline(next);
      browserCache.set("active_timeline", next);

      const track = next.tracks.find((t) => t.id === sourceTrackId);
      const updated = track?.clips.find((c) => c.id === clipId);
      if (updated) {
        setSelectedClip(updated);
        selectedClipRef.current = updated;
      }
      updateHistoryState();
    }
  };

  const handleMoveClips = (
    moves: Array<{ clipId: string; newStart: number; sourceTrackId: string; targetTrackId?: string }>
  ) => {
    if (moves.length === 0) return;
    if (moves.length === 1) {
      handleMoveClip(moves[0].clipId, moves[0].newStart, moves[0].sourceTrackId, moves[0].targetTrackId);
      return;
    }

    const mutations: TimelineMutationOp[] = [];
    moves.forEach((move) => {
      const finalTrackId = move.targetTrackId || move.sourceTrackId;
      if (finalTrackId !== move.sourceTrackId) {
        const sourceTrack = timeline.tracks.find((t) => t.id === move.sourceTrackId);
        const clip = sourceTrack?.clips.find((c) => c.id === move.clipId);
        if (clip) {
          const updatedClip: TimelineClip = {
            ...clip,
            timelineRange: { ...clip.timelineRange, start: Math.max(0, move.newStart) },
          };
          mutations.push({ type: "REMOVE_CLIP", trackId: move.sourceTrackId, clipId: move.clipId });
          mutations.push({ type: "INSERT_CLIP", trackId: finalTrackId, clip: updatedClip });
        }
      } else {
        mutations.push({
          type: "TRIM_CLIP",
          trackId: move.sourceTrackId,
          clipId: move.clipId,
          newTimelineRange: { start: Math.max(0, move.newStart) },
        });
      }
    });

    if (mutations.length === 0) return;
    const next = historyRef.current.pushTransaction(
      mutations,
      `Move ${moves.length} clips together`
    );
    setTimeline(next);
    browserCache.set("active_timeline", next);
    updateHistoryState();
  };

  const handleTrimClip = (clipId: string, edge: "START" | "END", newFrame: number, trackId: string) => {
    const track = timeline.tracks.find((t) => t.id === trackId);
    const clip = track?.clips.find((c) => c.id === clipId);
    if (!clip) return;
    const currentStart = clip.timelineRange.start;
    const currentEnd = currentStart + clip.timelineRange.duration;
    const speed = clip.speed || 1.0;

    if (edge === "START") {
      const clampedStart = Math.max(0, Math.min(newFrame, currentEnd - 4));
      const delta = clampedStart - currentStart;
      const newDuration = currentEnd - clampedStart;
      const newSourceIn = Math.max(0, (clip.sourceRange?.in || 0) + Math.round(delta * speed));

      const next = historyRef.current.pushMutation({
        type: "TRIM_CLIP",
        trackId,
        clipId,
        newTimelineRange: { start: clampedStart, duration: newDuration },
        newSourceRange: { in: newSourceIn, out: clip.sourceRange?.out || newDuration },
      });
      setTimeline(next);
      browserCache.set("active_timeline", next);
      const updated = next.tracks.find((t) => t.id === trackId)?.clips.find((c) => c.id === clipId);
      if (updated) {
        setSelectedClip(updated);
        selectedClipRef.current = updated;
      }
      updateHistoryState();
    } else {
      const clampedEnd = Math.max(currentStart + 4, newFrame);
      const newDuration = clampedEnd - currentStart;
      const delta = newDuration - clip.timelineRange.duration;
      const newSourceOut = (clip.sourceRange?.out || clip.timelineRange.duration) + Math.round(delta * speed);

      const next = historyRef.current.pushMutation({
        type: "TRIM_CLIP",
        trackId,
        clipId,
        newTimelineRange: { duration: newDuration },
        newSourceRange: { in: clip.sourceRange?.in || 0, out: newSourceOut },
      });
      setTimeline(next);
      browserCache.set("active_timeline", next);
      const updated = next.tracks.find((t) => t.id === trackId)?.clips.find((c) => c.id === clipId);
      if (updated) {
        setSelectedClip(updated);
        selectedClipRef.current = updated;
      }
      updateHistoryState();
    }
  };

  const handleInsertClip = (assetData: any, trackId: string, startFrame: number) => {
    const targetTrack = timeline.tracks.find((t) => t.id === trackId) || timeline.tracks[0];
    if (!targetTrack) return;

    const dur = assetData.durationFrames && assetData.durationFrames > 0 ? Math.min(assetData.durationFrames, 180) : 120;
    const newClip: TimelineClip = {
      id: `clip_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      assetId: assetData.assetId || assetData.id || "ast_user",
      name: assetData.title || "Inserted Clip",
      sourceRange: { in: 0, out: dur },
      timelineRange: { start: Math.max(0, startFrame), duration: dur },
      speed: 1.0,
      transform: {
        position: { x: 0, y: 0 },
        scale: { x: 1, y: 1 },
        rotation: 0,
        opacity: 1.0,
      },
      effects: [],
    };

    const next = historyRef.current.pushMutation({
      type: "INSERT_CLIP",
      trackId: targetTrack.id,
      clip: newClip,
    });
    setTimeline(next);
    browserCache.set("active_timeline", next);
    setSelectedClip(newClip);
    selectedClipRef.current = newClip;
    updateHistoryState();
  };

  const handleDeleteClips = (clipIds: string[]) => {
    if (clipIds.length === 0) return;
    if (clipIds.length === 1) {
      handleDeleteClip(clipIds[0]);
      return;
    }

    const mutations: TimelineMutationOp[] = [];
    for (const track of timeline.tracks) {
      for (const clip of track.clips) {
        if (clipIds.includes(clip.id)) {
          mutations.push({
            type: "REMOVE_CLIP",
            trackId: track.id,
            clipId: clip.id,
          });
        }
      }
    }

    if (mutations.length === 0) return;
    const next = historyRef.current.pushTransaction(
      mutations,
      `Delete ${mutations.length} selected clips`
    );
    setTimeline(next);
    browserCache.set("active_timeline", next);
    setSelectedClipIds([]);
    setSelectedClip(null);
    selectedClipRef.current = null;
    updateHistoryState();
  };

  const handleDeleteClip = (clipId: string, trackId?: string, ripple = false) => {
    if (selectedClipIdsRef.current.length > 1 && selectedClipIdsRef.current.includes(clipId)) {
      handleDeleteClips(selectedClipIdsRef.current);
      return;
    }

    const effectiveTrackId =
      trackId ||
      timeline.tracks.find((t) => t.clips.some((c) => c.id === clipId))?.id;
    if (!effectiveTrackId) return;

    const track = timeline.tracks.find((t) => t.id === effectiveTrackId);
    if (!track) return;
    const clip = track.clips.find((c) => c.id === clipId);
    if (!clip) return;

    if (ripple) {
      const clipStart = clip.timelineRange.start;
      const clipDuration = clip.timelineRange.duration;
      const subsequentClips = track.clips.filter((c) => c.timelineRange.start > clipStart);

      const mutations: TimelineMutationOp[] = [
        {
          type: "REMOVE_CLIP",
          trackId: effectiveTrackId,
          clipId,
        },
        ...subsequentClips.map((sub) => ({
          type: "TRIM_CLIP" as const,
          trackId: effectiveTrackId,
          clipId: sub.id,
          newTimelineRange: { start: Math.max(0, sub.timelineRange.start - clipDuration) },
        })),
      ];

      const updated = historyRef.current.pushTransaction(mutations, `Ripple delete clip ${clip.name}`);
      setTimeline(updated);
      browserCache.set("active_timeline", updated);
      updateHistoryState();
    } else {
      const next = historyRef.current.pushMutation({
        type: "REMOVE_CLIP",
        trackId: effectiveTrackId,
        clipId,
      });
      setTimeline(next);
      browserCache.set("active_timeline", next);
      updateHistoryState();
    }
    setSelectedClipIds((prev) => prev.filter((id) => id !== clipId));
    if (selectedClip?.id === clipId) {
      setSelectedClip(null);
      selectedClipRef.current = null;
    }
  };

  const handleResetTimeline = () => {
    const emptyTimeline = createEmptyTimeline();
    historyRef.current = new TimelineHistoryManager(emptyTimeline);
    setTimeline(emptyTimeline);
    browserCache.set("active_timeline", emptyTimeline);
    setSelectedClip(null);
    setSelectedClipIds([]);
    setCurrentFrame(0);
    setTimelineBefore(null);
    setHasPendingAiChanges(false);
    updateHistoryState();
  };

  // Professional Track Management Handlers (Add, Delete, Rename, Lock, Mute, Volume, Reorder)
  const handleAddTrack = (type: TrackType, targetIndex?: number) => {
    const isVideoLike = type === "VIDEO" || type === "GRAPHICS" || type === "EFFECTS";
    const existingSameType = timeline.tracks.filter(
      (t) => t.type === type || (isVideoLike && (t.type === "VIDEO" || t.type === "GRAPHICS" || t.type === "EFFECTS"))
    );
    const prefix = type === "AUDIO" ? "A" : type === "GRAPHICS" ? "G" : type === "EFFECTS" ? "FX" : "V";
    const nextNum = existingSameType.length + 1;
    const newTrackId = `trk_${prefix.toLowerCase()}${nextNum}_${Date.now().toString(36).slice(-4)}`;
    const newTrackName = `${prefix}${nextNum}: ${type === "AUDIO" ? "Audio " + nextNum : type === "GRAPHICS" ? "Graphics " + nextNum : type === "EFFECTS" ? "Effects " + nextNum : "Video " + nextNum}`;

    const newTrack: TimelineTrack = {
      id: newTrackId,
      type,
      name: newTrackName,
      index: timeline.tracks.length,
      muted: false,
      locked: false,
      volume: type === "AUDIO" ? 0 : undefined,
      clips: [],
      transitions: [],
    };

    let newTracks: TimelineTrack[];
    if (typeof targetIndex === "number" && targetIndex >= 0 && targetIndex <= timeline.tracks.length) {
      newTracks = [...timeline.tracks];
      newTracks.splice(targetIndex, 0, newTrack);
    } else if (isVideoLike) {
      const lastVideoIdx = timeline.tracks.map((t) => t.type).lastIndexOf("VIDEO");
      const lastGraphicsIdx = timeline.tracks.map((t) => t.type).lastIndexOf("GRAPHICS");
      const lastEffectsIdx = timeline.tracks.map((t) => t.type).lastIndexOf("EFFECTS");
      const insertIdx = Math.max(lastVideoIdx, lastGraphicsIdx, lastEffectsIdx) + 1;
      newTracks = [...timeline.tracks];
      newTracks.splice(insertIdx >= 0 ? insertIdx : 0, 0, newTrack);
    } else {
      newTracks = [...timeline.tracks, newTrack];
    }
    newTracks.forEach((t, i) => {
      t.index = i;
    });

    const updatedTimeline: TimelineIR = {
      ...timeline,
      version: timeline.version + 1,
      tracks: newTracks,
    };

    const next = historyRef.current.pushSnapshot(updatedTimeline, `Add ${type} Track ${newTrackName}`);
    setTimeline(next);
    browserCache.set("active_timeline", next);
    updateHistoryState();
  };

  const handleDuplicateTrack = (trackId: string) => {
    const track = timeline.tracks.find((t) => t.id === trackId);
    if (!track) return;
    const currentIdx = timeline.tracks.findIndex((t) => t.id === trackId);
    const isVideoLike = track.type === "VIDEO" || track.type === "GRAPHICS" || track.type === "EFFECTS";
    const prefix = track.type === "AUDIO" ? "A" : track.type === "GRAPHICS" ? "G" : track.type === "EFFECTS" ? "FX" : "V";
    const sameTypeCount = timeline.tracks.filter(
      (t) => t.type === track.type || (isVideoLike && (t.type === "VIDEO" || t.type === "GRAPHICS" || t.type === "EFFECTS"))
    ).length;
    const nextNum = sameTypeCount + 1;
    const newTrackId = `trk_${prefix.toLowerCase()}${nextNum}_${Date.now().toString(36).slice(-4)}`;
    
    // Deep clone clips with unique IDs so duplicates don't conflict
    const newClips: TimelineClip[] = track.clips.map((c) => ({
      ...c,
      id: `clip_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    }));

    const cleanBaseName = track.name.replace(/^(V\d+|A\d+|G\d+|FX\d+):\s*/i, "");
    const duplicatedTrack: TimelineTrack = {
      ...track,
      id: newTrackId,
      name: `${prefix}${nextNum}: ${cleanBaseName} (Copy)`,
      clips: newClips,
      transitions: [],
    };

    const newTracks = [...timeline.tracks];
    newTracks.splice(currentIdx, 0, duplicatedTrack);
    newTracks.forEach((t, i) => {
      t.index = i;
    });

    const updatedTimeline: TimelineIR = {
      ...timeline,
      version: timeline.version + 1,
      tracks: newTracks,
    };

    const next = historyRef.current.pushSnapshot(updatedTimeline, `Duplicate Track ${track.name}`);
    setTimeline(next);
    browserCache.set("active_timeline", next);
    updateHistoryState();
  };

  const handleDeleteTrack = (trackId: string) => {
    const track = timeline.tracks.find((t) => t.id === trackId);
    if (!track) return;
    const sameTypeCount = timeline.tracks.filter((t) => t.type === track.type).length;
    if (sameTypeCount <= 1) return; // Keep at least one track of each type

    const newTracks = timeline.tracks.filter((t) => t.id !== trackId);
    newTracks.forEach((t, i) => {
      t.index = i;
    });

    const updatedTimeline: TimelineIR = {
      ...timeline,
      version: timeline.version + 1,
      tracks: newTracks,
    };

    const next = historyRef.current.pushSnapshot(updatedTimeline, `Delete Track ${track.name}`);
    setTimeline(next);
    browserCache.set("active_timeline", next);
    updateHistoryState();
  };

  const handleRenameTrack = (trackId: string, newName: string) => {
    if (!newName.trim()) return;
    const newTracks = timeline.tracks.map((t) => (t.id === trackId ? { ...t, name: newName.trim() } : t));
    const updatedTimeline: TimelineIR = {
      ...timeline,
      version: timeline.version + 1,
      tracks: newTracks,
    };
    const next = historyRef.current.pushSnapshot(updatedTimeline, `Rename Track to ${newName.trim()}`);
    setTimeline(next);
    browserCache.set("active_timeline", next);
    updateHistoryState();
  };

  const handleToggleTrackLock = (trackId: string) => {
    const newTracks = timeline.tracks.map((t) => (t.id === trackId ? { ...t, locked: !t.locked } : t));
    const updatedTimeline: TimelineIR = {
      ...timeline,
      tracks: newTracks,
    };
    setTimeline(updatedTimeline);
    browserCache.set("active_timeline", updatedTimeline);
  };

  const handleToggleTrackMute = (trackId: string) => {
    const newTracks = timeline.tracks.map((t) => (t.id === trackId ? { ...t, muted: !t.muted } : t));
    const updatedTimeline: TimelineIR = {
      ...timeline,
      tracks: newTracks,
    };
    setTimeline(updatedTimeline);
    browserCache.set("active_timeline", updatedTimeline);
  };

  const handleToggleTrackSolo = (trackId: string) => {
    const newTracks = timeline.tracks.map((t) => (t.id === trackId ? { ...t, solo: !t.solo } : t));
    const updatedTimeline: TimelineIR = {
      ...timeline,
      tracks: newTracks,
    };
    setTimeline(updatedTimeline);
    browserCache.set("active_timeline", updatedTimeline);
  };

  const handleSetTrackVolume = (trackId: string, volumeDb: number) => {
    const newTracks = timeline.tracks.map((t) => (t.id === trackId ? { ...t, volume: volumeDb } : t));
    const updatedTimeline: TimelineIR = {
      ...timeline,
      tracks: newTracks,
    };
    setTimeline(updatedTimeline);
    browserCache.set("active_timeline", updatedTimeline);
  };

  const handleReorderTracks = (reorderedTracks: TimelineTrack[]) => {
    reorderedTracks.forEach((t, i) => {
      t.index = i;
    });
    const updatedTimeline: TimelineIR = {
      ...timeline,
      version: timeline.version + 1,
      tracks: reorderedTracks,
    };
    const next = historyRef.current.pushSnapshot(updatedTimeline, "Reorder Tracks");
    setTimeline(next);
    browserCache.set("active_timeline", next);
    updateHistoryState();
  };

  const handleUpdateClipSpeed = (clipId: string, speed: number) => {
    const track = timeline.tracks.find((t) => t.clips.some((c) => c.id === clipId));
    if (!track) return;
    const clip = track.clips.find((c) => c.id === clipId);
    if (!clip) return;
    clip.speed = speed;
    setTimeline({ ...timeline });
    browserCache.set("active_timeline", timeline);
  };

  const handleTrimQuick = (clipId: string, deltaFrames: number) => {
    const track = timeline.tracks.find((t) => t.clips.some((c) => c.id === clipId));
    if (!track) return;
    const clip = track.clips.find((c) => c.id === clipId);
    if (!clip) return;
    const newDur = Math.max(15, clip.timelineRange.duration + deltaFrames);
    const next = historyRef.current.pushMutation({
      type: "TRIM_CLIP",
      trackId: track.id,
      clipId,
      newTimelineRange: { duration: newDur },
    });
    setTimeline(next);
    browserCache.set("active_timeline", next);
    updateHistoryState();
  };

  // 1. Workflow Management Handlers
  const handleUpdateWorkflow = (newGraph: WorkflowGraph) => {
    setWorkflow(newGraph);
    browserCache.set("active_workflow", newGraph);
    if (selectedNode) {
      const refreshed = newGraph.nodes.find((n) => n.id === selectedNode.id);
      setSelectedNode(refreshed || null);
    }
  };

  const handleUpdateNode = (updatedNode: WorkflowNode) => {
    const updatedNodes = workflow.nodes.map((n) => (n.id === updatedNode.id ? updatedNode : n));
    const nextGraph = { ...workflow, nodes: updatedNodes, version: workflow.version + 1 };
    handleUpdateWorkflow(nextGraph);
    setSelectedNode(updatedNode);
  };

  const handleDeleteNode = (nodeId: string) => {
    const updatedNodes = workflow.nodes.filter((n) => n.id !== nodeId);
    const updatedEdges = workflow.edges.filter((e) => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId);
    const nextGraph = { ...workflow, nodes: updatedNodes, edges: updatedEdges, version: workflow.version + 1 };
    handleUpdateWorkflow(nextGraph);
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  };

  const handleExecuteWorkflow = async () => {
    setIsWorkflowRunning(true);
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ graph: workflow, timeline }),
      });
      const data = await res.json();
      if (data.success && data.state) {
        setExecutionState(data.state);
        if (data.timelineMutations && data.timelineMutations.length > 0) {
          setTimelineBefore(timeline);
          let updated = timeline;
          for (const mut of data.timelineMutations) {
            updated = historyRef.current.pushMutation(mut);
          }
          setTimeline(updated);
          browserCache.set("active_timeline", updated);
          updateHistoryState();
          setHasPendingAiChanges(true);
        }
        if (data.state.status === "SUSPENDED_FOR_APPROVAL") {
          setMode("REVIEW");
        }
      }
    } catch (err) {
      console.error("Workflow execution error:", err);
    } finally {
      setIsWorkflowRunning(false);
    }
  };

  const handleExecuteSingleNode = async (nodeId: string) => {
    const targetNode = workflow.nodes.find((n) => n.id === nodeId);
    if (!targetNode) return;

    const singleGraph: WorkflowGraph = {
      id: `single_${nodeId}`,
      name: `Execute: ${targetNode.label}`,
      version: 1,
      nodes: [targetNode],
      edges: [],
    };

    setIsWorkflowRunning(true);
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ graph: singleGraph, timeline }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.state?.nodeStates[nodeId]) {
          setExecutionState((prev) => ({
            executionId: data.state.executionId,
            workflowId: workflow.id,
            status: "COMPLETED",
            startedAt: prev?.startedAt || Date.now(),
            contextData: {},
            nodeStates: {
              ...(prev?.nodeStates || {}),
              [nodeId]: data.state.nodeStates[nodeId],
            },
          }));
        }
        if (data.timelineMutations && data.timelineMutations.length > 0) {
          let updated = timeline;
          for (const mut of data.timelineMutations) {
            updated = historyRef.current.pushMutation(mut);
          }
          setTimeline(updated);
          browserCache.set("active_timeline", updated);
          updateHistoryState();
        }
      }
    } catch (err) {
      console.error("Single node execution failed:", err);
    } finally {
      setIsWorkflowRunning(false);
    }
  };

  const handleLoadWorkflowPreset = (presetId: string) => {
    if (presetId === "travel") {
      handleUpdateWorkflow(SAMPLE_WORKFLOW_TRAVEL);
    } else if (presetId === "shorts") {
      handleUpdateWorkflow({
        id: "wf_shorts_preset",
        name: "Viral Vertical Shorts (9:16)",
        version: 1,
        nodes: [
          {
            id: "node_1_ingest",
            type: "TRIGGER_UPLOAD",
            label: "Raw Camera Ingest",
            category: "TRIGGER",
            position: { x: 60, y: 180 },
            parameters: { targetFps: 30 },
            inputs: [],
            outputs: [{ name: "rawMedia", type: "MediaAsset[]" }],
          },
          {
            id: "node_2_silence",
            type: "ANALYSIS_SILENCE_DETECTION",
            label: "Fast Dead Air Cutter",
            category: "ANALYSIS",
            position: { x: 340, y: 180 },
            parameters: { thresholdDb: -28, minDurationMs: 300 },
            inputs: [{ name: "rawMedia", type: "MediaAsset[]" }],
            outputs: [{ name: "trimmedMedia", type: "MediaAsset[]" }],
          },
          {
            id: "node_3_pacing",
            type: "AI_AGENT_PACING",
            label: "High-Retention Rhythm",
            category: "AI",
            position: { x: 620, y: 180 },
            parameters: { targetShotSec: 1.8, hookEmphasis: true },
            inputs: [{ name: "trimmedMedia", type: "MediaAsset[]" }],
            outputs: [{ name: "pacedClips", type: "TimelineIR" }],
          },
          {
            id: "node_4_captions",
            type: "AI_AGENT_CAPTIONING",
            label: "Whisper Dynamic Captions",
            category: "AI",
            position: { x: 900, y: 180 },
            parameters: { style: "Karaoke Word Highlight", font: "Inter-Bold" },
            inputs: [{ name: "pacedClips", type: "TimelineIR" }],
            outputs: [{ name: "subtitledTimeline", type: "TimelineIR" }],
          },
          {
            id: "node_5_render",
            type: "OUTPUT_RENDER_MASTER",
            label: "9:16 Mobile Hardware Export",
            category: "OUTPUT",
            position: { x: 1180, y: 180 },
            parameters: { resolution: "1080x1920", codec: "VIDEOTOOLBOX_H264" },
            inputs: [{ name: "subtitledTimeline", type: "TimelineIR" }],
            outputs: [{ name: "masterUrl", type: "string" }],
          },
        ],
        edges: [
          { id: "e1", sourceNodeId: "node_1_ingest", sourceOutputPort: "rawMedia", targetNodeId: "node_2_silence", targetInputPort: "rawMedia" },
          { id: "e2", sourceNodeId: "node_2_silence", sourceOutputPort: "trimmedMedia", targetNodeId: "node_3_pacing", targetInputPort: "trimmedMedia" },
          { id: "e3", sourceNodeId: "node_3_pacing", sourceOutputPort: "pacedClips", targetNodeId: "node_4_captions", targetInputPort: "pacedClips" },
          { id: "e4", sourceNodeId: "node_4_captions", sourceOutputPort: "subtitledTimeline", targetNodeId: "node_5_render", targetInputPort: "subtitledTimeline" },
        ],
      });
    } else if (presetId === "commercial") {
      handleUpdateWorkflow({
        id: "wf_commercial_preset",
        name: "Commercial / Ad Spot (15s)",
        version: 1,
        nodes: [
          {
            id: "node_1_ingest",
            type: "TRIGGER_UPLOAD",
            label: "Raw Ingest",
            category: "TRIGGER",
            position: { x: 80, y: 180 },
            parameters: { targetFps: 30 },
            inputs: [],
            outputs: [{ name: "rawMedia", type: "MediaAsset[]" }],
          },
          {
            id: "node_2_beat",
            type: "ANALYSIS_BEAT_TRACKING",
            label: "Music Beat Grid Sync",
            category: "ANALYSIS",
            position: { x: 360, y: 180 },
            parameters: { sensitivity: 0.9 },
            inputs: [{ name: "rawMedia", type: "MediaAsset[]" }],
            outputs: [{ name: "beatGrid", type: "BeatGrid" }],
          },
          {
            id: "node_3_color",
            type: "CREATIVE_COLOR_GRADE",
            label: "Commercial Clean Rec.709",
            category: "CREATIVE",
            position: { x: 640, y: 180 },
            parameters: { lut: "Rec709_Clean.cube", intensity: 1.0 },
            inputs: [{ name: "beatGrid", type: "BeatGrid" }],
            outputs: [{ name: "timelineIr", type: "TimelineIR" }],
          },
          {
            id: "node_4_render",
            type: "OUTPUT_RENDER_MASTER",
            label: "Master Broadcast Export",
            category: "OUTPUT",
            position: { x: 920, y: 180 },
            parameters: { codec: "PRORES_422", resolution: "3840x2160" },
            inputs: [{ name: "timelineIr", type: "TimelineIR" }],
            outputs: [{ name: "videoMasterUrl", type: "string" }],
          },
        ],
        edges: [
          { id: "e1", sourceNodeId: "node_1_ingest", sourceOutputPort: "rawMedia", targetNodeId: "node_2_beat", targetInputPort: "rawMedia" },
          { id: "e2", sourceNodeId: "node_2_beat", sourceOutputPort: "beatGrid", targetNodeId: "node_3_color", targetInputPort: "beatGrid" },
          { id: "e3", sourceNodeId: "node_3_color", sourceOutputPort: "timelineIr", targetNodeId: "node_4_render", targetInputPort: "timelineIr" },
        ],
      });
    }
  };

  // Natural Language AI Directive & Direct Script Execution (Section 20)
  const handleAiDirective = async (prompt: string, customScript?: any) => {
    setIsAiThinking(true);
    try {
      const targetTrackId = timeline.tracks.find((t) => t.clips.some((c) => c.id === selectedClip?.id))?.id;
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${prompt} [Clip: ${selectedClip?.name || "all"}, Playhead: ${currentFrame}]`,
          timeline,
          workflow,
          policy: modelPolicy,
          currentFrame,
          selectedClipId: selectedClip?.id,
          selectedClipName: selectedClip?.name,
          selectedTrackId: targetTrackId,
          assets: assets.map((a) => ({ id: a.id, title: a.title, durationFrames: a.durationFrames })),
          customScript,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.updatedWorkflow) {
          handleUpdateWorkflow(data.updatedWorkflow);
        }
        if (data.proposedMutations && data.proposedMutations.length > 0) {
          setTimelineBefore(timeline);
          let updated = timeline;
          for (const mut of data.proposedMutations) {
            try {
              updated = TimelineMutator.apply(updated, mut);
            } catch (mutErr) {
              console.warn("Skipping unexecutable AI mutation:", mut, mutErr);
            }
          }
          historyRef.current.pushSnapshot(updated, `AI Edit: ${prompt}`);
          setTimeline(updated);
          browserCache.set("active_timeline", updated);
          updateHistoryState();
          setHasPendingAiChanges(true);

          // Update active selected clip if modified
          if (selectedClip) {
            const freshTrack = updated.tracks.find((t) => t.clips.some((c) => c.id === selectedClip.id || c.id.startsWith(selectedClip.id)));
            const freshClip = freshTrack?.clips.find((c) => c.id === selectedClip.id || c.id.startsWith(selectedClip.id)) || null;
            if (freshClip) {
              setSelectedClip(freshClip);
              selectedClipRef.current = freshClip;
            }
          }
        }
        setActiveAiRun({
          agentName: data.agentName || "AI Director",
          modelUsed: data.modelUsed || "Gemini 1.5 Flash",
          reasoning: data.reasoning || prompt,
          mutationsCount: (data.proposedMutations?.length || 0) + (data.updatedWorkflow ? 1 : 0),
          timestamp: Date.now(),
          currentTimestampContext: data.currentTimestampContext,
          targetClipContext: data.targetClipContext,
          agentSteps: data.agentSteps,
          generatedScript: data.generatedScript,
          thinkingTrace: data.thinkingTrace,
          detailedAction: data.detailedAction,
        });
      }
    } catch (err) {
      console.error("AI Directive execution failed:", err);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Left Tool Rail selection toggle
  const handleRailSelect = (sec: ToolRailSection) => {
    if (activeRailSection === sec) {
      setActiveRailSection(null);
    } else {
      setActiveRailSection(sec);
    }
  };

  // Hardware Render Export
  const handleStartRender = async (settings: { format: "MP4" | "MOV"; resolution: { width: number; height: number } }) => {
    setIsRendering(true);
    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeline, resolution: settings.resolution }),
      });

      const data = await res.json();
      if (data.success) {
        setRenderResult({
          success: true,
          downloadUrl: data.downloadUrl,
          command: data.compiledCommand || data.command,
          hardwareAccel: data.hardwareAccel,
          fileSizeBytes: data.fileSizeBytes,
        });
      }
    } catch (err) {
      console.error("Render compilation error:", err);
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="studio-root">
      {/* 1. SECTION 8: TOP COMMAND BAR (64px) */}
      <Header
        mode={mode}
        setMode={setMode}
        projectName={projectName}
        onProjectChange={setProjectName}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenSystemStatus={() => setSystemStatusOpen(true)}
        onOpenRender={() => {
          setRenderResult(null);
          setRenderModalOpen(true);
        }}
        onOpenSettings={() => setSettingsModalOpen(true)}
        isRendering={isRendering}
        isAiThinking={isAiThinking}
        aspectRatio={aspectRatio}
        onAspectRatioChange={(ratio) => {
          setAspectRatio(ratio);
          browserCache.set("aspect_ratio", ratio);
        }}
        timelineVersion={timeline.version}
      />

      {/* 2. SECTION 3 & 4: MAIN APPLICATION WORKSPACE */}
      <div className="studio-body-layout">
        {/* SECTION 9: Left Tool Rail (88px) */}
        <ToolRail
          activeSection={activeRailSection}
          onSelectSection={handleRailSelect}
        />

        {/* Left Contextual Drawer (340px) */}
        <LeftDrawer
          section={activeRailSection}
          onClose={() => setActiveRailSection(null)}
          assets={assets}
          selectedAsset={selectedAsset}
          onSelectAsset={setSelectedAsset}
          onInsertAsset={(asset) => {
            handleInsertClip(asset, "trk_v1_primary", currentFrame);
          }}
          isProxyMode={isProxyMode}
          onToggleProxyMode={setIsProxyMode}
          onApplyPreset={(preset) => handleAiDirective(`Apply preset: ${preset}`)}
          onDirectAiAction={handleAiDirective}
          onAddAssets={handleAddAssets}
          onDeleteAsset={handleDeleteAsset}
        />

        {/* Center Workspace Stage */}
        <main className="center-workspace-stage">
          {/* MODE 1: EDIT (Primary NLE + AI Workspace) */}
          {mode === "EDIT" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              {/* SECTION 12: Context Toolbar (56px) */}
              <ContextToolbar
                selectedClip={selectedClip}
                onOpenColor={() => {}}
                onOpenSpeed={() => {}}
                onOpenReframe={() => {
                  setAspectRatio((prev) => (prev === "16:9" ? "9:16" : "16:9"));
                }}
                onAiAction={handleAiDirective}
                onDeleteClip={handleDeleteClip}
                onUpdateSpeed={handleUpdateClipSpeed}
                onTrimQuick={handleTrimQuick}
                aspectRatio={aspectRatio}
                currentFrame={currentFrame}
                fps={fps}
              />

              {/* SECTION 11: Central Preview Stage */}
              <PreviewStage
                timeline={timeline}
                currentFrame={currentFrame}
                totalFrames={projectDurationFrames}
                fps={fps}
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying(!isPlaying)}
                onSeek={setCurrentFrame}
                aspectRatio={aspectRatio}
                selectedAsset={selectedAsset}
                selectedClip={selectedClip}
                assets={assets}
              />

              {/* SECTION 14–18: Persistent Bottom Timeline (min 280px) */}
              <div style={{ height: "290px", minHeight: "260px", display: "flex", flexDirection: "column" }}>
                <MultiTrackTimeline
                  timeline={timeline}
                  currentFrame={currentFrame}
                  onSeek={setCurrentFrame}
                  selectedClipId={selectedClip?.id || null}
                  selectedClipIds={selectedClipIds}
                  onSelectClip={handleSelectClip}
                  onSelectClips={handleSelectClips}
                  onSplitClip={handleSplitClip}
                  onSplitClips={handleSplitClips}
                  onDeleteClip={handleDeleteClip}
                  onDeleteClips={handleDeleteClips}
                  onMoveClip={handleMoveClip}
                  onMoveClips={handleMoveClips}
                  onTrimClip={handleTrimClip}
                  onInsertClip={handleInsertClip}
                  onUpdateClipSpeed={handleUpdateClipSpeed}
                  onResetTimeline={handleResetTimeline}
                  onAddTrack={handleAddTrack}
                  onDuplicateTrack={handleDuplicateTrack}
                  onDeleteTrack={handleDeleteTrack}
                  onRenameTrack={handleRenameTrack}
                  onToggleTrackLock={handleToggleTrackLock}
                  onToggleTrackMute={handleToggleTrackMute}
                  onToggleTrackSolo={handleToggleTrackSolo}
                  onSetTrackVolume={handleSetTrackVolume}
                  onReorderTracks={handleReorderTracks}
                  activeTool={activeTool}
                  setActiveTool={setActiveTool}
                  isSnapping={isSnapping}
                  setIsSnapping={setIsSnapping}
                  isMagnetic={isMagnetic}
                  setIsMagnetic={setIsMagnetic}
                  zoomLevel={zoomLevel}
                  setZoomLevel={setZoomLevel}
                />
              </div>
            </div>
          )}

          {/* MODE 2: WORKFLOW (Visual Node Graph Canvas) */}
          {mode === "WORKFLOW" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
                <VisualNodeGraph
                  graph={workflow}
                  executionState={executionState}
                  isRunning={isWorkflowRunning}
                  onRunWorkflow={handleExecuteWorkflow}
                  onResetWorkflow={() => setExecutionState(null)}
                  selectedNodeId={selectedNode?.id || null}
                  onSelectNode={setSelectedNode}
                  onOpenApproval={() => setMode("REVIEW")}
                  onUpdateGraph={handleUpdateWorkflow}
                  onDeleteNode={handleDeleteNode}
                  onExecuteNode={handleExecuteSingleNode}
                  onLoadPreset={handleLoadWorkflowPreset}
                />
              </div>

              {/* Persistent bottom timeline in Workflow mode (One Workspace principle) */}
              <div style={{ height: "220px", display: "flex", flexDirection: "column" }}>
                <MultiTrackTimeline
                  timeline={timeline}
                  currentFrame={currentFrame}
                  onSeek={setCurrentFrame}
                  selectedClipId={selectedClip?.id || null}
                  selectedClipIds={selectedClipIds}
                  onSelectClip={handleSelectClip}
                  onSelectClips={handleSelectClips}
                  onSplitClip={handleSplitClip}
                  onSplitClips={handleSplitClips}
                  onDeleteClip={handleDeleteClip}
                  onDeleteClips={handleDeleteClips}
                  onMoveClip={handleMoveClip}
                  onMoveClips={handleMoveClips}
                  onTrimClip={handleTrimClip}
                  onInsertClip={handleInsertClip}
                  onUpdateClipSpeed={handleUpdateClipSpeed}
                  onResetTimeline={handleResetTimeline}
                  onAddTrack={handleAddTrack}
                  onDuplicateTrack={handleDuplicateTrack}
                  onDeleteTrack={handleDeleteTrack}
                  onRenameTrack={handleRenameTrack}
                  onToggleTrackLock={handleToggleTrackLock}
                  onToggleTrackMute={handleToggleTrackMute}
                  onToggleTrackSolo={handleToggleTrackSolo}
                  onSetTrackVolume={handleSetTrackVolume}
                  onReorderTracks={handleReorderTracks}
                  activeTool={activeTool}
                  setActiveTool={setActiveTool}
                  isSnapping={isSnapping}
                  setIsSnapping={setIsSnapping}
                  zoomLevel={zoomLevel}
                  setZoomLevel={setZoomLevel}
                />
              </div>
            </div>
          )}

          {/* MODE 3: REVIEW (Timeline Diff & Quality Impact) */}
          {mode === "REVIEW" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <div style={{ flex: 1, overflowY: "auto" }}>
                <ReviewDiffPanel
                  timelineBefore={timelineBefore}
                  timelineAfter={timeline}
                  onAcceptAll={() => {
                    setTimelineBefore(null);
                    setHasPendingAiChanges(false);
                    setMode("EDIT");
                  }}
                  onRejectAll={() => {
                    handleUndo();
                    setTimelineBefore(null);
                    setHasPendingAiChanges(false);
                    setMode("EDIT");
                  }}
                  onUndoAiChanges={() => {
                    handleUndo();
                    setTimelineBefore(null);
                    setHasPendingAiChanges(false);
                    setMode("EDIT");
                  }}
                />
              </div>

              {/* Shared Timeline in Review Mode */}
              <div style={{ height: "220px", display: "flex", flexDirection: "column" }}>
                <MultiTrackTimeline
                  timeline={timeline}
                  currentFrame={currentFrame}
                  onSeek={setCurrentFrame}
                  selectedClipId={selectedClip?.id || null}
                  selectedClipIds={selectedClipIds}
                  onSelectClip={handleSelectClip}
                  onSelectClips={handleSelectClips}
                  onSplitClip={handleSplitClip}
                  onSplitClips={handleSplitClips}
                  onDeleteClip={handleDeleteClip}
                  onDeleteClips={handleDeleteClips}
                  onMoveClip={handleMoveClip}
                  onMoveClips={handleMoveClips}
                  onTrimClip={handleTrimClip}
                  onInsertClip={handleInsertClip}
                  onUpdateClipSpeed={handleUpdateClipSpeed}
                  onResetTimeline={handleResetTimeline}
                  onAddTrack={handleAddTrack}
                  onDuplicateTrack={handleDuplicateTrack}
                  onDeleteTrack={handleDeleteTrack}
                  onRenameTrack={handleRenameTrack}
                  onToggleTrackLock={handleToggleTrackLock}
                  onToggleTrackMute={handleToggleTrackMute}
                  onToggleTrackSolo={handleToggleTrackSolo}
                  onSetTrackVolume={handleSetTrackVolume}
                  onReorderTracks={handleReorderTracks}
                  activeTool={activeTool}
                  setActiveTool={setActiveTool}
                  isSnapping={isSnapping}
                  setIsSnapping={setIsSnapping}
                  zoomLevel={zoomLevel}
                  setZoomLevel={setZoomLevel}
                />
              </div>
            </div>
          )}
        </main>

        {/* SECTION 13: RIGHT INSPECTOR (340px) */}
        <aside className="right-inspector-panel">
          <InspectorPanel
            selectedClip={selectedClip}
            selectedNode={selectedNode}
            mode={mode}
            timeline={timeline}
            timelineBefore={timelineBefore}
            activeAiRun={activeAiRun}
            assets={assets}
            creativeBrief={creativeBrief}
            onUpdateCreativeBrief={setCreativeBrief}
            onUpdateClipSpeed={handleUpdateClipSpeed}
            onDirectPrompt={handleAiDirective}
            isThinking={isAiThinking}
            hasPendingChanges={hasPendingAiChanges}
            onReviewChanges={() => setMode("REVIEW")}
            onApproveChanges={() => {
              setTimelineBefore(null);
              setHasPendingAiChanges(false);
            }}
            onRejectChanges={() => {
              handleUndo();
              setTimelineBefore(null);
              setHasPendingAiChanges(false);
            }}
            onUpdateNode={handleUpdateNode}
            onDeleteNode={handleDeleteNode}
            onExecuteNode={handleExecuteSingleNode}
            currentFrame={currentFrame}
          />
        </aside>
      </div>

      {/* Render & Export Modal (Section 31-32) */}
      <RenderModal
        isOpen={renderModalOpen}
        onClose={() => setRenderModalOpen(false)}
        onStartRender={handleStartRender}
        isRendering={isRendering}
        renderResult={renderResult}
      />

      {/* System Diagnostics Modal */}
      <SystemStatusModal
        isOpen={systemStatusOpen}
        onClose={() => setSystemStatusOpen(false)}
        modelPolicy={modelPolicy}
        setModelPolicy={setModelPolicy}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        geminiApiKey={geminiApiKey}
        onSaveGeminiApiKey={(key) => {
          setGeminiApiKey(key);
          browserCache.set("gemini_api_key", key);
        }}
        localEndpoint={localEndpoint}
        onSaveLocalEndpoint={(ep) => {
          setLocalEndpoint(ep);
          browserCache.set("local_ai_endpoint", ep);
        }}
      />

      {/* Command Palette (⌘K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectAction={(actionId) => {
          if (actionId === "export_master") {
            setRenderModalOpen(true);
          } else if (actionId === "open_settings") {
            setSettingsModalOpen(true);
          } else if (actionId === "cut_dead_air") {
            handleAiDirective("Cut dead air");
          } else if (actionId === "make_cinematic") {
            handleAiDirective("Make this cinematic");
          }
        }}
      />
    </div>
  );
}
