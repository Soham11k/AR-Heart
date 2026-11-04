/**
 * Adaptive quality tier detection, configuration presets, and runtime frame-time governor.
 */
export const QUALITY_TIERS = {
  high: {
    tier: 'high',
    label: 'High (Surgical)',
    maxPixelRatio: 2.0,
    bloom: true,
    bloomStrength: 0.14,
    shadows: true,
    shadowMapSize: 1024,
    enableSss: true,
    rbcRatio: 1.0,
    modelUrl: '/models/heart-high.glb',
    allowHandArByDefault: true
  },
  medium: {
    tier: 'medium',
    label: 'Medium (Balanced)',
    maxPixelRatio: 1.5,
    bloom: true,
    bloomStrength: 0.1,
    shadows: true,
    shadowMapSize: 512,
    enableSss: true,
    rbcRatio: 0.62,
    modelUrl: '/models/heart-medium.glb',
    allowHandArByDefault: true
  },
  low: {
    tier: 'low',
    label: 'Low (Mobile Fast)',
    maxPixelRatio: 1.0,
    bloom: false,
    bloomStrength: 0.0,
    shadows: false,
    shadowMapSize: 256,
    enableSss: false,
    rbcRatio: 0.32,
    modelUrl: '/models/heart-low.glb',
    allowHandArByDefault: false
  }
};

export function detectInitialQualityTier(env = {}) {
  const width =
    env.width ?? (typeof window !== 'undefined' ? window.innerWidth : 1440);
  const deviceMemory =
    env.deviceMemory ??
    (typeof navigator !== 'undefined' ? navigator.deviceMemory : undefined);
  const hardwareConcurrency =
    env.hardwareConcurrency ??
    (typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : undefined);
  const userAgent =
    env.userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  const override = env.override ?? null;

  if (override && QUALITY_TIERS[override]) {
    return override;
  }

  const isPhoneWidth = width <= 768;
  const isTabletWidth = width > 768 && width < 1200;
  const isMobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);

  if (
    isPhoneWidth ||
    (deviceMemory !== undefined && deviceMemory <= 3) ||
    (hardwareConcurrency !== undefined && hardwareConcurrency <= 4 && isMobileUA)
  ) {
    return 'low';
  }

  if (
    isTabletWidth ||
    isMobileUA ||
    (deviceMemory !== undefined && deviceMemory <= 6) ||
    (hardwareConcurrency !== undefined && hardwareConcurrency <= 4)
  ) {
    return 'medium';
  }

  return 'high';
}

export function getQualityConfig(tier = 'high') {
  return QUALITY_TIERS[tier] || QUALITY_TIERS.high;
}

export function createAdaptiveFrameMonitor({ initialTier = 'high', onTierChange } = {}) {
  let currentTier = initialTier;
  let userLocked = false;
  let warmupElapsed = 0;
  let emaFrameMs = 16.6;
  let slowFrameStreak = 0;

  function recordFrame(dtSeconds) {
    const ms = dtSeconds * 1000;
    warmupElapsed += dtSeconds;
    emaFrameMs = emaFrameMs * 0.92 + ms * 0.08;

    if (userLocked || warmupElapsed < 3.0) return currentTier;

    if (ms > 36 && emaFrameMs > 33) {
      slowFrameStreak++;
      if (slowFrameStreak >= 48) {
        slowFrameStreak = 0;
        const nextTier =
          currentTier === 'high' ? 'medium' : currentTier === 'medium' ? 'low' : 'low';
        if (nextTier !== currentTier) {
          currentTier = nextTier;
          warmupElapsed = 0;
          if (onTierChange) onTierChange(currentTier, 'auto-downgrade');
        }
      }
    } else if (ms < 24) {
      slowFrameStreak = Math.max(0, slowFrameStreak - 1);
    }
    return currentTier;
  }

  function setTier(tier, locked = true) {
    if (!QUALITY_TIERS[tier]) return currentTier;
    currentTier = tier;
    userLocked = Boolean(locked);
    slowFrameStreak = 0;
    if (onTierChange) onTierChange(currentTier, locked ? 'manual' : 'programmatic');
    return currentTier;
  }

  return {
    recordFrame,
    setTier,
    getTier: () => currentTier,
    getFps: () => Math.round(1000 / Math.max(8, emaFrameMs)),
    isLocked: () => userLocked
  };
}
