import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { HEART_PARTS, createHeartModel, updateHeartCycle } from './heart.js';
import { createBloodFlowSystem } from './flow.js';
import { createGestureController } from './gestures.js';

// ============================================================================
// 1. THREE.JS SCENE, CAMERA, RENDERER & CLIPPING PLANE
// ============================================================================
const canvas = document.getElementById('heart-canvas');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.localClippingEnabled = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  42,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
const DEFAULT_CAM_POS = new THREE.Vector3(0, 0.4, 8.2);
const DEFAULT_TARGET = new THREE.Vector3(0, 0.2, 0);
camera.position.copy(DEFAULT_CAM_POS);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(DEFAULT_TARGET);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 3.2;
controls.maxDistance = 16.0;
controls.maxPolarAngle = Math.PI * 0.88;
controls.minPolarAngle = Math.PI * 0.12;

// Studio / Surgical Lighting
const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.72);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xfff1f2, 2.2);
keyLight.position.set(5.5, 7.5, 6.5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.15);
fillLight.position.set(-6.0, 2.5, 4.0);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xf43f5e, 1.35);
rimLight.position.set(0.5, -5.5, -5.5);
scene.add(rimLight);

// Subtle spatial reference ring beneath the heart
const floorGrid = new THREE.PolarGridHelper(3.4, 12, 6, 64, 0x1e3a8a, 0x1e293b);
floorGrid.position.y = -2.85;
floorGrid.material.transparent = true;
floorGrid.material.opacity = 0.35;
scene.add(floorGrid);

// Cross-sectional clipping plane + visual slice indicator ring
const clippingPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 3.0);

const sliceRingGeo = new THREE.RingGeometry(2.35, 2.42, 64);
const sliceRingMat = new THREE.MeshBasicMaterial({
  color: 0x38bdf8,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.55
});
const slicePlaneHelper = new THREE.Mesh(sliceRingGeo, sliceRingMat);
slicePlaneHelper.visible = false;
scene.add(slicePlaneHelper);

// Build 26-part heart & blood flow particle system
const heartModel = createHeartModel(clippingPlane);
scene.add(heartModel.root);

const bloodFlow = createBloodFlowSystem();
scene.add(bloodFlow.group);

// ============================================================================
// 2. STATE & UI ELEMENTS
// ============================================================================
let selectedPartId = null;
let hoveredPartId = null;
let activeCategory = 'All';
let searchQuery = '';
let bpm = 72;
let beatEnabled = true;
let flowEnabled = true;
let explodeTarget = 0;
let explodeCurrent = 0;
let slicePercent = 0;
let sliceAxis = 'z';

// Smooth camera focus interpolation
const desiredCamTarget = DEFAULT_TARGET.clone();

const partsListEl = document.getElementById('parts-list');
const partCountBadge = document.getElementById('part-count-badge');
const partSearchEl = document.getElementById('part-search');
const categoryTabsEl = document.getElementById('category-tabs');

const infoCategoryEl = document.getElementById('info-category');
const infoOxygenEl = document.getElementById('info-oxygen');
const infoTitleEl = document.getElementById('info-title');
const infoLatinEl = document.getElementById('info-latin');
const infoDescEl = document.getElementById('info-description');
const infoPathwayEl = document.getElementById('info-pathway');
const infoRoleEl = document.getElementById('info-role');

const sliceSlider = document.getElementById('slice-slider');
const sliceValueEl = document.getElementById('slice-value');
const sliceAxisGroup = document.getElementById('slice-axis-group');

const bpmSlider = document.getElementById('bpm-slider');
const bpmValueEl = document.getElementById('bpm-value');
const bpmReadoutEl = document.getElementById('bpm-readout');
const cardiacPhaseEl = document.getElementById('cardiac-phase');
const pulseIndicatorEl = document.getElementById('pulse-indicator');

const btnToggleFlow = document.getElementById('btn-toggle-flow');
const btnToggleBeat = document.getElementById('btn-toggle-beat');
const btnExplode = document.getElementById('btn-explode');
const btnEnableAr = document.getElementById('btn-enable-ar');
const btnResetView = document.getElementById('btn-reset-view');

