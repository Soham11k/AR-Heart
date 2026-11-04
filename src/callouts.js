import * as THREE from 'three';
import { HEART_LAYERS_CATALOG } from './heartLayers.js';

/**
 * The 13 classic anatomical callouts from the Cleveland Clinic "Inside of heart" diagram,
 * mapped to our 26-part catalog IDs and exact 3D internal anatomical anchor points.
 */
export const INSIDE_HEART_CALLOUTS = [
  // Left column (ordered top to bottom)
  {
    partId: 'aorta_arch',
    label: 'Aorta',
    subtitle: 'Systemic arch',
    side: 'left',
    anchor: [-0.36, 1.88, -0.45]
  },
  {
    partId: 'superior_vena_cava',
    label: 'Superior vena cava',
    subtitle: 'Upper venous return',
    side: 'left',
    anchor: [-1.24, 1.48, -0.35]
  },
  {
    partId: 'right_atrium',
    label: 'Right atrium',
    subtitle: 'Venous receiving chamber',
    side: 'left',
    anchor: [-1.06, 0.14, 0.12]
  },
  {
    partId: 'inferior_vena_cava',
    label: 'Inferior vena cava',
    subtitle: 'Lower venous return',
    side: 'left',
    anchor: [-1.14, -1.42, -0.68]
  },
  {
    partId: 'tricuspid_valve',
    label: 'Tricuspid valve',
    subtitle: '3-leaflet right AV valve',
    side: 'left',
    anchor: [-0.58, -0.58, 0.36]
  },
  {
    partId: 'right_ventricle',
    label: 'Right ventricle',
    subtitle: 'Pulmonary pump & trabeculae',
    side: 'left',
    anchor: [-0.14, -1.04, 0.72]
  },
  {
    partId: 'pulmonary_valve',
    label: 'Pulmonary valve',
    subtitle: '3 semilunar cusps',
    side: 'left',
    anchor: [0.02, 0.76, 0.28]
  },

  // Right column (ordered top to bottom)
  {
    partId: 'pulmonary_trunk',
    label: 'Pulmonary trunk',
    subtitle: 'To left & right lungs',
    side: 'right',
    anchor: [0.06, 1.38, -0.18]
  },
  {
    partId: 'aortic_valve',
    label: 'Aortic valve',
    subtitle: '3 semilunar cusps',
    side: 'right',
    anchor: [-0.24, 0.52, -0.12]
  },
  {
    partId: 'left_atrium',
    label: 'Left atrium',
    subtitle: 'Oxygenated reservoir',
    side: 'right',
    anchor: [0.32, 0.42, -0.62]
  },
  {
    partId: 'mitral_valve',
    label: 'Bicuspid (mitral) valve',
    subtitle: '2-leaflet left AV valve',
    side: 'right',
    anchor: [0.28, -0.16, -0.42]
  },
  {
    partId: 'left_ventricle',
    label: 'Left ventricle',
    subtitle: 'Thick-walled systemic pump',
    side: 'right',
    anchor: [0.88, -0.62, 0.24]
  },
  {
    partId: 'interventricular_septum',
    label: 'Ventricular septum',
    subtitle: 'Muscular & membranous partition',
    side: 'right',
    anchor: [0.38, -1.08, 0.44]
  }
];

/**
 * Exterior surface anatomy callouts when viewing the whole intact 3D heart.
 */
export const EXTERIOR_HEART_CALLOUTS = [
  {
    partId: 'aorta_arch',
    label: 'Ascending aorta & arch',
    subtitle: 'Brachiocephalic, carotid, subclavian',
    side: 'left',
    anchor: [-0.36, 1.92, -0.42]
  },
  {
    partId: 'superior_vena_cava',
    label: 'Superior vena cava',
    subtitle: 'Drains upper body into RA',
    side: 'left',
    anchor: [-1.24, 1.48, -0.35]
  },
  {
    partId: 'right_atrium',
    label: 'Right atrium & auricle',
    subtitle: 'Houses sinoatrial (SA) node',
    side: 'left',
    anchor: [-1.18, 0.16, 0.28]
  },
  {
    partId: 'right_coronary_artery',
    label: 'Right coronary artery (RCA)',
    subtitle: 'Courses in right AV sulcus',
    side: 'left',
    anchor: [-0.88, -0.48, 0.72]
  },
  {
    partId: 'right_ventricle',
    label: 'Right ventricle',
    subtitle: 'Anterior sternocostal surface',
    side: 'left',
    anchor: [-0.18, -0.82, 1.16]
  },
  {
    partId: 'pulmonary_trunk',
    label: 'Pulmonary trunk',
    subtitle: 'Bifurcates into L & R pulmonary arteries',
    side: 'right',
    anchor: [0.06, 1.38, -0.14]
  },
  {
    partId: 'left_atrium',
    label: 'Left atrial appendage',
    subtitle: 'Receives 4 pulmonary veins',
    side: 'right',
    anchor: [0.42, 0.48, -0.42]
  },
  {
    partId: 'left_anterior_descending',
    label: 'Left anterior descending (LAD)',
    subtitle: 'Anterior interventricular sulcus',
    side: 'right',
    anchor: [0.68, -0.38, 1.06]
  },
  {
    partId: 'left_ventricle',
    label: 'Left ventricle',
    subtitle: 'Obtuse margin & systemic chamber',
    side: 'right',
    anchor: [1.14, -0.58, 0.48]
  },
  {
    partId: 'cardiac_apex',
    label: 'Cardiac apex',
    subtitle: 'Point of maximal impulse (5th ICS)',
    side: 'right',
    anchor: [1.18, -1.42, 1.18]
  }
];

