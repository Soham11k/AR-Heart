# Heart AR — Interactive 3D Cardiac Anatomy Explorer

An interactive 3D human heart explorer built with **Three.js**, **MediaPipe Hands**, and **Vite**. Explore 26 anatomical structures across chambers, valves, great vessels, and coronary vasculature with real-time cardiac cycle animation, cross-sectional clipping, hemodynamic blood-flow particles, and webcam hand gestures.

## Features

- **26 Selectable Anatomical Structures**: Right & left atria, right & left ventricles, interventricular & interatrial septa, cardiac apex, tricuspid/mitral/pulmonary/aortic valves, chordae tendineae, papillary muscles, ascending aorta & arch, descending aorta, pulmonary trunk, left & right pulmonary arteries, superior & inferior vena cava, left & right pulmonary veins, coronary sinus, and the three main coronary arteries (RCA, LAD, LCx).
- **Physiological Heartbeat & Valve Kinematics**: Adjustable BPM (40–160 BPM) with synchronized atrial contraction, ventricular systole, arterial pulse expansion, valve leaflet opening/closing, and a live ECG trace.
- **Cross-Sectional Slice Plane**: Real-time clipping slider with selectable axes (Anterior–Posterior, Sagittal, Transverse) to inspect internal septa, valve rings, chordae tendineae, and papillary muscles.
- **Hemodynamic Blood Flow**: Animated particle streams tracing deoxygenated venous blood (blue: SVC/IVC -> RA -> Tricuspid -> RV -> Pulmonary Valve -> Pulmonary Trunk/Arteries) and oxygenated arterial blood (red: Pulmonary Veins -> LA -> Mitral -> LV -> Aortic Valve -> Aorta & Coronary Arteries).
- **Webcam Hand Gestures (MediaPipe Hands)** + **Mouse/Touch Fallback**:
  - **Open hand drag**: Orbit the 3D heart
  - **Pinch + move up/down**: Zoom in and out
  - **Pinch on a part** (using the hand reticle): Select and inspect that anatomical structure
  - **Closed fist**: Reset the camera, slice, and selection

## Getting Started

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (typically `http://localhost:5173`).

## Camera Permissions & Fallback

Click **Enable Hand AR** in the top bar (or gesture dock) to activate webcam hand tracking via `@mediapipe/tasks-vision`. If camera permission is denied or unavailable, full mouse/trackpad orbit (`Left Drag`), pan (`Right Drag`), zoom (`Scroll`), click-to-select, and HUD controls remain active.
