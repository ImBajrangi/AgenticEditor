"use client";

import React, { useState } from "react";
import {
  X,
  Sparkles,
  Film,
  Music2,
  Type,
  Layers,
  UploadCloud,
  Subtitles,
  Image as ImageIcon,
  Video,
  Square,
  BookmarkCheck,
  Search,
  Plus,
  Play,
  Volume2,
  Palette,
  Check,
  Zap,
} from "lucide-react";
import { ToolRailSection } from "./ToolRail";
import { MediaBin } from "../assets/MediaBin";
import { MediaAsset } from "@/lib/sample-data";

interface LeftDrawerProps {
  section: ToolRailSection | null;
  onClose: () => void;
  assets: MediaAsset[];
  selectedAsset: MediaAsset | null;
  onSelectAsset: (asset: MediaAsset) => void;
  onInsertAsset: (asset: MediaAsset) => void;
  isProxyMode: boolean;
  onToggleProxyMode: (val: boolean) => void;
  onApplyPreset?: (presetName: string) => void;
  onDirectAiAction?: (action: string) => void;
  onAddAssets?: (assets: MediaAsset[]) => void;
  onDeleteAsset?: (assetId: string) => void;
}

// Professional Cinematic Presets (Section 46-47)
const CINEMATIC_PRESETS = [
  {
    id: "cinematic-travel",
    title: "Cinematic Travel",
    mood: "Warm • Organic • Filmic",
    pacing: "Medium",
    color: "Kodak 5207 Filmic",
    transitions: "Minimal Cuts",
    sound: "Natural + Ambient Cinematic",
  },
  {
    id: "luxury-product",
    title: "Luxury Product",
    mood: "Sleek • High Contrast • Precision",
    pacing: "Controlled",
    color: "Clean Monochrome Gamma 2.4",
    transitions: "Match Cut",
    sound: "Crisp Sub-Bass + ASMR",
  },
  {
    id: "documentary",
    title: "Documentary Narrative",
    mood: "Raw • Authentic • Realism",
    pacing: "Observational",
    color: "Rec.709 Natural",
    transitions: "J/L Audio Leads",
    sound: "Dialogue Priority (-14 LUFS)",
  },
  {
    id: "editorial-fashion",
    title: "Editorial Fashion",
    mood: "Punchy • Stylized • Avant-Garde",
    pacing: "Rhythmic & Fast",
    color: "Fujifilm Eterna 250D",
    transitions: "Whip Pan & Zoom",
    sound: "Electronic Beats",
  },
  {
    id: "dark-thriller",
    title: "Dark Thriller",
    mood: "Moody • Cold • Suspense",
    pacing: "Tense Build",
    color: "Teal & Orange Film",
    transitions: "Hard Cuts & Fade",
    sound: "Low Drone & Tension Hit",
  },
  {
    id: "high-energy-social",
    title: "High-Energy Social",
    mood: "Fast • Hook-Driven • Dynamic",
    pacing: "Hyper (1.2s avg cut)",
    color: "Vibrant Punch",
    transitions: "Fast Swipes",
    sound: "Beat Drop + Sound FX",
  },
];

const CAPTION_STYLES = [
  { id: "sub_bold", name: "Bold Impact", preview: "DISCOVER THE WORLD", font: "Inter Black", color: "#FFFFFF", bg: "#4F73F7" },
  { id: "sub_clean", name: "Modern Minimal", preview: "The ocean speaks in silence.", font: "Inter Medium", color: "#202124", bg: "transparent" },
  { id: "sub_cinema", name: "Cinematic Lower", preview: "PACIFIC COASTLINE — 07:00 AM", font: "Monospace", color: "#F7F7F8", bg: "rgba(0,0,0,0.6)" },
  { id: "sub_karaoke", name: "Karaoke Highlight", preview: "Catching the next wave", font: "Inter Bold", color: "#22A06B", bg: "transparent" },
];

