"use client";

import React from "react";
import { X, Cpu, HardDrive, Zap, Shield, Sparkles, Activity } from "lucide-react";

interface SystemStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelPolicy: "AUTO" | "CLOUD" | "LOCAL";
  setModelPolicy: (p: "AUTO" | "CLOUD" | "LOCAL") => void;
}

export const SystemStatusModal: React.FC<SystemStatusModalProps> = ({
  isOpen,
  onClose,
  modelPolicy,
  setModelPolicy,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay-backdrop" onClick={onClose}>
      <div className="modal-dialog-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-bar">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Activity size={16} style={{ color: "var(--accent)" }} />
            <span>System Diagnostics & AI Gateway</span>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body-content">
          {/* AI Inference Policy */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
              <Sparkles size={13} style={{ color: "var(--warning)" }} />
              <span>AI Model Gateway Policy</span>
            </label>
            <select
              value={modelPolicy}
              onChange={(e) => setModelPolicy(e.target.value as "AUTO" | "CLOUD" | "LOCAL")}
              className="workspace-preset-select"
            >
              <option value="AUTO">AUTO: Intelligent Router (Cloud + Local Fallback)</option>
              <option value="CLOUD">CLOUD: Google Gemini 1.5 Flash / Pro (Dedicated)</option>
              <option value="LOCAL">LOCAL: vLLM / Ollama (Private & Air-Gapped)</option>
            </select>
          </div>

          {/* Engine & GPU Status */}
          <div style={{ background: "var(--bg-subtle)", padding: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px" }}>
            <div style={{ fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
              <Cpu size={14} style={{ color: "var(--success)" }} />
              <span>Hardware Acceleration Capability Report</span>
            </div>
            <div style={{ fontFamily: "monospace", display: "flex", flexDirection: "column", gap: "2px", color: "var(--text-secondary)" }}>
              <div>Decode: <strong>VideoToolbox (Hardware Dec)</strong></div>
              <div>Filters: <strong>CPU (Optimized SIMD NEON)</strong></div>
              <div>Composite: <strong>CPU / Canvas2D</strong></div>
              <div>Encode: <strong>h264_videotoolbox (Hardware Enc)</strong></div>
            </div>
          </div>

          {/* Cache & Storage Vault */}
          <div style={{ background: "var(--bg-subtle)", padding: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px" }}>
            <div style={{ fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
              <HardDrive size={14} style={{ color: "var(--accent)" }} />
              <span>Storage Vault & CAC Performance</span>
            </div>
            <div style={{ fontFamily: "monospace", display: "flex", flexDirection: "column", gap: "2px", color: "var(--text-secondary)" }}>
              <div>Cache Latency: <strong>0ms (SHA-256 Hit)</strong></div>
              <div>Vault Path: <strong>storage/vault/ (Originals, Proxies, Renders)</strong></div>
              <div>Manifest Format: <strong>render.json (Deterministic SHA-256)</strong></div>
            </div>
          </div>
        </div>

        <div className="modal-footer-bar">
          <button onClick={onClose} className="export-primary-btn">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
