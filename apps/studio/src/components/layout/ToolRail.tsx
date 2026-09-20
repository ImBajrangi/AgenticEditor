"use client";

import React from "react";
import {
  LayoutTemplate,
  FolderOpen,
  Boxes,
  UploadCloud,
  Subtitles,
  Image as ImageIcon,
  Film,
  Music,
  Type,
  Shapes,
  Palette,
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

const RAIL_ITEMS: Array<{ id: ToolRailSection; label: string; icon: React.FC<{ size?: number }> }> = [
  { id: "TEMPLATES", label: "Templates", icon: LayoutTemplate },
  { id: "MEDIA", label: "Media", icon: FolderOpen },
  { id: "ELEMENTS", label: "Elements", icon: Boxes },
  { id: "UPLOADS", label: "Uploads", icon: UploadCloud },
  { id: "CAPTIONS", label: "Captions", icon: Subtitles },
  { id: "IMAGES", label: "Images", icon: ImageIcon },
  { id: "VIDEOS", label: "Videos", icon: Film },
  { id: "AUDIO", label: "Audio", icon: Music },
  { id: "TEXT", label: "Text", icon: Type },
  { id: "SHAPES", label: "Shapes", icon: Shapes },
  { id: "BRAND", label: "Brand", icon: Palette },
  { id: "AI", label: "AI Tools", icon: Sparkles },
];

export const ToolRail: React.FC<ToolRailProps> = ({ activeSection, onSelectSection }) => {
  return (
    <aside className="tool-rail-container" aria-label="Left Tool Rail">
      {RAIL_ITEMS.map((item) => {
        const IconComponent = item.icon;
        const isActive = activeSection === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectSection(item.id)}
            className={`rail-item-btn ${isActive ? "rail-item-active" : ""}`}
            title={`${item.label} Panel`}
            aria-pressed={isActive}
          >
            <IconComponent size={20} />
            <span className="rail-item-label">{item.label}</span>
          </button>
        );
      })}
    </aside>
  );
};
