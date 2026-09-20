"use client";

import React, { useState, useRef } from "react";
import {
  Folder,
  Film,
  Music,
  Plus,
  LayoutGrid,
  List as ListIcon,
  Sparkles,
  Search,
  CheckCircle2,
  Trash2,
  UploadCloud,
  Zap,
} from "lucide-react";
import { MediaAsset } from "@/lib/sample-data";

export interface ExtendedMediaAsset extends MediaAsset {
  proxyStatus?: "READY" | "ORIGINAL_ONLY" | "OFFLINE" | "TRANSCODING";
  codec?: string;
  sourceFilePath?: string;
  file?: File;
}

interface MediaBinProps {
  assets: MediaAsset[];
  selectedAssetId: string | null;
  onSelectAsset: (asset: MediaAsset) => void;
  onInsertToTimeline: (asset: MediaAsset) => void;
  isProxyMode?: boolean;
  onToggleProxyMode?: (val: boolean) => void;
  onAddAssets?: (newAssets: MediaAsset[]) => void;
  onDeleteAsset?: (assetId: string) => void;
}

export const MediaBin: React.FC<MediaBinProps> = ({
  assets,
  selectedAssetId,
  onSelectAsset,
  onInsertToTimeline,
  isProxyMode = true,
  onToggleProxyMode,
  onAddAssets,
  onDeleteAsset,
}) => {
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = assets.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle Real Local File Upload
  const handleFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newAssets: MediaAsset[] = [];

    fileArray.forEach((file) => {
      const isVideo = file.type.startsWith("video");
      const isAudio = file.type.startsWith("audio");
      const isImage = file.type.startsWith("image");

      const url = URL.createObjectURL(file);
      const assetId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // Create video element to inspect real dimensions and duration
      if (isVideo) {
        const tempVideo = document.createElement("video");
        tempVideo.preload = "metadata";
        tempVideo.src = url;
        tempVideo.onloadedmetadata = () => {
          const duration = Math.round(tempVideo.duration) || 10;
          const width = tempVideo.videoWidth || 1920;
          const height = tempVideo.videoHeight || 1080;
          const asset: ExtendedMediaAsset = {
            id: assetId,
            title: file.name.replace(/\.[^/.]+$/, ""),
            type: "VIDEO",
            durationSec: duration,
            durationFrames: duration * 30,
            fps: 30,
            resolution: `${width}x${height}`,
            thumbnailUrl: url,
            tags: ["Upload", width >= 3840 ? "4K" : "HD"],
            proxyStatus: "READY",
            codec: file.type.includes("mp4") ? "H.264 (MP4)" : "QuickTime MOV",
            sourceFilePath: file.name,
            file,
            scenes: [
              { startFrame: 0, endFrame: duration * 30, shotType: "Medium", motion: "Static", score: 0.9 },
            ],
          };
          onAddAssets?.([asset]);
        };
      } else {
        const assetType = isAudio ? "AUDIO" : isImage ? "IMAGE" : "VIDEO";
        const durSec = isAudio ? 60 : 5;
        const asset: ExtendedMediaAsset = {
          id: assetId,
          title: file.name.replace(/\.[^/.]+$/, ""),
          type: assetType,
          durationSec: durSec,
          durationFrames: durSec * 30,
          fps: 30,
          resolution: isImage ? "1920x1080" : "Stereo 48kHz",
          thumbnailUrl: isImage ? url : "",
          tags: ["Upload", isAudio ? "Audio" : "Image"],
          proxyStatus: "READY",
          codec: file.type || "Media",
          sourceFilePath: file.name,
          file,
          scenes: [],
        };
        newAssets.push(asset);
      }
    });

    if (newAssets.length > 0) {
      onAddAssets?.(newAssets);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg-surface)",
        position: "relative",
      }}
    >
      {/* Hidden file input for real uploads */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/*,audio/*,image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
        }}
      />

      {/* 1. Header with Ingest Button & Proxy Toggle */}
      <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Folder size={15} style={{ color: "var(--accent)" }} />
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
            Media Pool
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", background: "var(--bg-subtle)", padding: "1px 6px", borderRadius: "4px" }}>
            {assets.length}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {/* Real Import Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="export-primary-btn"
            style={{ padding: "4px 8px", fontSize: "11px" }}
            title="Upload real footage from your device"
          >
            <Plus size={12} />
            <span>Import</span>
          </button>

          <div style={{ display: "flex", background: "var(--bg-subtle)", padding: "2px", borderRadius: "var(--radius-sm)" }}>
            <button
              onClick={() => setViewMode("GRID")}
              style={{
                padding: "3px 5px",
                border: "none",
                borderRadius: "3px",
                background: viewMode === "GRID" ? "var(--bg-surface)" : "transparent",
                color: viewMode === "GRID" ? "var(--accent)" : "var(--text-muted)",
                cursor: "pointer",
              }}
              title="Grid View"
            >
              <LayoutGrid size={12} />
            </button>
            <button
              onClick={() => setViewMode("LIST")}
              style={{
                padding: "3px 5px",
                border: "none",
                borderRadius: "3px",
                background: viewMode === "LIST" ? "var(--bg-surface)" : "transparent",
                color: viewMode === "LIST" ? "var(--accent)" : "var(--text-muted)",
                cursor: "pointer",
              }}
              title="List View"
            >
              <ListIcon size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Search Box */}
      <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "5px 8px" }}>
          <Search size={13} style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search clips by name or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: "12px",
              background: "transparent",
              color: "var(--text-primary)",
            }}
          />
        </div>
      </div>

      {/* Drag Over Overlay */}
      {isDragging && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(79, 115, 247, 0.15)",
            border: "2px dashed var(--accent)",
            zIndex: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <UploadCloud size={32} style={{ color: "var(--accent)" }} />
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--accent)" }}>
            Drop files to import into project
          </span>
        </div>
      )}

      {/* 3. Empty State (Section 35) or Asset Grid/List */}
      {filtered.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "32px 16px",
            textAlign: "center",
            gap: "10px",
          }}
        >
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
            <UploadCloud size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
              No media yet
            </h4>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
              Drop video, audio, or images here.
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="export-primary-btn"
            style={{ fontSize: "11px", padding: "6px 14px" }}
          >
            Import Media
          </button>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map((asset) => {
            const isSelected = selectedAssetId === asset.id;

            return (
              <div
                key={asset.id}
                onClick={() => onSelectAsset(asset)}
                onDoubleClick={() => onInsertToTimeline(asset)}
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData(
                    "application/json",
                    JSON.stringify({
                      type: "MEDIA_ASSET",
                      assetId: asset.id,
                      title: asset.title,
                      durationSec: asset.durationSec,
                      durationFrames: asset.durationFrames,
                      mediaType: asset.type,
                    })
                  );
                  e.dataTransfer.effectAllowed = "copy";
                }}
                style={{
                  display: "flex",
                  flexDirection: viewMode === "GRID" ? "column" : "row",
                  background: isSelected ? "var(--accent-soft)" : "var(--bg-surface)",
                  border: isSelected ? "1px solid var(--accent-border)" : "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  cursor: "grab",
                  boxShadow: isSelected ? "0 0 0 1px var(--accent)" : "var(--shadow-xs)",
                  transition: "all 0.12s ease",
                  position: "relative",
                }}
              >
                {/* Thumbnail Wrap */}
                <div style={{ position: "relative", width: viewMode === "GRID" ? "100%" : "90px", height: viewMode === "GRID" ? "95px" : "60px", background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {asset.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={asset.thumbnailUrl}
                      alt={asset.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <Film size={22} style={{ color: "#666" }} />
                  )}
                  <span
                    style={{
                      position: "absolute",
                      bottom: "4px",
                      right: "4px",
                      background: "rgba(0, 0, 0, 0.75)",
                      color: "white",
                      fontSize: "9px",
                      fontWeight: 600,
                      padding: "1px 4px",
                      borderRadius: "3px",
                    }}
                  >
                    {asset.durationSec}s
                  </span>
                  <span
                    style={{
                      position: "absolute",
                      top: "4px",
                      left: "4px",
                      background: "rgba(79, 115, 247, 0.9)",
                      color: "white",
                      fontSize: "8px",
                      fontWeight: 700,
                      padding: "1px 4px",
                      borderRadius: "2px",
                    }}
                  >
                    {asset.resolution.includes("3840") ? "4K" : "HD"}
                  </span>
                </div>

                {/* Asset Meta Info & Add to Timeline */}
                <div style={{ padding: "8px", display: "flex", flexDirection: "column", gap: "5px", flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {asset.title}
                    </span>
                    {onDeleteAsset && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteAsset(asset.id);
                        }}
                        style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "2px" }}
                        title="Remove Asset"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>

                  <div style={{ fontSize: "10px", color: "var(--text-secondary)", display: "flex", justifyContent: "space-between" }}>
                    <span>{asset.tags.join(" • ") || "Clip"}</span>
                    <span style={{ fontFamily: "monospace" }}>{asset.resolution}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onInsertToTimeline(asset);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      background: "var(--bg-subtle)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      padding: "3px 6px",
                      fontSize: "10px",
                      fontWeight: 600,
                      color: "var(--accent)",
                      cursor: "pointer",
                      marginTop: "2px",
                      transition: "all 0.12s ease",
                    }}
                    title="Insert clip to timeline at playhead"
                  >
                    <Plus size={11} />
                    <span>Add to Timeline</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
