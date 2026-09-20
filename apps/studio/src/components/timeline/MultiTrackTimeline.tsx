"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Scissors,
  MousePointer,
  Volume2,
  VolumeX,
  Lock,
  Unlock,
  ZoomIn,
  ZoomOut,
  Bookmark,
  Magnet,
  Sparkles,
  ArrowRightLeft,
  ChevronsLeftRight,
  MoveHorizontal,
  Compass,
  RotateCcw,
  Trash2,
  Split,
  Eye,
  EyeOff,
  Plus,
  MoreVertical,
  Sliders,
  Edit2,
  Layers,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2,
  GripVertical,
  Copy,
  Check,
} from "lucide-react";
import { TimelineIR, TimelineClip, TimelineTrack, TrackType } from "@aetheredit/timeline-ir";

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

export interface MultiTrackTimelineProps {
  timeline: TimelineIR;
  currentFrame: number;
  onSeek: (frame: number) => void;
  selectedClipId: string | null;
  selectedClipIds?: string[];
  onSelectClip: (clip: TimelineClip) => void;
  onSelectClips?: (clips: TimelineClip[], isAdditive?: boolean) => void;
  onSplitClip: (clipId: string, frame: number, trackId?: string) => void;
  onSplitClips?: (splits: { clipId: string; frame: number; trackId: string }[]) => void;
  onDeleteClip?: (clipId: string, trackId?: string, ripple?: boolean) => void;
  onDeleteClips?: (clipIds: string[]) => void;
  onMoveClip?: (clipId: string, newStart: number, sourceTrackId: string, targetTrackId?: string) => void;
  onMoveClips?: (moves: Array<{ clipId: string; newStart: number; sourceTrackId: string; targetTrackId?: string }>) => void;
  onTrimClip?: (clipId: string, edge: "START" | "END", newFrame: number, trackId: string) => void;
  onInsertClip?: (asset: any, trackId: string, startFrame: number) => void;
  onUpdateClipSpeed?: (clipId: string, speed: number) => void;
  onResetTimeline?: () => void;
  onAddTrack?: (type: TrackType, targetIndex?: number) => void;
  onDuplicateTrack?: (trackId: string) => void;
  onDeleteTrack?: (trackId: string) => void;
  onRenameTrack?: (trackId: string, newName: string) => void;
  onToggleTrackLock?: (trackId: string) => void;
  onToggleTrackMute?: (trackId: string) => void;
  onToggleTrackSolo?: (trackId: string) => void;
  onSetTrackVolume?: (trackId: string, volumeDb: number) => void;
  onReorderTracks?: (tracks: TimelineTrack[]) => void;
  targetTrackId?: string;
  onSetTargetTrackId?: (trackId: string) => void;
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
  selectedClipIds = [],
  onSelectClip,
  onSelectClips,
  onSplitClip,
  onSplitClips,
  onDeleteClip,
  onDeleteClips,
  onMoveClip,
  onMoveClips,
  onTrimClip,
  onInsertClip,
  onUpdateClipSpeed,
  onResetTimeline,
  onAddTrack,
  onDuplicateTrack,
  onDeleteTrack,
  onRenameTrack,
  onToggleTrackLock,
  onToggleTrackMute,
  onToggleTrackSolo,
  onSetTrackVolume,
  onReorderTracks,
  targetTrackId: propTargetTrackId,
  onSetTargetTrackId,
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
  const trackHeadersRef = useRef<HTMLDivElement>(null);

  // Multi-Selection: derive active selected IDs
  const activeSelectedIds = React.useMemo(() => {
    if (selectedClipIds && selectedClipIds.length > 0) return selectedClipIds;
    if (selectedClipId) return [selectedClipId];
    return [];
  }, [selectedClipIds, selectedClipId]);

  // Find selected clip object
  const selectedClipObj = React.useMemo(() => {
    for (const t of timeline.tracks) {
      for (const c of t.clips) {
        if (c.id === selectedClipId || (activeSelectedIds.length === 1 && c.id === activeSelectedIds[0])) {
          return { clip: c, trackId: t.id };
        }
      }
    }
    return null;
  }, [timeline, selectedClipId, activeSelectedIds]);

  // Scroll Metrics for Custom Horizontal Scrollbar Navigator
  const [scrollMetrics, setScrollMetrics] = useState({
    scrollLeft: 0,
    scrollTop: 0,
    scrollWidth: 1400,
    clientWidth: 800,
  });

