// Lane F1 probe: PixiJS 3D v0.1.0 mechanisms needed by the lane-field rewrite.
// Each mechanism records PASS / FAIL / ABSENT with the exact error where one occurs.
// No masterspec authoring here. WebGL2 path only (headless SwiftShader has no WebGPU).
import { Application, BufferImageSource, Texture } from 'pixi.js';
import {
  BatchedMesh3D,
  Camera3D,
  CubeGeometry,
  DirectionalLight,
  Material3D,
  Matrix4,
  Mesh3D,
  RenderPassBit,
  View3D,
} from '@pixi/3d';
import type { ShaderBit } from '@pixi/3d';
import { captureGraphDebugSnapshot, GraphDebugOverlay } from '@pixi/3d/extras';

type Verdict = 'PASS' | 'FAIL' | 'ABSENT';
interface Step { mechanism: string; verdict: Verdict; detail: string; }
const steps: Step[] = [];
const step = (mechanism: string, verdict: Verdict, detail: string): void => {
  steps.push({ mechanism, verdict, detail });
};

const logs: string[] = [];
const report = (): void => {
  const el = document.getElementById('probe-result');
  if (el) {
    el.textContent = JSON.stringify({ steps, console: logs }, null, 2);
  }
  (window as unknown as { __probeDone?: boolean }).__probeDone = true;
};

// Capture console errors/warnings and uncaught errors into the report,
// because a failed shader compile in Pixi logs instead of throwing.
window.addEventListener('error', (e) => logs.push(`window.onerror: ${e.message}`));
const origError = console.error.bind(console);
const origWarn = console.warn.bind(console);
console.error = (...a: unknown[]): void => {
  logs.push(`console.error: ${a.map(String).join(' ')}`.slice(0, 500));
  origError(...a);
};
console.warn = (...a: unknown[]): void => {
  logs.push(`console.warn: ${a.map(String).join(' ')}`.slice(0, 500));
  origWarn(...a);
};

