precision highp float;
precision highp int;

in float vSide; in float vHalf; in float vU; in vec3 vColor; in float vAlpha; // lit-ok: shader constant
flat in int vLane; flat in int vKind; flat in vec4 vAct; // lit-ok: shader constant

uniform float uTime;
uniform vec4 uW; // lit-ok: shader constant
uniform vec3 uHot;            // signalHot, linear // lit-ok: shader constant
uniform vec3 uRouteColor;     // ink, linear // lit-ok: shader constant
uniform vec3 uTrailCore;      // chalk, linear // lit-ok: shader constant
uniform vec3 uTrailRim;       // signal, linear // lit-ok: shader constant
uniform vec2 uFirePeriod;     // seconds [min, max] // lit-ok: shader constant
uniform float uFireDuty, uFireSpeed, uFireSigma, uSweepPeriod, uFirePeak;
uniform float uFadeSec;
uniform float uFrozen;        // 1.0 under reduced motion: pulses at fixed phases // lit-ok: shader constant

out vec4 outColor; // lit-ok: shader constant

float hash11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); } // lit-ok: shader constant

float fire(int lane, float u, float t) {
  float warp = float(lane >> 5); // lit-ok: shader constant
  float sm = float(lane >> 7); // lit-ok: shader constant
  float h = hash11(warp * 17.0 + 3.0); // lit-ok: shader constant
  float period = mix(uFirePeriod.x, uFirePeriod.y, h);
  float phase = fract(t / period + h);
  float occ = step(phase, uFireDuty);            // 'active' is reserved in GLSL ES
  float sweep = 0.5 + 0.5 * sin(6.2831853 * (t / uSweepPeriod - mod(sm, 8.0) / 8.0)); // lit-ok: shader constant
  float head = fract(t * uFireSpeed + hash11(warp + 101.0)); // lit-ok: shader constant
  float dd = u - head; dd -= floor(dd + 0.5); // lit-ok: shader constant
  float pulse = exp(-(dd * dd) / (uFireSigma * uFireSigma));
  return occ * pulse * (0.55 + 0.45 * sweep); // lit-ok: shader constant
}

void main() {
  float edge = 1.0 - smoothstep(vHalf - 0.5, vHalf + 0.5, abs(vSide)); // lit-ok: shader constant
  vec3 col = vColor; // lit-ok: shader constant
  float a = vAlpha;

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

  a *= edge;
  if (a < 0.003) discard; // lit-ok: shader constant
  outColor = vec4(col * a, a); // lit-ok: shader constant
}
