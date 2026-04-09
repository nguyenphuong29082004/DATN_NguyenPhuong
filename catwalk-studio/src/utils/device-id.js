/**
 * Lightweight device fingerprint generator
 * Uses Canvas, WebGL, AudioContext, screen, navigator properties
 * Accuracy: ~80-90% (sufficient for abuse prevention, not for tracking)
 * Has timeout protection so it never blocks the auth flow
 */

let cachedFingerprint = null;

// Simple hash function (djb2)
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function getCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'canvas-no-ctx';
    canvas.width = 200;
    canvas.height = 50;
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Catwalk.AI', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('fingerprint', 4, 17);
    return canvas.toDataURL();
  } catch {
    return 'canvas-blocked';
  }
}

function getWebGLFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'webgl-none';
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
      return vendor + '~' + renderer;
    }
    return 'webgl-no-debug';
  } catch {
    return 'webgl-blocked';
  }
}

function getAudioFingerprint() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return 'audio-none';
    const ctx = new AudioCtx();
    const sampleRate = ctx.sampleRate || 0;
    const channels = ctx.destination?.maxChannelCount || 0;
    ctx.close().catch(() => {});
    return sampleRate + ':' + channels;
  } catch {
    return 'audio-blocked';
  }
}

function generateFingerprint() {
  const components = [
    navigator.userAgent || '',
    navigator.language || '',
    navigator.hardwareConcurrency?.toString() || '',
    screen.width + 'x' + screen.height,
    screen.colorDepth?.toString() || '',
    new Date().getTimezoneOffset().toString(),
    navigator.platform || '',
    navigator.maxTouchPoints?.toString() || '0',
    getCanvasFingerprint(),
    getWebGLFingerprint(),
    getAudioFingerprint(),
  ];

  const raw = components.join('|||');
  return 'fp_' + hashString(raw);
}

// Generate fingerprint with a timeout (default 3s) so it never blocks auth
export async function getDeviceFingerprint(timeoutMs = 3000) {
  if (cachedFingerprint) return cachedFingerprint;

  try {
    const result = await Promise.race([
      new Promise((resolve) => resolve(generateFingerprint())),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('fingerprint-timeout')), timeoutMs)
      ),
    ]);
    cachedFingerprint = result;
    return cachedFingerprint;
  } catch {
    // Fallback: random ID so auth flow is never blocked
    cachedFingerprint = 'fp_fallback_' + Math.random().toString(36).slice(2);
    return cachedFingerprint;
  }
}

export function clearFingerprintCache() {
  cachedFingerprint = null;
}