  // Marquee Selection State (Box Drag over multiple clips)
  const [marqueeState, setMarqueeState] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    isAdditive: boolean;
    initialSelectedIds: string[];
  } | null>(null);

  // Middle Mouse / Spacebar Panning State
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [panState, setPanState] = useState<{
    startX: number;
    startY: number;
    initialScrollLeft: number;
    initialScrollTop: number;
  } | null>(null);

  // Professional Track Height & Resizing
  type TrackHeightMode = "COMPACT" | "STANDARD" | "EXPANDED";
  const [trackHeightMode, setTrackHeightMode] = useState<TrackHeightMode>("STANDARD");
  const trackHeightPx = trackHeightMode === "COMPACT" ? 36 : trackHeightMode === "EXPANDED" ? 70 : 48;

  // Track Target Patching
  const [targetTrackId, setTargetTrackId] = useState<string>(
    propTargetTrackId || timeline.tracks[0]?.id || "trk_v1_primary"
  );
  useEffect(() => {
    if (propTargetTrackId) setTargetTrackId(propTargetTrackId);
  }, [propTargetTrackId]);

  const handleSetTargetTrack = (id: string) => {
    setTargetTrackId(id);
    onSetTargetTrackId?.(id);
  };

  // Track Inline Rename
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [editingTrackName, setEditingTrackName] = useState<string>("");

  // Track Context Menu
  const [trackContextMenu, setTrackContextMenu] = useState<{
    x: number;
    y: number;
    anchorTop?: number;
    anchorBottom?: number;
    track: TimelineTrack;
  } | null>(null);

  // Audio Track Volume Slider Popup
  const [activeVolumeTrackId, setActiveVolumeTrackId] = useState<string | null>(null);

  // Floating Action Feedback Toast State
  const [toastMessage, setToastMessage] = useState<{ id: number; text: string } | null>(null);
  const showToast = (text: string) => {
    const id = Date.now();
    setToastMessage({ id, text });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.id === id ? null : prev));
    }, 2400);
  };

  // Track Drag-and-Drop Reordering State
  const [draggedTrackId, setDraggedTrackId] = useState<string | null>(null);
  const [dragOverTrackState, setDragOverTrackState] = useState<{
    targetId: string;
    position: "BEFORE" | "AFTER";
  } | null>(null);

  const [soloTracks, setSoloTracks] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    timeline.tracks.forEach((t) => {
      if (t.solo) map[t.id] = true;
    });
    return map;
  });
  const [mutedTracks, setMutedTracks] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    timeline.tracks.forEach((t) => {
      if (t.muted) map[t.id] = true;
    });
    return map;
  });
  const [lockedTracks, setLockedTracks] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    timeline.tracks.forEach((t) => {
      if (t.locked) map[t.id] = true;
    });
    return map;
  });

  useEffect(() => {
    setSoloTracks((prev) => {
      const updated = { ...prev };
      timeline.tracks.forEach((t) => {
        if (t.solo !== undefined) updated[t.id] = t.solo;
      });
      return updated;
    });
    setMutedTracks((prev) => {
      const updated = { ...prev };
      timeline.tracks.forEach((t) => {
        if (t.muted !== undefined) updated[t.id] = t.muted;
      });
      return updated;
    });
    setLockedTracks((prev) => {
      const updated = { ...prev };
      timeline.tracks.forEach((t) => {
        if (t.locked !== undefined) updated[t.id] = t.locked;
      });
      return updated;
    });
  }, [timeline.tracks]);

  const [markers, setMarkers] = useState<TimelineMarker[]>(DEFAULT_MARKERS);
  const [isScrubbingRuler, setIsScrubbingRuler] = useState(false);

  // Clip Drag & Trim States with multiClips support
  const [dragState, setDragState] = useState<{
    type: "MOVE" | "TRIM_START" | "TRIM_END";
    clipId: string;
    trackId: string;
    initialStart: number;
    initialDuration: number;
    startX: number;
    currentDeltaFrames: number;
    multiClips?: Array<{
      clipId: string;
      trackId: string;
      initialStart: number;
      initialDuration: number;
    }>;
  } | null>(null);

  // Hovered target track during vertical dragging between tracks
  const [dragHoverTrackId, setDragHoverTrackId] = useState<string | null>(null);

  // Drop Preview State for dragging asset from MediaBin onto timeline
  const [dropGhost, setDropGhost] = useState<{
    trackId: string;
    startFrame: number;
    durationFrames: number;
    title: string;
  } | null>(null);

  // Cut Flash Animation State
  const [cutFlash, setCutFlash] = useState<{
    trackId: string;
    frame: number;
  } | null>(null);

  // Right-Click Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    anchorTop?: number;
    anchorBottom?: number;
    clip: TimelineClip;
    trackId: string;
  } | null>(null);

  const [razorHover, setRazorHover] = useState<{
    trackId: string;
    clipId: string;
    frame: number;
  } | null>(null);

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

  // Ruler Scrubbing Listener
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

  // Context Menu dismissal listener
  useEffect(() => {
    const handleGlobalClick = () => {
      setContextMenu(null);
      setTrackContextMenu(null);
      setActiveVolumeTrackId(null);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setContextMenu(null);
        setTrackContextMenu(null);
        setActiveVolumeTrackId(null);
        setEditingTrackId(null);
      }
    };
    window.addEventListener("click", handleGlobalClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("click", handleGlobalClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Mouse Wheel: Vertical track scrolling, Shift+Wheel horizontal scrolling, Cmd/Alt zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.altKey || e.metaKey || e.ctrlKey) {
      e.preventDefault();
      const zoomDelta = -Math.sign(e.deltaY) * 0.15;
      const newZoom = Math.max(0.3, Math.min(3.5, parseFloat((zoomLevel + zoomDelta).toFixed(2))));
      setZoomLevel(newZoom);
      return;
    }

    if (e.shiftKey) {
      // Shift + Vertical Wheel -> Horizontal timeline scroll
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft += e.deltaY;
      }
      return;
    }

    // Direct horizontal scroll from trackpad/tilt-wheel
    if (Math.abs(e.deltaX) > 0 && scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft += e.deltaX;
    }

    // Direct vertical scroll from trackpad/wheel scrolls tracks vertically
    if (Math.abs(e.deltaY) > 0 && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop += e.deltaY;
      if (trackHeadersRef.current) {
        trackHeadersRef.current.scrollTop = scrollContainerRef.current.scrollTop;
      }
    }
  };

  // Space key tracking for Hand Panning tool
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        setIsSpacePressed(true);
      }
      if ((e.key === "Backspace" || e.key === "Delete") && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        if (activeSelectedIds.length > 1) {
          e.preventDefault();
          onDeleteClips?.(activeSelectedIds);
        } else if (activeSelectedIds.length === 1 && selectedClipObj) {
          e.preventDefault();
          onDeleteClip?.(selectedClipObj.clip.id, selectedClipObj.trackId, e.shiftKey);
        }
      }
      if (e.key === "a" && (e.metaKey || e.ctrlKey) && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        const allClips = timeline.tracks.filter((t) => !lockedTracks[t.id]).flatMap((t) => t.clips);
        onSelectClips?.(allClips);
      }
      if (e.key === "Escape") {
        onSelectClips?.([]);
      }
      if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown") && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        const activeTrackId = targetTrackId || timeline.tracks[0]?.id;
        if (activeTrackId && !lockedTracks[activeTrackId]) {
          handleMoveTrackOrder(activeTrackId, e.key === "ArrowUp" ? "UP" : "DOWN");
        }
      }
      // Track Quick Shortcuts (L: Lock, M: Mute, S: Solo, F2: Rename)
      if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        const activeTrackId = targetTrackId || timeline.tracks[0]?.id;
        if (activeTrackId && !e.metaKey && !e.ctrlKey && !e.altKey) {
          if (e.key === "l" || e.key === "L") {
            e.preventDefault();
            toggleLock(activeTrackId);
          } else if (e.key === "m" || e.key === "M") {
            e.preventDefault();
            toggleMute(activeTrackId);
          } else if (e.key === "s" || e.key === "S") {
            e.preventDefault();
            toggleSolo(activeTrackId);
          } else if (e.key === "q" || e.key === "Q") {
            e.preventDefault();
            handleTrimStartToPlayhead();
          } else if (e.key === "w" || e.key === "W") {
            e.preventDefault();
            handleTrimEndToPlayhead();
          } else if (e.key === "F2") {
            e.preventDefault();
            const trk = timeline.tracks.find((t) => t.id === activeTrackId);
            if (trk) handleStartRenameTrack(trk);
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
        setPanState(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [activeSelectedIds, selectedClipObj, timeline, lockedTracks, mutedTracks, soloTracks, targetTrackId, onDeleteClips, onDeleteClip, onSelectClips]);

  // Global Mouse Move & Up Listener (Handles Multi-Drag, Marquee Selection & Hand Pan)
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      // 1. Panning Mode
      if (panState && scrollContainerRef.current) {
        const dx = e.clientX - panState.startX;
        const dy = e.clientY - panState.startY;
        scrollContainerRef.current.scrollLeft = panState.initialScrollLeft - dx;
        scrollContainerRef.current.scrollTop = panState.initialScrollTop - dy;
        if (trackHeadersRef.current) {
          trackHeadersRef.current.scrollTop = scrollContainerRef.current.scrollTop;
        }
        return;
      }

      // 2. Marquee Selection Mode
      if (marqueeState && scrollContainerRef.current) {
        const lanesElement = document.getElementById("timeline-lanes-container");
        if (!lanesElement) return;
        const rect = lanesElement.getBoundingClientRect();
        const curX = e.clientX - rect.left;
        const curY = e.clientY - rect.top;

        setMarqueeState((prev) => (prev ? { ...prev, currentX: curX, currentY: curY } : null));

        const boxLeft = Math.min(marqueeState.startX, curX);
        const boxRight = Math.max(marqueeState.startX, curX);
        const boxTop = Math.min(marqueeState.startY, curY);
        const boxBottom = Math.max(marqueeState.startY, curY);

        const hits: TimelineClip[] = [];
        timeline.tracks.forEach((tr, trIdx) => {
          const trTop = trIdx * 48;
          const trBottom = trTop + 48;
          if (trBottom >= boxTop && trTop <= boxBottom) {
            tr.clips.forEach((c) => {
              const cLeft = c.timelineRange.start * pixelsPerFrame;
              const cRight = (c.timelineRange.start + c.timelineRange.duration) * pixelsPerFrame;
              if (cRight >= boxLeft && cLeft <= boxRight) {
                hits.push(c);
              }
            });
          }
        });

        let result = hits;
        if (marqueeState.isAdditive) {
          const existing = timeline.tracks.flatMap((t) => t.clips).filter((c) => marqueeState.initialSelectedIds.includes(c.id));
          const combined = [...existing];
          for (const h of hits) {
            if (!combined.some((ex) => ex.id === h.id)) combined.push(h);
          }
          result = combined;
        }

        if (onSelectClips) {
          onSelectClips(result);
        } else if (result.length > 0) {
          onSelectClip(result[0]);
        }
        return;
      }

      // 3. Clip Dragging (Single or Multi-Clip)
      if (dragState) {
        const deltaX = e.clientX - dragState.startX;
        let deltaFrames = Math.round(deltaX / pixelsPerFrame);

        // Detect track lane index from clientY for vertical dragging
        if (dragState.type === "MOVE") {
          const lanesElement = document.getElementById("timeline-lanes-container");
          if (lanesElement) {
            const rect = lanesElement.getBoundingClientRect();
            const relativeY = e.clientY - rect.top;
            const trackIndex = Math.floor(relativeY / 48);
            if (trackIndex >= 0 && trackIndex < timeline.tracks.length) {
              setDragHoverTrackId(timeline.tracks[trackIndex].id);
            }
          }
        }

        if (isSnapping && dragState.type === "MOVE") {
          const proposedStart = dragState.initialStart + deltaFrames;
          const proposedEnd = proposedStart + dragState.initialDuration;
          if (Math.abs(proposedStart - currentFrame) <= 6) {
            deltaFrames = currentFrame - dragState.initialStart;
          } else if (Math.abs(proposedEnd - currentFrame) <= 6) {
            deltaFrames = currentFrame - (dragState.initialStart + dragState.initialDuration);
          }
          for (const t of timeline.tracks) {
            for (const c of t.clips) {
              if (c.id === dragState.clipId) continue;
              const cStart = c.timelineRange.start;
              const cEnd = cStart + c.timelineRange.duration;
              if (Math.abs(proposedStart - cEnd) <= 6) {
                deltaFrames = cEnd - dragState.initialStart;
                break;
              }
              if (Math.abs(proposedEnd - cStart) <= 6) {
                deltaFrames = cStart - (dragState.initialStart + dragState.initialDuration);
                break;
              }
            }
          }
        }

        setDragState((prev) => (prev ? { ...prev, currentDeltaFrames: deltaFrames } : null));
      }
    };

    const handleWindowMouseUp = () => {
      if (panState) {
        setPanState(null);
      }

      if (marqueeState) {
        const dist = Math.hypot(marqueeState.currentX - marqueeState.startX, marqueeState.currentY - marqueeState.startY);
        if (dist < 4 && !marqueeState.isAdditive) {
          onSelectClips ? onSelectClips([]) : onSelectClip(null as any);
        }
        setMarqueeState(null);
      }

      if (dragState) {
        const { type, clipId, trackId, initialStart, initialDuration, currentDeltaFrames, multiClips } = dragState;
        if (currentDeltaFrames !== 0 || (dragHoverTrackId && dragHoverTrackId !== trackId)) {
          if (type === "MOVE") {
            if (multiClips && multiClips.length > 1) {
              const moves = multiClips.map((mc) => ({
                clipId: mc.clipId,
                newStart: Math.max(0, mc.initialStart + currentDeltaFrames),
                sourceTrackId: mc.trackId,
                targetTrackId: mc.trackId,
              }));
              if (onMoveClips) {
                onMoveClips(moves);
              } else {
                for (const m of moves) {
                  onMoveClip?.(m.clipId, m.newStart, m.sourceTrackId);
                }
              }
            } else {
              const newStart = Math.max(0, initialStart + currentDeltaFrames);
              const finalTrackId = dragHoverTrackId || trackId;
              onMoveClip?.(clipId, newStart, trackId, finalTrackId);
            }
          } else if (type === "TRIM_START") {
            const newStart = Math.max(0, initialStart + currentDeltaFrames);
            onTrimClip?.(clipId, "START", newStart, trackId);
          } else if (type === "TRIM_END") {
            const newEnd = Math.max(initialStart + 6, initialStart + initialDuration + currentDeltaFrames);
            onTrimClip?.(clipId, "END", newEnd, trackId);
          }
        }
        setDragState(null);
        setDragHoverTrackId(null);
      }
    };

    if (dragState || marqueeState || panState) {
      window.addEventListener("mousemove", handleWindowMouseMove);
      window.addEventListener("mouseup", handleWindowMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [dragState, marqueeState, panState, pixelsPerFrame, isSnapping, currentFrame, timeline, dragHoverTrackId, onMoveClip, onMoveClips, onTrimClip, onSelectClips, onSelectClip]);

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



  const triggerCutFlash = (trackId: string, frame: number) => {
    setCutFlash({ trackId, frame });
    setTimeout(() => setCutFlash(null), 200);
  };

  // Split Selected Clip(s) at Playhead or Split ALL Clips under Playhead across all unlocked tracks
  const handleSplitAtPlayhead = () => {
    // 1. If clips are explicitly selected, find all selected clips intersecting currentFrame
    if (activeSelectedIds.length > 0) {
      const targetSplits: { clipId: string; frame: number; trackId: string }[] = [];
      for (const track of timeline.tracks) {
        if (lockedTracks[track.id]) continue;
        for (const clip of track.clips) {
          if (activeSelectedIds.includes(clip.id)) {
            const clipStart = clip.timelineRange.start;
            const clipEnd = clipStart + clip.timelineRange.duration;
            if (currentFrame > clipStart + 2 && currentFrame < clipEnd - 2) {
              targetSplits.push({ clipId: clip.id, frame: currentFrame, trackId: track.id });
              triggerCutFlash(track.id, currentFrame);
            }
          }
        }
      }

      if (targetSplits.length > 0) {
        if (onSplitClips) {
          onSplitClips(targetSplits);
        } else {
          for (const s of targetSplits) {
            onSplitClip(s.clipId, s.frame, s.trackId);
          }
        }
        showToast(`Split ${targetSplits.length} selected clip${targetSplits.length > 1 ? "s" : ""} at frame ${currentFrame}`);
        return;
      }
    }

    // 2. If NO clip is selected (or selected clips don't intersect playhead):
    // Standard professional NLE behavior: Split ALL intersecting clips across all unlocked tracks at current playhead!
    const allSplits: { clipId: string; frame: number; trackId: string }[] = [];
    for (const track of timeline.tracks) {
      if (lockedTracks[track.id]) continue;
      const intersectingClip = track.clips.find(
        (c) => currentFrame > c.timelineRange.start + 2 && currentFrame < c.timelineRange.start + c.timelineRange.duration - 2
      );
      if (intersectingClip) {
        allSplits.push({ clipId: intersectingClip.id, frame: currentFrame, trackId: track.id });
        triggerCutFlash(track.id, currentFrame);
      }
    }

    if (allSplits.length > 0) {
      if (onSplitClips) {
        onSplitClips(allSplits);
      } else {
        for (const s of allSplits) {
          onSplitClip(s.clipId, s.frame, s.trackId);
        }
      }
      showToast(`Split all ${allSplits.length} track${allSplits.length > 1 ? "s" : ""} at frame ${currentFrame}`);
    } else {
      showToast(`No clips under playhead at frame ${currentFrame} to split`);
    }
  };

  // Delete Selected Clip
  const handleDeleteSelectedClip = (ripple = false) => {
    if (!selectedClipObj) return;
    if (lockedTracks[selectedClipObj.trackId]) return;
    onDeleteClip?.(selectedClipObj.clip.id, selectedClipObj.trackId, ripple);
  };

  // Q: Trim Left Edge / Start of clip to playhead (Cutting from start edge)
  const handleTrimStartToPlayhead = () => {
    let targetClip: TimelineClip | null = null;
    let targetTrackId: string | null = null;

    if (selectedClipObj && !lockedTracks[selectedClipObj.trackId]) {
      const { clip, trackId } = selectedClipObj;
      const start = clip.timelineRange.start;
      const end = start + clip.timelineRange.duration;
      if (currentFrame > start && currentFrame < end) {
        targetClip = clip;
        targetTrackId = trackId;
      }
    }

    if (!targetClip) {
      for (const track of timeline.tracks) {
        if (lockedTracks[track.id]) continue;
        const hit = track.clips.find(
          (c) => currentFrame > c.timelineRange.start && currentFrame < c.timelineRange.start + c.timelineRange.duration
        );
        if (hit) {
          targetClip = hit;
          targetTrackId = track.id;
          break;
        }
      }
    }

    if (targetClip && targetTrackId) {
      onTrimClip?.(targetClip.id, "START", currentFrame, targetTrackId);
      showToast(`Cut left edge of "${targetClip.name}" to frame ${currentFrame} (Q)`);
    } else {
      showToast(`No clip under playhead to trim left edge`);
    }
  };

  // W: Trim Right Edge / End of clip to playhead (Cutting from end edge)
  const handleTrimEndToPlayhead = () => {
    let targetClip: TimelineClip | null = null;
    let targetTrackId: string | null = null;

    if (selectedClipObj && !lockedTracks[selectedClipObj.trackId]) {
      const { clip, trackId } = selectedClipObj;
      const start = clip.timelineRange.start;
      const end = start + clip.timelineRange.duration;
      if (currentFrame > start && currentFrame < end) {
        targetClip = clip;
        targetTrackId = trackId;
      }
    }

    if (!targetClip) {
      for (const track of timeline.tracks) {
        if (lockedTracks[track.id]) continue;
        const hit = track.clips.find(
          (c) => currentFrame > c.timelineRange.start && currentFrame < c.timelineRange.start + c.timelineRange.duration
        );
        if (hit) {
          targetClip = hit;
          targetTrackId = track.id;
          break;
        }
      }
    }

    if (targetClip && targetTrackId) {
      onTrimClip?.(targetClip.id, "END", currentFrame, targetTrackId);
      showToast(`Cut right edge of "${targetClip.name}" to frame ${currentFrame} (W)`);
    } else {
      showToast(`No clip under playhead to trim right edge`);
    }
  };

  const toggleSolo = (trackId: string) => {
    const willSolo = !soloTracks[trackId];
    setSoloTracks((prev) => ({ ...prev, [trackId]: willSolo }));
    onToggleTrackSolo?.(trackId);
    const track = timeline.tracks.find((t) => t.id === trackId);
    const clean = track?.name.replace(/^(V\d+|A\d+|G\d+|FX\d+):\s*/i, "") || "Track";
    showToast(`Track "${clean}" ${willSolo ? "Solo Active" : "Unsoloed"} (S)`);
  };

  const toggleMute = (trackId: string) => {
    const willMute = !mutedTracks[trackId];
    setMutedTracks((prev) => ({ ...prev, [trackId]: willMute }));
    onToggleTrackMute?.(trackId);
    const track = timeline.tracks.find((t) => t.id === trackId);
    const clean = track?.name.replace(/^(V\d+|A\d+|G\d+|FX\d+):\s*/i, "") || "Track";
    showToast(`Track "${clean}" ${willMute ? "Muted" : "Active"} (M)`);
  };

  const toggleLock = (trackId: string) => {
    const willLock = !lockedTracks[trackId];
    setLockedTracks((prev) => ({ ...prev, [trackId]: willLock }));
    onToggleTrackLock?.(trackId);
    const track = timeline.tracks.find((t) => t.id === trackId);
    const clean = track?.name.replace(/^(V\d+|A\d+|G\d+|FX\d+):\s*/i, "") || "Track";
    showToast(`Track "${clean}" ${willLock ? "Locked" : "Unlocked"} (L)`);
  };

  const handleStartRenameTrack = (track: TimelineTrack) => {
    setEditingTrackId(track.id);
    const cleanName = track.name.replace(/^(V\d+|A\d+|G\d+|FX\d+):\s*/i, "");
    setEditingTrackName(cleanName || track.name);
    setTrackContextMenu(null);
  };

  const handleCommitRenameTrack = (trackId: string) => {
    if (editingTrackName.trim()) {
      const cleanName = editingTrackName.trim();
      onRenameTrack?.(trackId, cleanName);
      showToast(`Renamed track to "${cleanName}"`);
    }
    setEditingTrackId(null);
  };

  const handleMoveTrackOrder = (trackId: string, direction: "UP" | "DOWN") => {
    const idx = timeline.tracks.findIndex((t) => t.id === trackId);
    if (idx === -1) return;
    const currentTrack = timeline.tracks[idx];
    const isAudio = currentTrack.type === "AUDIO";

    // Reorder within the same bus tier (video vs audio)
    let targetIdx = -1;
    if (direction === "UP") {
      for (let i = idx - 1; i >= 0; i--) {
        if ((timeline.tracks[i].type === "AUDIO") === isAudio) {
          targetIdx = i;
          break;
        }
      }
    } else {
      for (let i = idx + 1; i < timeline.tracks.length; i++) {
        if ((timeline.tracks[i].type === "AUDIO") === isAudio) {
          targetIdx = i;
          break;
        }
      }
    }

    if (targetIdx === -1) return;

    const newTracks = [...timeline.tracks];
    const [moved] = newTracks.splice(idx, 1);
    newTracks.splice(targetIdx, 0, moved);
    newTracks.forEach((t, i) => {
      t.index = i;
    });
    onReorderTracks?.(newTracks);
    setTrackContextMenu(null);
    const clean = currentTrack.name.replace(/^(V\d+|A\d+|G\d+|FX\d+):\s*/i, "");
    showToast(`Moved track "${clean}" ${direction === "UP" ? "up" : "down"} (⌥${direction === "UP" ? "↑" : "↓"})`);
  };

  const handleReorderTrackDrop = (sourceId: string, targetId: string, position: "BEFORE" | "AFTER") => {
    if (sourceId === targetId) return;
    const sourceIdx = timeline.tracks.findIndex((t) => t.id === sourceId);
    const targetIdx = timeline.tracks.findIndex((t) => t.id === targetId);
    if (sourceIdx === -1 || targetIdx === -1) return;

    const sourceTrack = timeline.tracks[sourceIdx];
    const targetTrack = timeline.tracks[targetIdx];

    // Enforce tier consistency: video tracks reorder within video tier, audio within audio tier
    const sourceIsAudio = sourceTrack.type === "AUDIO";
    const targetIsAudio = targetTrack.type === "AUDIO";
    if (sourceIsAudio !== targetIsAudio) {
      showToast(`Cannot move ${sourceTrack.type.toLowerCase()} track into ${targetTrack.type.toLowerCase()} section`);
      return;
    }

    const newTracks = [...timeline.tracks];
    const [moved] = newTracks.splice(sourceIdx, 1);
    let insertIdx = newTracks.findIndex((t) => t.id === targetId);
    if (position === "AFTER") {
      insertIdx += 1;
    }
    newTracks.splice(insertIdx, 0, moved);
    newTracks.forEach((t, i) => {
      t.index = i;
    });
    onReorderTracks?.(newTracks);
    const clean = sourceTrack.name.replace(/^(V\d+|A\d+|G\d+|FX\d+):\s*/i, "");
    showToast(`Reordered track "${clean}"`);
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
          minHeight: "38px",
          padding: "0 12px",
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border)",
          gap: "10px",
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        {/* Left: Professional Toolset (Segmented Modes, Snap, Magnetic, Marker, Split, Delete) */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          {/* Unified Tool Modes Segmented Control */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "var(--bg-subtle)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              padding: "2px",
              gap: "2px",
              flexShrink: 0,
            }}
          >
            {(
              [
                { id: "SELECT", label: "Select", key: "V", icon: MousePointer },
                { id: "RAZOR", label: "Razor", key: "C", icon: Scissors },
                { id: "RIPPLE", label: "Ripple", key: "B", icon: ChevronsLeftRight },
                { id: "ROLL", label: "Roll", key: "N", icon: ArrowRightLeft },
                { id: "SLIP", label: "Slip", key: "Y", icon: MoveHorizontal },
              ] as const
            ).map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    height: "24px",
                    padding: "0 7px",
                    borderRadius: "3px",
                    border: "none",
                    background: isActive ? "var(--bg-surface)" : "transparent",
                    color: isActive ? "var(--accent)" : "var(--text-secondary)",
                    boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                    fontSize: "11px",
                    fontWeight: isActive ? 600 : 500,
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    lineHeight: 1,
                    userSelect: "none",
                    flexShrink: 0,
                    transition: "all 0.1s ease",
                  }}
                  title={`${tool.label} Tool (${tool.key})`}
                  aria-label={`${tool.label} Tool (${tool.key})`}
                >
                  <Icon size={12} />
                  <span>{tool.label}</span>
                  <kbd style={{ fontSize: "9px", opacity: isActive ? 0.9 : 0.55, fontFamily: "monospace" }}>{tool.key}</kbd>
                </button>
              );
            })}
          </div>

          <div className="divider-vert" style={{ height: "16px", margin: "0 2px" }} />

          {/* Snap & Magnetic Toggles Segmented Group */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "var(--bg-subtle)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              padding: "2px",
              gap: "2px",
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => setIsSnapping(!isSnapping)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                height: "24px",
                padding: "0 7px",
                borderRadius: "3px",
                border: "none",
                background: isSnapping ? "var(--bg-surface)" : "transparent",
                color: isSnapping ? "var(--accent)" : "var(--text-muted)",
                boxShadow: isSnapping ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                fontSize: "11px",
                fontWeight: isSnapping ? 600 : 500,
                whiteSpace: "nowrap",
                cursor: "pointer",
                lineHeight: 1,
                flexShrink: 0,
                transition: "all 0.1s ease",
              }}
              title="Snap to Edges & Playhead (S)"
            >
              <Magnet size={12} />
              <span>Snap</span>
              <span style={{ fontSize: "9px", fontWeight: 700, color: isSnapping ? "var(--accent)" : "var(--text-muted)", fontFamily: "monospace" }}>
                {isSnapping ? "ON" : "OFF"}
              </span>
            </button>

            <button
              onClick={() => setIsMagnetic?.(!isMagnetic)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                height: "24px",
                padding: "0 7px",
                borderRadius: "3px",
                border: "none",
                background: isMagnetic ? "var(--bg-surface)" : "transparent",
                color: isMagnetic ? "var(--accent)" : "var(--text-muted)",
                boxShadow: isMagnetic ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                fontSize: "11px",
                fontWeight: isMagnetic ? 600 : 500,
                whiteSpace: "nowrap",
                cursor: "pointer",
                lineHeight: 1,
                flexShrink: 0,
                transition: "all 0.1s ease",
              }}
              title="Magnetic Timeline (Ripple edit closes gaps)"
            >
              <Compass size={12} />
              <span>Magnetic</span>
              <span style={{ fontSize: "9px", fontWeight: 700, color: isMagnetic ? "var(--accent)" : "var(--text-muted)", fontFamily: "monospace" }}>
                {isMagnetic ? "ON" : "OFF"}
              </span>
            </button>
          </div>

          <div className="divider-vert" style={{ height: "16px", margin: "0 2px" }} />

          {/* Quick Marker, Cut & Delete Buttons */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
            <button
              onClick={handleAddMarker ? () => handleAddMarker(currentFrame, "Scene Marker") : undefined}
              className="btn-icon-subtle"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                height: "26px",
                padding: "0 7px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                background: "var(--bg-subtle)",
                color: "var(--text-secondary)",
                fontSize: "11px",
                fontWeight: 500,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
              title="Add Timeline Marker at Playhead (M)"
            >
              <Bookmark size={12} />
              <span>Marker</span>
              <kbd style={{ fontSize: "9px", opacity: 0.6, fontFamily: "monospace" }}>M</kbd>
            </button>

            <button
              onClick={handleSplitAtPlayhead}
              disabled={!selectedClipObj}
              className="btn-icon-subtle"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                height: "26px",
                padding: "0 7px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                background: "var(--bg-subtle)",
                color: selectedClipObj ? "var(--text-primary)" : "var(--text-muted)",
                fontSize: "11px",
                fontWeight: 500,
                whiteSpace: "nowrap",
                flexShrink: 0,
                cursor: selectedClipObj ? "pointer" : "not-allowed",
                opacity: selectedClipObj ? 1 : 0.45,
              }}
              title="Split selected clip at playhead (⌘B)"
            >
              <Split size={12} />
              <span>Split</span>
              <kbd style={{ fontSize: "9px", opacity: 0.6, fontFamily: "monospace" }}>⌘B</kbd>
            </button>

            <button
              onClick={() => handleDeleteSelectedClip(false)}
              disabled={!selectedClipObj}
              className="btn-icon-subtle"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                height: "26px",
                padding: "0 7px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                background: "var(--bg-subtle)",
                color: selectedClipObj ? "var(--danger)" : "var(--text-muted)",
                fontSize: "11px",
                fontWeight: 500,
                whiteSpace: "nowrap",
                flexShrink: 0,
                cursor: selectedClipObj ? "pointer" : "not-allowed",
                opacity: selectedClipObj ? 1 : 0.45,
              }}
              title="Delete selected clip (Backspace / Delete)"
            >
              <Trash2 size={12} />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Center: Timeline Track Metadata */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "11px",
            color: "var(--text-secondary)",
            whiteSpace: "nowrap",
            flexShrink: 0,
            padding: "0 6px",
          }}
        >
          <span>
            Target: <strong style={{ color: "var(--accent)", fontFamily: "monospace" }}>{targetTrackId.replace("trk_", "").toUpperCase().slice(0, 2)}</strong>
          </span>
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

        {/* Right: Reset Timeline, Track Height, Zoom Level & Fit Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0, whiteSpace: "nowrap" }}>
          {onResetTimeline && (
            <button
              onClick={onResetTimeline}
              className="btn-icon-subtle"
              style={{
                padding: "0 7px",
                height: "26px",
                fontSize: "10px",
                fontWeight: 600,
                borderRadius: "3px",
                border: "1px solid var(--border)",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
              title="Reset Timeline to clean initial cut"
            >
              <RotateCcw size={11} />
              <span>Reset</span>
            </button>
          )}

          {/* Track Height Toggle */}
          <button
            onClick={() => {
              const nextMode = trackHeightMode === "STANDARD" ? "COMPACT" : trackHeightMode === "COMPACT" ? "EXPANDED" : "STANDARD";
              setTrackHeightMode(nextMode);
              showToast(`Track Height: ${nextMode === "COMPACT" ? "Compact (36px)" : nextMode === "EXPANDED" ? "Expanded (70px)" : "Standard (48px)"}`);
            }}
            className="btn-icon-subtle"
            style={{
              padding: "0 7px",
              height: "26px",
              fontSize: "10px",
              fontWeight: 600,
              borderRadius: "3px",
              border: "1px solid var(--border)",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              whiteSpace: "nowrap",
              flexShrink: 0,
              background: trackHeightMode !== "STANDARD" ? "var(--bg-active)" : "transparent",
            }}
            title={`Toggle Track Height: Compact / Normal / Tall (Currently ${trackHeightMode.toLowerCase()})`}
          >
            <Layers size={11} />
            <span>{trackHeightMode === "COMPACT" ? "Compact" : trackHeightMode === "EXPANDED" ? "Tall" : "Normal"}</span>
          </button>

          <button
            onClick={handleZoomFit}
            className="btn-icon-subtle"
            style={{
              padding: "0 7px",
              height: "26px",
              fontSize: "10px",
              fontWeight: 700,
              borderRadius: "3px",
              border: "1px solid var(--border)",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
            title="Fit Entire Timeline in View (Shift+Z)"
          >
            Fit (⇧Z)
          </button>
          <button
            onClick={() => setZoomLevel(Math.max(0.4, parseFloat((zoomLevel - 0.2).toFixed(2))))}
            className="btn-icon-subtle"
            style={{ padding: "0 6px", height: "26px", whiteSpace: "nowrap", flexShrink: 0 }}
            title="Zoom Out (Cmd -)"
            aria-label="Zoom Out"
          >
            <ZoomOut size={13} />
          </button>
          <span style={{ fontSize: "11px", fontFamily: "monospace", color: "var(--text-muted)", minWidth: "32px", textAlign: "center", whiteSpace: "nowrap" }}>
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel(Math.min(3.0, parseFloat((zoomLevel + 0.2).toFixed(2))))}
            className="btn-icon-subtle"
            style={{ padding: "0 6px", height: "26px", whiteSpace: "nowrap", flexShrink: 0 }}
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
          ref={trackHeadersRef}
          onWheel={(e) => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop += e.deltaY;
            }
          }}
          style={{
            width: "240px",
            minWidth: "240px",
            background: "var(--bg-surface)",
            borderRight: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 10,
            userSelect: "none",
          }}
        >
          {/* Track Header Top Bar */}
          <div
            style={{
              height: "26px",
              borderBottom: "1px solid var(--border)",
              background: "var(--bg-subtle)",
              padding: "0 8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Tracks
              </span>
              <button
                onClick={() => {
                  setTrackHeightMode((prev) =>
                    prev === "COMPACT" ? "STANDARD" : prev === "STANDARD" ? "EXPANDED" : "COMPACT"
                  );
                }}
                className="btn-icon-subtle"
                style={{
                  padding: "1px 5px",
                  fontSize: "9px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  borderRadius: "3px",
                  border: "1px solid var(--border)",
                  background: "var(--bg-card)",
                }}
                title={`Track Height: ${trackHeightMode} (Click to switch Compact 36px / Standard 48px / Expanded 70px)`}
              >
                {trackHeightMode === "COMPACT" ? "36px" : trackHeightMode === "EXPANDED" ? "70px" : "48px"}
              </button>
            </div>

            {/* Quick Add Track Buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
              <button
                onClick={() => onAddTrack?.("VIDEO")}
                style={{
                  padding: "2px 5px",
                  fontSize: "9px",
                  fontWeight: 700,
                  borderRadius: "3px",
                  border: "1px solid rgba(59, 130, 246, 0.4)",
                  background: "rgba(59, 130, 246, 0.1)",
                  color: "var(--accent)",
                  cursor: "pointer",
                }}
                title="Add Video Track (+V)"
              >
                +V
              </button>
              <button
                onClick={() => onAddTrack?.("AUDIO")}
                style={{
                  padding: "2px 5px",
                  fontSize: "9px",
                  fontWeight: 700,
                  borderRadius: "3px",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                  background: "rgba(16, 185, 129, 0.1)",
                  color: "var(--success)",
                  cursor: "pointer",
                }}
                title="Add Audio Track (+A)"
              >
                +A
              </button>
            </div>
          </div>

          {timeline.tracks.map((track, idx) => {
            const isTarget = targetTrackId === track.id;
            const isMuted = !!mutedTracks[track.id];
            const isSolo = !!soloTracks[track.id];
            const isLocked = !!lockedTracks[track.id];
            const isAudio = track.type === "AUDIO";
            const prevTrack = idx > 0 ? timeline.tracks[idx - 1] : null;
            const showAudioDivider = isAudio && prevTrack && prevTrack.type !== "AUDIO";

            return (
              <React.Fragment key={track.id}>
                {showAudioDivider && (
                  <div
                    style={{
                      height: "22px",
                      background: "rgba(16, 185, 129, 0.08)",
                      borderTop: "1px solid rgba(16, 185, 129, 0.2)",
                      borderBottom: "1px solid rgba(16, 185, 129, 0.2)",
                      padding: "0 8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 700,
                        color: "var(--success)",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Audio Tracks
                    </span>
                    <button
                      onClick={() => onAddTrack?.("AUDIO")}
                      className="btn-icon-subtle"
                      style={{ padding: "1px 4px", fontSize: "9px", color: "var(--success)" }}
                      title="Add Audio Track"
                    >
                      + Audio
                    </button>
                  </div>
                )}

                <div
                  draggable={!isLocked && editingTrackId !== track.id}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/x-track-id", track.id);
                    e.dataTransfer.effectAllowed = "move";
                    setDraggedTrackId(track.id);
                  }}
                  onDragEnd={() => {
                    setDraggedTrackId(null);
                    setDragOverTrackState(null);
                  }}
                  onDragOver={(e) => {
                    if (!draggedTrackId || draggedTrackId === track.id) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    const rect = e.currentTarget.getBoundingClientRect();
                    const position = e.clientY < rect.top + rect.height / 2 ? "BEFORE" : "AFTER";
                    if (!dragOverTrackState || dragOverTrackState.targetId !== track.id || dragOverTrackState.position !== position) {
                      setDragOverTrackState({ targetId: track.id, position });
                    }
                  }}
                  onDragLeave={(e) => {
                    const related = e.relatedTarget as HTMLElement;
                    if (!e.currentTarget.contains(related)) {
                      if (dragOverTrackState?.targetId === track.id) {
                        setDragOverTrackState(null);
                      }
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const sourceId = e.dataTransfer.getData("application/x-track-id") || draggedTrackId;
                    if (sourceId && sourceId !== track.id) {
                      handleReorderTrackDrop(sourceId, track.id, dragOverTrackState?.position ?? "BEFORE");
                    }
                    setDraggedTrackId(null);
                    setDragOverTrackState(null);
                  }}
                  onClick={() => handleSetTargetTrack(track.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setTrackContextMenu({
                      x: e.clientX,
                      y: e.clientY,
                      anchorTop: e.clientY,
                      anchorBottom: e.clientY,
                      track,
                    });
                  }}
                  style={{
                    height: `${trackHeightPx}px`,
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 6px 0 4px",
                    background: isTarget
                      ? "rgba(79, 115, 247, 0.09)"
                      : isLocked
                      ? "rgba(0,0,0,0.02)"
                      : "transparent",
                    cursor: isLocked ? "default" : draggedTrackId === track.id ? "grabbing" : "grab",
                    transition: "background 0.15s ease, box-shadow 0.1s ease",
                    borderLeft: isTarget
                      ? `3px solid ${isAudio ? "var(--success)" : "var(--accent)"}`
                      : "3px solid transparent",
                    position: "relative",
                    opacity: draggedTrackId === track.id ? 0.4 : 1.0,
                    boxShadow:
                      dragOverTrackState?.targetId === track.id
                        ? dragOverTrackState.position === "BEFORE"
                          ? `inset 0 3px 0 0 ${isAudio ? "var(--success)" : "var(--accent)"}, 0 -2px 6px rgba(79,115,247,0.3)`
                          : `inset 0 -3px 0 0 ${isAudio ? "var(--success)" : "var(--accent)"}, 0 2px 6px rgba(79,115,247,0.3)`
                        : "none",
                  }}
                >
                  {/* Left: Grip Handle + Target Patching + Track Name */}
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", minWidth: 0, flex: 1 }}>
                    {/* Reorder Drag Grip Handle */}
                    <div
                      title={isLocked ? "Track is locked" : "Drag to reorder track"}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-muted)",
                        opacity: isLocked ? 0.25 : 0.6,
                        cursor: isLocked ? "not-allowed" : "grab",
                        padding: "2px 0",
                        flexShrink: 0,
                      }}
                    >
                      <GripVertical size={13} />
                    </div>

                    {/* Target Patch Button [V1] / [A1] */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetTargetTrack(track.id);
                      }}
                      style={{
                        padding: "1px 5px",
                        fontSize: "10px",
                        fontWeight: 700,
                        fontFamily: "monospace",
                        borderRadius: "3px",
                        border: isTarget
                          ? `1px solid ${isAudio ? "var(--success)" : "var(--accent)"}`
                          : "1px solid var(--border)",
                        background: isTarget
                          ? isAudio
                            ? "rgba(16, 185, 129, 0.18)"
                            : "rgba(79, 115, 247, 0.18)"
                          : "var(--bg-subtle)",
                        color: isTarget
                          ? isAudio
                            ? "var(--success)"
                            : "var(--accent)"
                          : "var(--text-muted)",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                      title={`Target Track: ${track.id.replace("trk_", "").toUpperCase().slice(0, 2)} (Click to set as active target)`}
                    >
                      {track.id.replace("trk_", "").toUpperCase().slice(0, 2)}
                    </button>

                    {/* Track Name (Inline Editable) */}
                    {editingTrackId === track.id ? (
                      <input
                        autoFocus
                        value={editingTrackName}
                        onChange={(e) => setEditingTrackName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCommitRenameTrack(track.id);
                          if (e.key === "Escape") setEditingTrackId(null);
                        }}
                        onBlur={() => handleCommitRenameTrack(track.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          background: "var(--bg-card)",
                          border: "1px solid var(--accent)",
                          color: "var(--text-primary)",
                          borderRadius: "2px",
                          padding: "1px 4px",
                          width: "80px",
                        }}
                      />
                    ) : (
                      <span
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleStartRenameTrack(track);
                        }}
                        title="Double-click to rename track"
                        style={{
                          fontSize: "11px",
                          fontWeight: isTarget ? 600 : 500,
                          color: isLocked
                            ? "var(--text-muted)"
                            : isTarget
                            ? "var(--text-primary)"
                            : "var(--text-secondary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "75px",
                        }}
                      >
                        {track.name}
                      </span>
                    )}
                  </div>

                  {/* Right: Mute/Eye, Solo, Lock, Volume, Quick Reorder Chevrons & Menu */}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: "2px" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Audio Volume Pill */}
                    {isAudio && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveVolumeTrackId(activeVolumeTrackId === track.id ? null : track.id);
                        }}
                        style={{
                          padding: "1px 4px",
                          fontSize: "9px",
                          fontFamily: "monospace",
                          borderRadius: "2px",
                          border: "1px solid var(--border)",
                          background: "var(--bg-subtle)",
                          color: (track.volume ?? 0) !== 0 ? "var(--accent)" : "var(--text-muted)",
                          cursor: "pointer",
                        }}
                        title={`Volume: ${(track.volume ?? 0) >= 0 ? "+" : ""}${track.volume ?? 0}dB (Click to adjust)`}
                      >
                        {(track.volume ?? 0) >= 0 ? `+${track.volume ?? 0}` : `${track.volume}dB`}
                      </button>
                    )}

                    {/* Lock Toggle */}
                    <button
                      onClick={() => toggleLock(track.id)}
                      className="btn-icon-subtle"
                      style={{ padding: "2px 2px", color: isLocked ? "var(--warning)" : "var(--text-muted)" }}
                      title={isLocked ? "Unlock Track" : "Lock Track (Protect from Edits)"}
                    >
                      {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                    </button>

                    {/* Solo Toggle */}
                    <button
                      onClick={() => toggleSolo(track.id)}
                      style={{
                        padding: "2px 3px",
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

                    {/* Mute / Video Visibility Toggle */}
                    <button
                      onClick={() => toggleMute(track.id)}
                      className="btn-icon-subtle"
                      style={{ padding: "2px 2px" }}
                      title={
                        isAudio
                          ? isMuted
                            ? "Unmute Audio Track"
                            : "Mute Audio Track"
                          : isMuted
                          ? "Enable Video Track Output"
                          : "Disable Video Track Output"
                      }
                    >
                      {isAudio ? (
                        isMuted ? (
                          <VolumeX size={12} style={{ color: "var(--danger)" }} />
                        ) : (
                          <Volume2 size={12} style={{ color: "var(--text-muted)" }} />
                        )
                      ) : isMuted ? (
                        <EyeOff size={12} style={{ color: "var(--danger)" }} />
                      ) : (
                        <Eye size={12} style={{ color: "var(--text-muted)" }} />
                      )}
                    </button>

                    {/* Quick Reorder Chevrons (Move Up / Down) */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "1px", flexShrink: 0 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveTrackOrder(track.id, "UP");
                        }}
                        className="btn-icon-subtle"
                        style={{ padding: "0 1px", height: "9px", display: "flex", alignItems: "center", justifyContent: "center" }}
                        title="Move Track Up (⌥↑)"
                      >
                        <ChevronUp size={9} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveTrackOrder(track.id, "DOWN");
                        }}
                        className="btn-icon-subtle"
                        style={{ padding: "0 1px", height: "9px", display: "flex", alignItems: "center", justifyContent: "center" }}
                        title="Move Track Down (⌥↓)"
                      >
                        <ChevronDown size={9} />
                      </button>
                    </div>

                    {/* Track Options Menu Trigger */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTrackContextMenu({
                          x: rect.left,
                          y: rect.top,
                          anchorTop: rect.top,
                          anchorBottom: rect.bottom,
                          track,
                        });
                      }}
                      className="btn-icon-subtle"
                      style={{ padding: "2px 2px", color: "var(--text-muted)" }}
                      title="Track Options (Reorder, Rename, Delete...)"
                    >
                      <MoreVertical size={12} />
                    </button>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Scrollable Tracks & Timeline Lanes */}
        <div
          ref={scrollContainerRef}
          onWheel={handleWheel}
          onScroll={(e) => {
            const target = e.currentTarget;
            if (trackHeadersRef.current) {
              trackHeadersRef.current.scrollTop = target.scrollTop;
            }
            setScrollMetrics({
              scrollLeft: target.scrollLeft,
              scrollTop: target.scrollTop,
              scrollWidth: target.scrollWidth,
              clientWidth: target.clientWidth,
            });
          }}
          style={{
            flex: 1,
            overflowX: "auto",
            overflowY: "auto",
            position: "relative",
            cursor: isSpacePressed ? (panState ? "grabbing" : "grab") : undefined,
          }}
        >
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

            {/* Playhead Vertical Accent Line (Section 16) */}
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${currentFrame * pixelsPerFrame}px`,
                width: "2px",
                background: "var(--accent)",
                zIndex: 30,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "-5px",
                  width: "12px",
                  height: "14px",
                  background: "var(--accent)",
                  clipPath: "polygon(0 0, 100% 0, 100% 60%, 50% 100%, 0 60%)",
                }}
              />
            </div>

            {/* Multi-Track Clip Lanes Container */}
            <div
              id="timeline-lanes-container"
              style={{ position: "relative", minHeight: "100%" }}
              onMouseDown={(e) => {
                // If middle mouse (wheel click) or Space key is held -> start pan!
                if (e.button === 1 || (e.button === 0 && isSpacePressed)) {
                  e.preventDefault();
                  if (scrollContainerRef.current) {
                    setPanState({
                      startX: e.clientX,
                      startY: e.clientY,
                      initialScrollLeft: scrollContainerRef.current.scrollLeft,
                      initialScrollTop: scrollContainerRef.current.scrollTop,
                    });
                  }
                  return;
                }

                // If left click on track lane background -> start marquee selection!
                if (e.button === 0 && activeTool === "SELECT") {
                  const target = e.target as HTMLElement;
                  if (target.closest(".timeline-clip-card") || target.closest("button") || target.closest(".timeline-trim-handle")) {
                    return;
                  }

                  const lanesElement = document.getElementById("timeline-lanes-container");
                  if (!lanesElement) return;
                  const rect = lanesElement.getBoundingClientRect();
                  const startX = e.clientX - rect.left;
                  const startY = e.clientY - rect.top;

                  const isAdditive = e.shiftKey || e.metaKey || e.ctrlKey;
                  setMarqueeState({
                    startX,
                    startY,
                    currentX: startX,
                    currentY: startY,
                    isAdditive,
                    initialSelectedIds: isAdditive ? [...activeSelectedIds] : [],
                  });
                }
              }}
            >
              {/* Marquee Selection Rectangle Box */}
              {marqueeState && (
                <div
                  style={{
                    position: "absolute",
                    left: `${Math.min(marqueeState.startX, marqueeState.currentX)}px`,
                    top: `${Math.min(marqueeState.startY, marqueeState.currentY)}px`,
                    width: `${Math.abs(marqueeState.currentX - marqueeState.startX)}px`,
                    height: `${Math.abs(marqueeState.currentY - marqueeState.startY)}px`,
                    background: "rgba(79, 115, 247, 0.22)",
                    border: "1.5px dashed var(--accent)",
                    borderRadius: "2px",
                    zIndex: 55,
                    pointerEvents: "none",
                  }}
                />
              )}

              {timeline.tracks.map((track, idx) => {
                const isTrackMuted = !!mutedTracks[track.id];
                const isTrackLocked = !!lockedTracks[track.id];
                const hasAnySolo = Object.values(soloTracks).some(Boolean);
                const isTrackSoloed = !!soloTracks[track.id];
                const isTrackDimmed = isTrackMuted || (hasAnySolo && !isTrackSoloed);
                const isDragHoverTarget = dragHoverTrackId === track.id && dragState?.type === "MOVE";
                const isAudio = track.type === "AUDIO";
                const prevTrack = idx > 0 ? timeline.tracks[idx - 1] : null;
                const showAudioDivider = isAudio && prevTrack && prevTrack.type !== "AUDIO";

                return (
                  <React.Fragment key={track.id}>
                    {/* Synchronized Audio Bus Divider Bar Matching Track Headers */}
                    {showAudioDivider && (
                      <div
                        style={{
                          height: "22px",
                          background: "rgba(16, 185, 129, 0.04)",
                          borderTop: "1px solid rgba(16, 185, 129, 0.15)",
                          borderBottom: "1px solid rgba(16, 185, 129, 0.15)",
                          display: "flex",
                          alignItems: "center",
                          paddingLeft: "12px",
                          fontSize: "9px",
                          fontWeight: 700,
                          color: "rgba(16, 185, 129, 0.6)",
                          letterSpacing: "1px",
                          userSelect: "none",
                          pointerEvents: "none",
                        }}
                      >
                        ── AUDIO BUS ──
                      </div>
                    )}

                    <div
                      onDragOver={(e) => {
                        if (isTrackLocked) {
                          e.dataTransfer.dropEffect = "none";
                          return;
                        }
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "copy";
                        const targetFrame = calculateFrameFromX(e.clientX);
                        setDropGhost({
                          trackId: track.id,
                          startFrame: targetFrame,
                          durationFrames: 150,
                          title: "Drop to insert clip",
                        });
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setDropGhost(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDropGhost(null);
                        if (isTrackLocked) return;
                        try {
                          const raw = e.dataTransfer.getData("application/json");
                          if (!raw) return;
                          const data = JSON.parse(raw);
                          if (data && (data.type === "MEDIA_ASSET" || data.assetId)) {
                            const targetFrame = calculateFrameFromX(e.clientX);
                            onInsertClip?.(data, track.id, targetFrame);
                          }
                        } catch (err) {
                          console.error("Drop failed:", err);
                        }
                      }}
                      style={{
                        height: `${trackHeightPx}px`,
                        borderBottom: "1px solid var(--border)",
                        position: "relative",
                        background: isDragHoverTarget
                          ? "rgba(79, 115, 247, 0.16)"
                          : isTrackLocked
                          ? "repeating-linear-gradient(45deg, rgba(0,0,0,0.035), rgba(0,0,0,0.035) 10px, transparent 10px, transparent 20px)"
                          : isAudio
                          ? "rgba(16, 185, 129, 0.02)"
                          : "transparent",
                        outline: isDragHoverTarget ? "2px dashed var(--accent)" : "none",
                        outlineOffset: "-2px",
                        opacity: isTrackDimmed ? 0.38 : 1.0,
                        transition: "opacity 0.15s ease, background 0.12s ease",
                      }}
                    >
                      {/* Locked Track Lane Background Watermark */}
                      {isTrackLocked && (
                        <div
                          style={{
                            position: "absolute",
                            right: "20px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "9px",
                            fontWeight: 700,
                            color: "var(--text-muted)",
                            opacity: 0.35,
                            letterSpacing: "1px",
                            pointerEvents: "none",
                            userSelect: "none",
                            zIndex: 2,
                          }}
                        >
                          <Lock size={10} />
                          <span>TRACK LOCKED</span>
                        </div>
                      )}

                      {/* Muted Video/Audio Indicator */}
                      {isTrackMuted && (
                        <div
                          style={{
                            position: "absolute",
                            right: isTrackLocked ? "130px" : "20px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            fontSize: "9px",
                            fontWeight: 700,
                            color: "var(--danger)",
                            opacity: 0.45,
                            letterSpacing: "0.5px",
                            pointerEvents: "none",
                            userSelect: "none",
                            zIndex: 2,
                          }}
                        >
                          MUTED
                        </div>
                      )}

                      {/* Media Drop Ghost Indicator */}
                      {dropGhost && dropGhost.trackId === track.id && (
                        <div
                          style={{
                            position: "absolute",
                            top: "4px",
                            bottom: "4px",
                            left: `${dropGhost.startFrame * pixelsPerFrame}px`,
                            width: `${dropGhost.durationFrames * pixelsPerFrame}px`,
                            background: "rgba(79, 115, 247, 0.3)",
                            border: "2px dashed var(--accent)",
                            borderRadius: "var(--radius-sm)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#FFFFFF",
                            zIndex: 35,
                            pointerEvents: "none",
                          }}
                        >
                          + Insert Clip
                        </div>
                      )}

                      {/* Cut Flash Visual Confirmation */}
                      {cutFlash && cutFlash.trackId === track.id && (
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            bottom: 0,
                            left: `${cutFlash.frame * pixelsPerFrame - 1}px`,
                            width: "3px",
                            background: "#FFFFFF",
                            boxShadow: "0 0 12px #FFFFFF",
                            zIndex: 60,
                            pointerEvents: "none",
                          }}
                        />
                      )}

                    {/* Clips on Track */}
                    {track.clips.map((clip) => {
                      const multiClipInfo = dragState?.multiClips?.find((mc) => mc.clipId === clip.id);
                      const isMultiDragging = dragState?.type === "MOVE" && !!multiClipInfo;
                      const isDraggingThis = dragState?.clipId === clip.id || isMultiDragging;
                      let startFrame = clip.timelineRange.start;
                      let durationFrames = clip.timelineRange.duration;

                      if (isDraggingThis && dragState) {
                        if (dragState.type === "MOVE") {
                          const baseStart = multiClipInfo ? multiClipInfo.initialStart : clip.timelineRange.start;
                          startFrame = Math.max(0, baseStart + dragState.currentDeltaFrames);
                        } else if (dragState.type === "TRIM_START") {
                          const proposedStart = Math.max(0, clip.timelineRange.start + dragState.currentDeltaFrames);
                          const end = clip.timelineRange.start + clip.timelineRange.duration;
                          startFrame = Math.min(proposedStart, end - 4);
                          durationFrames = end - startFrame;
                        } else if (dragState.type === "TRIM_END") {
                          durationFrames = Math.max(4, clip.timelineRange.duration + dragState.currentDeltaFrames);
                        }
                      }

                      const left = startFrame * pixelsPerFrame;
                      const rawWidth = durationFrames * pixelsPerFrame;
                      const visualWidth = Math.max(3, rawWidth - 1);
                      const isSelected = activeSelectedIds.includes(clip.id);
                      const isAiHighlighted = highlightedClipIds.includes(clip.id);
                      const isAudio = track.type === "AUDIO";
                      const durationSec = (durationFrames / fps).toFixed(1);

                      return (
                        <div
                          key={clip.id}
                          className={`timeline-clip-card ${isSelected ? "selected" : ""}`}
                          title={`${clip.name} • ${durationSec}s [${startFrame}f - ${startFrame + durationFrames}f]`}
                          onMouseDown={(e) => {
                            if (lockedTracks[track.id]) return;
                            if (activeTool === "RAZOR") {
                              e.stopPropagation();
                              const clickFrame = calculateFrameFromX(e.clientX);
                              const clipStart = clip.timelineRange.start;
                              const clipEnd = clipStart + clip.timelineRange.duration;
                              if (clickFrame > clipStart + 2 && clickFrame < clipEnd - 2) {
                                triggerCutFlash(track.id, clickFrame);
                                onSplitClip(clip.id, clickFrame, track.id);
                              }
                              return;
                            }
                            if (activeTool === "SELECT") {
                              e.stopPropagation();
                              const isMultiKey = e.shiftKey || e.metaKey || e.ctrlKey;
                              let newSelectedClips: TimelineClip[] = [];

                              if (isMultiKey) {
                                const allClips = timeline.tracks.flatMap((t) => t.clips);
                                if (activeSelectedIds.includes(clip.id)) {
                                  newSelectedClips = allClips.filter((c) => activeSelectedIds.includes(c.id) && c.id !== clip.id);
                                } else {
                                  newSelectedClips = [...allClips.filter((c) => activeSelectedIds.includes(c.id)), clip];
                                }
                                onSelectClips?.(newSelectedClips, true);
                                if (newSelectedClips.length > 0) onSelectClip(newSelectedClips[0]);
                              } else {
                                if (activeSelectedIds.includes(clip.id) && activeSelectedIds.length > 1) {
                                  const allClips = timeline.tracks.flatMap((t) => t.clips);
                                  newSelectedClips = allClips.filter((c) => activeSelectedIds.includes(c.id));
                                } else {
                                  newSelectedClips = [clip];
                                  onSelectClips?.(newSelectedClips);
                                  onSelectClip(clip);
                                }
                              }

                              const multiClips = newSelectedClips.map((selClip) => {
                                const selTrack = timeline.tracks.find((t) => t.clips.some((c) => c.id === selClip.id)) || track;
                                return {
                                  clipId: selClip.id,
                                  trackId: selTrack.id,
                                  initialStart: selClip.timelineRange.start,
                                  initialDuration: selClip.timelineRange.duration,
                                };
                              });

                              setDragState({
                                type: "MOVE",
                                clipId: clip.id,
                                trackId: track.id,
                                initialStart: clip.timelineRange.start,
                                initialDuration: clip.timelineRange.duration,
                                startX: e.clientX,
                                currentDeltaFrames: 0,
                                multiClips,
                              });
                            }
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onSelectClip(clip);
                            setContextMenu({
                              x: e.clientX,
                              y: e.clientY,
                              anchorTop: e.clientY,
                              anchorBottom: e.clientY,
                              clip,
                              trackId: track.id,
                            });
                          }}
                          onMouseMove={(e) => {
                            if (activeTool === "RAZOR" && !lockedTracks[track.id]) {
                              const frame = calculateFrameFromX(e.clientX);
                              setRazorHover({ trackId: track.id, clipId: clip.id, frame });
                            }
                          }}
                          onMouseLeave={() => {
                            if (razorHover?.clipId === clip.id) {
                              setRazorHover(null);
                            }
                          }}
                          style={{
                            position: "absolute",
                            left: `${left}px`,
                            width: `${visualWidth}px`,
                            top: "4px",
                            bottom: "4px",
                            borderRadius: "var(--radius-sm)",
                            background: isAudio
                              ? "linear-gradient(180deg, #10B981 0%, #059669 100%)"
                              : isSelected
                              ? "linear-gradient(180deg, #4F73F7 0%, #3B82F6 100%)"
                              : "linear-gradient(180deg, #2563EB 0%, #1D4ED8 100%)",
                            color: "white",
                            borderLeft: "1px solid rgba(255,255,255,0.25)",
                            borderRight: "1px solid rgba(0,0,0,0.45)",
                            padding: visualWidth < 35 ? "0" : visualWidth < 75 ? "2px 4px" : "3px 6px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: visualWidth >= 75 ? "space-between" : "center",
                            cursor: lockedTracks[track.id]
                              ? "not-allowed"
                              : activeTool === "RAZOR"
                              ? "crosshair"
                              : isDraggingThis
                              ? "grabbing"
                              : "grab",
                            boxShadow: isSelected
                              ? "0 0 0 1.5px var(--bg-surface), 0 0 0 3px var(--accent), 0 4px 14px rgba(79, 115, 247, 0.45)"
                              : isAiHighlighted
                              ? "0 0 0 1.5px var(--accent)"
                              : "0 1px 3px rgba(0,0,0,0.2)",
                            userSelect: "none",
                            overflow: "hidden",
                            zIndex: isDraggingThis ? 40 : isSelected ? 20 : isAiHighlighted ? 19 : 5,
                            opacity: isDraggingThis ? 0.88 : 1.0,
                          }}
                        >
                          {/* Left Trim Handle (Trim In Point - Cut from Left Edge) */}
                          {!lockedTracks[track.id] && activeTool === "SELECT" && visualWidth >= 20 && (
                            <div
                              className="timeline-trim-handle-left"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                onSelectClip(clip);
                                setDragState({
                                  type: "TRIM_START",
                                  clipId: clip.id,
                                  trackId: track.id,
                                  initialStart: clip.timelineRange.start,
                                  initialDuration: clip.timelineRange.duration,
                                  startX: e.clientX,
                                  currentDeltaFrames: 0,
                                });
                              }}
                              style={{
                                background: isSelected ? "rgba(255,255,255,0.9)" : "transparent",
                                borderRight: isSelected ? "1px solid rgba(0,0,0,0.3)" : "none",
                              }}
                              title="Trim In Point (Cut from Left Edge - Shortcut: Q)"
                            />
                          )}

                          {/* Right Trim Handle (Trim Out Point - Cut from Right Edge) */}
                          {!lockedTracks[track.id] && activeTool === "SELECT" && visualWidth >= 20 && (
                            <div
                              className="timeline-trim-handle-right"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                onSelectClip(clip);
                                setDragState({
                                  type: "TRIM_END",
                                  clipId: clip.id,
                                  trackId: track.id,
                                  initialStart: clip.timelineRange.start,
                                  initialDuration: clip.timelineRange.duration,
                                  startX: e.clientX,
                                  currentDeltaFrames: 0,
                                });
                              }}
                              style={{
                                background: isSelected ? "rgba(255,255,255,0.9)" : "transparent",
                                borderLeft: isSelected ? "1px solid rgba(0,0,0,0.3)" : "none",
                              }}
                              title="Trim Out Point (Cut from Right Edge - Shortcut: W)"
                            />
                          )}

                          {/* Razor Cutting Laser Line Indicator */}
                          {activeTool === "RAZOR" && razorHover?.clipId === clip.id && (
                            <div
                              style={{
                                position: "absolute",
                                top: 0,
                                bottom: 0,
                                left: `${(razorHover.frame - clip.timelineRange.start) * pixelsPerFrame}px`,
                                width: "2px",
                                background: "#EF4444",
                                boxShadow: "0 0 8px #EF4444",
                                zIndex: 35,
                                pointerEvents: "none",
                              }}
                            >
                              <div
                                style={{
                                  position: "absolute",
                                  top: "-18px",
                                  left: "-22px",
                                  background: "#EF4444",
                                  color: "white",
                                  fontSize: "9px",
                                  padding: "1px 5px",
                                  borderRadius: "3px",
                                  fontWeight: 700,
                                  fontFamily: "monospace",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                ✂️ CUT @ {Math.floor(razorHover.frame / fps)}s {razorHover.frame % fps}f
                              </div>
                            </div>
                          )}

                          {/* Dragging Delta Tooltip Badge */}
                          {isDraggingThis && dragState && dragState.currentDeltaFrames !== 0 && (
                            <div
                              style={{
                                position: "absolute",
                                top: "-20px",
                                left: "50%",
                                transform: "translateX(-50%)",
                                background: "var(--accent)",
                                color: "white",
                                fontSize: "9px",
                                fontWeight: 700,
                                padding: "2px 6px",
                                borderRadius: "3px",
                                whiteSpace: "nowrap",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                                zIndex: 50,
                                fontFamily: "monospace",
                              }}
                            >
                              {dragState.type === "MOVE"
                                ? `${dragState.currentDeltaFrames > 0 ? "+" : ""}${dragState.currentDeltaFrames}f (${(dragState.currentDeltaFrames / fps).toFixed(2)}s)${dragHoverTrackId && dragHoverTrackId !== track.id ? ` ➔ ${dragHoverTrackId.replace("trk_", "").toUpperCase().slice(0, 2)}` : ""}`
                                : dragState.type === "TRIM_START"
                                ? `Trim In: ${dragState.currentDeltaFrames > 0 ? "+" : ""}${dragState.currentDeltaFrames}f`
                                : `Trim Out: ${dragState.currentDeltaFrames > 0 ? "+" : ""}${dragState.currentDeltaFrames}f`}
                            </div>
                          )}

                          {/* Clip Title & Badges: Strict progressive thresholds */}
                          {visualWidth >= 35 && (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "2px", minWidth: 0, width: "100%", overflow: "hidden" }}>
                              <span
                                style={{
                                  fontSize: visualWidth < 75 ? "9px" : "11px",
                                  fontWeight: 600,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  flex: 1,
                                  minWidth: 0,
                                  lineHeight: 1.1,
                                }}
                              >
                                {clip.name}
                              </span>
                              {visualWidth >= 95 && isAiHighlighted && (
                                <span style={{ fontSize: "7px", background: "rgba(255,255,255,0.25)", color: "white", padding: "1px 3px", borderRadius: "2px", fontWeight: 700, flexShrink: 0 }}>
                                  AI
                                </span>
                              )}
                              {visualWidth >= 115 && clip.effects.length > 0 && !isAiHighlighted && (
                                <span style={{ fontSize: "7px", background: "rgba(0,0,0,0.3)", padding: "1px 3px", borderRadius: "2px", fontWeight: 600, flexShrink: 0 }}>
                                  FX
                                </span>
                              )}
                            </div>
                          )}

                          {/* Audio Waveform Visualization in Standard/Expanded Modes */}
                          {isAudio && trackHeightPx >= 48 && (
                            <div
                              style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                bottom: "3px",
                                height: trackHeightPx >= 70 ? "34px" : "18px",
                                display: "flex",
                                alignItems: "center",
                                gap: "1.5px",
                                opacity: 0.5,
                                padding: "0 4px",
                                pointerEvents: "none",
                                overflow: "hidden",
                              }}
                            >
                              {Array.from({ length: Math.min(80, Math.floor(visualWidth / 4)) }).map((_, wIdx) => {
                                const pseudoHeight = Math.round(18 + Math.abs(Math.sin((wIdx * 7 + (clip.id.charCodeAt(0) || 0)) * 0.35)) * 75);
                                return (
                                  <div
                                    key={wIdx}
                                    style={{
                                      flex: "0 0 2px",
                                      height: `${pseudoHeight}%`,
                                      background: "#FFFFFF",
                                      borderRadius: "1px",
                                    }}
                                  />
                                );
                              })}
                            </div>
                          )}

                          {/* Filmstrip Sprocket Perforations in Expanded Mode */}
                          {!isAudio && trackHeightPx >= 70 && (
                            <div
                              style={{
                                position: "absolute",
                                top: "2px",
                                left: 0,
                                right: 0,
                                height: "4px",
                                display: "flex",
                                gap: "6px",
                                padding: "0 4px",
                                pointerEvents: "none",
                                opacity: 0.35,
                                overflow: "hidden",
                              }}
                            >
                              {Array.from({ length: Math.min(60, Math.floor(visualWidth / 10)) }).map((_, pIdx) => (
                                <div
                                  key={pIdx}
                                  style={{
                                    width: "4px",
                                    height: "3px",
                                    background: "#FFFFFF",
                                    borderRadius: "1px",
                                    flexShrink: 0,
                                  }}
                                />
                              ))}
                            </div>
                          )}

                          {/* Clip Duration & Speed Row: Only rendered if wide enough (>= 75px) */}
                          {visualWidth >= 75 && (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "9px", opacity: 0.85, fontFamily: "monospace", lineHeight: 1, whiteSpace: "nowrap", overflow: "hidden", position: "relative", zIndex: 2 }}>
                              <span>{durationSec}s</span>
                              {clip.speed !== 1.0 && visualWidth >= 110 && (
                                <span style={{ background: "rgba(0,0,0,0.3)", padding: "1px 3px", borderRadius: "2px", fontSize: "8px" }}>
                                  {clip.speed}x
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </React.Fragment>
              );
            })}
          </div>

            {/* Right-Click NLE Clip Context Menu */}
            {contextMenu && (() => {
              const clipMenuWidth = 225;
              const winW = typeof window !== "undefined" ? window.innerWidth : 1200;
              const winH = typeof window !== "undefined" ? window.innerHeight : 800;

              const menuItemBase: React.CSSProperties = {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                padding: "6px 10px",
                background: "transparent",
                border: "none",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-primary)",
                fontSize: "12px",
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.1s ease, color 0.1s ease",
              };

              const shortcutStyle: React.CSSProperties = {
                fontSize: "10px",
                fontFamily: "monospace",
                color: "var(--text-muted)",
                padding: "1px 5px",
                borderRadius: "3px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              };

              const anchorBottom = contextMenu.anchorBottom ?? contextMenu.y;
              const anchorTop = contextMenu.anchorTop ?? contextMenu.y;
              const isUpward = anchorBottom > winH - 320 || anchorBottom > winH * 0.55;

              const menuX = Math.max(8, Math.min(winW - clipMenuWidth - 8, contextMenu.x));
              const menuY = isUpward ? Math.max(12, anchorTop - 4) : Math.min(winH - 40, anchorBottom + 4);

              return (
                <>
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 9998, background: "transparent" }}
                    onClick={() => setContextMenu(null)}
                    onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
                  />
                  <div
                    style={{
                      position: "fixed",
                      left: `${menuX}px`,
                      top: `${menuY}px`,
                      transform: isUpward ? "translateY(-100%)" : "none",
                      transformOrigin: isUpward ? "bottom left" : "top left",
                      background: "var(--bg-surface)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      padding: "5px",
                      boxShadow: "0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)",
                      zIndex: 9999,
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                      minWidth: "215px",
                      maxHeight: isUpward ? `${anchorTop - 16}px` : `${winH - anchorBottom - 16}px`,
                      overflowY: "auto",
                      overflowX: "hidden",
                      boxSizing: "border-box",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ padding: "4px 8px", fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {contextMenu.clip.name}
                    </div>
                    <div style={{ height: "1px", background: "var(--border)", margin: "2px 0" }} />

                    {/* Trim in from left edge */}
                    <button
                      onClick={() => {
                        onTrimClip?.(contextMenu.clip.id, "START", currentFrame, contextMenu.trackId);
                        showToast(`Cut left edge of "${contextMenu.clip.name}" to frame ${currentFrame} (Q)`);
                        setContextMenu(null);
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      style={{ ...menuItemBase, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Scissors size={12} style={{ color: "var(--accent)" }} />
                        <span>Trim In to Playhead</span>
                      </div>
                      <span style={shortcutStyle}>Q</span>
                    </button>

                    {/* Trim out from right edge */}
                    <button
                      onClick={() => {
                        onTrimClip?.(contextMenu.clip.id, "END", currentFrame, contextMenu.trackId);
                        showToast(`Cut right edge of "${contextMenu.clip.name}" to frame ${currentFrame} (W)`);
                        setContextMenu(null);
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      style={{ ...menuItemBase, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Scissors size={12} style={{ color: "var(--accent)" }} />
                        <span>Trim Out to Playhead</span>
                      </div>
                      <span style={shortcutStyle}>W</span>
                    </button>

                    {/* Split at Playhead */}
                    <button
                      onClick={() => {
                        handleSplitAtPlayhead();
                        setContextMenu(null);
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      style={{ ...menuItemBase, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Scissors size={12} style={{ color: "var(--accent)" }} />
                        <span>Split at Playhead</span>
                      </div>
                      <span style={shortcutStyle}>⌘B</span>
                    </button>

                    {/* Ripple Delete */}
                    <button
                      onClick={() => {
                        onDeleteClip?.(contextMenu.clip.id, contextMenu.trackId, true);
                        setContextMenu(null);
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      style={{ ...menuItemBase, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Trash2 size={12} style={{ color: "var(--warning)" }} />
                        <span>Ripple Delete</span>
                      </div>
                      <span style={shortcutStyle}>⇧⌫</span>
                    </button>

                    {/* Delete Clip */}
                    <button
                      onClick={() => {
                        onDeleteClip?.(contextMenu.clip.id, contextMenu.trackId, false);
                        setContextMenu(null);
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      style={{ ...menuItemBase, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", color: "var(--danger)" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Trash2 size={12} style={{ color: "var(--danger)" }} />
                        <span>Delete Clip</span>
                      </div>
                      <span style={{ ...shortcutStyle, color: "var(--danger)" }}>⌫</span>
                    </button>

                    <div style={{ height: "1px", background: "var(--border)", margin: "2px 0" }} />
                    <div style={{ padding: "2px 8px", fontSize: "10px", color: "var(--text-muted)", fontWeight: 600 }}>
                      PLAYBACK SPEED
                    </div>
                    <div style={{ display: "flex", gap: "3px", padding: "2px 8px" }}>
                      {[0.5, 1.0, 1.25, 2.0].map((spd) => (
                        <button
                          key={spd}
                          onClick={() => {
                            onUpdateClipSpeed?.(contextMenu.clip.id, spd);
                            setContextMenu(null);
                          }}
                          style={{
                            flex: 1,
                            padding: "3px 4px",
                            fontSize: "9px",
                            fontWeight: 600,
                            borderRadius: "3px",
                            border: contextMenu.clip.speed === spd ? "1px solid var(--accent)" : "1px solid var(--border)",
                            background: contextMenu.clip.speed === spd ? "var(--accent-soft)" : "transparent",
                            color: "var(--text-primary)",
                            cursor: "pointer",
                          }}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Professional Track Options Context Menu with First-Class UX */}
            {trackContextMenu && (() => {
              const currentTrack = trackContextMenu.track;
              const isAudio = currentTrack.type === "AUDIO";
              const currentIdx = timeline.tracks.findIndex((t) => t.id === currentTrack.id);
              const isLocked = !!lockedTracks[currentTrack.id];
              const isMuted = !!mutedTracks[currentTrack.id];
              const isSolo = !!soloTracks[currentTrack.id];

              let canMoveUp = false;
              for (let i = currentIdx - 1; i >= 0; i--) {
                if ((timeline.tracks[i].type === "AUDIO") === isAudio) {
                  canMoveUp = true;
                  break;
                }
              }
              let canMoveDown = false;
              for (let i = currentIdx + 1; i < timeline.tracks.length; i++) {
                if ((timeline.tracks[i].type === "AUDIO") === isAudio) {
                  canMoveDown = true;
                  break;
                }
              }

              const trackTypeLabel = isAudio ? "Audio" : currentTrack.type === "GRAPHICS" ? "Graphics" : "Video";
              const trackBadgeColor = isAudio ? "var(--success)" : "var(--accent)";
              const clipCount = currentTrack.clips.length;

              const menuItemBase: React.CSSProperties = {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                padding: "6px 10px",
                background: "transparent",
                border: "none",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-primary)",
                fontSize: "12px",
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.1s ease, color 0.1s ease",
              };

              const shortcutStyle: React.CSSProperties = {
                fontSize: "10px",
                fontFamily: "monospace",
                color: "var(--text-muted)",
                padding: "1px 5px",
                borderRadius: "3px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              };

              const menuWidth = 245;
              const winW = typeof window !== "undefined" ? window.innerWidth : 1200;
              const winH = typeof window !== "undefined" ? window.innerHeight : 800;

              const anchorBottom = trackContextMenu.anchorBottom ?? trackContextMenu.y;
              const anchorTop = trackContextMenu.anchorTop ?? trackContextMenu.y;
              const isUpward = anchorBottom > winH - 320 || anchorBottom > winH * 0.55;

              const menuX = Math.max(8, Math.min(winW - menuWidth - 8, trackContextMenu.x));
              const menuY = isUpward ? Math.max(12, anchorTop - 4) : Math.min(winH - 40, anchorBottom + 4);

              return (
                <>
                  {/* Backdrop to catch clicks outside and dismiss menu */}
                  <div
                    style={{
                      position: "fixed",
                      inset: 0,
                      zIndex: 9998,
                      background: "transparent",
                    }}
                    onClick={() => setTrackContextMenu(null)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setTrackContextMenu(null);
                    }}
                  />
                  <div
                    style={{
                      position: "fixed",
                      left: `${menuX}px`,
                      top: `${menuY}px`,
                      transform: isUpward ? "translateY(-100%)" : "none",
                      transformOrigin: isUpward ? "bottom left" : "top left",
                      background: "var(--bg-surface)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      padding: "5px",
                      boxShadow: "0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)",
                      zIndex: 9999,
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                      minWidth: "235px",
                      maxWidth: "280px",
                      maxHeight: isUpward ? `${anchorTop - 16}px` : `${winH - anchorBottom - 16}px`,
                      overflowY: "auto",
                      overflowX: "hidden",
                      boxSizing: "border-box",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Menu Header with Track Badge, Clip Info & Active Status Badges */}
                    <div
                      style={{
                        padding: "5px 8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "6px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0, flex: 1 }}>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "1px 5px",
                            borderRadius: "3px",
                            background: isAudio ? "rgba(16, 185, 129, 0.18)" : "rgba(79, 115, 247, 0.18)",
                            color: trackBadgeColor,
                            border: `1px solid ${isAudio ? "rgba(16, 185, 129, 0.3)" : "rgba(79, 115, 247, 0.3)"}`,
                            flexShrink: 0,
                          }}
                        >
                          {currentTrack.id.replace("trk_", "").toUpperCase().slice(0, 2)}
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {currentTrack.name.replace(/^(V\d+|A\d+|G\d+|FX\d+):\s*/i, "") || currentTrack.name}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                        {isLocked && (
                          <span
                            style={{
                              fontSize: "9px",
                              fontFamily: "monospace",
                              fontWeight: 700,
                              padding: "1px 4px",
                              borderRadius: "3px",
                              background: "rgba(245, 158, 11, 0.15)",
                              color: "var(--warning)",
                              border: "1px solid rgba(245, 158, 11, 0.3)",
                            }}
                          >
                            LOCK
                          </span>
                        )}
                        {isMuted && (
                          <span
                            style={{
                              fontSize: "9px",
                              fontFamily: "monospace",
                              fontWeight: 700,
                              padding: "1px 4px",
                              borderRadius: "3px",
                              background: "rgba(239, 68, 68, 0.15)",
                              color: "var(--danger)",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                            }}
                          >
                            {isAudio ? "MUTE" : "HIDE"}
                          </span>
                        )}
                        {isSolo && (
                          <span
                            style={{
                              fontSize: "9px",
                              fontFamily: "monospace",
                              fontWeight: 700,
                              padding: "1px 4px",
                              borderRadius: "3px",
                              background: "rgba(245, 158, 11, 0.15)",
                              color: "var(--warning)",
                              border: "1px solid rgba(245, 158, 11, 0.3)",
                            }}
                          >
                            SOLO
                          </span>
                        )}
                        <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                          {clipCount} {clipCount === 1 ? "clip" : "clips"}
                        </span>
                      </div>
                    </div>

                    <div style={{ height: "1px", background: "var(--border)", margin: "3px 0" }} />

                    {/* Rename Track */}
                    <button
                      onClick={() => handleStartRenameTrack(currentTrack)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      style={menuItemBase}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Edit2 size={12} style={{ color: "var(--accent)" }} />
                        <span>Rename Track</span>
                      </div>
                      <span style={shortcutStyle}>F2</span>
                    </button>

                    {/* Duplicate Track */}
                    <button
                      onClick={() => {
                        onDuplicateTrack?.(currentTrack.id);
                        setTrackContextMenu(null);
                        showToast(`Duplicated ${currentTrack.name}`);
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      style={menuItemBase}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Copy size={12} style={{ color: "var(--accent)" }} />
                        <span>Duplicate Track</span>
                      </div>
                      <span style={shortcutStyle}>⌥D</span>
                    </button>

                    {/* Add Track Above */}
                    <button
                      onClick={() => {
                        onAddTrack?.(currentTrack.type, currentIdx);
                        setTrackContextMenu(null);
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      style={menuItemBase}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Plus size={12} style={{ color: "var(--success)" }} />
                        <span>Add {trackTypeLabel} Above</span>
                      </div>
                      <span style={shortcutStyle}>⌥+</span>
                    </button>

                    {/* Add Track Below */}
                    <button
                      onClick={() => {
                        onAddTrack?.(currentTrack.type, currentIdx + 1);
                        setTrackContextMenu(null);
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      style={menuItemBase}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Plus size={12} style={{ color: "var(--success)" }} />
                        <span>Add {trackTypeLabel} Below</span>
                      </div>
                    </button>

                    <div style={{ height: "1px", background: "var(--border)", margin: "3px 0" }} />

                  {/* Move Track Up */}
                  <button
                    disabled={!canMoveUp}
                    onClick={() => {
                      if (!canMoveUp) return;
                      handleMoveTrackOrder(currentTrack.id, "UP");
                    }}
                    onMouseEnter={(e) => {
                      if (canMoveUp) e.currentTarget.style.background = "var(--bg-hover)";
                    }}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    style={{
                      ...menuItemBase,
                      opacity: canMoveUp ? 1 : 0.4,
                      cursor: canMoveUp ? "pointer" : "not-allowed",
                    }}
                    title={canMoveUp ? "Move track up (⌥↑)" : `Already at the top of ${trackTypeLabel.toLowerCase()} tracks`}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <ChevronUp size={12} style={{ color: canMoveUp ? "var(--text-primary)" : "var(--text-muted)" }} />
                      <span>Move Track Up</span>
                    </div>
                    <span style={shortcutStyle}>{canMoveUp ? "⌥↑" : "Top"}</span>
                  </button>

                  {/* Move Track Down */}
                  <button
                    disabled={!canMoveDown}
                    onClick={() => {
                      if (!canMoveDown) return;
                      handleMoveTrackOrder(currentTrack.id, "DOWN");
                    }}
                    onMouseEnter={(e) => {
                      if (canMoveDown) e.currentTarget.style.background = "var(--bg-hover)";
                    }}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    style={{
                      ...menuItemBase,
                      opacity: canMoveDown ? 1 : 0.4,
                      cursor: canMoveDown ? "pointer" : "not-allowed",
                    }}
                    title={canMoveDown ? "Move track down (⌥↓)" : `Already at the bottom of ${trackTypeLabel.toLowerCase()} tracks`}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <ChevronDown size={12} style={{ color: canMoveDown ? "var(--text-primary)" : "var(--text-muted)" }} />
                      <span>Move Track Down</span>
                    </div>
                    <span style={shortcutStyle}>{canMoveDown ? "⌥↓" : "Bottom"}</span>
                  </button>

                  <div style={{ height: "1px", background: "var(--border)", margin: "3px 0" }} />

                  {/* Lock / Unlock Toggle */}
                  <button
                    onClick={() => {
                      toggleLock(currentTrack.id);
                      setTrackContextMenu(null);
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    style={menuItemBase}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {isLocked ? (
                        <>
                          <Unlock size={12} style={{ color: "var(--warning)" }} />
                          <span>Unlock Track</span>
                        </>
                      ) : (
                        <>
                          <Lock size={12} style={{ color: "var(--text-muted)" }} />
                          <span>Lock Track</span>
                        </>
                      )}
                    </div>
                    <span style={shortcutStyle}>L</span>
                  </button>

                  {/* Output / Mute Toggle */}
                  <button
                    onClick={() => {
                      toggleMute(currentTrack.id);
                      setTrackContextMenu(null);
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    style={menuItemBase}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {isAudio ? (
                        isMuted ? (
                          <>
                            <Volume2 size={12} style={{ color: "var(--success)" }} />
                            <span>Unmute Audio</span>
                          </>
                        ) : (
                          <>
                            <VolumeX size={12} style={{ color: "var(--danger)" }} />
                            <span>Mute Audio</span>
                          </>
                        )
                      ) : isMuted ? (
                        <>
                          <Eye size={12} style={{ color: "var(--accent)" }} />
                          <span>Enable Output</span>
                        </>
                      ) : (
                        <>
                          <EyeOff size={12} style={{ color: "var(--danger)" }} />
                          <span>Disable Output</span>
                        </>
                      )}
                    </div>
                    <span style={shortcutStyle}>M</span>
                  </button>

                  {/* Solo Toggle */}
                  <button
                    onClick={() => {
                      toggleSolo(currentTrack.id);
                      setTrackContextMenu(null);
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    style={menuItemBase}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "2px",
                          background: isSolo ? "var(--warning)" : "var(--border)",
                          color: isSolo ? "#000" : "var(--text-muted)",
                          fontSize: "8px",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        S
                      </span>
                      <span>{isSolo ? "Unsolo Track" : "Solo Track"}</span>
                    </div>
                    <span style={shortcutStyle}>S</span>
                  </button>

                  {/* Audio Volume Reset */}
                  {isAudio && (
                    <button
                      onClick={() => {
                        onSetTrackVolume?.(currentTrack.id, 0);
                        setTrackContextMenu(null);
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      style={menuItemBase}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <RotateCcw size={12} />
                        <span>Reset Volume (0.0 dB)</span>
                      </div>
                      <span style={shortcutStyle}>0 dB</span>
                    </button>
                  )}

                  <div style={{ height: "1px", background: "var(--border)", margin: "3px 0" }} />

                  {/* Delete Track with Confirmation if clips exist */}
                  <button
                    onClick={() => {
                      if (clipCount > 0) {
                        const confirmed = window.confirm(
                          `Delete track "${currentTrack.name}" and all ${clipCount} clip(s) on it?`
                        );
                        if (!confirmed) return;
                      }
                      onDeleteTrack?.(currentTrack.id);
                      setTrackContextMenu(null);
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    style={{
                      ...menuItemBase,
                      color: "var(--danger)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Trash2 size={12} style={{ color: "var(--danger)" }} />
                      <span>{clipCount > 0 ? `Delete Track (${clipCount} clips)` : "Delete Track"}</span>
                    </div>
                    <span style={{ ...shortcutStyle, color: "var(--danger)", borderColor: "rgba(239, 68, 68, 0.2)" }}>
                      ⇧⌫
                    </span>
                  </button>
                </div>
                </>
              );
            })()}

            {/* Audio Track Floating Volume Slider Popup */}
            {activeVolumeTrackId && (
              (() => {
                const volTrack = timeline.tracks.find((t) => t.id === activeVolumeTrackId);
                if (!volTrack) return null;
                const currentVol = volTrack.volume ?? 0;
                return (
                  <div
                    style={{
                      position: "fixed",
                      left: "245px",
                      bottom: "75px",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      padding: "10px 14px",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
                      zIndex: 9999,
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      minWidth: "200px",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)" }}>
                        {volTrack.name} Volume
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontFamily: "monospace",
                          fontWeight: 700,
                          color: currentVol > 0 ? "var(--warning)" : currentVol < 0 ? "var(--text-muted)" : "var(--success)",
                        }}
                      >
                        {currentVol >= 0 ? `+${currentVol.toFixed(1)}` : currentVol.toFixed(1)} dB
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-24}
                      max={12}
                      step={0.5}
                      value={currentVol}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onSetTrackVolume?.(volTrack.id, val);
                      }}
                      style={{ width: "100%", accentColor: "var(--accent)", cursor: "pointer" }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", fontFamily: "monospace", color: "var(--text-muted)" }}>
                      <span>-24dB</span>
                      <button
                        onClick={() => onSetTrackVolume?.(volTrack.id, 0)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--accent)",
                          cursor: "pointer",
                          fontSize: "9px",
                          fontWeight: 700,
                          padding: 0,
                        }}
                      >
                        0.0 dB
                      </button>
                      <span>+12dB</span>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </div>

      {/* 3. Bottom Horizontal Scrollbar & Timeline Mini-Navigator */}
      <div
        style={{
          height: "24px",
          background: "var(--bg-subtle)",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          padding: "0 10px",
          gap: "12px",
          zIndex: 15,
          userSelect: "none",
        }}
      >
        {/* Multi-Select Info Badge */}
        {activeSelectedIds.length > 1 ? (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--accent)",
                background: "var(--accent-soft)",
                padding: "2px 8px",
                borderRadius: "4px",
                border: "1px solid var(--accent-border)",
              }}
            >
              {activeSelectedIds.length} clips selected
            </span>
            <button
              onClick={() => onDeleteClips?.(activeSelectedIds)}
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "var(--danger)",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                borderRadius: "3px",
                padding: "2px 6px",
              }}
              title="Delete all selected clips (Delete / Backspace)"
            >
              Delete ({activeSelectedIds.length})
            </button>
            <button
              onClick={() => onSelectClips?.([])}
              style={{
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                fontSize: "11px",
                cursor: "pointer",
                borderRadius: "3px",
                padding: "2px 6px",
              }}
              title="Deselect all (Esc)"
            >
              Deselect
            </button>
          </div>
        ) : (
          <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "monospace" }}>
            Scroll: Wheel • Pan: Middle Click / Space+Drag • Multi-Select: Drag Box / Shift+Click
          </span>
        )}

        {/* Interactive Custom Horizontal Scrollbar */}
        <div
          onMouseDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            if (scrollContainerRef.current) {
              const maxScroll = scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth;
              scrollContainerRef.current.scrollLeft = clickRatio * maxScroll;
            }
          }}
          style={{
            flex: 1,
            height: "8px",
            background: "rgba(0,0,0,0.08)",
            borderRadius: "4px",
            position: "relative",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${Math.min(100, Math.max(0, (scrollMetrics.scrollLeft / Math.max(1, scrollMetrics.scrollWidth - scrollMetrics.clientWidth)) * 100))}%`,
              width: `${Math.min(100, Math.max(6, (scrollMetrics.clientWidth / Math.max(1, scrollMetrics.scrollWidth)) * 100))}%`,
              background: "var(--accent)",
              opacity: 0.85,
              borderRadius: "4px",
              cursor: "grab",
              transition: "opacity 0.15s",
            }}
            title="Drag or click to scroll timeline horizontally"
          />
        </div>

        {/* Zoom Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <button
            onClick={() => setZoomLevel(Math.max(0.3, parseFloat((zoomLevel - 0.2).toFixed(2))))}
            className="btn-icon-subtle"
            style={{ padding: "2px 4px" }}
            title="Zoom Out (-)"
          >
            <ZoomOut size={12} />
          </button>
          <span style={{ fontSize: "10px", fontFamily: "monospace", color: "var(--text-secondary)", minWidth: "30px", textAlign: "center" }}>
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel(Math.min(3.0, parseFloat((zoomLevel + 0.2).toFixed(2))))}
            className="btn-icon-subtle"
            style={{ padding: "2px 4px" }}
            title="Zoom In (+)"
          >
            <ZoomIn size={12} />
          </button>
          <button
            onClick={handleZoomFit}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "3px",
              padding: "1px 5px",
              fontSize: "10px",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontWeight: 600,
            }}
            title="Zoom to fit all clips (Shift+Z)"
          >
            Fit
          </button>
        </div>
      </div>

      {/* Floating Action Feedback Toast */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "28px",
            right: "28px",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(17, 24, 39, 0.95)",
            backdropFilter: "blur(12px)",
            color: "#ffffff",
            fontSize: "12px",
            fontWeight: 500,
            padding: "8px 14px",
            borderRadius: "8px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "0 12px 28px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(0, 0, 0, 0.2)",
            animation: "toastSlideUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              background: "rgba(16, 185, 129, 0.2)",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#10B981",
              flexShrink: 0,
            }}
          >
            <Check size={11} strokeWidth={2.5} />
          </div>
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
};
