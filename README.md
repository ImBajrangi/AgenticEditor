# AgenticEditor (AetherEdit OS)

> **Next-Generation Autonomous AI Director & DaVinci Resolve-Class Professional Video Editing System**

AgenticEditor is a full-stack, enterprise-grade Non-Linear Editing (NLE) operating system and autonomous AI directorial agent platform. Built with Next.js 16 (Turbopack), TypeScript, WebGL/WebGPU hardware acceleration, and the Timeline Intermediate Representation (IR).

---

## 🌟 Key Architecture & Capabilities

### 1. 🎬 DaVinci Resolve-Class Professional NLE Studio
- **Precision Transport & Dual Monitor**: Frame-by-frame stepping ($\pm 1$ / $\pm 10$ frames), J-K-L shuttle engine (Reverse, Pause, Forward Play), and SMPTE drop-frame timecode (`HH:MM:SS:FF`).
- **A/B Split Screen Wipe**: Real-time interactive comparison between ungraded Log/Rec.709 footage and 3D LUT graded master.
- **In & Out Point Boundaries**: `I`/`O` mark points with duration calculation, looping boundaries, and shaded timeline region overlays.
- **Multi-Track Timeline**:
  - Continuous 60fps playhead scrubbing on ruler.
  - Visual Marker system (`M` key) with labeled pins and seek navigation.
  - Independent track controls: Track Lock (with safety pattern overlay), Track Solo (`⇧S`), and Track Mute.
  - Multi-tool suite: Selection (`V`), Razor Blade (`C`), Ripple Edit (`B`), Roll (`N`), and Slip (`Y`).

### 2. 🎨 Digital Intermediate (DI) Color Page
- **Interactive 3-Way Color Wheels**: Independent Lift (Shadows), Gamma (Midtones), and Gain (Highlights) with 2D chromatic tint pucks and Master Luminance Y faders.
- **Parametric Tone Curves**: Dynamic spline curves with presets for Film Contrast S-Curve, Matte Shadow Lift, and Highlight Roll-off.
- **Hardware Calibrated Scopes**: Real-time RGB Parade and Vectorscope with 100 IRE and 0 IRE graticule scales.
- **3D LUT Metadata Engine**: Support for `.cube` tetrahedral interpolation profiles (e.g., Kodak Vision3 5207, Fujifilm Eterna 250D).

### 3. 🎚️ Fairlight Audio Architecture & Mixer
- **Multi-Bus Fader Architecture**: Dedicated buses for Dialogue (A1+A2), Ducked Music, SFX (A4), and Master Output with dynamic peak level meters.
- **Broadcast Loudness Standards**: One-click target normalization for **EBU R128 (-23.0 LUFS)**, **YouTube (-14.0 LUFS)**, and **Podcast/Spotify (-16.0 LUFS)**.
- **Sidechain Ducking Engine**: Automatic real-time speech ducking on background music tracks.

### 4. 🧠 Autonomous Multimodal AI Director
- **Hierarchical Media Intelligence**: Scene, setup, shot decomposition with action-phase tracking and confidence scoring.
- **1-Stroke Atomic Transaction Undo**: Entire multi-mutation AI editorial transactions are committed into a single `⌘Z` undo step.
- **Visual DAG Workflow Engine**: Node-based automation with human-in-the-loop approval gates.
- **Real Footage Creative Benchmark (RFCB)**: Rigorous statistical pipeline evaluating editorial reasoning with canonical coincidence Krippendorff $\alpha$ agreement metrics.

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation & Development
```bash
# Clone the repository
git clone https://github.com/ImBajrangi/AgenticEditor.git
cd AgenticEditor

# Install dependencies
npm install

# Run the test suite (66/66 test suites)
npm test

# Launch the studio development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access AgenticEditor Studio.

### Production Build
```bash
npm run build
```

---

## ⌨️ Professional Keyboard Shortcuts

| Key / Shortcut | Action |
|---|---|
| `Space` | Play / Pause Toggle |
| `J` / `K` / `L` | Shuttle Reverse / Pause / Shuttle Forward |
| `Left` / `Right Arrow` | Step 1 Frame Back / Forward (`+Shift` for 10 frames) |
| `I` / `O` | Mark In / Mark Out Point |
| `Option + X` / `Alt + X` | Clear In & Out Points |
| `Home` / `End` | Jump to Start (In) / Jump to End (Out) |
| `V` | Selection Tool |
| `C` | Razor Blade Tool |
| `B` | Ripple Edit Tool |
| `N` | Roll Edit Tool |
| `Y` | Slip Clip Tool |
| `S` | Toggle Snapping |
| `Shift + S` | Toggle Active Track Solo |
| `M` | Add Marker at Playhead |
| `Shift + Z` | Fit Timeline in View |
| `Cmd +` / `Cmd -` | Zoom In / Out |
| `Cmd + K` | Open Command Palette |
| `Cmd + Z` / `Cmd + Shift + Z` | Undo / Redo (Atomic AI Transaction) |

---

## 📄 License

MIT © [Bajrangi](https://github.com/ImBajrangi)
