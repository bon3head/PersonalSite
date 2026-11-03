precision highp float;
precision highp int;
precision highp sampler2D; // lit-ok: shader constant

in vec2 aSeg;                 // (lane, k) // lit-ok: shader constant
uniform sampler2D uLayouts; // lit-ok: shader constant
uniform sampler2D uActivity; // lit-ok: shader constant
uniform vec4 uW;              // layout weights, sum 1 // lit-ok: shader constant
uniform vec2 uViewport;       // drawing buffer size, device px // lit-ok: shader constant
uniform float uDpr;
uniform float uTime;
uniform vec2 uClassStyle[16]; // widthPx (CSS), alpha // lit-ok: shader constant
uniform vec2 uFog;            // view-depth fade [start, end], server and scatter only // lit-ok: shader constant
uniform float uLengthVariance; // lanefield.variance.lengthVariance // lit-ok: shader constant
uniform float uDepthBands;     // lanefield.variance.depthBands // lit-ok: shader constant
uniform vec3 uBandSpeed;       // lanefield.variance.bandSpeed // lit-ok: shader constant
uniform vec3 uBandAlpha;       // lanefield.variance.bandAlpha // lit-ok: shader constant
uniform vec2 uRingCenter;      // deflection ring center, world XZ // lit-ok: shader constant
uniform float uRingRadius;     // deflection ring radius, world units // lit-ok: shader constant
uniform float uRingStrength;   // deflection ring strength, world units // lit-ok: shader constant
uniform float uRingSwirl;      // tangential share of the push, seeded per morph or pulse // lit-ok: shader constant
uniform sampler2D uSilhouetteMask; // logo alpha mask, small square texture // lit-ok: shader constant
uniform vec2 uSilhouetteCenter;    // pull center, world XZ, tracks the ring // lit-ok: shader constant
uniform float uSilhouetteRadius;   // pull radius, world units, tracks the ring // lit-ok: shader constant
uniform float uSilhouetteStrength; // pull peak displacement, world units // lit-ok: shader constant

out float vSide;
out float vHalf;
out float vU;
out float vAlpha;
out float vBandSpeed;
flat out int vLane;
flat out int vKind;
flat out vec4 vAct; // lit-ok: shader constant

vec4 pt(int lane, int lay, int k) {          // 'layout' is a GLSL keyword // lit-ok: shader constant
  int idx = lane * 32 + lay * 8 + k; // lit-ok: shader constant
  return texelFetch(uLayouts, ivec2(idx & 255, idx >> 8), 0); // lit-ok: shader constant
}

float hash11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); } // lit-ok: shader constant

// P-LF-4a ring deflection, mirroring src/world/deflection.ts: radial
// push with falloff (1 - (d / r)^2)^2 inside the ring, zero outside.
// Falloff and its derivative are both zero at d = r, so the first
// derivative is continuous across the boundary. Polish round: a seeded
// tangential share (uRingSwirl) rides the same falloff, so the swirl
// keeps the C1 boundary and is zero wherever the push is zero.
vec2 deflectXZ(vec2 p) { // lit-ok: shader constant
  if (uRingRadius <= 0.0 || uRingStrength == 0.0) return p; // lit-ok: shader constant
  vec2 d = p - uRingCenter; // lit-ok: shader constant
  float dist = length(d); // lit-ok: shader constant
  if (dist >= uRingRadius || dist < 0.0001) return p; // lit-ok: shader constant
  float x = dist / uRingRadius; // lit-ok: shader constant
  float f = 1.0 - x * x; // lit-ok: shader constant
  vec2 dir = d / dist; // lit-ok: shader constant
  vec2 tangent = vec2(-dir.y, dir.x); // lit-ok: shader constant
  return p + (dir + tangent * uRingSwirl) * (uRingStrength * f * f); // lit-ok: shader constant
}

// P-LF-4b silhouette pull, mirroring src/world/silhouette.ts: the
// ring disc maps to the mask square (u with world x, v with world z),
// the alpha gradient points into the mark, and the point moves along
// that gradient by strength times (1 - alpha). The gradient is zero
// away from the contour, so only lanes near the contour move. The
// mask is a small square texture with linear filtering and no
// mipmaps, so texture() in the vertex stage needs no derivatives.
vec2 pullXZ(vec2 p) { // lit-ok: shader constant
  if (uSilhouetteRadius <= 0.0 || uSilhouetteStrength == 0.0) return p; // lit-ok: shader constant
  vec2 uv = (p - uSilhouetteCenter) / (2.0 * uSilhouetteRadius) + 0.5; // lit-ok: shader constant
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return p; // lit-ok: shader constant
  vec2 texel = 1.0 / vec2(textureSize(uSilhouetteMask, 0)); // lit-ok: shader constant
  float a = texture(uSilhouetteMask, uv).a; // lit-ok: shader constant
  float aE = texture(uSilhouetteMask, uv + vec2(texel.x, 0.0)).a; // lit-ok: shader constant
  float aW = texture(uSilhouetteMask, uv - vec2(texel.x, 0.0)).a; // lit-ok: shader constant
  float aS = texture(uSilhouetteMask, uv + vec2(0.0, texel.y)).a; // lit-ok: shader constant
  float aN = texture(uSilhouetteMask, uv - vec2(0.0, texel.y)).a; // lit-ok: shader constant
  vec2 grad = vec2(aE - aW, aS - aN); // lit-ok: shader constant
  float g = length(grad); // lit-ok: shader constant
  if (g < 0.0001) return p; // lit-ok: shader constant
  float mag = uSilhouetteStrength * (1.0 - clamp(a, 0.0, 1.0)); // lit-ok: shader constant
  return p + (grad / g) * mag; // lit-ok: shader constant
}

