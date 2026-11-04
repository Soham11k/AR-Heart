import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

/**
 * Webcam hand gesture controller powered by MediaPipe HandLandmarker.
 *
 * Supported gestures:
 * - OPEN HAND DRAG: Orbit the 3D heart (horizontal & vertical palm movement)
 * - PINCH + DRAG UP/DOWN: Zoom camera in and out smoothly
 * - PINCH TAP ON A PART: Select the anatomical structure under the hand reticle
 * - CLOSED FIST (brief hold): Reset camera, slice plane, and part selection once per closure
 */
export function createGestureController(callbacks) {
  const {
    videoEl,
    overlayCanvas,
    placeholderEl,
    statusEl,
    reticleEl,
    legendEls,
    onOrbitDelta,
    onZoomDelta,
    onHoverScreenPoint,
    onPinchSelectAtScreenPoint,
    onFistReset,
    onErrorState
  } = callbacks;

  let handLandmarker = null;
  let stream = null;
  let running = false;
  let rafId = null;
  let lastVideoTime = -1;

  // Smoothed cursor & gesture state
  let smoothX = window.innerWidth * 0.5;
  let smoothY = window.innerHeight * 0.5;
  let prevPalmX = null;
  let prevPalmY = null;
  let prevPinchY = null;
  let wasPinching = false;
  let pinchStartTime = 0;
  let pinchMovedDistance = 0;
  let pinchSelectedDuringHold = false;

  let fistStartTime = 0;
  let fistTriggeredInClosure = false;

  const ctx = overlayCanvas ? overlayCanvas.getContext('2d') : null;

  function setStatus(text, isLive = false) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.toggle('live', isLive);
  }

  function highlightLegend(activeKey) {
    if (!legendEls) return;
    Object.entries(legendEls).forEach(([key, el]) => {
      if (el) el.classList.toggle('active-gesture', key === activeKey);
    });
  }

  function dist2D(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function detectHandPose(landmarks) {
    const wrist = landmarks[0];
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];

    const indexMcp = landmarks[5];
    const middleMcp = landmarks[9];
    const ringMcp = landmarks[13];
    const pinkyMcp = landmarks[17];

    const palmScale = Math.max(0.08, dist2D(wrist, middleMcp));
    const pinchRatio = dist2D(thumbTip, indexTip) / palmScale;
    const isPinch = pinchRatio < 0.42;

    const indexCurled = dist2D(indexTip, wrist) < dist2D(indexMcp, wrist) * 1.18;
    const middleCurled = dist2D(middleTip, wrist) < dist2D(middleMcp, wrist) * 1.18;
    const ringCurled = dist2D(ringTip, wrist) < dist2D(ringMcp, wrist) * 1.18;
    const pinkyCurled = dist2D(pinkyTip, wrist) < dist2D(pinkyMcp, wrist) * 1.18;

    const isFist = !isPinch && indexCurled && middleCurled && ringCurled && pinkyCurled;

    const cursorNormX = 1 - (thumbTip.x + indexTip.x) * 0.5;
    const cursorNormY = (thumbTip.y + indexTip.y) * 0.5;

    const palmNormX = 1 - (wrist.x + middleMcp.x) * 0.5;
    const palmNormY = (wrist.y + middleMcp.y) * 0.5;

    return {
      isPinch,
      isFist,
      cursorNormX,
      cursorNormY,
      palmNormX,
      palmNormY
    };
  }

  function drawHandSkeleton(landmarks, isPinch, isFist) {
    if (!ctx || !overlayCanvas) return;
    const w = overlayCanvas.width;
    const h = overlayCanvas.height;
    ctx.clearRect(0, 0, w, h);

    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [0, 9], [9, 10], [10, 11], [11, 12],
      [0, 13], [13, 14], [14, 15], [15, 16],
      [0, 17], [17, 18], [18, 19], [19, 20],
      [5, 9], [9, 13], [13, 17]
    ];

    ctx.strokeStyle = isFist ? '#f59e0b' : isPinch ? '#f43f5e' : '#38bdf8';
    ctx.lineWidth = 2;

    for (const [i, j] of connections) {
      const a = landmarks[i];
      const b = landmarks[j];
      ctx.beginPath();
      ctx.moveTo((1 - a.x) * w, a.y * h);
      ctx.lineTo((1 - b.x) * w, b.y * h);
      ctx.stroke();
    }

    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      ctx.fillStyle = i === 4 || i === 8 ? '#f43f5e' : '#e0f2fe';
      ctx.beginPath();
      ctx.arc((1 - lm.x) * w, lm.y * h, i === 4 || i === 8 ? 3.8 : 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function processFrame() {
    if (!running) return;

    if (videoEl.readyState >= 2 && videoEl.currentTime !== lastVideoTime && handLandmarker) {
      lastVideoTime = videoEl.currentTime;
      const result = handLandmarker.detectForVideo(videoEl, performance.now());

      if (result.landmarks && result.landmarks.length > 0) {
        const lm = result.landmarks[0];
        const pose = detectHandPose(lm);
        drawHandSkeleton(lm, pose.isPinch, pose.isFist);

        const targetX = pose.cursorNormX * window.innerWidth;
        const targetY = pose.cursorNormY * window.innerHeight;
        smoothX += (targetX - smoothX) * 0.35;
        smoothY += (targetY - smoothY) * 0.35;

        if (reticleEl) {
          reticleEl.style.display = 'block';
          reticleEl.style.left = `${smoothX}px`;
          reticleEl.style.top = `${smoothY}px`;
          reticleEl.classList.toggle('pinching', pose.isPinch);
        }

        if (onHoverScreenPoint) {
          onHoverScreenPoint(smoothX, smoothY);
        }

        const now = performance.now();

        if (pose.isFist) {
          highlightLegend('reset');
          if (fistStartTime === 0) {
            fistStartTime = now;
          }
          const heldMs = now - fistStartTime;
          if (heldMs >= 260 && !fistTriggeredInClosure) {
            fistTriggeredInClosure = true;
            setStatus('Fist Hold: View Reset', true);
            if (onFistReset) onFistReset();
          } else if (!fistTriggeredInClosure) {
            setStatus('Hold Fist to Reset...', true);
          }
          prevPalmX = null;
          prevPalmY = null;
          prevPinchY = null;
          wasPinching = false;
        } else {
          fistStartTime = 0;
          fistTriggeredInClosure = false;

          if (pose.isPinch) {
            if (!wasPinching) {
              wasPinching = true;
              pinchStartTime = now;
              pinchMovedDistance = 0;
              pinchSelectedDuringHold = false;
              prevPinchY = pose.cursorNormY;
              setStatus('Pinch: Tap to Select / Drag ↕ to Zoom', true);
            } else if (prevPinchY !== null) {
              const dy = pose.cursorNormY - prevPinchY;
              pinchMovedDistance += Math.abs(dy);

              if (pinchMovedDistance > 0.018) {
                highlightLegend('zoom');
                setStatus('Pinch ↕: Zooming', true);
                if (Math.abs(dy) > 0.002 && onZoomDelta) {
                  onZoomDelta(dy * 12);
                }
              } else if (
                !pinchSelectedDuringHold &&
                now - pinchStartTime > 95 &&
                pinchMovedDistance < 0.012
              ) {
                pinchSelectedDuringHold = true;
                const didSelect = onPinchSelectAtScreenPoint
                  ? onPinchSelectAtScreenPoint(smoothX, smoothY)
                  : false;
                if (didSelect) {
                  highlightLegend('select');
                  setStatus('Pinch: Selected Structure', true);
                }
              }
              prevPinchY = pose.cursorNormY;
            }
            prevPalmX = null;
            prevPalmY = null;
          } else {
            wasPinching = false;
            prevPinchY = null;
            highlightLegend('orbit');
            setStatus('Open Hand: Orbiting', true);

            if (prevPalmX !== null && prevPalmY !== null) {
              const dx = pose.palmNormX - prevPalmX;
              const dy = pose.palmNormY - prevPalmY;
              if (Math.hypot(dx, dy) > 0.002 && onOrbitDelta) {
                onOrbitDelta(-dx * 4.2, -dy * 2.8);
              }
            }
            prevPalmX = pose.palmNormX;
            prevPalmY = pose.palmNormY;
          }
        }
      } else {
        if (ctx && overlayCanvas) {
          ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        }
        if (reticleEl) reticleEl.style.display = 'none';
        highlightLegend(null);
        setStatus('Hand AR Ready (Show Hand)', true);
        prevPalmX = null;
        prevPalmY = null;
        prevPinchY = null;
        wasPinching = false;
        fistStartTime = 0;
        fistTriggeredInClosure = false;
      }
    }

    rafId = requestAnimationFrame(processFrame);
  }

  async function start() {
    if (running) return true;
    try {
      setStatus('Loading MediaPipe Hands...', false);
      if (onErrorState) onErrorState(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam API unavailable in this browser context');
      }

      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 360 }, facingMode: 'user' },
        audio: false
      });

      videoEl.srcObject = stream;
      await videoEl.play();
      videoEl.style.display = 'block';
      if (placeholderEl) placeholderEl.style.display = 'none';

      if (!handLandmarker) {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
        );
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.55,
          minHandPresenceConfidence: 0.55,
          minTrackingConfidence: 0.55
        });
      }

      running = true;
      setStatus('Hand AR Live', true);
      rafId = requestAnimationFrame(processFrame);
      return true;
    } catch (err) {
      console.warn('Hand AR fallback to mouse/touch:', err);
      stop();
      const isPermission =
        err?.name === 'NotAllowedError' ||
        err?.name === 'PermissionDeniedError' ||
        String(err?.message || '').toLowerCase().includes('permission');
      const reason = isPermission
        ? 'Camera permission was denied. Allow camera access in your browser address bar or continue with Mouse / Touch orbit.'
        : 'Camera or MediaPipe hand tracker unavailable on this device. Full Mouse / Touch orbit, zoom, and slice controls remain active.';
      setStatus('Camera Unavailable — Touch/Mouse Active', false);
      if (placeholderEl) {
        placeholderEl.style.display = 'block';
        placeholderEl.innerHTML = `${reason}`;
      }
      if (onErrorState) {
        onErrorState({
          type: isPermission ? 'permission-denied' : 'unavailable',
          message: reason
        });
      }
      return false;
    }
  }

  function stop() {
    running = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
    if (videoEl) {
      videoEl.srcObject = null;
      videoEl.style.display = 'none';
    }
    if (reticleEl) {
      reticleEl.style.display = 'none';
    }
    if (placeholderEl) {
      placeholderEl.style.display = 'block';
    }
    if (ctx && overlayCanvas) {
      ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    }
    highlightLegend(null);
    setStatus('Mouse / Touch Active', false);
  }

  return {
    start,
    stop,
    isRunning: () => running
  };
}
