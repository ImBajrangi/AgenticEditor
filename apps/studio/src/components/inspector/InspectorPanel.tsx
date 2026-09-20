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
  Trash2,
  Play,
} from "lucide-react";
import { TimelineClip, TimelineIR } from "@aetheredit/timeline-ir";
import { WorkflowNode } from "@aetheredit/workflow-engine";
import { AIDirectorPanel } from "../agents/AIDirectorPanel";
import { MediaAsset } from "@/lib/sample-data";

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
  mode: "CREATE" | "REVIEW" | "EXPORT" | "EDIT" | "WORKFLOW";
  onUpdateClipSpeed?: (clipId: string, speed: number) => void;
  onUpdateClipVolume?: (clipId: string, volumeDb: number) => void;
  onDirectPrompt?: (prompt: string, customScript?: any) => void;
  isThinking?: boolean;
  hasPendingChanges?: boolean;
  onReviewChanges?: () => void;
  onApproveChanges?: () => void;
  onRejectChanges?: () => void;
  timeline?: TimelineIR;
  timelineBefore?: TimelineIR | null;
  activeAiRun?: any;
  assets?: MediaAsset[];
  creativeBrief?: string;
  onUpdateCreativeBrief?: (brief: string) => void;
  onUpdateNode?: (node: WorkflowNode) => void;
  onDeleteNode?: (nodeId: string) => void;
  onExecuteNode?: (nodeId: string) => void;
  currentFrame?: number;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selectedClip,
  selectedNode,
  mode,
  onUpdateClipSpeed,
  onDirectPrompt,
  isThinking = false,
  hasPendingChanges = false,
  onReviewChanges,
  onApproveChanges,
  onRejectChanges,
  timeline,
  timelineBefore,
  activeAiRun,
  assets = [],
  creativeBrief = "Premium cinematic travel film with warm filmic tone",
  onUpdateCreativeBrief,
  onUpdateNode,
  onDeleteNode,
  onExecuteNode,
  currentFrame = 0,
}) => {
  const [activeTab, setActiveTab] = useState<"PROPERTIES" | "AI_DIRECTOR">("PROPERTIES");
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
    const handleParamChange = (key: string, val: unknown) => {
      if (onUpdateNode) {
        onUpdateNode({
          ...selectedNode,
          parameters: {
            ...selectedNode.parameters,
            [key]: val,
          },
        });
      }
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-surface)" }}>
        {/* Node Configuration Header */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Settings2 size={14} style={{ color: "var(--accent)" }} />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
              Node Configuration
            </span>
          </div>

          <button
            onClick={() => onDeleteNode && onDeleteNode(selectedNode.id)}
            title="Delete Node (⌫)"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "transparent",
              border: "1px solid var(--border)",
              color: "#EF4444",
              borderRadius: "var(--radius-sm)",
              padding: "4px 8px",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Trash2 size={11} />
            <span>Delete</span>
          </button>
        </div>

        <div style={{ padding: "14px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Node Label (Editable) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>Node Title</span>
            <input
              type="text"
              value={selectedNode.label}
              onChange={(e) => {
                if (onUpdateNode) {
                  onUpdateNode({ ...selectedNode, label: e.target.value });
                }
              }}
              style={{
                width: "100%",
                padding: "6px 10px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text-primary)",
                background: "var(--bg-subtle)",
                outline: "none",
              }}
            />
          </div>

          {/* Node Metadata Badges */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", background: "var(--bg-subtle)", padding: "6px 10px", borderRadius: "var(--radius-sm)" }}>
            <span style={{ color: "var(--text-secondary)" }}>Category: <strong style={{ color: "var(--accent)" }}>{selectedNode.category}</strong></span>
            <span style={{ color: "var(--text-muted)", fontFamily: "monospace" }}>{selectedNode.type}</span>
          </div>

          <div style={{ height: "1px", background: "var(--border)", margin: "2px 0" }} />

          {/* Type-Specific Interactive Parameters */}
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Interactive Parameters
          </span>

          {/* 1. CREATIVE_COLOR_GRADE */}
          {selectedNode.type === "CREATIVE_COLOR_GRADE" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>3D LUT Profile</span>
                <select
                  value={(selectedNode.parameters.lut as string) || "Warm_Filmic_5207.cube"}
                  onChange={(e) => handleParamChange("lut", e.target.value)}
                  style={{
                    padding: "6px 8px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)",
                    fontSize: "12px",
                    background: "var(--bg-subtle)",
                    color: "var(--text-primary)",
                    outline: "none",
                  }}
                >
                  <option value="Warm_Filmic_5207.cube">Warm Kodak 5207 Filmic</option>
                  <option value="Rec709_Clean.cube">Clean Rec.709 Commercial</option>
                  <option value="Teal_Orange.cube">High Contrast Teal & Orange</option>
                  <option value="Monochrome_High_Contrast.cube">B&W Silver Halide Noir</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>LUT Intensity</span>
                  <span style={{ fontWeight: 600 }}>{Math.round(((selectedNode.parameters.intensity as number) ?? 0.85) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={((selectedNode.parameters.intensity as number) ?? 0.85)}
                  onChange={(e) => handleParamChange("intensity", parseFloat(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--accent)" }}
                />
              </div>
            </div>
          )}

          {/* 2. ANALYSIS_SILENCE_DETECTION */}
          {selectedNode.type === "ANALYSIS_SILENCE_DETECTION" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Silence Noise Floor Threshold</span>
                  <span style={{ fontWeight: 600 }}>{((selectedNode.parameters.thresholdDb as number) ?? -30)} dB</span>
                </div>
                <input
                  type="range"
                  min="-45"
                  max="-15"
                  step="1"
                  value={((selectedNode.parameters.thresholdDb as number) ?? -30)}
                  onChange={(e) => handleParamChange("thresholdDb", parseInt(e.target.value, 10))}
                  style={{ width: "100%", accentColor: "var(--accent)" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Minimum Dead Air Duration</span>
                  <span style={{ fontWeight: 600 }}>{((selectedNode.parameters.minDurationMs as number) ?? 400)} ms</span>
                </div>
                <input
                  type="range"
                  min="150"
                  max="1200"
                  step="50"
                  value={((selectedNode.parameters.minDurationMs as number) ?? 400)}
                  onChange={(e) => handleParamChange("minDurationMs", parseInt(e.target.value, 10))}
                  style={{ width: "100%", accentColor: "var(--accent)" }}
                />
              </div>
            </div>
          )}

          {/* 3. AI_AGENT_STORY */}
          {selectedNode.type === "AI_AGENT_STORY" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Narrative Tone</span>
                <select
                  value={(selectedNode.parameters.tone as string) || "Mysterious to Epic Peak"}
                  onChange={(e) => handleParamChange("tone", e.target.value)}
                  style={{
                    padding: "6px 8px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)",
                    fontSize: "12px",
                    background: "var(--bg-subtle)",
                    color: "var(--text-primary)",
                    outline: "none",
                  }}
                >
                  <option value="Mysterious to Epic Peak">Mysterious to Epic Peak</option>
                  <option value="Fast-Paced Action">Fast-Paced High Retention</option>
                  <option value="Emotional Documentary">Emotional Documentary</option>
                  <option value="Cinematic Minimalist">Cinematic Minimalist</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Target Video Duration</span>
                <select
                  value={String(selectedNode.parameters.targetDurationSec || 90)}
                  onChange={(e) => handleParamChange("targetDurationSec", parseInt(e.target.value, 10))}
                  style={{
                    padding: "6px 8px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)",
                    fontSize: "12px",
                    background: "var(--bg-subtle)",
                    color: "var(--text-primary)",
                    outline: "none",
                  }}
                >
                  <option value="15">15 Seconds (Story / Ad)</option>
                  <option value="30">30 Seconds (Social Reel)</option>
                  <option value="60">60 Seconds (Standard Short)</option>
                  <option value="90">90 Seconds (Cinematic Anthem)</option>
                  <option value="180">180 Seconds (Extended Cut)</option>
                </select>
              </div>
            </div>
          )}

          {/* 4. AUDIO_DUCKING_SIDECHAIN */}
          {selectedNode.type === "AUDIO_DUCKING_SIDECHAIN" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Music Ducking Attenuation</span>
                  <span style={{ fontWeight: 600 }}>{((selectedNode.parameters.duckingDb as number) ?? -14)} dB</span>
                </div>
                <input
                  type="range"
                  min="-24"
                  max="-6"
                  step="1"
                  value={((selectedNode.parameters.duckingDb as number) ?? -14)}
                  onChange={(e) => handleParamChange("duckingDb", parseInt(e.target.value, 10))}
                  style={{ width: "100%", accentColor: "var(--accent)" }}
                />
              </div>
            </div>
          )}

          {/* 5. CREATIVE_SPEED_RAMP */}
          {selectedNode.type === "CREATIVE_SPEED_RAMP" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Speed Acceleration Factor</span>
                <select
                  value={String(selectedNode.parameters.factor || 1.25)}
                  onChange={(e) => handleParamChange("factor", parseFloat(e.target.value))}
                  style={{
                    padding: "6px 8px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)",
                    fontSize: "12px",
                    background: "var(--bg-subtle)",
                    color: "var(--text-primary)",
                    outline: "none",
                  }}
                >
                  <option value="0.5">0.5x (Slow Motion)</option>
                  <option value="1.0">1.0x (Normal Speed)</option>
                  <option value="1.25">1.25x (Dynamic Paced)</option>
                  <option value="1.5">1.5x (High Energy)</option>
                  <option value="2.0">2.0x (Timelapse Motion)</option>
                </select>
              </div>
            </div>
          )}

          {/* Generic Parameters Key-Value Fallback */}
          {Object.entries(selectedNode.parameters).map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", background: "var(--bg-subtle)", padding: "5px 8px", borderRadius: "4px" }}>
              <span style={{ color: "var(--text-secondary)" }}>{k}</span>
              <span style={{ fontFamily: "monospace", color: "var(--text-primary)", fontWeight: 500 }}>{String(v)}</span>
            </div>
          ))}

          {/* Run Single Node Button */}
          <div style={{ marginTop: "8px" }}>
            <button
              onClick={() => onExecuteNode && onExecuteNode(selectedNode.id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                background: "var(--accent)",
                border: "none",
                color: "white",
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(79, 115, 247, 0.3)",
              }}
            >
              <Play size={12} />
              <span>Execute This Node</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedClip) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-surface)" }}>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <AIDirectorPanel
            timeline={timeline || { timelineId: "default", version: 1, timebase: { numerator: 30, denominator: 1 }, canvas: { width: 1920, height: 1080, pixelAspectRatio: "16:9", colorSpace: "Rec.709" }, tracks: [], markers: [] }}
            timelineBefore={timelineBefore}
            assets={assets}
            creativeBrief={creativeBrief}
            onUpdateCreativeBrief={onUpdateCreativeBrief}
            onDirectPrompt={onDirectPrompt || (() => {})}
            isThinking={isThinking}
            activeAiRun={activeAiRun}
            hasPendingChanges={hasPendingChanges}
            onReviewChanges={onReviewChanges}
            onApproveChanges={onApproveChanges}
            onRejectChanges={onRejectChanges}
            currentFrame={currentFrame}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-surface)", overflowY: "auto" }}>
      {/* Tab Switcher: Clip Properties vs AI Director */}
      <div style={{ display: "flex", background: "var(--bg-subtle)", borderBottom: "1px solid var(--border)", padding: "4px" }}>
        <button
          onClick={() => setActiveTab("PROPERTIES")}
          style={{
            flex: 1,
            padding: "6px",
            fontSize: "11px",
            fontWeight: 600,
            borderRadius: "var(--radius-sm)",
            border: "none",
            background: activeTab === "PROPERTIES" ? "var(--bg-surface)" : "transparent",
            color: activeTab === "PROPERTIES" ? "var(--accent)" : "var(--text-secondary)",
            boxShadow: activeTab === "PROPERTIES" ? "var(--shadow-xs)" : "none",
            cursor: "pointer",
          }}
        >
          Clip Inspector
        </button>
        <button
          onClick={() => setActiveTab("AI_DIRECTOR")}
          style={{
            flex: 1,
            padding: "6px",
            fontSize: "11px",
            fontWeight: 600,
            borderRadius: "var(--radius-sm)",
            border: "none",
            background: activeTab === "AI_DIRECTOR" ? "var(--bg-surface)" : "transparent",
            color: activeTab === "AI_DIRECTOR" ? "var(--accent)" : "var(--text-secondary)",
            boxShadow: activeTab === "AI_DIRECTOR" ? "var(--shadow-xs)" : "none",
            cursor: "pointer",
          }}
        >
          AI Director
        </button>
      </div>

      {activeTab === "AI_DIRECTOR" ? (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <AIDirectorPanel
            timeline={timeline || { timelineId: "default", version: 1, timebase: { numerator: 30, denominator: 1 }, canvas: { width: 1920, height: 1080, pixelAspectRatio: "16:9", colorSpace: "Rec.709" }, tracks: [], markers: [] }}
            timelineBefore={timelineBefore}
            assets={assets}
            creativeBrief={creativeBrief}
            onUpdateCreativeBrief={onUpdateCreativeBrief}
            onDirectPrompt={onDirectPrompt || (() => {})}
            isThinking={isThinking}
            activeAiRun={activeAiRun}
            hasPendingChanges={hasPendingChanges}
            onReviewChanges={onReviewChanges}
            onApproveChanges={onApproveChanges}
            onRejectChanges={onRejectChanges}
            currentFrame={currentFrame}
            selectedClipName={selectedClip?.name}
          />
        </div>
      ) : (
        <>

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
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "20px", height: "20px", borderRadius: "5px", background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Move size={12} style={{ color: "var(--accent)" }} />
            </div>
            <span style={{ fontSize: "12px", fontWeight: 600 }}>Transform & Speed Ramp</span>
          </div>
          {openSections.transform ? <ChevronDown size={14} style={{ color: "var(--text-muted)" }} /> : <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />}
        </button>
        {openSections.transform && (
          <div className="accordion-content">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
              <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Speed Playback</span>
              <span style={{ fontWeight: 700, color: "var(--accent)", background: "var(--accent-soft)", padding: "1px 6px", borderRadius: "4px", fontFamily: "monospace" }}>{selectedClip.speed}x</span>
            </div>
            <input
              type="range"
              min="0.25"
              max="4.0"
              step="0.25"
              value={selectedClip.speed}
              onChange={(e) => onUpdateClipSpeed?.(selectedClip.id, parseFloat(e.target.value))}
              className="slider-speed"
              style={{ width: "100%", accentColor: "var(--accent)" }}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "2px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 500 }}>Scale</span>
                <div style={{ position: "relative" }}>
                  <input
                    type="number"
                    step="0.1"
                    defaultValue={selectedClip.transform.scale.x}
                    className="pro-input-number"
                  />
                  <span style={{ position: "absolute", right: "8px", top: "5px", fontSize: "10px", color: "var(--text-muted)", pointerEvents: "none" }}>x</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 500 }}>Opacity</span>
                <div style={{ position: "relative" }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={Math.round(selectedClip.transform.opacity * 100)}
                    className="pro-input-number"
                  />
                  <span style={{ position: "absolute", right: "8px", top: "5px", fontSize: "10px", color: "var(--text-muted)", pointerEvents: "none" }}>%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Professional Color Grading (Primary, Wheels, Curves, Scopes, 3D LUT Metadata) */}
      <div className="accordion-group">
        <button className="accordion-header" onClick={() => toggleSection("color")}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "20px", height: "20px", borderRadius: "5px", background: "rgba(124, 58, 237, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Palette size={12} style={{ color: "#7C3AED" }} />
            </div>
            <span style={{ fontSize: "12px", fontWeight: 600 }}>Color Grading System</span>
          </div>
          {openSections.color ? <ChevronDown size={14} style={{ color: "var(--text-muted)" }} /> : <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />}
        </button>
        {openSections.color && (
          <div className="accordion-content">
            {/* Color Sub-Tabs [Primary | Wheels | Curves | Scopes] */}
            <div style={{ display: "flex", background: "var(--bg-subtle)", padding: "3px", borderRadius: "6px", marginBottom: "6px", border: "1px solid var(--border)" }}>
              {(["PRIMARY", "WHEELS", "CURVES", "SCOPES"] as const).map((tab) => {
                const isActive = colorSubTab === tab;
                const label = tab === "PRIMARY" ? "Primary" : tab === "WHEELS" ? "3-Way" : tab === "CURVES" ? "Curves" : "Scopes";
                return (
                  <button
                    key={tab}
                    onClick={() => setColorSubTab(tab)}
                    style={{
                      flex: 1,
                      padding: "4px 2px",
                      fontSize: "10px",
                      fontWeight: isActive ? 700 : 500,
                      border: "none",
                      borderRadius: "4px",
                      background: isActive ? "var(--bg-surface)" : "transparent",
                      color: isActive ? "var(--accent)" : "var(--text-secondary)",
                      boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                      cursor: "pointer",
                      transition: "all 0.12s ease",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {colorSubTab === "PRIMARY" && (
              <>
                {/* Exposure Slider */}
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                    <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Exposure</span>
                    <span style={{ fontWeight: 700, color: "var(--text-primary)", fontFamily: "monospace" }}>{exposure > 0 ? `+${exposure.toFixed(1)}` : exposure.toFixed(1)} EV</span>
                  </div>
                  <input
                    type="range"
                    min="-3.0"
                    max="3.0"
                    step="0.1"
                    value={exposure}
                    onChange={(e) => setExposure(parseFloat(e.target.value))}
                    className="slider-exposure"
                  />
                </div>

                {/* White Balance (Temp & Tint) */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                      <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Temp</span>
                      <span style={{ fontWeight: 600, color: "#D97706", fontFamily: "monospace", fontSize: "10px" }}>{temperature}K</span>
                    </div>
                    <input
                      type="range"
                      min="2500"
                      max="10000"
                      step="100"
                      value={temperature}
                      onChange={(e) => setTemperature(parseInt(e.target.value))}
                      className="slider-temp"
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                      <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Tint</span>
                      <span style={{ fontWeight: 600, color: "#DB2777", fontFamily: "monospace", fontSize: "10px" }}>{tint > 0 ? `+${tint}` : tint}</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={tint}
                      onChange={(e) => setTint(parseInt(e.target.value))}
                      className="slider-tint"
                    />
                  </div>
                </div>

                {/* Contrast & Saturation */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                      <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Contrast</span>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)", fontFamily: "monospace", fontSize: "10px" }}>{contrast.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.05"
                      value={contrast}
                      onChange={(e) => setContrast(parseFloat(e.target.value))}
                      style={{ accentColor: "var(--accent)" }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                      <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Saturation</span>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)", fontFamily: "monospace", fontSize: "10px" }}>{saturation}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={saturation}
                      onChange={(e) => setSaturation(parseInt(e.target.value))}
                      className="slider-saturation"
                    />
                  </div>
                </div>

                {/* 3D LUT Presets with Full Metadata Schema */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", background: "var(--bg-subtle)", padding: "10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", marginTop: "2px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>3D LUT Preset</span>
                    <span style={{ fontSize: "9px", fontFamily: "monospace", color: "var(--accent)", background: "var(--accent-soft)", padding: "1px 5px", borderRadius: "3px", fontWeight: 600 }}>{currentLut.version}</span>
                  </div>

                  <select
                    value={selectedLutIndex}
                    onChange={(e) => setSelectedLutIndex(parseInt(e.target.value))}
                    className="pro-select"
                  >
                    {LUT_PRESETS.map((lut, idx) => (
                      <option key={lut.name} value={idx}>
                        {lut.name}
                      </option>
                    ))}
                  </select>

                  {/* Metadata fields */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", fontSize: "10px", color: "var(--text-secondary)", marginTop: "2px", background: "var(--bg-surface)", padding: "6px 8px", borderRadius: "4px", border: "1px solid var(--border)" }}>
                    <div>Type: <strong style={{ color: "var(--text-primary)" }}>{currentLut.type}</strong></div>
                    <div>Intensity: <strong style={{ color: "var(--accent)" }}>{lutIntensity}%</strong></div>
                    <div>In: <strong style={{ color: "var(--text-primary)" }}>{currentLut.inputColorSpace}</strong></div>
                    <div>Out: <strong style={{ color: "var(--text-primary)" }}>{currentLut.outputColorSpace}</strong></div>
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
              /* Real Fairlight Hardware Console Mixer */
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "6px", background: "#0B0F17", padding: "10px 8px", borderRadius: "var(--radius-md)", border: "1px solid #1E293B" }}>
                  {/* 1. Dialogue Bus */}
                  <div className="fader-channel-strip">
                    <span style={{ fontSize: "9px", fontWeight: 700, color: "#F8FAFC", letterSpacing: "0.5px" }}>DIALOGUE</span>
                    <span style={{ fontSize: "8px", color: "var(--accent)", background: "rgba(79, 115, 247, 0.15)", padding: "1px 4px", borderRadius: "3px", fontWeight: 600 }}>A1 + A2</span>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", margin: "4px 0" }}>
                      {/* LED Meter */}
                      <div className="led-meter-bar">
                        <div style={{ width: "100%", height: `${Math.min(100, Math.max(10, ((dialogueBusGain + 24) / 30) * 100))}%`, background: "linear-gradient(to top, #10B981 60%, #F59E0B 85%, #EF4444 100%)", borderRadius: "1px", transition: "height 0.08s ease" }} />
                      </div>
                      
                      {/* Fader Track & Thumb */}
                      <div className="fader-slot">
                        <div className="fader-track-groove" />
                        <input
                          type="range"
                          min="-24"
                          max="6"
                          step="0.5"
                          value={dialogueBusGain}
                          onChange={(e) => setDialogueBusGain(parseFloat(e.target.value))}
                          style={{
                            position: "absolute",
                            width: "80px",
                            height: "24px",
                            transform: "rotate(-90deg)",
                            background: "transparent",
                            cursor: "ns-resize",
                            zIndex: 10,
                            margin: 0,
                          }}
                        />
                      </div>
                    </div>
                    
                    <span style={{ fontSize: "9px", fontFamily: "monospace", color: dialogueBusGain > 0 ? "#EF4444" : "#94A3B8", fontWeight: 600, background: "#06080D", padding: "2px 4px", borderRadius: "3px", border: "1px solid #1E293B" }}>
                      {dialogueBusGain > 0 ? `+${dialogueBusGain.toFixed(1)}` : dialogueBusGain.toFixed(1)}dB
                    </span>
                  </div>

                  {/* 2. Music Bus (Ducked) */}
                  <div className="fader-channel-strip">
                    <span style={{ fontSize: "9px", fontWeight: 700, color: "#F8FAFC", letterSpacing: "0.5px" }}>MUSIC</span>
                    <span style={{ fontSize: "8px", color: "#F59E0B", background: "rgba(245, 158, 11, 0.15)", padding: "1px 4px", borderRadius: "3px", fontWeight: 600 }}>Ducked</span>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", margin: "4px 0" }}>
                      {/* LED Meter */}
                      <div className="led-meter-bar">
                        <div style={{ width: "100%", height: `${Math.min(100, Math.max(10, ((musicBusGain + 24) / 30) * 85))}%`, background: "linear-gradient(to top, #10B981 50%, #F59E0B 80%, transparent 100%)", borderRadius: "1px", transition: "height 0.08s ease" }} />
                      </div>
                      
                      {/* Fader Track & Thumb */}
                      <div className="fader-slot">
                        <div className="fader-track-groove" />
                        <input
                          type="range"
                          min="-24"
                          max="6"
                          step="0.5"
                          value={musicBusGain}
                          onChange={(e) => setMusicBusGain(parseFloat(e.target.value))}
                          style={{
                            position: "absolute",
                            width: "80px",
                            height: "24px",
                            transform: "rotate(-90deg)",
                            background: "transparent",
                            cursor: "ns-resize",
                            zIndex: 10,
                            margin: 0,
                          }}
                        />
                      </div>
                    </div>
                    
                    <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#F59E0B", fontWeight: 600, background: "#06080D", padding: "2px 4px", borderRadius: "3px", border: "1px solid #1E293B" }}>
                      {musicBusGain > 0 ? `+${musicBusGain.toFixed(1)}` : musicBusGain.toFixed(1)}dB
                    </span>
                  </div>

                  {/* 3. SFX Bus */}
                  <div className="fader-channel-strip">
                    <span style={{ fontSize: "9px", fontWeight: 700, color: "#F8FAFC", letterSpacing: "0.5px" }}>SFX</span>
                    <span style={{ fontSize: "8px", color: "#10B981", background: "rgba(16, 185, 129, 0.15)", padding: "1px 4px", borderRadius: "3px", fontWeight: 600 }}>A4</span>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", margin: "4px 0" }}>
                      {/* LED Meter */}
                      <div className="led-meter-bar">
                        <div style={{ width: "100%", height: `${Math.min(100, Math.max(10, ((sfxBusGain + 24) / 30) * 90))}%`, background: "linear-gradient(to top, #10B981 65%, #F59E0B 90%, transparent 100%)", borderRadius: "1px", transition: "height 0.08s ease" }} />
                      </div>
                      
                      {/* Fader Track & Thumb */}
                      <div className="fader-slot">
                        <div className="fader-track-groove" />
                        <input
                          type="range"
                          min="-24"
                          max="6"
                          step="0.5"
                          value={sfxBusGain}
                          onChange={(e) => setSfxBusGain(parseFloat(e.target.value))}
                          style={{
                            position: "absolute",
                            width: "80px",
                            height: "24px",
                            transform: "rotate(-90deg)",
                            background: "transparent",
                            cursor: "ns-resize",
                            zIndex: 10,
                            margin: 0,
                          }}
                        />
                      </div>
                    </div>
                    
                    <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#10B981", fontWeight: 600, background: "#06080D", padding: "2px 4px", borderRadius: "3px", border: "1px solid #1E293B" }}>
                      {sfxBusGain > 0 ? `+${sfxBusGain.toFixed(1)}` : sfxBusGain.toFixed(1)}dB
                    </span>
                  </div>

                  {/* 4. Master Bus */}
                  <div className="fader-channel-strip" style={{ borderColor: "rgba(239, 68, 68, 0.4)", background: "#11141E" }}>
                    <span style={{ fontSize: "9px", fontWeight: 700, color: "#EF4444", letterSpacing: "0.5px" }}>MASTER</span>
                    <span style={{ fontSize: "8px", color: "#94A3B8", background: "rgba(255, 255, 255, 0.08)", padding: "1px 4px", borderRadius: "3px", fontWeight: 600 }}>{lufsStandard === "YOUTUBE" ? "-14 LUFS" : "-23 LUFS"}</span>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", margin: "4px 0" }}>
                      {/* LED Meter */}
                      <div className="led-meter-bar">
                        <div style={{ width: "100%", height: `${Math.min(100, Math.max(10, ((masterBusGain + 24) / 30) * 100))}%`, background: "linear-gradient(to top, #10B981 60%, #F59E0B 85%, #EF4444 100%)", borderRadius: "1px", transition: "height 0.08s ease" }} />
                      </div>
                      
                      {/* Fader Track & Thumb */}
                      <div className="fader-slot">
                        <div className="fader-track-groove" />
                        <input
                          type="range"
                          min="-24"
                          max="6"
                          step="0.5"
                          value={masterBusGain}
                          onChange={(e) => setMasterBusGain(parseFloat(e.target.value))}
                          style={{
                            position: "absolute",
                            width: "80px",
                            height: "24px",
                            transform: "rotate(-90deg)",
                            background: "transparent",
                            cursor: "ns-resize",
                            zIndex: 10,
                            margin: 0,
                          }}
                        />
                      </div>
                    </div>
                    
                    <span style={{ fontSize: "9px", fontFamily: "monospace", color: masterBusGain > 0 ? "#EF4444" : "#F8FAFC", fontWeight: 700, background: "#06080D", padding: "2px 4px", borderRadius: "3px", border: "1px solid #1E293B" }}>
                      {masterBusGain > 0 ? `+${masterBusGain.toFixed(1)}` : masterBusGain.toFixed(1)}dB
                    </span>
                  </div>
                </div>

                {/* Broadcast Delivery Profiles & Sidechain Status */}
                <div style={{ background: "var(--bg-subtle)", padding: "10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "8px", fontSize: "11px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Delivery Standard:</span>
                    <span style={{ fontWeight: 700, color: "var(--success)", fontFamily: "monospace", background: "rgba(34, 160, 107, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>{getLufsValue()}</span>
                  </div>

                  {/* Preset Buttons */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px" }}>
                    {(["EBU_R128", "YOUTUBE", "PODCAST"] as const).map((std) => {
                      const isActive = lufsStandard === std;
                      const label = std === "EBU_R128" ? "EBU R128 (-23)" : std === "YOUTUBE" ? "YouTube (-14)" : "Podcast (-16)";
                      return (
                        <button
                          key={std}
                          onClick={() => setLufsStandard(std)}
                          style={{
                            padding: "5px 4px",
                            fontSize: "9px",
                            fontWeight: isActive ? 700 : 500,
                            borderRadius: "4px",
                            border: isActive ? "1px solid var(--accent)" : "1px solid var(--border)",
                            background: isActive ? "var(--accent-soft)" : "var(--bg-surface)",
                            color: isActive ? "var(--accent)" : "var(--text-secondary)",
                            cursor: "pointer",
                            transition: "all 0.12s ease",
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "2px", borderTop: "1px solid var(--border)" }}>
                    <span style={{ color: "var(--text-secondary)", fontSize: "10px" }}>Sidechain Speech Ducking:</span>
                    <span style={{ fontWeight: 600, color: "var(--accent)", fontSize: "10px" }}>Music Bus −14 dB (Active)</span>
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
        </>
      )}
    </div>
  );
};
