"use client";

import React, { useState } from "react";
import {
  Settings2,
  ChevronDown,
  ChevronRight,
  Move,
  Eye,
  Palette,
  Volume2,
  Sparkles,
  Sliders,
  SunMedium,
  Pipette,
  Gauge,
  Layers,
  Activity,
  SplitSquareVertical,
  SlidersHorizontal,
  CircleDot,
} from "lucide-react";
import { TimelineClip } from "@aetheredit/timeline-ir";
import { WorkflowNode } from "@aetheredit/workflow-engine";

export interface LutMetadata {
  name: string;
  type: string;
  inputColorSpace: string;
  outputColorSpace: string;
  intensity: number;
  version: string;
  file: string;
}

const LUT_PRESETS: LutMetadata[] = [
  {
    name: "Kodak Vision3 5207",
    type: "3D Tetrahedral CUBE",
    inputColorSpace: "Rec.709 / Log-C",
    outputColorSpace: "Rec.709 Scene",
    intensity: 1.0,
    version: "v2.1",
    file: "Kodak_5207_Filmic.cube",
  },
  {
    name: "Fujifilm Eterna 250D",
    type: "3D Tetrahedral CUBE",
    inputColorSpace: "Rec.709 / F-Log",
    outputColorSpace: "Rec.709 Scene",
    intensity: 0.85,
    version: "v1.4",
    file: "Fuji_F125_Filmic.cube",
  },
  {
    name: "Rec.709 Standard Broadcast",
    type: "1D/3D Matrix",
    inputColorSpace: "Rec.709",
    outputColorSpace: "BT.709 Clean",
    intensity: 1.0,
    version: "v3.0",
    file: "Rec709_Clean.cube",
  },
  {
    name: "B&W Silver Halide Noir",
    type: "3D Monochrome CUBE",
    inputColorSpace: "Rec.709",
    outputColorSpace: "Monochrome Gamma 2.4",
    intensity: 1.0,
    version: "v1.0",
    file: "Monochrome_High_Contrast.cube",
  },
];

