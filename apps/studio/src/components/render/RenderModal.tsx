"use client";

import React, { useState } from "react";
import {
  X,
  Download,
  Cpu,
  CheckCircle2,
  Terminal,
  FileVideo,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";

interface RenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartRender: (settings: {
    format: "MP4" | "MOV";
    resolution: { width: number; height: number };
  }) => Promise<void>;
  isRendering: boolean;
  renderResult: {
    success: boolean;
    downloadUrl?: string;
    command?: string;
    fileSizeBytes?: number;
    hardwareAccel?: string;
  } | null;
}

export const RenderModal: React.FC<RenderModalProps> = ({
  isOpen,
  onClose,
  onStartRender,
  isRendering,
  renderResult,
}) => {
  const [preset, setPreset] = useState<"yt_4k" | "yt_1080p" | "reels_9_16" | "prores">("yt_1080p");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleRender = () => {
    let res = { width: 1920, height: 1080 };
    let format: "MP4" | "MOV" = "MP4";

    if (preset === "yt_4k") res = { width: 3840, height: 2160 };
    if (preset === "reels_9_16") res = { width: 1080, height: 1920 };
    if (preset === "prores") format = "MOV";

    onStartRender({ format, resolution: res });
  };

  const copyCommand = () => {
    if (renderResult?.command) {
      navigator.clipboard.writeText(renderResult.command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="modal-overlay-backdrop" onClick={onClose}>
      <div className="modal-dialog-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header-bar">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Download size={16} style={{ color: "var(--accent)" }} />
            <span>Export Video Master</span>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body-content">
          {!renderResult ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                  Export Preset
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <button
                    onClick={() => setPreset("yt_1080p")}
                    style={{
                      padding: "10px",
                      borderRadius: "var(--radius-sm)",
                      border: preset === "yt_1080p" ? "2px solid var(--accent)" : "1px solid var(--border)",
                      background: preset === "yt_1080p" ? "var(--accent-soft)" : "var(--bg-subtle)",
                      color: preset === "yt_1080p" ? "var(--accent)" : "var(--text-primary)",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div>YouTube 1080p</div>
                    <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "2px" }}>1920×1080 • H.264</div>
                  </button>

                  <button
                    onClick={() => setPreset("reels_9_16")}
                    style={{
                      padding: "10px",
                      borderRadius: "var(--radius-sm)",
                      border: preset === "reels_9_16" ? "2px solid var(--accent)" : "1px solid var(--border)",
                      background: preset === "reels_9_16" ? "var(--accent-soft)" : "var(--bg-subtle)",
                      color: preset === "reels_9_16" ? "var(--accent)" : "var(--text-primary)",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div>Instagram / TikTok 9:16</div>
                    <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "2px" }}>1080×1920 • Smart Reframe</div>
                  </button>

                  <button
                    onClick={() => setPreset("yt_4k")}
                    style={{
                      padding: "10px",
                      borderRadius: "var(--radius-sm)",
                      border: preset === "yt_4k" ? "2px solid var(--accent)" : "1px solid var(--border)",
                      background: preset === "yt_4k" ? "var(--accent-soft)" : "var(--bg-subtle)",
                      color: preset === "yt_4k" ? "var(--accent)" : "var(--text-primary)",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div>YouTube 4K UHD</div>
                    <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "2px" }}>3840×2160 • High Bitrate</div>
                  </button>

                  <button
                    onClick={() => setPreset("prores")}
                    style={{
                      padding: "10px",
                      borderRadius: "var(--radius-sm)",
                      border: preset === "prores" ? "2px solid var(--accent)" : "1px solid var(--border)",
                      background: preset === "prores" ? "var(--accent-soft)" : "var(--bg-subtle)",
                      color: preset === "prores" ? "var(--accent)" : "var(--text-primary)",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div>Apple ProRes Master</div>
                    <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "2px" }}>ProRes 422 HQ • Studio Archival</div>
                  </button>
                </div>
              </div>

              {/* Hardware Acceleration status */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-subtle)", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "11px", color: "var(--text-secondary)" }}>
                <Cpu size={14} style={{ color: "var(--success)" }} />
                <span>
                  Hardware Acceleration: <strong>VideoToolbox (Apple Silicon GPU) Active</strong>
                </span>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "var(--success-soft)", border: "1px solid var(--success)", padding: "12px", borderRadius: "var(--radius-md)" }}>
                <CheckCircle2 size={20} style={{ color: "var(--success)" }} />
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                    Render Master Completed Successfully
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    Generated immutable build manifest: <code style={{ fontFamily: "monospace" }}>render.json</code>
                  </div>
                </div>
              </div>

              {renderResult.command && (
                <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>
                      Compiled Deterministic Filtergraph
                    </span>
                    <button
                      onClick={copyCommand}
                      style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border)",
                        padding: "2px 6px",
                        borderRadius: "3px",
                        fontSize: "10px",
                        cursor: "pointer",
                      }}
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <pre style={{ fontSize: "10px", fontFamily: "monospace", overflowX: "auto", color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
                    {renderResult.command}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer-bar">
          <button
            onClick={onClose}
            style={{
              padding: "7px 14px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Close
          </button>
          {!renderResult ? (
            <button
              onClick={handleRender}
              disabled={isRendering}
              className="export-primary-btn"
            >
              <Download size={13} />
              <span>{isRendering ? "Compiling Master..." : "Start Export"}</span>
            </button>
          ) : (
            <a
              href={renderResult.downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="export-primary-btn"
              style={{ textDecoration: "none" }}
            >
              <FileVideo size={13} />
              <span>Download Master Video</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
