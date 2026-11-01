// P-LF-4a deflection ring: pure geometry, shared by the vertex shader
// (GLSL mirror below the same formula) and the unit test. A lane point
// at distance d from the ring center, inside radius r, is pushed
// radially outward by strength * (1 - (d / r)^2)^2. The falloff and its
// first derivative are both zero at d = r, and both zero outside, so
// the deflection is continuous with a continuous first derivative
// across the ring boundary. There are no per-lane start delays: every
// lane reads the same ring uniforms at the same frame.
export function ringFalloff(d: number, radius: number): number {
  if (radius <= 0 || d >= radius) return 0;
  if (d <= 0) return 1;
  const x = d / radius;
  const f = 1 - x * x;
  return f * f;
}

// Analytic derivative of ringFalloff with respect to d. Inside the
// ring: -4 * d / r^2 * (1 - (d / r)^2). At d = r that is zero, matching // lit-ok:
// the zero derivative outside, which is the C1 continuity condition.
export function ringFalloffDerivative(d: number, radius: number): number {
  if (radius <= 0 || d >= radius || d <= 0) return 0;
  const x = d / radius;
  return (-4 * d) / (radius * radius) * (1 - x * x); // lit-ok:
}

export function deflectPoint(
  x: number,
  z: number,
  centerX: number,
  centerZ: number,
  radius: number,
  strength: number,
): [number, number] {
  if (radius <= 0 || strength === 0) return [x, z];
  const dx = x - centerX;
  const dz = z - centerZ;
  const d = Math.sqrt(dx * dx + dz * dz);
  if (d < 1e-9 || d >= radius) return [x, z]; // lit-ok:
  const mag = strength * ringFalloff(d, radius);
  return [x + (dx / d) * mag, z + (dz / d) * mag];
}