/**
 * Creates the interactive 2D/3D SVG leader-line callout overlay system.
 */
export function createCalloutOverlay({
  containerEl,
  onSelectPart
}) {
  const rootEl = document.createElement('div');
  rootEl.id = 'atlas-callout-overlay';
  rootEl.className = 'atlas-callout-overlay';
  rootEl.setAttribute('aria-label', 'Anatomical callout labels');

  const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgEl.setAttribute('class', 'atlas-callout-svg');
  rootEl.appendChild(svgEl);

  const labelsContainerEl = document.createElement('div');
  labelsContainerEl.className = 'atlas-callout-labels';
  rootEl.appendChild(labelsContainerEl);

  // Quick Fact & Scale Note cards shown in "Heart Layers (1–9)" mode (matching Reference Image 2)
  const layersInfoEl = document.createElement('div');
  layersInfoEl.className = 'layers-atlas-notes';
  layersInfoEl.style.display = 'none';
  layersInfoEl.innerHTML = `
    <div class="layers-quick-fact">
      <div class="layers-quick-fact-title">Quick Fact</div>
      <p>The heart has multiple layers that work together to protect it and help it pump blood efficiently.</p>
    </div>
    <div class="layers-scale-note">
      <strong>Note:</strong> Layers are enlarged and separated here for better understanding. Not to exact scale.
    </div>
  `;
  rootEl.appendChild(layersInfoEl);

  containerEl.appendChild(rootEl);

  let enabled = true;
  let mode = 'inside'; // 'inside' | 'layers' | 'exterior'
  let activeItems = [];
  const tempVec = new THREE.Vector3();

  function rebuildDOM() {
    svgEl.innerHTML = '';
    labelsContainerEl.innerHTML = '';
    activeItems = [];

    if (!enabled) {
      rootEl.style.display = 'none';
      return;
    }
    rootEl.style.display = 'block';
    layersInfoEl.style.display = mode === 'layers' ? 'block' : 'none';

    const list =
      mode === 'layers'
        ? HEART_LAYERS_CATALOG.map((l) => ({
            partId: l.id,
            number: l.number,
            label: l.name,
            subtitle: `(${l.subtitle})`,
            side: 'left',
            isLayer: true
          }))
        : mode === 'inside'
          ? INSIDE_HEART_CALLOUTS
          : EXTERIOR_HEART_CALLOUTS;

    for (const spec of list) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `callout-tag callout-${spec.side}${spec.isLayer ? ' callout-layer-tag' : ''}`;
      btn.dataset.partId = spec.partId;

      if (spec.number) {
        btn.innerHTML = `
          <span class="callout-num">${spec.number}</span>
          <span class="callout-text-wrap">
            <span class="callout-title">${spec.label}</span>
            <span class="callout-sub">${spec.subtitle}</span>
          </span>
        `;
      } else {
        btn.innerHTML = `
          <span class="callout-text-wrap">
            <span class="callout-title">${spec.label}</span>
            <span class="callout-sub">${spec.subtitle}</span>
          </span>
        `;
      }

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectPart?.(spec.partId);
      });

      labelsContainerEl.appendChild(btn);

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      line.setAttribute('class', 'callout-leader-line');
      svgEl.appendChild(line);

      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('class', 'callout-anchor-dot');
      dot.setAttribute('r', '3.2');
      svgEl.appendChild(dot);

      activeItems.push({
        spec,
        btn,
        line,
        dot
      });
    }
  }

  function setMode(newMode) {
    if (mode === newMode && activeItems.length > 0) return;
    mode = newMode;
    rebuildDOM();
  }

  function setEnabled(val) {
    enabled = Boolean(val);
    rebuildDOM();
  }

  function isEnabled() {
    return enabled;
  }

  function update({
    camera,
    heartModel,
    layersAssembly,
    selectedPartId,
    hoveredPartId
  }) {
    if (!enabled || activeItems.length === 0) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w < 769) {
      // Hide full diagram leader columns on narrow phones so the 3D viewport stays uncluttered
      rootEl.style.display = 'none';
      return;
    }
    rootEl.style.display = 'block';

    const leftCollapsed = document.body.getAttribute('data-left-collapsed') === 'true';
    const rightCollapsed = document.body.getAttribute('data-right-collapsed') === 'true';

    const centerX = w * 0.5;
    const leftX = leftCollapsed ? Math.max(24, centerX - 380) : Math.max(314, centerX - 340);
    const rightX = rightCollapsed ? Math.min(w - 24, centerX + 380) : Math.min(w - 356, centerX + 320);

    const topBound = 86;
    const bottomBound = h - 88;

    const leftGroup = [];
    const rightGroup = [];

    for (const item of activeItems) {
      const { spec } = item;
      if (spec.isLayer && layersAssembly) {
        const rec = layersAssembly.layerRecords.get(spec.partId);
        if (rec) {
          tempVec.copy(rec.anchorLocal).add(rec.group.position);
        } else {
          tempVec.set(0, 0, 0);
        }
      } else {
        tempVec.set(spec.anchor[0], spec.anchor[1], spec.anchor[2]);
        const partRec = heartModel?.partMeshes?.get(spec.partId);
        if (partRec) {
          tempVec.add(partRec.group.position);
        }
      }

      tempVec.project(camera);
      const ax = (tempVec.x * 0.5 + 0.5) * w;
      const ay = (-tempVec.y * 0.5 + 0.5) * h;

      item.ax = ax;
      item.ay = ay;

      if (spec.side === 'left') leftGroup.push(item);
      else rightGroup.push(item);
    }

    function layoutColumn(group, colX, isLeft) {
      if (group.length === 0) return;
      // Preserve explicit anatomical order for numbered layers; sort by screen Y for dynamic 3D callouts
      if (mode !== 'layers') {
        group.sort((a, b) => a.ay - b.ay);
      }

      const minGap = mode === 'layers' ? Math.min(54, (bottomBound - topBound) / 9.2) : 44;
      const ys = group.map((it) => Math.max(topBound, Math.min(bottomBound, it.ay)));

      // Forward pass to enforce minimum vertical spacing
      for (let i = 1; i < ys.length; i++) {
        if (ys[i] < ys[i - 1] + minGap) {
          ys[i] = ys[i - 1] + minGap;
        }
      }
      // Backward pass if pushed past bottomBound
      if (ys[ys.length - 1] > bottomBound) {
        ys[ys.length - 1] = bottomBound;
        for (let i = ys.length - 2; i >= 0; i--) {
          if (ys[i] > ys[i + 1] - minGap) {
            ys[i] = Math.max(topBound, ys[i + 1] - minGap);
          }
        }
      }

      for (let i = 0; i < group.length; i++) {
        const item = group[i];
        const ly = ys[i];
        const isActive =
          selectedPartId === item.spec.partId || hoveredPartId === item.spec.partId;

        item.btn.classList.toggle('active', isActive);
        item.line.classList.toggle('active', isActive);
        item.dot.classList.toggle('active', isActive);

        if (isLeft) {
          item.btn.style.left = `${colX}px`;
          item.btn.style.top = `${ly}px`;
          const labelRightEdge = colX + (item.btn.offsetWidth || 152) + 6;
          const elbowX = Math.min(item.ax - 12, labelRightEdge + 18);
          item.line.setAttribute(
            'points',
            `${labelRightEdge},${ly} ${elbowX},${ly} ${item.ax},${item.ay}`
          );
        } else {
          item.btn.style.left = `${colX}px`;
          item.btn.style.top = `${ly}px`;
          const labelLeftEdge = colX - (item.btn.offsetWidth || 152) - 6;
          const elbowX = Math.max(item.ax + 12, labelLeftEdge - 18);
          item.line.setAttribute(
            'points',
            `${labelLeftEdge},${ly} ${elbowX},${ly} ${item.ax},${item.ay}`
          );
        }

        item.dot.setAttribute('cx', String(item.ax));
        item.dot.setAttribute('cy', String(item.ay));
      }
    }

    layoutColumn(leftGroup, leftX, true);
    layoutColumn(rightGroup, rightX, false);
  }

  rebuildDOM();

  return {
    setMode,
    setEnabled,
    isEnabled,
    update
  };
}
