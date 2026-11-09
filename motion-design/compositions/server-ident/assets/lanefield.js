/*
 * Lanefield for video: the 6,144-lane Server layout from spec/astryx/DESIGN.md section 12
 * (world.server), drawn on a 2D canvas through a real perspective camera.
 * Every frame is a pure function of (t, camera, params): no clock, no rAF, no Math.random.
 * Shared by motion-design/compositions/* (keep the copies identical).
 */
(function () {
  "use strict";

  // ---- tokens (DESIGN.md 1.4.0 section 12, world.server and colors) ----
  const T = {
    sm: { cols: 8, rows: 6, pitch: [0.95, 0.85] },
    part: { cols: 2, rows: 2, pitch: [0.27, 0.23] },
    lane: { cols: 8, rows: 4, pitch: [0.03, 0.05] },
    zStraight: [-24.0, -2.0],
    convergeZ: [0.4, 2.2],
    convergeMix: [0.5, 0.92],
    focus: [0.0, 0.0, 2.2],
    fire: { warpSize: 32, speed: 0.55, sigma: 0.05, duty: 0.6, period: [3.0, 7.0] },
    bands: { speed: [0.85, 1.0, 1.15], alpha: [0.55, 0.8, 1.0] },
    fog: [7.0, 30.0],
    words: ["Go TUI", "Ollama", "Tailscale", "Docker", "Open WebUI", "WSL2 Ubuntu", "Windows 11", "RTX 3070 Ti", "Smithtown, NY"],
    wordSize: 0.22,
    wordDrift: [-1.0, 0.5, 1.0],
    wordCadence: 1.1,
    wordLife: 2.6,
    wordFadeFrom: 0.55,
  };
  const C = {
    ground: "#0A0C0F",
    text2: [167, 171, 176],
    signal: [123, 181, 248],
    signalDim: [79, 119, 165],
    hot: [212, 231, 252],
  };
  const LANES = 6144;
  const PTS = 8;

  // ---- seeded entropy (DESIGN 6.11): counter-based splitmix32 draw(seed, channel, n) ----
  function mix32(x) {
    x = (x + 0x9e3779b9) | 0;
    x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
    x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
    return (x ^ (x >>> 16)) >>> 0;
  }
  function draw(seed, channel, n) {
    return mix32(mix32(mix32(seed >>> 0) ^ Math.imul(channel + 1, 0x27d4eb2d)) ^ n) / 4294967296;
  }
  const WORLD_SEED = 0x5eed; // layout seed, fixed (world.seed never changes)

  // ---- layout: lane cross-section and 8 control points ----
  const base = new Float32Array(LANES * PTS * 3);
  const band = new Uint8Array(LANES);
  const zs = [-24, -16, -8, -2, 0.4, 1.0, 1.6, 2.2];
  for (let i = 0; i < LANES; i++) {
    const sm = i >> 7, p = (i >> 5) & 3, l = i & 31;
    const x = ((sm % 8) - 3.5) * T.sm.pitch[0] + ((p % 2) - 0.5) * T.part.pitch[0] + ((l % 8) - 3.5) * T.lane.pitch[0];
    const y = (Math.floor(sm / 8) - 2.5) * T.sm.pitch[1] + ((p >> 1) - 0.5) * T.part.pitch[1] + ((l >> 3) - 1.5) * T.lane.pitch[1];
    band[i] = Math.floor(draw(WORLD_SEED, 1, i) * 3);
    for (let k = 0; k < PTS; k++) {
      const z = zs[k];
      let m = 0;
      if (z >= T.convergeZ[0]) {
        const u = (z - T.convergeZ[0]) / (T.convergeZ[1] - T.convergeZ[0]);
        m = T.convergeMix[0] + (T.convergeMix[1] - T.convergeMix[0]) * u;
      }
      const o = (i * PTS + k) * 3;
      base[o] = x + (T.focus[0] - x) * m;
      base[o + 1] = y + (T.focus[1] - y) * m;
      base[o + 2] = z;
    }
  }

  // ---- camera ----
  function camera(pos, target, fovDeg, shift, W, H) {
    const f = [target[0] - pos[0], target[1] - pos[1], target[2] - pos[2]];
    let fl = Math.hypot(f[0], f[1], f[2]);
    f[0] /= fl; f[1] /= fl; f[2] /= fl;
    // right = f x up(0,1,0)
    let r = [-f[2], 0, f[0]];
    const rl = Math.hypot(r[0], r[2]) || 1;
    r[0] /= rl; r[2] /= rl;
    const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
    const focal = (H / 2) / Math.tan((fovDeg * Math.PI) / 360);
    const cx = W / 2 + shift[0] * (W / 2);
    const cy = H / 2 - shift[1] * (H / 2);
    return { pos, f, r, u, focal, cx, cy };
  }
  // returns [sx, sy, depth] or null when behind the near plane
  function project(cam, x, y, z, out) {
    const dx = x - cam.pos[0], dy = y - cam.pos[1], dz = z - cam.pos[2];
    const d = dx * cam.f[0] + dy * cam.f[1] + dz * cam.f[2];
    if (d < 0.15) return false;
    const sx = dx * cam.r[0] + dy * cam.r[1] + dz * cam.r[2];
    const sy = dx * cam.u[0] + dy * cam.u[1] + dz * cam.u[2];
    out[0] = cam.cx + (sx / d) * cam.focal;
    out[1] = cam.cy - (sy / d) * cam.focal;
    out[2] = d;
    return true;
  }

  // ---- easing: cubic-bezier solver (exact CSS semantics) ----
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t;
    const sy = (t) => ((ay * t + by) * t + cy) * t;
    const dsx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return function (x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) {
        const e = sx(t) - x;
        if (Math.abs(e) < 1e-6) break;
        const d = dsx(t);
        if (Math.abs(d) < 1e-6) break;
        t -= e / d;
      }
      let lo = 0, hi = 1;
      for (let i = 0; i < 30 && Math.abs(sx(t) - x) > 1e-6; i++) {
        if (sx(t) < x) lo = t; else hi = t;
        t = (lo + hi) / 2;
      }
      return sy(t);
    };
  }
  const EASE = {
    standard: bezier(0.25, 0.1, 0.25, 1), // CSS "ease"
    signature: bezier(0.23, 1, 0.32, 1),
    lusionMain: bezier(0.35, 0, 0, 1),
    lusionSoft: bezier(0.4, 0, 0.1, 1),
  };

  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const lerp = (a, b, u) => a + (b - a) * u;
  const lerp3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  const rgba = (c, a) => "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a.toFixed(3) + ")";
  const mixc = (a, b, u) => [Math.round(lerp(a[0], b[0], u)), Math.round(lerp(a[1], b[1], u)), Math.round(lerp(a[2], b[2], u))];

  /*
   * render(ctx, t, opts)
   *   opts.cam      {pos, target, fov, shift}
   *   opts.seed     uint32 session seed (motion entropy)
   *   opts.alpha    base lane alpha (frame.md: 0.16)
   *   opts.width    lane width px (frame.md: 1.4)
   *   opts.deform   optional fn(i, k, p) mutating p=[x,y,z] (parting ring, 3D offsets)
   *   opts.fireAll  optional {t0} : every warp fires one lockstep front at t0
   *   opts.words    boolean, draw world.server.words at the focus
   *   opts.wordsFrom seconds when the word cadence starts
   */
  const P = new Float32Array(LANES * PTS * 3);
  const S = new Float32Array(LANES * PTS * 3); // screen x, y, depth
  const V = new Uint8Array(LANES * PTS);
  const tmp = [0, 0, 0];
  const pt = [0, 0, 0];

  function render(ctx, t, o) {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    const cam = camera(o.cam.pos, o.cam.target, o.cam.fov, o.cam.shift || [0, 0], W, H);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = C.ground;
    ctx.fillRect(0, 0, W, H);

    // world positions (optionally deformed) and projection
    for (let i = 0; i < LANES; i++) {
      for (let k = 0; k < PTS; k++) {
        const o3 = (i * PTS + k) * 3;
        pt[0] = base[o3]; pt[1] = base[o3 + 1]; pt[2] = base[o3 + 2];
        if (o.deform) o.deform(i, k, pt);
        P[o3] = pt[0]; P[o3 + 1] = pt[1]; P[o3 + 2] = pt[2];
        const ok = project(cam, pt[0], pt[1], pt[2], tmp);
        V[i * PTS + k] = ok ? 1 : 0;
        S[o3] = tmp[0]; S[o3 + 1] = tmp[1]; S[o3 + 2] = tmp[2];
      }
    }

    // base lanes: 3 depth bands x 4 fog buckets, one stroke each
    const baseA = o.alpha == null ? 0.16 : o.alpha;
    ctx.lineWidth = o.width || 1.4;
    ctx.lineCap = "round";
    for (let b = 0; b < 3; b++) {
      for (let fb = 0; fb < 4; fb++) {
        ctx.beginPath();
        let any = false;
        for (let i = 0; i < LANES; i++) {
          if (band[i] !== b) continue;
          for (let k = 0; k < PTS - 1; k++) {
            const a = i * PTS + k;
            if (!V[a] || !V[a + 1]) continue;
            const d = (S[a * 3 + 2] + S[a * 3 + 5]) / 2;
            const fog = clamp01((d - T.fog[0]) / (T.fog[1] - T.fog[0]));
            if (Math.min(3, Math.floor(fog * 4)) !== fb) continue;
            ctx.moveTo(S[a * 3], S[a * 3 + 1]);
            ctx.lineTo(S[a * 3 + 3], S[a * 3 + 4]);
            any = true;
          }
        }
        if (any) {
          ctx.strokeStyle = rgba(C.signalDim, baseA * T.bands.alpha[b] * (1 - (fb + 0.5) / 4.6));
          ctx.stroke();
        }
      }
    }

    // pulses: warps of 32 fire together, linear in time (Lockstep)
    ctx.globalCompositeOperation = "lighter";
    const sig = T.fire.sigma;
    const warps = LANES / T.fire.warpSize;
    for (let w = 0; w < warps; w++) {
      const fronts = [];
      if (draw(WORLD_SEED, 2, w) < T.fire.duty) {
        const per = lerp(T.fire.period[0], T.fire.period[1], draw(WORLD_SEED, 3, w));
        const ph = draw(WORLD_SEED, 4, w) * per;
        const sp = T.fire.speed * T.bands.speed[band[w * 32]];
        const s = (((t + ph) % per) + per) % per * sp;
        if (s < 1 + 3 * sig) fronts.push([s, 1]);
      }
      if (o.fireAll && t >= o.fireAll.t0) {
        const s = (t - o.fireAll.t0) * (o.fireAll.speed || 0.7);
        if (s < 1 + 3 * sig) fronts.push([s, o.fireAll.gain || 0.55]);
      }
      for (const [s, gain] of fronts) {
        for (let j = 0; j < 32; j++) {
          const i = w * 32 + j;
          drawPulse(ctx, i, s, sig, gain * T.bands.alpha[band[i]]);
        }
      }
    }
    ctx.globalCompositeOperation = "source-over";

    if (o.words) drawWords(ctx, cam, t - (o.wordsFrom || 0));
    return cam;
  }

  // a gaussian bright head along lane i at arc parameter s in [0,1] (z param)
  function drawPulse(ctx, i, s, sig, gain) {
    const z0 = T.zStraight[0], z1 = T.focus[2];
    const zc = z0 + (z1 - z0) * s;
    const zw = (z1 - z0) * sig;
    const lo = zc - zw * 1.2, hi = zc + zw * 0.25;
    let prev = null;
    for (let k = 0; k < PTS - 1; k++) {
      const a = i * PTS + k;
      const za = zs[k], zb = zs[k + 1];
      if (zb < lo || za > hi) continue;
      if (!V[a] || !V[a + 1]) continue;
      const ua = clamp01((lo - za) / (zb - za)), ub = clamp01((hi - za) / (zb - za));
      const x0 = lerp(S[a * 3], S[a * 3 + 3], ua), y0 = lerp(S[a * 3 + 1], S[a * 3 + 4], ua);
      const x1 = lerp(S[a * 3], S[a * 3 + 3], ub), y1 = lerp(S[a * 3 + 1], S[a * 3 + 4], ub);
      const d = lerp(S[a * 3 + 2], S[a * 3 + 5], 0.5);
      const fog = clamp01((d - T.fog[0]) / (T.fog[1] - T.fog[0]));
      const al = gain * (1 - fog) * 0.42;
      if (al < 0.01) continue;
      ctx.strokeStyle = rgba(C.signal, al * 0.6);
      ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.strokeStyle = rgba(C.hot, al);
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      prev = a;
    }
    return prev;
  }

  function drawWords(ctx, cam, t) {
    if (t < 0) return;
    const n0 = Math.max(0, Math.floor((t - T.wordLife) / T.wordCadence));
    const n1 = Math.floor(t / T.wordCadence);
    for (let n = n0; n <= n1; n++) {
      const u = (t - n * T.wordCadence) / T.wordLife;
      if (u < 0 || u >= 1) continue;
      const word = T.words[n % T.words.length];
      const ys = n % 2 === 0 ? 1 : -1;
      const x = T.focus[0] + T.wordDrift[0] * u;
      const y = T.focus[1] + T.wordDrift[1] * u * ys;
      const z = T.focus[2] + 0.2 + T.wordDrift[2] * u;
      if (!project(cam, x, y, z, tmp)) continue;
      const px = Math.max(28, (T.wordSize * cam.focal) / tmp[2]); // frame.md 28px floor
      let col;
      if (u < 0.4) col = mixc(C.hot, C.signal, u / 0.4);
      else col = mixc(C.signal, C.text2, (u - 0.4) / 0.6);
      const op = u < T.wordFadeFrom ? 1 : 1 - EASE.standard((u - T.wordFadeFrom) / (1 - T.wordFadeFrom));
      ctx.font = "400 " + px.toFixed(1) + 'px "Commit Mono"';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = rgba(col, op);
      ctx.fillText(word, tmp[0], tmp[1]);
    }
  }

  window.Lanefield = { render, project, camera, draw, EASE, lerp, lerp3, clamp01, rgba, mixc, C, T, LANES, PTS, base, band };
})();
