"use client";

import React, { useState } from "react";
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
  SlidersHorizontal,
  AlertTriangle,
  RotateCw,
  FolderOpen,
  Zap,
} from "lucide-react";
import { MediaAsset } from "@/lib/sample-data";

export interface ExtendedMediaAsset extends MediaAsset {
  proxyStatus?: "READY" | "ORIGINAL_ONLY" | "OFFLINE" | "TRANSCODING";
  codec?: string;
  sourceFilePath?: string;
}

interface MediaBinProps {
  assets: MediaAsset[];
  selectedAssetId: string | null;
  onSelectAsset: (asset: MediaAsset) => void;
  onInsertToTimeline: (asset: MediaAsset) => void;
  isProxyMode?: boolean;
  onToggleProxyMode?: (val: boolean) => void;
}

export const MediaBin: React.FC<MediaBinProps> = ({
  assets,
  selectedAssetId,
  onSelectAsset,
  onInsertToTimeline,
  isProxyMode = true,
  onToggleProxyMode,
}) => {
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID");
  const [searchQuery, setSearchQuery] = useState("");
  const [aiSearchActive, setAiSearchActive] = useState(false);
  const [relinkingAssetId, setRelinkingAssetId] = useState<string | null>(null);

  // Augment sample assets with realistic media management states (Point #14)
  const augmentedAssets: ExtendedMediaAsset[] = assets.map((a, i) => ({
    ...a,
    proxyStatus: i === 3 ? "OFFLINE" : i === 2 ? "TRANSCODING" : "READY",
    codec: a.resolution.includes("3840") ? "ProRes 422 HQ (4K)" : "H.264 (1080p)",
    sourceFilePath: `/Volumes/Vault/Footage/${a.title.replace(/\s+/g, "_")}.mov`,
  }));

  const filtered = augmentedAssets.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSimulateRelink = (assetId: string) => {
    setRelinkingAssetId(assetId);
    setTimeout(() => {
      setRelinkingAssetId(null);
    }, 1200);
  };

  const getProxyStatusBadge = (status?: string) => {
    switch (status) {
      case "READY":
        return (
          <span style={{ fontSize: "8px", fontWeight: 700, color: "#10B981", background: "rgba(16, 185, 129, 0.15)", padding: "1px 4px", borderRadius: "3px" }}>
            ● Proxy Ready
          </span>
        );
      case "OFFLINE":
        return (
          <span style={{ fontSize: "8px", fontWeight: 700, color: "#EF4444", background: "rgba(239, 68, 68, 0.15)", padding: "1px 4px", borderRadius: "3px", display: "flex", alignItems: "center", gap: "2px" }}>
            ⚠ Media Offline
          </span>
        );
      case "TRANSCODING":
        return (
          <span style={{ fontSize: "8px", fontWeight: 700, color: "#F59E0B", background: "rgba(245, 158, 11, 0.15)", padding: "1px 4px", borderRadius: "3px" }}>
            Transcoding...
          </span>
        );
      default:
        return (
          <span style={{ fontSize: "8px", fontWeight: 700, color: "var(--text-muted)", background: "var(--bg-subtle)", padding: "1px 4px", borderRadius: "3px" }}>
            Original Only
          </span>
        );
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-surface)" }}>
      {/* 1. Header with Proxy Mode Toggle & View Switcher (Points #14, #15) */}
      <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Folder size={15} style={{ color: "var(--accent)" }} />
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
            Media Vault
          </span>
        </div>

        {/* Global Proxy Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <button
            onClick={() => onToggleProxyMode?.(!isProxyMode)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "3px",
              padding: "2px 6px",
              fontSize: "10px",
              fontWeight: 700,
              borderRadius: "4px",
              border: isProxyMode ? "1px solid #10B981" : "1px solid var(--border)",
              background: isProxyMode ? "rgba(16, 185, 129, 0.12)" : "transparent",
              color: isProxyMode ? "#10B981" : "var(--text-muted)",
              cursor: "pointer",
            }}
            title="Toggle ProRes 720p Proxy Editing Mode"
          >
            <Zap size={11} />
            <span>Proxy: {isProxyMode ? "ON" : "OFF"}</span>
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

      {/* 2. Search & AI Semantic Filter */}
      <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "5px 8px" }}>
          <Search size={13} style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder={aiSearchActive ? "AI Semantic: 'b-roll drone footage'..." : "Search assets, codecs, tags..."}
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
          <button
            onClick={() => setAiSearchActive(!aiSearchActive)}
            style={{
              background: aiSearchActive ? "var(--accent-soft)" : "transparent",
              border: "none",
              borderRadius: "3px",
              padding: "2px 4px",
              cursor: "pointer",
              color: aiSearchActive ? "var(--accent)" : "var(--text-muted)",
            }}
            title="Toggle AI Semantic Search"
          >
            <Sparkles size={12} />
          </button>
        </div>
      </div>

      {/* 3. Assets List / Grid */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {filtered.map((asset) => {
          const isSelected = selectedAssetId === asset.id;
          const isOffline = asset.proxyStatus === "OFFLINE";
          const isRelinking = relinkingAssetId === asset.id;

          return (
            <div
              key={asset.id}
              onClick={() => onSelectAsset(asset)}
              onDoubleClick={() => onInsertToTimeline(asset)}
              style={{
                display: "flex",
                flexDirection: viewMode === "GRID" ? "column" : "row",
                background: isSelected ? "var(--accent-soft)" : "var(--bg-surface)",
                border: isSelected ? "1px solid var(--accent-border)" : "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                cursor: "pointer",
                boxShadow: isSelected ? "0 0 0 1px var(--accent)" : "var(--shadow-xs)",
                transition: "all 0.12s ease",
                opacity: isOffline ? 0.85 : 1,
              }}
            >
              {/* Thumbnail Wrap */}
              <div style={{ position: "relative", width: viewMode === "GRID" ? "100%" : "90px", height: viewMode === "GRID" ? "95px" : "60px", background: "#000" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset.thumbnailUrl}
                  alt={asset.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover", filter: isOffline ? "grayscale(80%)" : "none" }}
                />
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
                  {asset.resolution.includes("3840") ? "4K" : "1080p"}
                </span>
              </div>

              {/* Asset Meta Info */}
              <div style={{ padding: "8px", display: "flex", flexDirection: "column", gap: "3px", flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {asset.title}
                  </span>
                  {getProxyStatusBadge(asset.proxyStatus)}
                </div>

                <div style={{ fontSize: "10px", color: "var(--text-secondary)", display: "flex", justifyContent: "space-between" }}>
                  <span>{asset.codec}</span>
                  <span style={{ fontFamily: "monospace" }}>{asset.resolution}</span>
                </div>

                {/* Offline Relink UI (Point #14) */}
                {isOffline && (
                  <div style={{ display: "flex", gap: "4px", marginTop: "4px" }} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleSimulateRelink(asset.id)}
                      disabled={isRelinking}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "3px",
                        background: "var(--bg-subtle)",
                        border: "1px solid var(--danger)",
                        borderRadius: "3px",
                        padding: "3px 6px",
                        fontSize: "9px",
                        fontWeight: 600,
                        color: "var(--danger)",
                        cursor: "pointer",
                      }}
                    >
                      <RotateCw size={9} className={isRelinking ? "spin-fast" : ""} />
                      <span>{isRelinking ? "Relinking..." : "Relink"}</span>
                    </button>

                    <button
                      onClick={() => handleSimulateRelink(asset.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "2px",
                        background: "var(--bg-subtle)",
                        border: "1px solid var(--border)",
                        borderRadius: "3px",
                        padding: "3px 6px",
                        fontSize: "9px",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                      }}
                      title="Locate Folder"
                    >
                      <FolderOpen size={9} />
                      <span>Locate</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