const TEXT_PRESETS = [
  { id: "txt_hero", label: "Hero Title", sample: "CINEMATIC TITLE", size: "32px", weight: "800" },
  { id: "txt_sub", label: "Section Subtitle", sample: "Episode 01: The Beginning", size: "20px", weight: "600" },
  { id: "txt_lower", label: "Lower Third", sample: "Alex Rivera | Ocean Explorer", size: "14px", weight: "500" },
  { id: "txt_callout", label: "Feature Callout", sample: "4K 60FPS Footage", size: "12px", weight: "700" },
];

const AUDIO_TRACKS = [
  { id: "aud_1", title: "Pacific Ocean Breeze", category: "Ambient", duration: "2:45", bpm: 84 },
  { id: "aud_2", title: "Sunrise Cinematic Strings", category: "Music", duration: "3:12", bpm: 96 },
  { id: "aud_3", title: "Dynamic Surf Beat Drop", category: "High Energy", duration: "1:58", bpm: 128 },
  { id: "aud_4", title: "Deep Sub-Bass Impact", category: "SFX", duration: "0:04", bpm: 0 },
  { id: "aud_5", title: "Whoosh Transition", category: "SFX", duration: "0:02", bpm: 0 },
];

export const LeftDrawer: React.FC<LeftDrawerProps> = ({
  section,
  onClose,
  assets,
  selectedAsset,
  onSelectAsset,
  onInsertAsset,
  isProxyMode,
  onToggleProxyMode,
  onApplyPreset,
  onDirectAiAction,
  onAddAssets,
  onDeleteAsset,
}) => {
  const [activeTab, setActiveTab] = useState("all");

  if (!section) return null;

  return (
    <div className="left-drawer-panel" style={{ width: "340px" }}>
      {/* Drawer Header */}
      <div className="drawer-header">
        <span className="drawer-title">
          {section === "TEMPLATES" && "Templates & Presets"}
          {section === "MEDIA" && "Media Assets"}
          {section === "ELEMENTS" && "Elements & Motion"}
          {section === "UPLOADS" && "Import Media"}
          {section === "CAPTIONS" && "Auto Captions"}
          {section === "IMAGES" && "Image Library"}
          {section === "VIDEOS" && "Video Clips"}
          {section === "AUDIO" && "Audio & Music"}
          {section === "TEXT" && "Text & Titles"}
          {section === "SHAPES" && "Shapes"}
          {section === "BRAND" && "Brand Kit"}
          {section === "AI" && "AI Assistant"}
        </span>
        <button
          onClick={onClose}
          className="btn-icon-subtle"
          title="Close Panel"
          style={{ width: "28px", height: "28px" }}
        >
          <X size={15} />
        </button>
      </div>

      {/* Drawer Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
        {/* SECTION 1: TEMPLATES (Section 46-47) */}
        {section === "TEMPLATES" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              Complete style systems for pacing, color, transitions, and audio:
            </span>
            {CINEMATIC_PRESETS.map((p) => (
              <div
                key={p.id}
                style={{
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  transition: "border-color 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                    {p.title}
                  </span>
                  <button
                    onClick={() => onApplyPreset?.(p.title)}
                    className="export-primary-btn"
                    style={{ padding: "4px 10px", fontSize: "11px" }}
                  >
                    Apply
                  </button>
                </div>
                <span style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 600 }}>
                  {p.mood}
                </span>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px", marginTop: "2px" }}>
                  <span>Pacing: {p.pacing}</span>
                  <span>Color: {p.color}</span>
                  <span>Transitions: {p.transitions}</span>
                  <span>Audio: {p.sound}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SECTION 2: MEDIA / VIDEOS / IMAGES / UPLOADS */}
        {(section === "MEDIA" || section === "VIDEOS" || section === "IMAGES" || section === "UPLOADS") && (
          <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <MediaBin
              assets={assets}
              selectedAssetId={selectedAsset?.id || null}
              onSelectAsset={onSelectAsset}
              onInsertToTimeline={onInsertAsset}
              isProxyMode={isProxyMode}
              onToggleProxyMode={onToggleProxyMode}
              onAddAssets={onAddAssets}
              onDeleteAsset={onDeleteAsset}
            />
          </div>
        )}

        {/* SECTION 3: CAPTIONS */}
        {section === "CAPTIONS" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <button
              onClick={() => onDirectAiAction?.("Generate auto subtitles")}
              className="export-primary-btn"
              style={{ width: "100%", justifyContent: "center", padding: "10px" }}
            >
              <Sparkles size={15} />
              <span>Generate Auto-Captions</span>
            </button>

            <div>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                Subtitle Style Presets
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                {CAPTION_STYLES.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => onDirectAiAction?.(`Apply caption style: ${st.name}`)}
                    style={{
                      background: "var(--bg-subtle)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      padding: "10px 12px",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 600 }}>
                      <span>{st.name}</span>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{st.font}</span>
                    </div>
                    <div
                      style={{
                        marginTop: "8px",
                        background: "#000000",
                        padding: "8px",
                        borderRadius: "4px",
                        textAlign: "center",
                      }}
                    >
                      <span style={{ color: st.color, background: st.bg, padding: "2px 6px", borderRadius: "3px", fontSize: "11px", fontWeight: 700 }}>
                        {st.preview}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: TEXT */}
        {section === "TEXT" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
              Typography Presets
            </span>
            {TEXT_PRESETS.map((t) => (
              <div
                key={t.id}
                onClick={() => onDirectAiAction?.(`Insert text: ${t.label}`)}
                style={{
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "12px 14px",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>{t.label}</span>
                <span style={{ fontSize: t.size === "32px" ? "18px" : t.size, fontWeight: t.weight as any, color: "var(--text-primary)", display: "block", marginTop: "2px" }}>
                  {t.sample}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* SECTION 5: AUDIO */}
        {section === "AUDIO" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                Licensed Audio Library
              </span>
              <span style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 600 }}>Royalty-Free</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {AUDIO_TRACKS.map((track) => (
                <div
                  key={track.id}
                  style={{
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "8px 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "26px", height: "26px", borderRadius: "4px", background: "var(--accent-soft)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Music2 size={13} />
                    </div>
                    <div>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", display: "block" }}>
                        {track.title}
                      </span>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                        {track.category} • {track.duration} {track.bpm > 0 && `• ${track.bpm} BPM`}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onDirectAiAction?.(`Add audio track: ${track.title}`)}
                    className="btn-icon-subtle"
                    title="Add to Timeline"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 6: ELEMENTS & SHAPES */}
        {(section === "ELEMENTS" || section === "SHAPES") && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
              Geometric & Motion Elements
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {["Rectangle", "Circle", "Accent Line", "Arrow", "Pill Tag", "Glass Badge"].map((shape) => (
                <button
                  key={shape}
                  onClick={() => onDirectAiAction?.(`Insert shape: ${shape}`)}
                  style={{
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "16px 8px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    cursor: "pointer",
                    color: "var(--text-primary)",
                  }}
                >
                  <Square size={20} style={{ color: "var(--accent)" }} />
                  <span style={{ fontSize: "11px", fontWeight: 500 }}>{shape}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 7: BRAND */}
        {section === "BRAND" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                Brand Color Tokens
              </span>
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                {["#4F73F7", "#202124", "#22A06B", "#D99100", "#D64545"].map((c) => (
                  <div
                    key={c}
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "6px",
                      background: c,
                      border: "1px solid var(--border)",
                      boxShadow: "var(--shadow-xs)",
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                Brand Typography
              </span>
              <div style={{ marginTop: "6px", fontSize: "12px", color: "var(--text-secondary)" }}>
                Inter Display • Regular & Bold 800
              </div>
            </div>
          </div>
        )}

        {/* SECTION 8: AI */}
        {section === "AI" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              Direct the AI Director to automate edits across the timeline:
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {[
                "Cut dead air & remove pauses",
                "Enhance cinematic arc & pacing",
                "Reframe to 9:16 vertical format",
                "Add dynamic subtitle captions",
                "Apply Kodak 5207 3D LUT grade",
                "Normalize audio to -14 LUFS",
              ].map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => onDirectAiAction?.(cmd)}
                  style={{
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "8px 12px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Sparkles size={13} style={{ color: "var(--accent)", flexShrink: 0 }} />
                  <span>{cmd}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
