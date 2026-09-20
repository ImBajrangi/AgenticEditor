"use client";

import React, { useState } from "react";
import {
  UploadCloud,
  Film,
  Sparkles,
  Tv,
  Smartphone,
  CheckCircle2,
  Zap,
  ArrowRight,
  Clock,
  Palette,
  Volume2,
  Layout,
  Plus,
} from "lucide-react";
import { MediaAsset, SAMPLE_ASSETS } from "@/lib/sample-data";

interface CreateScreenProps {
  onStartCreation: (prompt: string, selectedAssets: MediaAsset[], aspectRatio: "16:9" | "9:16") => void;
  isProcessing: boolean;
}

export const CreateScreen: React.FC<CreateScreenProps> = ({
  onStartCreation,
  isProcessing,
}) => {
  const [prompt, setPrompt] = useState(
    "Create a cinematic travel reel from these clips. Make it emotional and energetic."
  );
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");
  const [selectedAssets, setSelectedAssets] = useState<MediaAsset[]>(SAMPLE_ASSETS);
  const [processingStage, setProcessingStage] = useState<string>("Analyzing 8 clips for people, energy & best moments...");
  const [processingProgress, setProcessingProgress] = useState<number>(15);

  const presetGoals = [
    "Cinematic travel reel, emotional & energetic",
    "Fast-paced 9:16 TikTok with beat sync & punchy cuts",
    "Clean dialogue story with ambient music ducking",
    "Action highlight reel with speed ramps & color grade",
  ];

  const handleCreateClick = () => {
    if (!prompt.trim()) return;
    // Simulate real agentic pipeline stages
    onStartCreation(prompt, selectedAssets, aspectRatio);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100%",
        width: "100%",
        background: "radial-gradient(ellipse at top, #141A28 0%, #090C12 70%)",
        color: "#F8FAFC",
        padding: "32px 20px",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "680px",
          background: "rgba(18, 22, 32, 0.85)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(99, 102, 241, 0.25)",
          borderRadius: "16px",
          padding: "32px 36px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 102, 241, 0.15)",
        }}
      >
        {/* Header Title */}
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px rgba(99, 102, 241, 0.5)",
              color: "#FFFFFF",
              marginBottom: "4px",
            }}
          >
            <Sparkles size={22} />
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.5px", color: "#FFFFFF" }}>
            AI Video Editor
          </h1>
          <p style={{ fontSize: "13px", color: "#94A3B8" }}>
            Import your clips. Tell the AI the goal. Get a finished professional edit in seconds.
          </p>
        </div>

        {/* 1. Dropzone Section */}
        <div
          style={{
            border: "2px dashed rgba(99, 102, 241, 0.35)",
            borderRadius: "12px",
            padding: "24px 20px",
            background: "rgba(11, 14, 21, 0.6)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          title="Drop files or click to add videos"
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "rgba(99, 102, 241, 0.15)",
              color: "#818CF8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <UploadCloud size={22} />
          </div>

          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF", display: "block" }}>
              Drop your videos here
            </span>
            <span style={{ fontSize: "12px", color: "#94A3B8" }}>
              MP4, MOV, ProRes, 4K, 60fps supported
            </span>
          </div>

          <button
            type="button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#E2E8F0",
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              marginTop: "4px",
            }}
          >
            <Plus size={14} />
            <span>+ Add videos</span>
          </button>

          {/* Asset Preview Pill Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", justifyContent: "center", marginTop: "6px" }}>
            <span style={{ fontSize: "11px", color: "#10B981", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
              <CheckCircle2 size={12} />
              {selectedAssets.length} clips ready:
            </span>
            {selectedAssets.slice(0, 4).map((a) => (
              <span
                key={a.id}
                style={{
                  fontSize: "10px",
                  background: "rgba(255, 255, 255, 0.06)",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  color: "#94A3B8",
                  fontFamily: "monospace",
                }}
              >
                {a.title.split(" ")[0]}
              </span>
            ))}
            {selectedAssets.length > 4 && (
              <span style={{ fontSize: "10px", color: "#64748B" }}>+{selectedAssets.length - 4} more</span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.08)", width: "100%" }} />

        {/* 2. "What should I make?" Prompt Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF" }}>
              What should I make?
            </label>

            {/* Target Format Switcher */}
            <div
              style={{
                display: "flex",
                background: "rgba(255, 255, 255, 0.06)",
                padding: "2px",
                borderRadius: "6px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <button
                type="button"
                onClick={() => setAspectRatio("16:9")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 8px",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: 600,
                  background: aspectRatio === "16:9" ? "rgba(99, 102, 241, 0.3)" : "transparent",
                  color: aspectRatio === "16:9" ? "#FFFFFF" : "#94A3B8",
                  cursor: "pointer",
                }}
              >
                <Tv size={11} />
                <span>16:9 Cinema</span>
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio("9:16")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 8px",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: 600,
                  background: aspectRatio === "9:16" ? "rgba(99, 102, 241, 0.3)" : "transparent",
                  color: aspectRatio === "9:16" ? "#FFFFFF" : "#94A3B8",
                  cursor: "pointer",
                }}
              >
                <Smartphone size={11} />
                <span>9:16 Reels</span>
              </button>
            </div>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            style={{
              width: "100%",
              padding: "12px 14px",
              fontSize: "13px",
              lineHeight: "1.45",
              background: "rgba(11, 14, 21, 0.85)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "10px",
              color: "#FFFFFF",
              resize: "none",
              outline: "none",
              fontFamily: "inherit",
              boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.4)",
            }}
            placeholder="Type your goal (e.g. Create a cinematic travel reel from these clips. Make it emotional and energetic)..."
          />

          {/* Quick Preset Goal Chips */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {presetGoals.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPrompt(p)}
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "12px",
                  padding: "3px 10px",
                  fontSize: "11px",
                  color: "#94A3B8",
                  cursor: "pointer",
                  transition: "all 0.1s ease",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Radiant "✦ Create Video" Action Button */}
        <button
          type="button"
          onClick={handleCreateClick}
          disabled={isProcessing}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "10px",
            padding: "14px 28px",
            fontSize: "14px",
            fontWeight: 800,
            letterSpacing: "0.5px",
            cursor: isProcessing ? "not-allowed" : "pointer",
            boxShadow: "0 0 25px rgba(99, 102, 241, 0.5)",
            transition: "all 0.15s ease",
            marginTop: "6px",
          }}
        >
          <Sparkles size={16} />
          <span>{isProcessing ? "AI EDITING EVERYTHING..." : "✦ CREATE VIDEO"}</span>
        </button>

        {/* Processing Indicator State */}
        {isProcessing && (
          <div
            style={{
              background: "rgba(11, 14, 21, 0.9)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              borderRadius: "8px",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              animation: "fadeIn 0.2s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px" }}>
              <span style={{ color: "#38BDF8", fontWeight: 600 }}>● {processingStage}</span>
              <span style={{ color: "#A5B4FC", fontFamily: "monospace" }}>82%</span>
            </div>
            <div style={{ width: "100%", height: "4px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "2px", overflow: "hidden" }}>
              <div
                style={{
                  width: "82%",
                  height: "100%",
                  background: "linear-gradient(90deg, #6366F1, #10B981)",
                  boxShadow: "0 0 8px #6366F1",
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#64748B" }}>
              <span>Story Agent: 5 Acts</span>
              <span>Visual Agent: Kodak 5207</span>
              <span>Audio Agent: -14dB Ducking</span>
              <span>Resolve Plan: Ready</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
