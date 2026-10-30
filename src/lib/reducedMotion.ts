// Reduced-motion preference (S00). SSR-safe: window is touched only
// when running in a browser; on the server every function no-ops and
// prefersReducedMotion returns false.
let motionMQ: MediaQueryList | null = null;

function getMQ(): MediaQueryList | null {
  if (motionMQ) return motionMQ;
  if (typeof window === 'undefined') return null;
  motionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  return motionMQ;
}

export function applyMotionPref(): void {
  const mq = getMQ();
  if (!mq) return;
  document.documentElement.classList.toggle('reduced-motion', mq.matches);
  // JS animation code reads the same class / motionMQ.matches before starting
}

export function initMotionPref(): void {
  const mq = getMQ();
  if (!mq) return;
  mq.addEventListener('change', applyMotionPref);
  applyMotionPref();
}

export function prefersReducedMotion(): boolean {
  return getMQ()?.matches ?? false;
}