void main() {
  int lane = int(aSeg.x + 0.5); // lit-ok: shader constant
  int k = int(aSeg.y + 0.5); // lit-ok: shader constant
  float laneF = float(lane); // lit-ok: shader constant
  vec3 p0 = vec3(0.0); vec3 p1 = vec3(0.0); vec3 start = vec3(0.0); // lit-ok: shader constant
  float widthCss = 0.0; float alpha = 0.0; // lit-ok: shader constant
  for (int l = 0; l < 4; l++) { // lit-ok: shader constant
    float w = uW[l];
    if (w <= 0.0) continue; // lit-ok: shader constant
    vec4 a = pt(lane, l, k); // lit-ok: shader constant
    vec4 b = pt(lane, l, k + 1); // lit-ok: shader constant
    vec4 s = pt(lane, l, 0); // lit-ok: shader constant
    p0 += w * a.xyz; p1 += w * b.xyz; start += w * s.xyz; // lit-ok: shader constant
    int cls = int(a.w + 0.5); // lit-ok: shader constant
    widthCss += w * uClassStyle[cls].x;
    alpha    += w * uClassStyle[cls].y;
  }

  // Variant B: fixed per-lane depth band, length, and (in the fragment
  // shader) phase. Length scales the lane about its start point, so a
  // lane never extends past its layout endpoints.
  int bands = int(uDepthBands + 0.5); // lit-ok: shader constant
  int band = lane - (lane / bands) * bands; // lit-ok: shader constant
  float lenScale = 1.0 + (hash11(laneF * 0.013 + 7.0) - 0.5) * 2.0 * uLengthVariance; // lit-ok: shader constant
  p0 = start + (p0 - start) * lenScale; // lit-ok: shader constant
  p1 = start + (p1 - start) * lenScale; // lit-ok: shader constant
  p0.xz = deflectXZ(p0.xz); // lit-ok: shader constant
  p1.xz = deflectXZ(p1.xz); // lit-ok: shader constant
  // Silhouette pull runs after the ring deflection, on the deflected
  // point, so the bunching follows the opened ring shape.
  p0.xz = pullXZ(p0.xz); // lit-ok: shader constant
  p1.xz = pullXZ(p1.xz); // lit-ok: shader constant

  vec4 act = texelFetch(uActivity, ivec2(lane & 255, lane >> 8), 0); // lit-ok: shader constant
  int kind = int(act.b + 0.5); // lit-ok: shader constant
  if (kind > 0 && uTime >= act.r) { // lit-ok: shader constant
    int cls = kind == 1 ? 10 : 11; // lit-ok: shader constant
    float on = kind == 1 ? uW.y : uW.z;          // routes exist only in leaflink, trails only in sidequests // lit-ok: shader constant
    widthCss = mix(widthCss, uClassStyle[cls].x, on);
  }

  vec4 c0 = projectionMatrix * modelViewMatrix * vec4(p0, 1.0); // lit-ok: shader constant
  vec4 c1 = projectionMatrix * modelViewMatrix * vec4(p1, 1.0); // lit-ok: shader constant
  if (c0.w < 0.01 || c1.w < 0.01) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; } // lit-ok: shader constant

  vec2 s0 = c0.xy / c0.w * 0.5 * uViewport; // lit-ok: shader constant
  vec2 s1 = c1.xy / c1.w * 0.5 * uViewport; // lit-ok: shader constant
  vec2 d = s1 - s0; // lit-ok: shader constant
  float len = length(d);
  vec2 dir = len > 1e-4 ? d / len : vec2(1.0, 0.0); // lit-ok: shader constant
  vec2 nrm = vec2(-dir.y, dir.x); // lit-ok: shader constant

  float wDev = widthCss * uDpr;
  float drawW = max(wDev, 1.0);                  // never thinner than 1 device px // lit-ok: shader constant
  float coverage = min(wDev, 1.0);               // sub-pixel lanes fade instead of shimmer // lit-ok: shader constant
  float halfW = drawW * 0.5;                     // 'half' is reserved in GLSL ES // lit-ok: shader constant
  float ext = halfW + 1.0;                        // 1px feather for analytic AA // lit-ok: shader constant

  vec4 c = mix(c0, c1, position.x); // lit-ok: shader constant
  c.xy += nrm * position.y * ext / (0.5 * uViewport) * c.w; // lit-ok: shader constant
  gl_Position = c;

  vSide = position.y * ext;
  vHalf = halfW;
  vU = (float(k) + position.x) / 7.0; // lit-ok: shader constant
  float depth = mix(c0.w, c1.w, position.x); // lit-ok: shader constant
  float fogAmt = smoothstep(uFog.x, uFog.y, depth) * (uW.x + uW.w);
  vAlpha = alpha * coverage * (1.0 - fogAmt) * uBandAlpha[band]; // lit-ok: shader constant
  vBandSpeed = uBandSpeed[band]; // lit-ok: shader constant
  vLane = lane;
  vKind = kind;
  vAct = act;
}