interface InspectorPanelProps {
  selectedClip: TimelineClip | null;
  selectedNode: WorkflowNode | null;
  mode: "EDIT" | "WORKFLOW" | "REVIEW";
  onUpdateClipSpeed?: (clipId: string, speed: number) => void;
  onUpdateClipVolume?: (clipId: string, volumeDb: number) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selectedClip,
  selectedNode,
  mode,
  onUpdateClipSpeed,
}) => {
  // Accordion Section States
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    transform: true,
    color: true,
    wheels: false,
    curves: false,
    scopes: false,
    audio: true,
    busMixer: true,
    effects: false,
  });

  // Color Grading States
  const [colorSubTab, setColorSubTab] = useState<"PRIMARY" | "WHEELS" | "CURVES" | "SCOPES">("PRIMARY");
  const [exposure, setExposure] = useState(0.3);
  const [temperature, setTemperature] = useState(5600);
  const [tint, setTint] = useState(2);
  const [contrast, setContrast] = useState(1.15);
  const [saturation, setSaturation] = useState(105);
  const [selectedLutIndex, setSelectedLutIndex] = useState(0);
  const [lutIntensity, setLutIntensity] = useState(100);
  const [splitCompareActive, setSplitCompareActive] = useState(false);

  // Audio DSP & Bus Architecture States
  const [audioViewMode, setAudioViewMode] = useState<"CLIP_DSP" | "BUS_MIXER">("BUS_MIXER");
  const [volumeDb, setVolumeDb] = useState(0.0);
  const [dialogueBusGain, setDialogueBusGain] = useState(0.0);
  const [musicBusGain, setMusicBusGain] = useState(-14.0);
  const [sfxBusGain, setSfxBusGain] = useState(-6.0);
  const [masterBusGain, setMasterBusGain] = useState(0.0);
  const [enableDucking, setEnableDucking] = useState(true);
  const [enableLufsNorm, setEnableLufsNorm] = useState(true);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Color Wheels State (Lift, Gamma, Gain)
  const [liftPuck, setLiftPuck] = useState({ x: -2, y: 2 });
  const [gammaPuck, setGammaPuck] = useState({ x: 0, y: 0 });
  const [gainPuck, setGainPuck] = useState({ x: 3, y: -3 });
  const [liftY, setLiftY] = useState(0.0);
  const [gammaY, setGammaY] = useState(0.0);
  const [gainY, setGainY] = useState(0.0);

  // Curve Presets State
  const [curvePreset, setCurvePreset] = useState<"LINEAR" | "S_CURVE" | "MATTE" | "HIGHLIGHT_ROLLOFF">("S_CURVE");

  // Audio LUFS Delivery Standard State
  const [lufsStandard, setLufsStandard] = useState<"EBU_R128" | "YOUTUBE" | "PODCAST">("EBU_R128");

  const getCurvePath = () => {
    switch (curvePreset) {
      case "S_CURVE":
        return "M 0 100 C 25 100, 25 75, 50 50 C 75 25, 75 0, 100 0";
      case "MATTE":
        return "M 0 85 C 30 85, 40 50, 60 30 C 80 15, 90 5, 100 0";
      case "HIGHLIGHT_ROLLOFF":
        return "M 0 100 C 35 70, 65 35, 80 18 C 90 10, 95 8, 100 5";
      default:
        return "M 0 100 L 100 0";
    }
  };

  const getLufsValue = () => {
    switch (lufsStandard) {
      case "YOUTUBE":
        return "-14.0 LUFS (-1.0 dBTP)";
      case "PODCAST":
        return "-16.0 LUFS (-1.0 dBTP)";
      default:
        return "-23.0 LUFS (-1.0 dBTP)";
    }
  };

  const handleColorWheelClick = (e: React.MouseEvent<HTMLDivElement>, wheel: "LIFT" | "GAMMA" | "GAIN") => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = Math.max(-12, Math.min(12, Math.round((e.clientX - centerX) / 2)));
    const dy = Math.max(-12, Math.min(12, Math.round((e.clientY - centerY) / 2)));

    if (wheel === "LIFT") setLiftPuck({ x: dx, y: dy });
    if (wheel === "GAMMA") setGammaPuck({ x: dx, y: dy });
    if (wheel === "GAIN") setGainPuck({ x: dx, y: dy });
  };

  const currentLut = LUT_PRESETS[selectedLutIndex];

  if (mode === "WORKFLOW" && selectedNode) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-surface)" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "6px" }}>
          <Settings2 size={14} style={{ color: "var(--accent)" }} />
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
            Node Configuration
          </span>
        </div>
        <div style={{ padding: "14px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
            <span style={{ color: "var(--text-secondary)" }}>Node ID</span>
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{selectedNode.id}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
            <span style={{ color: "var(--text-secondary)" }}>Category</span>
            <span style={{ fontWeight: 600, color: "var(--accent)" }}>{selectedNode.category}</span>
          </div>
          <div style={{ height: "1px", background: "var(--border)", margin: "4px 0" }} />
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Node Parameters
          </span>
          {Object.entries(selectedNode.parameters).map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", background: "var(--bg-subtle)", padding: "4px 8px", borderRadius: "4px" }}>
              <span style={{ color: "var(--text-secondary)" }}>{k}</span>
              <span style={{ fontFamily: "monospace", color: "var(--text-primary)" }}>{String(v)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!selectedClip) {
    return (
      <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
        Select a timeline clip to inspect transform, professional color grading, and audio DSP properties
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-surface)", overflowY: "auto" }}>
      {/* 1. Clip Identity Header */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", display: "block" }}>
            {selectedClip.name}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
            {(selectedClip.timelineRange.duration / 30).toFixed(1)}s • {selectedClip.timelineRange.duration} frames
          </span>
        </div>
        <span style={{ fontSize: "10px", background: "var(--accent-soft)", color: "var(--accent)", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>
          ACTIVE CLIP
        </span>
      </div>

      {/* 2. Transform & Speed Accordion */}
      <div className="accordion-group">
        <button className="accordion-header" onClick={() => toggleSection("transform")}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Move size={13} style={{ color: "var(--accent)" }} />
            <span>Transform & Speed Ramp</span>
          </div>
          {openSections.transform ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {openSections.transform && (
          <div className="accordion-content">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
              <span style={{ color: "var(--text-secondary)" }}>Speed Playback</span>
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{selectedClip.speed}x</span>
            </div>
            <input
              type="range"
              min="0.25"
              max="4.0"
              step="0.25"
              value={selectedClip.speed}
              onChange={(e) => onUpdateClipSpeed?.(selectedClip.id, parseFloat(e.target.value))}
              style={{ accentColor: "var(--accent)", width: "100%", cursor: "pointer" }}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "11px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Scale</span>
                <input
                  type="number"
                  step="0.1"
                  defaultValue={selectedClip.transform.scale.x}
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "4px", padding: "4px", fontSize: "11px" }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "11px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Opacity</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={Math.round(selectedClip.transform.opacity * 100)}
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "4px", padding: "4px", fontSize: "11px" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Professional Color Grading (Primary, Wheels, Curves, Scopes, 3D LUT Metadata) */}
      <div className="accordion-group">
        <button className="accordion-header" onClick={() => toggleSection("color")}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Palette size={13} style={{ color: "var(--accent)" }} />
            <span>Color Grading System</span>
          </div>
          {openSections.color ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {openSections.color && (
          <div className="accordion-content">
            {/* Color Sub-Tabs [Primary | Wheels | Curves | Scopes] */}
            <div style={{ display: "flex", background: "var(--bg-subtle)", padding: "2px", borderRadius: "4px", marginBottom: "8px" }}>
              <button
                onClick={() => setColorSubTab("PRIMARY")}
                style={{
                  flex: 1,
                  padding: "3px",
                  fontSize: "10px",
                  fontWeight: 600,
                  border: "none",
                  borderRadius: "3px",
                  background: colorSubTab === "PRIMARY" ? "var(--bg-surface)" : "transparent",
                  color: colorSubTab === "PRIMARY" ? "var(--accent)" : "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                Primary
              </button>
              <button
                onClick={() => setColorSubTab("WHEELS")}
                style={{
                  flex: 1,
                  padding: "3px",
                  fontSize: "10px",
                  fontWeight: 600,
                  border: "none",
                  borderRadius: "3px",
                  background: colorSubTab === "WHEELS" ? "var(--bg-surface)" : "transparent",
                  color: colorSubTab === "WHEELS" ? "var(--accent)" : "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                3-Way
              </button>
              <button
                onClick={() => setColorSubTab("CURVES")}
                style={{
                  flex: 1,
                  padding: "3px",
                  fontSize: "10px",
                  fontWeight: 600,
                  border: "none",
                  borderRadius: "3px",
                  background: colorSubTab === "CURVES" ? "var(--bg-surface)" : "transparent",
                  color: colorSubTab === "CURVES" ? "var(--accent)" : "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                Curves
              </button>
              <button
                onClick={() => setColorSubTab("SCOPES")}
                style={{
                  flex: 1,
                  padding: "3px",
                  fontSize: "10px",
                  fontWeight: 600,
                  border: "none",
                  borderRadius: "3px",
                  background: colorSubTab === "SCOPES" ? "var(--bg-surface)" : "transparent",
                  color: colorSubTab === "SCOPES" ? "var(--accent)" : "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                Scopes
              </button>
            </div>

            {colorSubTab === "PRIMARY" && (
              <>
                {/* Exposure Slider */}
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Exposure</span>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{exposure > 0 ? `+${exposure.toFixed(1)}` : exposure.toFixed(1)} EV</span>
                  </div>
                  <input
                    type="range"
                    min="-3.0"
                    max="3.0"
                    step="0.1"
                    value={exposure}
                    onChange={(e) => setExposure(parseFloat(e.target.value))}
                    style={{ accentColor: "var(--accent)", width: "100%", cursor: "pointer" }}
                  />
                </div>

                {/* White Balance (Temp & Tint) */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "11px" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Temp ({temperature}K)</span>
                    <input
                      type="range"
                      min="2500"
                      max="10000"
                      step="100"
                      value={temperature}
                      onChange={(e) => setTemperature(parseInt(e.target.value))}
                      style={{ accentColor: "#F59E0B", cursor: "pointer" }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "11px" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Tint ({tint})</span>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={tint}
                      onChange={(e) => setTint(parseInt(e.target.value))}
                      style={{ accentColor: "#EC4899", cursor: "pointer" }}
                    />
                  </div>
                </div>

                {/* Contrast & Saturation */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "11px" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Contrast ({contrast.toFixed(2)})</span>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.05"
                      value={contrast}
                      onChange={(e) => setContrast(parseFloat(e.target.value))}
                      style={{ accentColor: "var(--accent)", cursor: "pointer" }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "11px" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Saturation ({saturation}%)</span>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={saturation}
                      onChange={(e) => setSaturation(parseInt(e.target.value))}
                      style={{ accentColor: "var(--accent)", cursor: "pointer" }}
                    />
                  </div>
                </div>

                {/* 3D LUT Presets with Full Metadata Schema (Point #11) */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", background: "var(--bg-subtle)", padding: "8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)" }}>3D LUT Preset</span>
                    <span style={{ fontSize: "9px", fontFamily: "monospace", color: "var(--accent)" }}>{currentLut.version}</span>
                  </div>

                  <select
                    value={selectedLutIndex}
                    onChange={(e) => setSelectedLutIndex(parseInt(e.target.value))}
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      padding: "5px 8px",
                      fontSize: "11px",
                      color: "var(--text-primary)",
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    {LUT_PRESETS.map((lut, idx) => (
                      <option key={lut.name} value={idx}>
                        {lut.name}
                      </option>
                    ))}
                  </select>

                  {/* Metadata fields */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", fontSize: "9px", color: "var(--text-muted)", marginTop: "2px" }}>
                    <div>Type: <strong style={{ color: "var(--text-secondary)" }}>{currentLut.type}</strong></div>
                    <div>Intensity: <strong style={{ color: "var(--text-secondary)" }}>{lutIntensity}%</strong></div>
                    <div>In: <strong style={{ color: "var(--text-secondary)" }}>{currentLut.inputColorSpace}</strong></div>
                    <div>Out: <strong style={{ color: "var(--text-secondary)" }}>{currentLut.outputColorSpace}</strong></div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={lutIntensity}
                    onChange={(e) => setLutIntensity(parseInt(e.target.value))}
                    style={{ accentColor: "var(--accent)", cursor: "pointer", marginTop: "4px" }}
                  />
                </div>
              </>
            )}

            {colorSubTab === "WHEELS" && (
              <div className="color-wheels-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                {/* Lift Wheel (Shadows) */}
                <div className="color-wheel-box" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>LIFT (Shadows)</span>
                  <div
                    className="color-wheel-circle"
                    onClick={(e) => handleColorWheelClick(e, "LIFT")}
                    style={{
                      width: "68px",
                      height: "68px",
                      borderRadius: "50%",
                      background: "radial-gradient(circle, #202638 0%, #151A24 100%)",
                      border: "1px solid var(--border-strong)",
                      position: "relative",
                      cursor: "crosshair",
                    }}
                    title="Click/drag to adjust Shadow Color Tint"
                  >
                    <div
                      className="color-wheel-pip"
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#3B82F6",
                        border: "1.5px solid white",
                        transform: `translate(calc(-50% + ${liftPuck.x}px), calc(-50% + ${liftPuck.y}px))`,
                        boxShadow: "0 0 4px rgba(59,130,246,0.8)",
                      }}
                    />
                  </div>
                  <div style={{ width: "100%", marginTop: "4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8px", color: "var(--text-muted)" }}>
                      <span>Y Master</span>
                      <span>{liftY > 0 ? `+${liftY.toFixed(2)}` : liftY.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="-1.0"
                      max="1.0"
                      step="0.05"
                      value={liftY}
                      onChange={(e) => setLiftY(parseFloat(e.target.value))}
                      style={{ width: "100%", accentColor: "var(--accent)", height: "4px" }}
                    />
                  </div>
                </div>

                {/* Gamma Wheel (Midtones) */}
                <div className="color-wheel-box" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>GAMMA (Mids)</span>
                  <div
                    className="color-wheel-circle"
                    onClick={(e) => handleColorWheelClick(e, "GAMMA")}
                    style={{
                      width: "68px",
                      height: "68px",
                      borderRadius: "50%",
                      background: "radial-gradient(circle, #202638 0%, #151A24 100%)",
                      border: "1px solid var(--border-strong)",
                      position: "relative",
                      cursor: "crosshair",
                    }}
                    title="Click/drag to adjust Midtone Color Tint"
                  >
                    <div
                      className="color-wheel-pip"
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#10B981",
                        border: "1.5px solid white",
                        transform: `translate(calc(-50% + ${gammaPuck.x}px), calc(-50% + ${gammaPuck.y}px))`,
                        boxShadow: "0 0 4px rgba(16,185,129,0.8)",
                      }}
                    />
                  </div>
                  <div style={{ width: "100%", marginTop: "4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8px", color: "var(--text-muted)" }}>
                      <span>Y Master</span>
                      <span>{gammaY > 0 ? `+${gammaY.toFixed(2)}` : gammaY.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="-1.0"
                      max="1.0"
                      step="0.05"
                      value={gammaY}
                      onChange={(e) => setGammaY(parseFloat(e.target.value))}
                      style={{ width: "100%", accentColor: "#10B981", height: "4px" }}
                    />
                  </div>
                </div>

                {/* Gain Wheel (Highlights) */}
                <div className="color-wheel-box" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>GAIN (Highs)</span>
                  <div
                    className="color-wheel-circle"
                    onClick={(e) => handleColorWheelClick(e, "GAIN")}
                    style={{
                      width: "68px",
                      height: "68px",
                      borderRadius: "50%",
                      background: "radial-gradient(circle, #202638 0%, #151A24 100%)",
                      border: "1px solid var(--border-strong)",
                      position: "relative",
                      cursor: "crosshair",
                    }}
                    title="Click/drag to adjust Highlight Color Tint"
                  >
                    <div
                      className="color-wheel-pip"
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#F59E0B",
                        border: "1.5px solid white",
                        transform: `translate(calc(-50% + ${gainPuck.x}px), calc(-50% + ${gainPuck.y}px))`,
                        boxShadow: "0 0 4px rgba(245,158,11,0.8)",
                      }}
                    />
                  </div>
                  <div style={{ width: "100%", marginTop: "4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8px", color: "var(--text-muted)" }}>
                      <span>Y Master</span>
                      <span>{gainY > 0 ? `+${gainY.toFixed(2)}` : gainY.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="-1.0"
                      max="1.0"
                      step="0.05"
                      value={gainY}
                      onChange={(e) => setGainY(parseFloat(e.target.value))}
                      style={{ width: "100%", accentColor: "#F59E0B", height: "4px" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {colorSubTab === "CURVES" && (
              <div style={{ background: "var(--bg-subtle)", padding: "10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Custom Tone Curve (Luma)
                  </span>
                  <span style={{ fontSize: "9px", color: "var(--accent)", fontWeight: 600 }}>{curvePreset}</span>
                </div>

                <svg viewBox="0 0 100 100" style={{ width: "100%", height: "90px", background: "#0B0F19", borderRadius: "4px", border: "1px solid var(--border)" }}>
                  {/* Grid graticules */}
                  <line x1="0" y1="25" x2="100" y2="25" stroke="#1E293B" strokeWidth="0.5" strokeDasharray="2,2" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#1E293B" strokeWidth="0.5" strokeDasharray="2,2" />
                  <line x1="0" y1="75" x2="100" y2="75" stroke="#1E293B" strokeWidth="0.5" strokeDasharray="2,2" />
                  <line x1="25" y1="0" x2="25" y2="100" stroke="#1E293B" strokeWidth="0.5" strokeDasharray="2,2" />
                  <line x1="50" y1="0" x2="50" y2="100" stroke="#1E293B" strokeWidth="0.5" strokeDasharray="2,2" />
                  <line x1="75" y1="0" x2="75" y2="100" stroke="#1E293B" strokeWidth="0.5" strokeDasharray="2,2" />

                  {/* Diagonal baseline */}
                  <line x1="0" y1="100" x2="100" y2="0" stroke="#334155" strokeDasharray="2,2" strokeWidth="1" />

                  {/* Active parametric curve */}
                  <path d={getCurvePath()} fill="none" stroke="var(--accent)" strokeWidth="2.5" />
                  <circle cx="25" cy="75" r="3" fill="#EC4899" />
                  <circle cx="50" cy="50" r="3" fill="#10B981" />
                  <circle cx="75" cy="25" r="3" fill="#3B82F6" />
                </svg>

                {/* Curve Presets Selector */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", marginTop: "8px" }}>
                  <button
                    onClick={() => setCurvePreset("S_CURVE")}
                    style={{
                      padding: "3px 6px",
                      fontSize: "9px",
                      fontWeight: 600,
                      borderRadius: "3px",
                      border: curvePreset === "S_CURVE" ? "1px solid var(--accent)" : "1px solid var(--border)",
                      background: curvePreset === "S_CURVE" ? "var(--accent-soft)" : "var(--bg-surface)",
                      color: curvePreset === "S_CURVE" ? "var(--accent)" : "var(--text-secondary)",
                      cursor: "pointer",
                    }}
                  >
                    Film Contrast S-Curve
                  </button>
                  <button
                    onClick={() => setCurvePreset("MATTE")}
                    style={{
                      padding: "3px 6px",
                      fontSize: "9px",
                      fontWeight: 600,
                      borderRadius: "3px",
                      border: curvePreset === "MATTE" ? "1px solid var(--accent)" : "1px solid var(--border)",
                      background: curvePreset === "MATTE" ? "var(--accent-soft)" : "var(--bg-surface)",
                      color: curvePreset === "MATTE" ? "var(--accent)" : "var(--text-secondary)",
                      cursor: "pointer",
                    }}
                  >
                    Matte Shadow Lift
                  </button>
                  <button
                    onClick={() => setCurvePreset("HIGHLIGHT_ROLLOFF")}
                    style={{
                      padding: "3px 6px",
                      fontSize: "9px",
                      fontWeight: 600,
                      borderRadius: "3px",
                      border: curvePreset === "HIGHLIGHT_ROLLOFF" ? "1px solid var(--accent)" : "1px solid var(--border)",
                      background: curvePreset === "HIGHLIGHT_ROLLOFF" ? "var(--accent-soft)" : "var(--bg-surface)",
                      color: curvePreset === "HIGHLIGHT_ROLLOFF" ? "var(--accent)" : "var(--text-secondary)",
                      cursor: "pointer",
                    }}
                  >
                    Highlight Roll-off
                  </button>
                  <button
                    onClick={() => setCurvePreset("LINEAR")}
                    style={{
                      padding: "3px 6px",
                      fontSize: "9px",
                      fontWeight: 600,
                      borderRadius: "3px",
                      border: curvePreset === "LINEAR" ? "1px solid var(--accent)" : "1px solid var(--border)",
                      background: curvePreset === "LINEAR" ? "var(--accent-soft)" : "var(--bg-surface)",
                      color: curvePreset === "LINEAR" ? "var(--accent)" : "var(--text-secondary)",
                      cursor: "pointer",
                    }}
                  >
                    Linear Default
                  </button>
                </div>
              </div>
            )}

            {colorSubTab === "SCOPES" && (
              <div style={{ background: "var(--bg-subtle)", padding: "8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    RGB Parade (100 IRE Scale)
                  </span>
                  <span style={{ fontSize: "8px", fontFamily: "monospace", color: "var(--success)" }}>CALIBRATED</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px", height: "70px", background: "#050914", padding: "4px", borderRadius: "4px", position: "relative" }}>
                  {/* IRE 100 line */}
                  <div style={{ position: "absolute", top: "10%", left: 0, right: 0, height: "1px", background: "rgba(255,255,255,0.15)", borderTop: "1px dashed rgba(255,255,255,0.2)" }} />
                  {/* IRE 0 line */}
                  <div style={{ position: "absolute", bottom: "10%", left: 0, right: 0, height: "1px", background: "rgba(255,255,255,0.15)", borderTop: "1px dashed rgba(255,255,255,0.2)" }} />

                  {/* Red Channel */}
                  <div style={{ borderBottom: "2px solid #EF4444", display: "flex", alignItems: "flex-end", height: "100%", position: "relative" }}>
                    <div style={{ width: "100%", height: "72%", background: "linear-gradient(to top, transparent, #EF4444)", opacity: 0.75 }} />
                    <span style={{ position: "absolute", top: "2px", left: "2px", fontSize: "7px", color: "#EF4444", fontWeight: 700 }}>R</span>
                  </div>

                  {/* Green Channel */}
                  <div style={{ borderBottom: "2px solid #10B981", display: "flex", alignItems: "flex-end", height: "100%", position: "relative" }}>
                    <div style={{ width: "100%", height: "86%", background: "linear-gradient(to top, transparent, #10B981)", opacity: 0.75 }} />
                    <span style={{ position: "absolute", top: "2px", left: "2px", fontSize: "7px", color: "#10B981", fontWeight: 700 }}>G</span>
                  </div>

                  {/* Blue Channel */}
                  <div style={{ borderBottom: "2px solid #3B82F6", display: "flex", alignItems: "flex-end", height: "100%", position: "relative" }}>
                    <div style={{ width: "100%", height: "64%", background: "linear-gradient(to top, transparent, #3B82F6)", opacity: 0.75 }} />
                    <span style={{ position: "absolute", top: "2px", left: "2px", fontSize: "7px", color: "#3B82F6", fontWeight: 700 }}>B</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Audio Mixer & Multi-Bus Architecture (Point #12: DaVinci Fairlight Style) */}
      <div className="accordion-group">
        <button className="accordion-header" onClick={() => toggleSection("audio")}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Volume2 size={13} style={{ color: "var(--success)" }} />
            <span>Audio Bus Architecture & Fairlight Mixer</span>
          </div>
          {openSections.audio ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {openSections.audio && (
          <div className="accordion-content">
            {/* View Mode Switcher */}
            <div style={{ display: "flex", background: "var(--bg-subtle)", padding: "2px", borderRadius: "4px", marginBottom: "8px" }}>
              <button
                onClick={() => setAudioViewMode("BUS_MIXER")}
                style={{
                  flex: 1,
                  padding: "3px",
                  fontSize: "10px",
                  fontWeight: 600,
                  border: "none",
                  borderRadius: "3px",
                  background: audioViewMode === "BUS_MIXER" ? "var(--bg-surface)" : "transparent",
                  color: audioViewMode === "BUS_MIXER" ? "var(--accent)" : "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                Multi-Bus Mixer
              </button>
              <button
                onClick={() => setAudioViewMode("CLIP_DSP")}
                style={{
                  flex: 1,
                  padding: "3px",
                  fontSize: "10px",
                  fontWeight: 600,
                  border: "none",
                  borderRadius: "3px",
                  background: audioViewMode === "CLIP_DSP" ? "var(--bg-surface)" : "transparent",
                  color: audioViewMode === "CLIP_DSP" ? "var(--accent)" : "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                Clip DSP
              </button>
            </div>

            {audioViewMode === "BUS_MIXER" ? (
              /* Real Bus Architecture Mixer */
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "6px", background: "var(--bg-subtle)", padding: "8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                  {/* Dialogue Bus */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                    <span style={{ fontSize: "9px", fontWeight: 700, color: "var(--text-primary)" }}>DIALOGUE</span>
                    <span style={{ fontSize: "8px", color: "var(--accent)" }}>A1 + A2</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                      <div style={{ width: "3px", height: "65px", background: "linear-gradient(to top, #10B981 60%, #F59E0B 85%, #EF4444 100%)", borderRadius: "2px" }} />
                      <input
                        type="range"
                        min="-24"
                        max="6"
                        value={dialogueBusGain}
                        onChange={(e) => setDialogueBusGain(parseFloat(e.target.value))}
                        style={{ height: "65px", writingMode: "vertical-lr", direction: "rtl", accentColor: "var(--accent)" }}
                      />
                    </div>
                    <span style={{ fontSize: "9px", fontFamily: "monospace" }}>{dialogueBusGain.toFixed(1)}dB</span>
                  </div>

                  {/* Music Bus (Ducked) */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                    <span style={{ fontSize: "9px", fontWeight: 700, color: "var(--text-primary)" }}>MUSIC</span>
                    <span style={{ fontSize: "8px", color: "var(--warning)" }}>Ducked</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                      <div style={{ width: "3px", height: "65px", background: "linear-gradient(to top, #10B981 40%, #F59E0B 70%, transparent 100%)", borderRadius: "2px" }} />
                      <input
                        type="range"
                        min="-24"
                        max="6"
                        value={musicBusGain}
                        onChange={(e) => setMusicBusGain(parseFloat(e.target.value))}
                        style={{ height: "65px", writingMode: "vertical-lr", direction: "rtl", accentColor: "var(--warning)" }}
                      />
                    </div>
                    <span style={{ fontSize: "9px", fontFamily: "monospace", color: "var(--danger)" }}>{musicBusGain.toFixed(1)}dB</span>
                  </div>

                  {/* SFX Bus */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                    <span style={{ fontSize: "9px", fontWeight: 700, color: "var(--text-primary)" }}>SFX</span>
                    <span style={{ fontSize: "8px", color: "var(--success)" }}>A4</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                      <div style={{ width: "3px", height: "65px", background: "linear-gradient(to top, #10B981 50%, #F59E0B 80%, transparent 100%)", borderRadius: "2px" }} />
                      <input
                        type="range"
                        min="-24"
                        max="6"
                        value={sfxBusGain}
                        onChange={(e) => setSfxBusGain(parseFloat(e.target.value))}
                        style={{ height: "65px", writingMode: "vertical-lr", direction: "rtl", accentColor: "var(--success)" }}
                      />
                    </div>
                    <span style={{ fontSize: "9px", fontFamily: "monospace" }}>{sfxBusGain.toFixed(1)}dB</span>
                  </div>

                  {/* Master Bus */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", borderLeft: "1px solid var(--border)", paddingLeft: "4px" }}>
                    <span style={{ fontSize: "9px", fontWeight: 700, color: "var(--danger)" }}>MASTER</span>
                    <span style={{ fontSize: "8px", color: "var(--text-muted)" }}>{lufsStandard === "YOUTUBE" ? "-14 LUFS" : "-23 LUFS"}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                      <div style={{ width: "3px", height: "65px", background: "linear-gradient(to top, #10B981 65%, #F59E0B 90%, #EF4444 100%)", borderRadius: "2px" }} />
                      <input
                        type="range"
                        min="-24"
                        max="6"
                        value={masterBusGain}
                        onChange={(e) => setMasterBusGain(parseFloat(e.target.value))}
                        style={{ height: "65px", writingMode: "vertical-lr", direction: "rtl", accentColor: "var(--danger)" }}
                      />
                    </div>
                    <span style={{ fontSize: "9px", fontFamily: "monospace" }}>{masterBusGain.toFixed(1)}dB</span>
                  </div>
                </div>

                {/* Broadcast Delivery Profiles & Sidechain Status */}
                <div style={{ background: "var(--bg-subtle)", padding: "8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Delivery Standard:</span>
                    <span style={{ fontWeight: 600, color: "var(--success)", fontFamily: "monospace" }}>{getLufsValue()}</span>
                  </div>

                  {/* Preset Buttons */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px" }}>
                    <button
                      onClick={() => setLufsStandard("EBU_R128")}
                      style={{
                        padding: "3px",
                        fontSize: "9px",
                        fontWeight: 600,
                        borderRadius: "3px",
                        border: lufsStandard === "EBU_R128" ? "1px solid var(--accent)" : "1px solid var(--border)",
                        background: lufsStandard === "EBU_R128" ? "var(--accent-soft)" : "var(--bg-surface)",
                        color: lufsStandard === "EBU_R128" ? "var(--accent)" : "var(--text-secondary)",
                        cursor: "pointer",
                      }}
                    >
                      EBU R128 (-23)
                    </button>
                    <button
                      onClick={() => setLufsStandard("YOUTUBE")}
                      style={{
                        padding: "3px",
                        fontSize: "9px",
                        fontWeight: 600,
                        borderRadius: "3px",
                        border: lufsStandard === "YOUTUBE" ? "1px solid var(--accent)" : "1px solid var(--border)",
                        background: lufsStandard === "YOUTUBE" ? "var(--accent-soft)" : "var(--bg-surface)",
                        color: lufsStandard === "YOUTUBE" ? "var(--accent)" : "var(--text-secondary)",
                        cursor: "pointer",
                      }}
                    >
                      YouTube (-14)
                    </button>
                    <button
                      onClick={() => setLufsStandard("PODCAST")}
                      style={{
                        padding: "3px",
                        fontSize: "9px",
                        fontWeight: 600,
                        borderRadius: "3px",
                        border: lufsStandard === "PODCAST" ? "1px solid var(--accent)" : "1px solid var(--border)",
                        background: lufsStandard === "PODCAST" ? "var(--accent-soft)" : "var(--bg-surface)",
                        color: lufsStandard === "PODCAST" ? "var(--accent)" : "var(--text-secondary)",
                        cursor: "pointer",
                      }}
                    >
                      Podcast (-16)
                    </button>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2px" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Sidechain Speech Ducking:</span>
                    <span style={{ fontWeight: 600, color: "var(--accent)" }}>Music Bus −14 dB (Active)</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Clip Gain & Parametric EQ */
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Selected Clip Gain</span>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{volumeDb.toFixed(1)} dB</span>
                </div>
                <input
                  type="range"
                  min="-24"
                  max="12"
                  step="0.5"
                  value={volumeDb}
                  onChange={(e) => setVolumeDb(parseFloat(e.target.value))}
                  style={{ accentColor: "var(--success)", width: "100%", cursor: "pointer" }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
