precision highp float;
precision highp int;

in float vSide; in float vHalf; in float vU; in float vAlpha; in float vBandSpeed; // lit-ok: shader constant
flat in int vLane; flat in int vKind; flat in vec4 vAct; // lit-ok: shader constant
flat in float vGb; // lit-ok: shader constant

uniform float uTime;
uniform vec4 uW; // lit-ok: shader constant
uniform vec3 uHot;            // signalHot, sRGB components as before // lit-ok: shader constant
uniform vec3 uRouteColor;     // ink // lit-ok: shader constant
uniform vec3 uTrailCore;      // chalk // lit-ok: shader constant
uniform vec3 uTrailRim;       // signal // lit-ok: shader constant
uniform vec2 uFirePeriod;     // seconds [min, max] // lit-ok: shader constant
uniform float uFireDuty, uFireSpeed, uFireSigma, uSweepPeriod, uFirePeak;
uniform float uFadeSec;
uniform float uFrozen;        // 1.0 under reduced motion: pulses at fixed phases // lit-ok: shader constant
uniform vec3 uGradLead;       // scene gradient lead stop, OKLab, build-time converted // lit-ok: shader constant
uniform vec3 uGradTail;       // scene gradient tail stop, OKLab, build-time converted // lit-ok: shader constant
uniform vec3 uSignalOklab;    // signal, OKLab, build-time converted // lit-ok: shader constant
uniform float uGradTailLength; // scene gradient tailLength // lit-ok: shader constant
uniform float uLightMode;     // 0 band, 1 radial, 2 wander, 3 static // lit-ok: shader constant
uniform float uLightModeFrom; // outgoing light mode during travel // lit-ok: shader constant
uniform float uLightMix;      // 0 outgoing mode, 1 incoming mode // lit-ok: shader constant
uniform float uLightRadius;   // scene gradient light radius // lit-ok: shader constant
uniform float uLightGain;     // scene gradient light gain // lit-ok: shader constant
uniform vec3 uGbColor;        // guestbook letter lane color: signalHot, ink on paper // lit-ok: shader constant
uniform vec4 uWordTint[WORD_SLOTS]; // server node lanes: sRGB color, opacity per pool slot (DESIGN 6.15) // lit-ok: shader constant
uniform vec4 uGbDimBox;       // guestbook contrast box, buffer px, x0 y0 x1 y1 // lit-ok: shader constant
uniform float uGbDim;         // dim amount behind the panel, 0 off // lit-ok: shader constant
uniform float uGbDimFeather;  // feather outside the box, buffer px // lit-ok: shader constant

out vec4 outColor; // lit-ok: shader constant

float hash11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); } // lit-ok: shader constant

