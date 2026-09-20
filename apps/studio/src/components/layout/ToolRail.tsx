"use client";

import React from "react";
import {
  LayoutTemplate,
  FolderOpen,
  Layers,
  UploadCloud,
  Subtitles,
  Image as ImageIcon,
  Video,
  Music2,
  Type,
  Square,
  BookmarkCheck,
  Sparkles,
} from "lucide-react";

export type ToolRailSection =
  | "TEMPLATES"
  | "MEDIA"
  | "ELEMENTS"
  | "UPLOADS"
  | "CAPTIONS"
  | "IMAGES"
  | "VIDEOS"
  | "AUDIO"
  | "TEXT"
  | "SHAPES"
  | "BRAND"
  | "AI";

interface ToolRailProps {
  activeSection: ToolRailSection | null;
  onSelectSection: (section: ToolRailSection) => void;
}

const RAIL_ITEMS: Array<{
  id: ToolRailSection;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  shortcut?: string;
}> = [
  { id: "TEMPLATES", label: "Templates", icon: LayoutTemplate, shortcut: "T" },
  { id: "MEDIA", label: "Media", icon: FolderOpen, shortcut: "M" },
  { id: "ELEMENTS", label: "Elements", icon: Layers, shortcut: "E" },
  { id: "UPLOADS", label: "Uploads", icon: UploadCloud, shortcut: "U" },
  { id: "CAPTIONS", label: "Captions", icon: Subtitles, shortcut: "C" },
  { id: "IMAGES", label: "Images", icon: ImageIcon, shortcut: "I" },
  { id: "VIDEOS", label: "Videos", icon: Video, shortcut: "V" },
  { id: "AUDIO", label: "Audio", icon: Music2, shortcut: "A" },
  { id: "TEXT", label: "Text", icon: Type, shortcut: "X" },
  { id: "SHAPES", label: "Shapes", icon: Square, shortcut: "S" },
  { id: "BRAND", label: "Brand", icon: BookmarkCheck, shortcut: "B" },
  { id: "AI", label: "AI", icon: Sparkles, shortcut: "⌘J" },
];

export const ToolRail: React.FC<ToolRailProps> = ({
  activeSection,
  onSelectSection,
}) => {
  return (
    <aside className="tool-rail-container" aria-label="Tool Rail">
      <div style={{ display: "flex", flexDirection: "column", gap: "2px", width: "100%", alignItems: "center" }}>
        {RAIL_ITEMS.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`rail-item-btn ${isActive ? "rail-item-active" : ""}`}
              title={`${item.label} (${item.shortcut || ""})`}
              aria-pressed={isActive}
            >
              <IconComponent size={18} />
              <span className="rail-item-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
