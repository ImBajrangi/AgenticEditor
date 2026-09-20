"use client";

import React, { useState } from "react";
import { X, Settings, Key, Cpu, HardDrive, Check, Zap, Shield } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  geminiApiKey: string;
  onSaveGeminiApiKey: (key: string) => void;
  localEndpoint: string;
  onSaveLocalEndpoint: (endpoint: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  geminiApiKey,
  onSaveGeminiApiKey,
  localEndpoint,
  onSaveLocalEndpoint,
}) => {
  const [apiKey, setApiKey] = useState(geminiApiKey);
  const [endpoint, setEndpoint] = useState(localEndpoint);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveGeminiApiKey(apiKey);
    onSaveLocalEndpoint(endpoint);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="modal-overlay-backdrop" onClick={onClose}>
      <div className="modal-dialog-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header-bar">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Settings size={16} style={{ color: "var(--accent)" }} />
            <span>AI Gateway & System Settings</span>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body-content">
          {/* Cloud API Key */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
              <Key size={13} style={{ color: "var(--warning)" }} />
              <span>Google Gemini API Key</span>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy... (leave blank to use auto-router fallback)"
              style={{
                width: "100%",
                background: "var(--bg-subtle)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                padding: "8px 12px",
                fontSize: "12px",
                color: "var(--text-primary)",
                outline: "none",
              }}
            />
            <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
              Powers multimodal video understanding, long-context narrative planning, and structured tool calling.
            </span>
          </div>

          {/* Local AI Endpoint */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
              <Cpu size={13} style={{ color: "var(--accent)" }} />
              <span>Local AI Endpoint (vLLM / Ollama)</span>
            </label>
            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="http://localhost:11434/v1"
              style={{
                width: "100%",
                background: "var(--bg-subtle)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                padding: "8px 12px",
                fontSize: "12px",
                color: "var(--text-primary)",
                outline: "none",
              }}
            />
            <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
              Target endpoint for offline, private, or air-gapped inference (Llama-3.1, Mistral, Qwen).
            </span>
          </div>

          {/* Granular Hardware Pipeline Diagnostics */}
          <div style={{ background: "var(--bg-subtle)", padding: "10px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "11px", color: "var(--text-secondary)" }}>
            <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Shield size={13} style={{ color: "var(--success)" }} />
              <span>Hardware & Storage Pipeline Status</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontFamily: "monospace" }}>
              <div>Decode: <strong>VideoToolbox (Hardware Dec)</strong></div>
              <div>Filters: <strong>CPU (Optimized SIMD NEON)</strong></div>
              <div>Composite: <strong>CPU / Canvas2D</strong></div>
              <div>Encode: <strong>h264_videotoolbox (Hardware Enc)</strong></div>
              <div>Storage Vault: <strong>storage/vault/ (Originals, Proxies, Renders)</strong></div>
            </div>
          </div>
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
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="export-primary-btn"
          >
            {saved ? <Check size={13} /> : <Zap size={13} />}
            <span>{saved ? "Saved" : "Save Settings"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
