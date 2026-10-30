const motionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');

export function applyMotionPref(): void {
  document.documentElement.classList.toggle('reduced-motion', motionMQ.matches);
  // JS animation code reads the same class / motionMQ.matches before starting
}

motionMQ.addEventListener('change', applyMotionPref);
applyMotionPref();

export function prefersReducedMotion(): boolean {
  return motionMQ.matches;
}