async function main(): Promise<void> {
  const app = new Application();
  try {
    // Import of @pixi/3d happens before app.init (guide trap: import after init draws nothing).
    await app.init({
      preference: 'webgl',
      width: 640,
      height: 360,
      antialias: false,
      background: 0x0d0b16,
    });
    document.getElementById('app')?.appendChild(app.canvas);
    step('app.init webgl', 'PASS', `renderer type: ${app.renderer.type}`);
  } catch (e) {
    step('app.init webgl', 'FAIL', e instanceof Error ? e.message : String(e));
    report();
    return;
  }

  // 1. View3D + Camera3D
  const camera = new Camera3D({ fov: 45, near: 0.1, far: 500 });
  const view3d = new View3D({
    width: 640,
    height: 360,
    camera,
    environment: { skyColor: 0xc9d6ff, groundColor: 0x3a2f45, intensity: 0.6 },
  });
  app.stage.addChild(view3d);
  // PBR materials need light: quick-start sun, aimed at the origin.
  const sun = new DirectionalLight({ color: 0xfff4e0, intensity: 3 });
  sun.position.set(-3, 5, 2);
  sun.lookAt({ x: 0, y: 0, z: 0 });
  view3d.root.addChild(sun);
  step('View3D + Camera3D', 'PASS', 'new View3D({width,height,camera}), added to app.stage');

  // 2. RGBA32F texture: 256x24 float layout buffer, same shape as lanefield gbTex.
  let layoutTex: Texture;
  try {
    const floats = new Float32Array(256 * 24 * 4);
    for (let i = 0; i < floats.length; i++) floats[i] = (i % 97) / 97;
    const source = new BufferImageSource({
      resource: floats,
      width: 256,
      height: 24,
      format: 'rgba32float',
    });
    layoutTex = new Texture({ source });
    step(
      'RGBA32F texture',
      'PASS',
      `BufferImageSource Float32Array 256x24 format=${source.format} (pixi.js defaults Float32Array to rgba32float)`,
    );
  } catch (e) {
    step('RGBA32F texture', 'FAIL', e instanceof Error ? e.message : String(e));
    report();
    return;
  }

  // 3. Custom ShaderBit: WGSL + GLSL, reads the float texture in the VERTEX stage
  // via sampleLayoutMapDirect (mip 0, either stage) and a per-instance field.
  const layoutBit: ShaderBit = {
    name: 'f1LayoutRead',
    textures: ['layoutMap'],
    bindings: {
      instance: { tint: 'vec4<f32>' },
      material: { gain: 'f32' },
    },
    gpu: {
      vertex: {
        beforeTransform:
          'let lv = sampleLayoutMapDirect(vec2<f32>(0.5, 0.5)); position.y += lv.r * 0.1;',
      },
      fragment: {
        material: 'albedo *= instance.tint.rgb * material.gain;',
      },
    },
    gl: {
      vertex: {
        beforeTransform:
          'position.y += sampleLayoutMapDirect(vec2(0.5, 0.5)).r * 0.1;',
      },
      fragment: {
        material: 'albedo *= instance.tint.rgb * material.gain;',
      },
    },
  };

  // 4. BatchedMesh3D with per-instance attributes (vec4 tint field).
  let batched: BatchedMesh3D;
  try {
    const material = new Material3D({
      roughness: 0.6,
      extraBits: [layoutBit],
      textures: { layoutMap: layoutTex },
    });
    material.data.gain = 1.0;
    const geometry = new CubeGeometry({ width: 1, height: 1, depth: 1 });
    batched = new BatchedMesh3D({
      size: 100,
      instanceData: { tint: { value: [1, 1, 1, 1], type: 'vec4<f32>' } },
    });
    const m = new Matrix4();
    for (let i = 0; i < 100; i++) {
      batched.setGeometryAt(i, geometry);
      batched.setMaterialAt(i, material);
      batched.setPassesAt(i, RenderPassBit.OPAQUE);
      m.makeTranslation((i % 10) * 2 - 9, Math.floor(i / 10) * 2 - 9, 0);
      batched.setMatrixAt(i, m);
      batched.setInstanceDataAt(i, 'tint', 1, 0.5, 0.2, 1);
    }
    // Bulk rewrite path: write into the Float32Array and update() once.
    const { data, stride, offset, fields } = batched.instanceData;
    for (let i = 0; i < 100; i++) {
      const o = offset + i * stride + fields.tint;
      data[o + 3] = 0.9;
    }
    batched.instanceData.update();
    view3d.root.addChild(batched);
    step(
      'BatchedMesh3D + per-instance attributes',
      'PASS',
      `size=100, setMatrixAt x100, setInstanceDataAt x100, instanceData stride=${stride} fields=${JSON.stringify(fields)}, update() ok`,
    );
  } catch (e) {
    step(
      'BatchedMesh3D + per-instance attributes',
      'FAIL',
      e instanceof Error ? `${e.name}: ${e.message}` : String(e),
    );
    report();
    return;
  }

  // 5. Custom shader compile is proven only by a rendered frame (no public warmup API).
  // Warmup: no public API exists in the shipped .d.ts or guides; compileShader is @internal
  // and source-level only. Recorded as ABSENT, not attempted as a call.
  step(
    'warmup / precompile',
    'ABSENT',
    'No public warmup API in @pixi/3d 0.1.0 docs or dist/index.d.ts; compileShader is @internal and returns shader source text, not a GPU program',
  );

  // 6. Off-center projection: Camera3DOptions has fov/near/far/mode/orthographicSize/zoom
  // and no shift/offset; projection is readonly, computed by computeProjection().
  try {
    const proj = camera.computeProjection(640 / 360, new Matrix4());
    const elems = proj.elements ?? proj;
    void elems;
    step(
      'off-center projection',
      'ABSENT',
      'No shift/offset option in Camera3DOptions (scene.Camera3DOptions.html.md); projection is readonly Matrix4; computeProjection(aspect, out) recomputes from fov/near/far/mode only. No public API to inject elements [8]/[9] as three.js does.',
    );
  } catch (e) {
    step('off-center projection', 'FAIL', e instanceof Error ? e.message : String(e));
  }

  // 7. Renderer statistics: no renderer.info equivalent; debug path is GraphDebugOverlay /
  // captureGraphDebugSnapshot(view graph). The graph is internal (_graph), so the snapshot
  // call is attempted via the overlay recording path instead.
  try {
    const overlay = new GraphDebugOverlay({ view: view3d, renderer: app.renderer });
    overlay.destroy();
    step(
      'renderer statistics',
      'PASS',
      'No renderer.info equivalent; programmatic stats path is GraphDebugOverlay / captureGraphDebugSnapshot (extras, debug-only, adds CPU time per frame per extras_debug guide). Overlay constructed and destroyed without error.',
    );
  } catch (e) {
    step('renderer statistics', 'FAIL', e instanceof Error ? e.message : String(e));
  }
  void captureGraphDebugSnapshot; // imported to prove the export exists; needs the internal RenderGraph to call

  // 8. Render frames and confirm the custom shader + batch actually draw.
  // Control: one plain Mesh3D with a stock Material3D (no custom bit) at the
  // origin, so a blank frame can be blamed on the bit or on the batch/render.
  try {
    const control = new Mesh3D({
      geometry: new CubeGeometry({ width: 6, height: 6, depth: 6 }),
      material: new Material3D({ baseColor: 0xff3355, roughness: 0.6 }),
    });
    view3d.root.addChild(control);
    camera.position.set(0, 0, 30);
    camera.lookAt({ x: 0, y: 0, z: 0 });
    const readback = (): { lit: number; reddish: number } => {
      const ctx = app.canvas.getContext('webgl2');
      const w = 640;
      const h = 360;
      const px = new Uint8Array(w * h * 4);
      ctx?.readPixels(0, 0, w, h, ctx.RGBA, ctx.UNSIGNED_BYTE, px);
      let lit = 0;
      let reddish = 0;
      for (let k = 0; k < w * h; k++) {
        const r = px[k * 4];
        const g = px[k * 4 + 1];
        const b = px[k * 4 + 2];
        if (r !== 13 || g !== 11 || b !== 22) lit++;
        if (r > 100 && r > g + 40 && r > b + 40) reddish++;
      }
      return { lit, reddish };
    };
    const t0 = performance.now();
    for (let i = 0; i < 10; i++) app.render();
    const ms = performance.now() - t0;
    const full = readback();
    step(
      'render 10 frames (WebGL2, SwiftShader)',
      full.lit > 1000 && full.reddish > 100 ? 'PASS' : 'FAIL',
      `10 renders in ${ms.toFixed(1)}ms; ${full.lit}/230400 pixels differ from background 0x0d0b16, ${full.reddish} reddish (control cube is 0xff3355)`,
    );

    // 8b. Isolate the batch: hide the control cube, read back the custom-bit batch alone.
    control.visible = false;
    app.render();
    const batchOnly = readback();
    step(
      'batch alone (custom ShaderBit, control hidden)',
      batchOnly.lit > 1000 ? 'PASS' : 'FAIL',
      `${batchOnly.lit}/230400 pixels differ from background, ${batchOnly.reddish} reddish; 0 means the custom-bit batch drew nothing (shader may have failed to compile silently)`,
    );

    // 8c. Isolate the bit: same batch shape, stock material, no extraBits.
    batched.visible = false;
    const stock = new BatchedMesh3D({ size: 100 });
    const stockMat = new Material3D({ baseColor: 0xffffff, roughness: 0.6 });
    const stockGeo = new CubeGeometry({ width: 1, height: 1, depth: 1 });
    const m2 = new Matrix4();
    for (let i = 0; i < 100; i++) {
      stock.setGeometryAt(i, stockGeo);
      stock.setMaterialAt(i, stockMat);
      stock.setPassesAt(i, RenderPassBit.OPAQUE);
      m2.makeTranslation((i % 10) * 2 - 9, Math.floor(i / 10) * 2 - 9, 0);
      stock.setMatrixAt(i, m2);
    }
    view3d.root.addChild(stock);
    app.render();
    const stockOnly = readback();
    step(
      'batch alone (stock material, no custom bit)',
      stockOnly.lit > 1000 ? 'PASS' : 'FAIL',
      `${stockOnly.lit}/230400 pixels differ from background, ${stockOnly.reddish} reddish; PASS here + FAIL above isolates the failure to the custom ShaderBit`,
    );
  } catch (e) {
    step(
      'render 10 frames (WebGL2, SwiftShader)',
      'FAIL',
      e instanceof Error ? `${e.name}: ${e.message}` : String(e),
    );
  }

  report();
}

main().catch((e: unknown) => {
  step('probe main', 'FAIL', e instanceof Error ? `${e.name}: ${e.message}` : String(e));
  report();
});
