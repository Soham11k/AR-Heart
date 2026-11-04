# Heart — 3D Anatomical Atlas & Cross-Section Explorer

An interactive 3D human heart atlas built with **Three.js (r170)**, **HuBMAP / Visible Human Male Reference Anatomy (CC BY 4.0)**, **MediaPipe Hands**, and **Vite**. Explore **26 anatomical structures** and **9 histological wall layers** across three dedicated atlas modes (**Inside of Heart**, **Heart Layers 1–9**, and **Exterior**), with real-time torsional cardiac cycle mechanics, stencil-capped cross-sectional slicing, 2D/3D leader-line callouts, biconcave red blood cell hemodynamics, Web Audio S1/S2 heart sounds, and a quiet paper-and-ink anatomy-atlas interface.

## Key Features

- **Three Interactive Atlas Modes**:
  - **Inside of Heart (Coronal Cutaway)**: Opens the 4 chambers, interventricular & interatrial septa, tricuspid & mitral (bicuspid) valves with 24 fan-like chordae tendineae and papillary muscles, and sculpted 3-cusp pulmonary & aortic semilunar valves, paired with **13 interactive SVG leader-line callouts**.
  - **Heart Layers (1–9 Exploded 3D Layer View)**: Vertically separated 3D histological stack of **① Fibrous Pericardium**, **② Parietal Pericardium**, **③ Pericardial Cavity**, **④ Visceral Pericardium (Epicardium)**, **⑤ Myocardium**, **⑥ Endocardium**, **⑦ Heart Valves**, **⑧ Heart Chambers**, and **⑨ Coronary Blood Vessels**, complete with numbered callouts and interactive **Layer spread** control.
  - **Exterior**: Intact 3D heart and great vessels with surface coronary vasculature callouts.
- **Licensed HuBMAP / Visible Human Male Reference Anatomy**:
  - Bundled multi-resolution Meshopt-compressed GLB tiers (`/public/models/heart-high.glb`, `heart-medium.glb`, `heart-low.glb`) derived from the National Library of Medicine **Visible Human Male** dataset via the HuBMAP CCF 3D Reference Object Library (`CC BY 4.0`), supplemented with explicitly tagged sub-meshes for the interatrial septum (`fossa ovalis`), chordae tendineae, semilunar valve cusps, apical cap, epicardial adipose pads, and internal trabeculae carneae.
  - Full license, SHA-256 provenance, and UBERON/FMA ontology mappings are documented in [`docs/MODEL_LICENSE.md`](docs/MODEL_LICENSE.md).
- **Stencil-Capped Anatomical Cross-Sections**:
  - Real-time multi-layer front/back stencil capping fills cut myocardial, vascular, valvular, and adipose walls with a pale endocardial/epicardial lamina rim so cross-sections display solid tissue thickness around hollow chamber lumina.
  - One-click clinical presets (**Inside of heart**, **Four-chamber**, **Outflow tract**, **Bicaval & septal**, **Ventricular short-axis**), millimeter offset readout, toggles for **Solid caps** and **Guide ring**, and clickable **In section plane** links.
- **Physiological Torsional Heartbeat, RBC Flow & S1/S2 Audio**:
  - Bounds-normalized helical apical twist, longitudinal shortening, and radial contraction synchronized with a Lead II ECG waveform (40–160 bpm).
  - Instanced Evans–Fung biconcave erythrocytes (RBCs) streaming along 7 venous, arterial, and coronary pathways anchored to the HuBMAP anatomy.
  - Web Audio S1 ("Lub", M1+T1 split) and S2 ("Dub", A2+P2 split) valvular heart sound synthesis.
- **Paper-and-Ink Anatomy Atlas UI & Adaptive Quality**:
  - Warm paper panels (`#f4f0e8`), dark ink typography (`Source Serif 4` + `Source Sans 3`), oxblood accents (`#8f2d2d`), collapsible desktop rails (`Index [C]`, `Notes [I]`), and 44px touch-target mobile bottom sheets (`<= 768px`).
  - Automatic `High`, `Medium`, and `Low` quality tier detection (`src/quality.js`) with a runtime FPS monitor and manual selector.

## Getting Started

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (typically `http://localhost:5173`).

### Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start the Vite development server |
| `npm run build:assets` | Rebuild `heart-high.glb`, `heart-medium.glb`, `heart-low.glb`, and `heart-manifest.json` from HuBMAP source assets |
| `npm test` | Run the Vitest unit test suite |
| `npm run build` | Build production bundle into `dist/` |

## Controls & Keyboard Shortcuts

- **Mouse / Trackpad / Touch**:
  - **Left Drag / 1-Finger Drag**: Orbit around the 3D heart
  - **Right Drag / 2-Finger Drag**: Pan camera target
  - **Scroll / Pinch**: Zoom in and out
  - **Click / Tap a Structure or Callout Label**: Select & focus that structure or layer (switch between **Dim others**, **Isolate**, and **Context** in the Notes panel)
- **Keyboard Shortcuts**:
  - `C` — Toggle the Left Structure & Layer Index rail
  - `I` — Toggle the Right Notes & Section Planes rail
  - `L` — Toggle 2D/3D anatomical leader-line callout labels
  - `R` — Reset view, cut plane, explode state, and selection
  - `Esc` — Clear current selection or close mobile bottom sheet
- **Webcam Hand AR (MediaPipe Hands)**:
  - **Open Palm Move**: Turn the 3D heart
  - **Pinch Tap on Structure**: Select structure under the hand reticle
  - **Pinch + Drag Up/Down**: Zoom camera
  - **Hold Closed Fist**: Reset view and cut

## Medical Reference Disclaimer

The bundled 3D reference heart is intended for educational visualization and anatomical study. Supplemental structures (`interatrial_septum`, `chordae_tendineae`, semilunar cusps, `cardiac_apex` partition, epicardial fat strips, trabeculae carneae, and the 9-layer exploded histological diagram) are procedurally anchored to the HuBMAP Visible Human Male landmarks and labeled in the Inspector and [`docs/MODEL_LICENSE.md`](docs/MODEL_LICENSE.md). Not for clinical diagnosis or surgical navigation.