const hoverTooltipEl = document.getElementById('hover-tooltip');
const selectedPinEl = document.getElementById('selected-pin');
const selectedPinLabelEl = document.getElementById('selected-pin-label');

// ============================================================================
// 3. PART CATALOG & INSPECTOR PANEL LOGIC
// ============================================================================
function renderPartsList() {
  partsListEl.innerHTML = '';
  const q = searchQuery.trim().toLowerCase();

  const filtered = HEART_PARTS.filter((part) => {
    const matchesCat = activeCategory === 'All' || part.category === activeCategory;
    const matchesQuery =
      !q ||
      part.name.toLowerCase().includes(q) ||
      part.latin.toLowerCase().includes(q) ||
      part.category.toLowerCase().includes(q) ||
      part.description.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  partCountBadge.textContent = `${filtered.length} / ${HEART_PARTS.length}`;

  filtered.forEach((part) => {
    const globalIdx = HEART_PARTS.findIndex((p) => p.id === part.id) + 1;
    const btn = document.createElement('button');
    btn.className = `part-item${selectedPartId === part.id ? ' selected' : ''}`;
    btn.dataset.partId = part.id;

    const hexColor = `#${part.color.toString(16).padStart(6, '0')}`;
    btn.innerHTML = `
      <span class="part-swatch" style="background:${hexColor}; color:${hexColor}"></span>
      <div class="part-item-text">
        <div class="part-item-name">${part.name}</div>
        <div class="part-item-cat">${part.category}</div>
      </div>
      <span class="part-item-index">#${String(globalIdx).padStart(2, '0')}</span>
    `;

    btn.addEventListener('click', () => {
      selectPart(selectedPartId === part.id ? null : part.id, true);
    });
    btn.addEventListener('mouseenter', () => {
      hoveredPartId = part.id;
    });
    btn.addEventListener('mouseleave', () => {
      if (hoveredPartId === part.id) hoveredPartId = null;
    });

    partsListEl.appendChild(btn);
  });
}

function updateInspector(part) {
  if (!part) {
    infoCategoryEl.textContent = 'CARDIAC OVERVIEW';
    infoOxygenEl.textContent = 'DUAL CIRCULATION';
    infoOxygenEl.style.background = 'rgba(56, 189, 248, 0.14)';
    infoOxygenEl.style.color = '#bae6fd';
    infoTitleEl.textContent = 'Human Heart (26-Part Model)';
    infoLatinEl.textContent = 'Cor humanum — Pulmonary & Systemic Pump';
    infoDescEl.textContent =
      'Click any structure on the 3D heart or pick from the 26-part catalog on the left. Drag the Cross-Section Slice slider below to open the chambers and inspect the interventricular septum, valves, chordae tendineae, and papillary muscles.';
    infoPathwayEl.textContent = 'RA → RV → Lungs → LA → LV → Aorta';
    infoRoleEl.textContent = '~5 L/min Cardiac Output';
    return;
  }

  infoCategoryEl.textContent = part.category;
  infoOxygenEl.textContent = part.oxygenation;

  const isVenous = part.oxygenation.toLowerCase().includes('deoxygenated');
  infoOxygenEl.style.background = isVenous
    ? 'rgba(56, 189, 248, 0.18)'
    : 'rgba(244, 63, 94, 0.18)';
  infoOxygenEl.style.color = isVenous ? '#7dd3fc' : '#fda4af';

  infoTitleEl.textContent = part.name;
  infoLatinEl.textContent = part.latin;
  infoDescEl.textContent = part.description;
  infoPathwayEl.textContent = part.pathway;
  infoRoleEl.textContent = part.role;
}

function selectPart(partId, scrollIntoCatalog = false) {
  selectedPartId = partId;
  const part = HEART_PARTS.find((p) => p.id === partId) || null;
  updateInspector(part);

  // Highlight active row in catalog
  const items = partsListEl.querySelectorAll('.part-item');
  items.forEach((el) => {
    const match = el.dataset.partId === partId;
    el.classList.toggle('selected', match);
    if (match && scrollIntoCatalog) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });

  if (partId && heartModel.partMeshes.has(partId)) {
    const rec = heartModel.partMeshes.get(partId);
    rec.group.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(rec.group);
    box.getCenter(desiredCamTarget);
  } else {
    desiredCamTarget.copy(DEFAULT_TARGET);
  }
}

partSearchEl.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  renderPartsList();
});

categoryTabsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.cat-tab');
  if (!btn) return;
  activeCategory = btn.dataset.cat;
  categoryTabsEl.querySelectorAll('.cat-tab').forEach((b) => b.classList.toggle('active', b === btn));
  renderPartsList();
});

renderPartsList();

// ============================================================================
// 4. CROSS-SECTIONAL SLICE PLANE LOGIC
// ============================================================================
function updateSlicePlane() {
  if (slicePercent <= 0) {
    renderer.localClippingEnabled = false;
    slicePlaneHelper.visible = false;
    sliceValueEl.textContent = 'Off';
    return;
  }

  renderer.localClippingEnabled = true;
  slicePlaneHelper.visible = true;
  sliceValueEl.textContent = `${slicePercent}%`;

  // Map percentage [1..100] to world coordinate range [+2.5 .. -2.5]
  const offset = 2.4 - (slicePercent / 100) * 4.8;

  if (sliceAxis === 'z') {
    clippingPlane.normal.set(0, 0, -1);
    clippingPlane.constant = offset;
    slicePlaneHelper.rotation.set(0, 0, 0);
    slicePlaneHelper.position.set(0, 0.2, offset);
  } else if (sliceAxis === 'x') {
    clippingPlane.normal.set(-1, 0, 0);
    clippingPlane.constant = offset;
    slicePlaneHelper.rotation.set(0, Math.PI / 2, 0);
    slicePlaneHelper.position.set(offset, 0.2, 0);
  } else {
    clippingPlane.normal.set(0, -1, 0);
    clippingPlane.constant = offset;
    slicePlaneHelper.rotation.set(Math.PI / 2, 0, 0);
    slicePlaneHelper.position.set(0, offset, 0);
  }
}

sliceSlider.addEventListener('input', (e) => {
  slicePercent = Number(e.target.value);
  updateSlicePlane();
});

sliceAxisGroup.addEventListener('click', (e) => {
  const btn = e.target.closest('.axis-btn');
  if (!btn) return;
  sliceAxis = btn.dataset.axis;
  sliceAxisGroup.querySelectorAll('.axis-btn').forEach((b) => b.classList.toggle('active', b === btn));
  updateSlicePlane();
});

// ============================================================================
// 5. TOPBAR & DOCK CONTROLS
// ============================================================================
bpmSlider.addEventListener('input', (e) => {
  bpm = Number(e.target.value);
  bpmValueEl.textContent = `${bpm} BPM`;
  bpmReadoutEl.textContent = `${bpm} BPM`;
  pulseIndicatorEl.style.animationDuration = `${(60 / bpm).toFixed(2)}s`;
});

btnToggleFlow.addEventListener('click', () => {
  flowEnabled = !flowEnabled;
  btnToggleFlow.classList.toggle('active', flowEnabled);
  btnToggleFlow.textContent = `Blood Flow: ${flowEnabled ? 'ON' : 'OFF'}`;
});

btnToggleBeat.addEventListener('click', () => {
  beatEnabled = !beatEnabled;
  btnToggleBeat.classList.toggle('active', beatEnabled);
  btnToggleBeat.textContent = `Beat: ${beatEnabled ? 'ON' : 'OFF'}`;
});

btnExplode.addEventListener('click', () => {
  explodeTarget = explodeTarget > 0 ? 0 : 1;
  btnExplode.classList.toggle('active', explodeTarget > 0);
  btnExplode.textContent = explodeTarget > 0 ? 'Explode: ON' : 'Explode View';
});

function resetViewAndSelection() {
  selectPart(null);
  slicePercent = 0;
  sliceSlider.value = '0';
  updateSlicePlane();
  explodeTarget = 0;
  btnExplode.classList.remove('active');
  btnExplode.textContent = 'Explode View';
  camera.position.copy(DEFAULT_CAM_POS);
  desiredCamTarget.copy(DEFAULT_TARGET);
  controls.target.copy(DEFAULT_TARGET);
  controls.update();
}