// OKLab to sRGB (Bjorn Ottosson matrices, inverted). Output components
// are sRGB values, matching the previous pipeline where ShaderMaterial
// output is not color-managed.
vec3 oklabToSrgb(vec3 c) { // lit-ok: shader constant
  float l_ = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z; // lit-ok: shader constant
  float m_ = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z; // lit-ok: shader constant
  float s_ = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z; // lit-ok: shader constant
  l_ = l_ * l_ * l_; m_ = m_ * m_ * m_; s_ = s_ * s_ * s_; // lit-ok: shader constant
  vec3 lin = vec3( // lit-ok: shader constant
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_, // lit-ok: shader constant
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_, // lit-ok: shader constant
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_); // lit-ok: shader constant
  vec3 lo = lin * 12.92; // lit-ok: shader constant
  vec3 hi = 1.055 * pow(max(lin, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055; // lit-ok: shader constant
  return clamp(mix(lo, hi, step(0.0031308, lin)), 0.0, 1.0); // lit-ok: shader constant
}

// Light bump along the lane for one light mode (polish round: both the
// outgoing and incoming modes are evaluated during travel and mixed by
// uLightMix, so the light never jumps at the travel midpoint).
float lightAt(float mode) { // lit-ok: shader constant
  float centerU; // lit-ok: shader constant
  if (mode < 0.5) centerU = fract(uTime / uSweepPeriod); // lit-ok: shader constant
  else if (mode < 1.5) centerU = 0.5; // lit-ok: shader constant
  else if (mode < 2.5) centerU = fract(uTime / uSweepPeriod + hash11(float(vLane) * 0.37 + 11.0) * 0.5); // lit-ok: shader constant
  else centerU = 0.5; // lit-ok: shader constant
  float ldd = vU - centerU; ldd -= floor(ldd + 0.5); // lit-ok: shader constant
  float lw = uLightRadius * 0.02; // lit-ok: shader constant
  return exp(-(ldd * ldd) / (lw * lw)) * uLightGain; // lit-ok: shader constant
}

float fire(int lane, float u, float t) {
  float warp = float(lane >> 5); // lit-ok: shader constant
  float sm = float(lane >> 7); // lit-ok: shader constant
  float h = hash11(warp * 17.0 + 3.0); // lit-ok: shader constant
  // Variant B seeded phase jitter, zeroed by Lockstep: (1 - uW.x) is
  // exactly zero on the server route. The hash reads vLane, never the
  // lane parameter, so the lockstep source check still holds.
  float jitter = hash11(float(vLane) * 0.37 + 11.0) * (1.0 - uW.x); // lit-ok: shader constant
  float period = mix(uFirePeriod.x, uFirePeriod.y, h);
  float phase = fract(t / period + h + jitter);
  float occ = step(phase, uFireDuty);            // 'active' is reserved in GLSL ES
  float sweep = 0.5 + 0.5 * sin(6.2831853 * (t / uSweepPeriod - mod(sm, 8.0) / 8.0)); // lit-ok: shader constant
  float head = fract(t * uFireSpeed * vBandSpeed + hash11(warp + 101.0)); // lit-ok: shader constant
  float dd = u - head; dd -= floor(dd + 0.5); // lit-ok: shader constant
  float pulse = exp(-(dd * dd) / (uFireSigma * uFireSigma));
  return occ * pulse * (0.55 + 0.45 * sweep); // lit-ok: shader constant
}

void main() {
  float edge = 1.0 - smoothstep(vHalf - 0.5, vHalf + 0.5, abs(vSide)); // lit-ok: shader constant
  float a = vAlpha;

  // P-LF-2 gradient: interpolate the uniform OKLab stops along lane
  // length. The gradient completes over tailLength of the lane, then
  // holds the tail stop. The scene light shifts lanes toward signal
  // near a moving center along the lane; the light width in u units is
  // the token radius scaled by 0.02, and the mix is capped at 0.35 so // lit-ok:
  // the light brightens without recoloring the lane into signal.
  float g = clamp(vU / max(uGradTailLength, 0.001), 0.0, 1.0); // lit-ok: shader constant
  vec3 gradOklab = mix(uGradLead, uGradTail, g); // lit-ok: shader constant
  float lightF = mix(lightAt(uLightModeFrom), lightAt(uLightMode), uLightMix); // lit-ok: shader constant
  gradOklab = mix(gradOklab, uSignalOklab, clamp(lightF, 0.0, 1.0) * 0.35); // lit-ok: shader constant

  // Luminance-only dither: perturb OKLab lightness L by at most 0.004 // lit-ok:
  // around the gradient, leaving a and b untouched, so banding breaks
  // without shifting hue or chroma.
  float dith = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453); // lit-ok: shader constant
  vec3 dithered = vec3(gradOklab.x + (dith - 0.5) * 0.008, gradOklab.y, gradOklab.z); // lit-ok: shader constant
  vec3 col = oklabToSrgb(dithered); // lit-ok: shader constant

  if (uW.x > 0.0) {                              // server pulses, weighted out in other layouts // lit-ok: shader constant
    float t = uFrozen > 0.5 ? 0.0 : uTime; // lit-ok: shader constant
    float f = fire(vLane, vU, t) * uW.x;
    col = mix(col, uHot, f);
    a = mix(a, uFirePeak, f);
  }

  if (vKind > 0 && uTime >= vAct.r) {            // routes (1) and lit trails (2) // lit-ok: shader constant
    float rate = vAct.a;
    float travelled = (uTime - vAct.r) * abs(rate);
    float along = rate >= 0.0 ? vU : 1.0 - vU; // lit-ok: shader constant
    float shown = step(along, travelled);
    float fade = vAct.g > 0.0 ? 1.0 - clamp((uTime - vAct.g) / uFadeSec, 0.0, 1.0) : 1.0; // lit-ok: shader constant
    float on = (vKind == 1 ? uW.y : uW.z) * shown * fade; // lit-ok: shader constant
    vec3 target = vKind == 1 ? uRouteColor : mix(uTrailRim, uTrailCore, edge); // lit-ok: shader constant
    col = mix(col, target, on);
    a = mix(a, 1.0, on); // lit-ok: shader constant
  }

  if (vGb > 1.5) {                              // server node lanes: alpha 2 plus slot // lit-ok: shader constant
    vec4 tint = uWordTint[int(vGb - 2.0 + 0.5)]; // lit-ok: shader constant
    col = mix(col, tint.rgb, tint.a); // lit-ok: shader constant
    a = mix(a, max(a, vU), tint.a); // lit-ok: shader constant
  } else if (vGb > 0.0) {                       // guestbook letter lanes // lit-ok: shader constant
    col = uGbColor; // lit-ok: shader constant
    a = max(a, vU); // lit-ok: shader constant
  }

  if (uGbDim > 0.0) {                           // guestbook contrast: the field dims behind the panel // lit-ok: shader constant
    vec2 c = 0.5 * (uGbDimBox.xy + uGbDimBox.zw); // lit-ok: shader constant
    vec2 hs = 0.5 * (uGbDimBox.zw - uGbDimBox.xy); // lit-ok: shader constant
    float dd = length(max(abs(gl_FragCoord.xy - c) - hs, 0.0)); // lit-ok: shader constant
    float m = 1.0 - smoothstep(0.0, uGbDimFeather, dd); // lit-ok: shader constant
    a *= 1.0 - uGbDim * m; // lit-ok: shader constant
  }

  a *= edge;
  if (a < 0.003) discard; // lit-ok: shader constant
  outColor = vec4(col * a, a); // lit-ok: shader constant
}