btnResetView.addEventListener('click', resetViewAndSelection);

// ============================================================================
// 6. 3D RAYCASTING (MOUSE / TOUCH & HAND RETICLE)
// ============================================================================
const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();

function raycastAtScreenXY(clientX, clientY) {
  pointerNDC.x = (clientX / window.innerWidth) * 2 - 1;
  pointerNDC.y = -(clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointerNDC, camera);

  const hits = raycaster.intersectObjects(heartModel.pickableMeshes, false);
  for (const hit of hits) {
    // Respect active clipping plane so sliced-away geometry is ignored
    if (renderer.localClippingEnabled) {
      if (clippingPlane.distanceToPoint(hit.point) < 0) {
        continue;
      }
    }
    return hit.object.userData.partId || null;
  }
  return null;
}

let pointerDownPos = { x: 0, y: 0 };

canvas.addEventListener('pointerdown', (e) => {
  pointerDownPos = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener('pointermove', (e) => {
  const partId = raycastAtScreenXY(e.clientX, e.clientY);
  hoveredPartId = partId;
  if (partId) {
    const part = HEART_PARTS.find((p) => p.id === partId);
    hoverTooltipEl.textContent = part ? part.name : partId;
    hoverTooltipEl.style.display = 'block';
    hoverTooltipEl.style.left = `${e.clientX}px`;
    hoverTooltipEl.style.top = `${e.clientY}px`;
    canvas.style.cursor = 'pointer';
  } else {
    hoverTooltipEl.style.display = 'none';
    canvas.style.cursor = 'grab';
  }
});

canvas.addEventListener('pointerup', (e) => {
  const moved = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
  if (moved > 6) return; // Dragged to orbit, not a click
  const partId = raycastAtScreenXY(e.clientX, e.clientY);
  if (partId) {
    selectPart(selectedPartId === partId ? null : partId, true);
  }
});

// ============================================================================
// 7. WEBCAM HAND GESTURES (MEDIAPIPE HANDS)
// ============================================================================
const spherical = new THREE.Spherical();
const offsetVec = new THREE.Vector3();

function applyOrbitDelta(deltaAzimuth, deltaPolar) {
  offsetVec.copy(camera.position).sub(controls.target);
  spherical.setFromVector3(offsetVec);
  spherical.theta += deltaAzimuth;
  spherical.phi = Math.max(0.25, Math.min(Math.PI * 0.85, spherical.phi + deltaPolar));
  offsetVec.setFromSpherical(spherical);
  camera.position.copy(controls.target).add(offsetVec);
  controls.update();
}

function applyZoomDelta(deltaRadius) {
  offsetVec.copy(camera.position).sub(controls.target);
  spherical.setFromVector3(offsetVec);
  spherical.radius = Math.max(
    controls.minDistance,
    Math.min(controls.maxDistance, spherical.radius + deltaRadius)
  );
  offsetVec.setFromSpherical(spherical);
  camera.position.copy(controls.target).add(offsetVec);
  controls.update();
}

const gestureController = createGestureController({
  videoEl: document.getElementById('webcam-video'),
  overlayCanvas: document.getElementById('hand-overlay'),
  placeholderEl: document.getElementById('cam-placeholder'),
  statusEl: document.getElementById('gesture-status'),
  reticleEl: document.getElementById('hand-reticle'),
  legendEls: {
    orbit: document.getElementById('legend-orbit'),
    zoom: document.getElementById('legend-zoom'),
    select: document.getElementById('legend-select'),
    reset: document.getElementById('legend-reset')
  },
  onOrbitDelta: (dTheta, dPhi) => applyOrbitDelta(dTheta, dPhi),
  onZoomDelta: (dR) => applyZoomDelta(dR),
  onHoverScreenPoint: (x, y) => {
    const partId = raycastAtScreenXY(x, y);
    hoveredPartId = partId;
    if (partId) {
      const part = HEART_PARTS.find((p) => p.id === partId);
      hoverTooltipEl.textContent = part ? part.name : partId;
      hoverTooltipEl.style.display = 'block';
      hoverTooltipEl.style.left = `${x}px`;
      hoverTooltipEl.style.top = `${y}px`;
    } else {
      hoverTooltipEl.style.display = 'none';
    }
  },
  onPinchSelectAtScreenPoint: (x, y) => {
    const partId = raycastAtScreenXY(x, y);
    if (partId) {
      selectPart(partId, true);
      return true;
    }
    return false;
  },
  onFistReset: () => {
    resetViewAndSelection();
  }
});

btnEnableAr.addEventListener('click', async () => {
  if (gestureController.isRunning()) {
    gestureController.stop();
    btnEnableAr.classList.remove('active');
    btnEnableAr.textContent = 'Enable Hand AR';
  } else {
    btnEnableAr.textContent = 'Starting Camera...';
    const ok = await gestureController.start();
    btnEnableAr.classList.toggle('active', ok);
    btnEnableAr.textContent = ok ? 'Hand AR: ON' : 'Enable Hand AR';
  }
});

// ============================================================================
// 8. LIVE ECG WAVEFORM CANVAS & 3D SELECTED CALLOUT PIN
// ============================================================================
const ecgCanvas = document.getElementById('ecg-canvas');
const ecgCtx = ecgCanvas.getContext('2d');
const ecgHistory = new Array(140).fill(0);

function drawEcgTrace(sample) {
  ecgHistory.push(sample);
  if (ecgHistory.length > ecgCanvas.width) ecgHistory.shift();

  const w = ecgCanvas.width;
  const h = ecgCanvas.height;
  ecgCtx.clearRect(0, 0, w, h);

  ecgCtx.strokeStyle = '#f43f5e';
  ecgCtx.lineWidth = 1.8;
  ecgCtx.beginPath();
  for (let i = 0; i < ecgHistory.length; i++) {
    const x = i;
    const y = h * 0.65 - ecgHistory[i] * (h * 0.52);
    if (i === 0) ecgCtx.moveTo(x, y);
    else ecgCtx.lineTo(x, y);
  }
  ecgCtx.stroke();
}

const tempPinWorld = new THREE.Vector3();

function updateSelectedPin() {
  if (!selectedPartId || !heartModel.partMeshes.has(selectedPartId)) {
    selectedPinEl.style.display = 'none';
    return;
  }
  const rec = heartModel.partMeshes.get(selectedPartId);
  rec.group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(rec.group);
  box.getCenter(tempPinWorld);
  tempPinWorld.project(camera);

  if (tempPinWorld.z > 1) {
    selectedPinEl.style.display = 'none';
    return;
  }

  const sx = (tempPinWorld.x * 0.5 + 0.5) * window.innerWidth;
  const sy = (-tempPinWorld.y * 0.5 + 0.5) * window.innerHeight;
  selectedPinEl.style.display = 'block';
  selectedPinEl.style.left = `${sx}px`;
  selectedPinEl.style.top = `${sy - 14}px`;
  selectedPinLabelEl.textContent = rec.meta.name;
}

// ============================================================================
// 9. RESIZE & MAIN ANIMATION LOOP
// ============================================================================
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(0.05, clock.getDelta());
  const elapsed = clock.getElapsedTime();

  explodeCurrent += (explodeTarget - explodeCurrent) * 0.1;

  // Update 26-part heart contraction, valve motion & highlight shaders
  const { phaseLabel, ecgValue, phase } = updateHeartCycle(
    heartModel,
    elapsed,
    bpm,
    beatEnabled,
    explodeCurrent,
    selectedPartId,
    hoveredPartId
  );

  cardiacPhaseEl.textContent = beatEnabled ? phaseLabel : 'CARDIAC ARREST / PAUSED';
  drawEcgTrace(ecgValue);

  // Update blood flow particles along venous & arterial pathways
  bloodFlow.update(dt, bpm, phase, flowEnabled);

  // Smooth camera target interpolation
  controls.target.lerp(desiredCamTarget, 0.08);
  controls.update();

  updateSelectedPin();
  renderer.render(scene, camera);
}

animate();
