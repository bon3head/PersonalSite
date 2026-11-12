# Porting from Three.js

Most of a Three.js port is renaming. The hard part is code that still compiles and runs after the rename but draws a darker scene, a sideways light or a floor that casts a shadow. This page lists those differences first, then ports a small scene line by line. The API reference covers every name. The `pixijs-3d` agent skill that ships in the npm package also has full tables of Three.js names.

## API mapping

- **The scene is one display object in a PixiJS app.** There's no renderer to own. Create an `Application`, add a [View3D](scene.View3D.html.md) to its stage, and build the scene under [view3d.root](scene.View3D.html#root). 2D sprites, text and UI share the canvas, as [View3D and 2D content](core-concepts-1.html.md) explains.
- **The view holds the scene-wide settings** that Three.js splits between the renderer and the scene: [toneMapping](scene.View3D.html#tonemapping), [exposure](scene.View3D.html#exposure), [shadowQuality](scene.View3D.html#shadowquality), [fog](scene.View3D.html#fog), [background](scene.View3D.html#background), [environment](scene.View3D.html#environment) and the post-processing [passes](scene.View3D.html#passes).
- **Constructors take one options object**, such as `new CubeGeometry({ width, height, depth })`. The same values are properties on the object afterwards.
- **The frame loop is `app.ticker`.** Its callback gets the ticker. [OrbitCamera](extras_camera.OrbitCamera.html.md), a model's [player](scene.Model3D.html#player) and [ParticleSystem3D](extras_particles.ParticleSystem3D.html.md) advance on `Ticker.shared` unless you step them yourself.
- **A loaded glTF is a template.** `Assets.load` returns a [Scene3DSource](assets.Scene3DSource.html.md), and each [Model3D](scene.Model3D.html.md) built from it shares its geometry, materials and textures. See [Loading models](assets.html.md).

## Behaviour differences

Each line compiles after a plain rename and still changes what you see. The first group affects nearly every port.

**Light and shadow**

- A HemisphereLight becomes the view's environment, a [Hemisphere](environment.Hemisphere.html.md). Three.js divides its intensity by π and the view doesn't, so pass `intensity: i / Math.PI`. Directional, point, spot and ambient intensities port unchanged.
- Lights have no target. Directional and spot lights shine along their local -Z axis, so call [lookAt](scene.Container3D.html#lookat) after placing one, and again after every move ([Lights](scene-4.html.md)). An unrotated [DirectionalLight](scene.DirectionalLight.html.md) shines sideways, not down.
- Meshes and models cast and receive shadows [by default](scene.Mesh3D.html#castshadow). Set `castShadow: false` on floors and terrain, which otherwise also stretch the sun's shadow box.
- [shadow.bias](scene.LightShadow.html#bias) has the opposite sign, so negate a Three.js value or keep the default. `shadow.mapSize` becomes the view's `shadowQuality`, and the shadow camera's box becomes [shadow.bounds](scene.LightShadow.html#bounds), which is in world space.

**Time**

- `ticker.deltaTime` measures time in 60 fps frames, not seconds. For the seconds that Three.js's getDelta() returns, use `ticker.deltaMS / 1000`. The ticker caps `deltaMS` at 100 ms, so below 10 fps motion slows down.
- Where Three.js called `controls.update()` or `mixer.update(dt)` in the loop, build the controller or model with `autoUpdate: false`. Then call its `update(ticker)` from `app.ticker`, so it steps in the same frame as your code.
- The camera defaults to a field of view of 60 and a far plane of 1000 ([Camera3D#fov](scene.Camera3D.html#fov), [Camera3D#far](scene.Camera3D.html#far)). Three.js apps usually pass 50 and 2000, so set both.

**Colour and output**

- Tone mapping is off by default in both engines. [exposure](scene.View3D.html#exposure) scales the light even under `'none'`, where Three.js ignores it, so port a NoToneMapping app with exposure 1.
- `scene.background` becomes the view's [background](scene.View3D.html#background), which post effects and fog cover as they do in Three.js. Under a tone mapping curve such as `'aces'`, the background goes through the curve too. For an exact colour, pass `backgroundColor` to `app.init` instead.
- An emissive colour is an opt-in group, `emissive: { color, strength }`, and its colour defaults to white. Pass the group only where the Three.js emissive isn't black.

**Surfaces**

- [alphaMode](materials.BaseMaterial3D.html#alphamode) defaults to `'opaque'`, which ignores `alpha` and texture alpha. `transparent: true` becomes `'blend'`, and alphaTest becomes `'mask'` with `alphaCutoff`.
- Images upload without Three.js's `flipY`, so a picture on a [PlaneGeometry](geometry.PlaneGeometry.html.md) needs `flipV: true` ([Textures on the built-in shapes](geometry.html.md)).
- Mipmaps are off by default. Load a tiled or distant texture with `Assets.load({ src, data: { autoGenerateMipmaps: true } })`, or it shimmers.
- Texture `repeat` and `offset` become the material's [uvTransform](materials.Material3D.html#uvtransform), a PixiJS `Matrix` that applies to all its textures. Base colour and emissive textures always decode as sRGB, so `colorSpace` has nothing to port to.

**Scene graph**

- `rotation` and `quaternion` don't stay in sync. Nodes from a glTF file, and nodes you've called `lookAt` on, store their orientation in the quaternion, so `rotation.y += a` throws it away ([Rotation and quaternion](core-concepts.html.md)).
- [getLocalBounds](scene.Container3D.html#getlocalbounds) measures in the node's own space, without its own transform, where Box3.setFromObject measures in world space.
- A Three.js crossFadeTo becomes two playing states whose [weights](animation.AnimationState.html#weight) you ramp, and `play()` doesn't stop any other state ([Blending and crossfades](animation.html.md)).

## Side-by-side example

A Three.js scene with a hemisphere light, a shadowed sun, a ground, a spinning box and orbit controls:

```js
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9cc7ea);
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(4, 3, 8);
const controls = new OrbitControls(camera, renderer.domElement);

scene.add(new THREE.HemisphereLight(0xdfeeff, 0x5a5040, 1.5));
const sun = new THREE.DirectionalLight(0xfff4e0, 2.5);
sun.position.set(4, 8, 5);
sun.castShadow = true;
scene.add(sun);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial({ color: 0x7a9a5a }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const box = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0xd9534f }));
box.position.y = 0.5;
box.castShadow = true;
scene.add(box);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const timer = new THREE.Timer();
renderer.setAnimationLoop((time) => {
  timer.update(time);
  box.rotation.y += timer.getDelta();
  controls.update();
  renderer.render(scene, camera);
});
```

Here's the same scene in PixiJS 3D. Comments mark each line that's more than a rename.

```ts
import { CubeGeometry, DirectionalLight, Material3D, Mesh3D, PlaneGeometry, View3D } from '@pixi/3d';
import { OrbitCamera } from '@pixi/3d/extras';
import { Application } from 'pixi.js';

const app = new Application();
await app.init({
  resizeTo: window,
  antialias: true,
  resolution: Math.min(window.devicePixelRatio, 2),
  autoDensity: true,
});
document.body.appendChild(app.canvas);

const view3d = new View3D({
  autoResize: true, // follows the app's size, so you need no resize listener
  background: 0x9cc7ea,
  environment: { skyColor: 0xdfeeff, groundColor: 0x5a5040, intensity: 1.5 / Math.PI }, // divide by π
});
app.stage.addChild(view3d);

view3d.camera.fov = 50; // the default is 60
view3d.camera.far = 100;
view3d.camera.position.set(4, 3, 8); // before the controller, which keeps this offset
const orbit = new OrbitCamera({ view: view3d, autoUpdate: false });

const sun = new DirectionalLight({ color: 0xfff4e0, intensity: 2.5, castShadow: true, position: { x: 4, y: 8, z: 5 } });
view3d.root.addChild(sun);
sun.lookAt({ x: 0, y: 0, z: 0 }); // lights have no target, so aim it

const ground = new Mesh3D({
  geometry: new PlaneGeometry({ width: 20, height: 20 }),
  material: new Material3D({ baseColor: 0x7a9a5a }),
  rotation: { x: -Math.PI / 2, y: 0, z: 0 }, // lies in XY like Three.js's, so lay it flat
  castShadow: false, // meshes cast shadows by default
});
view3d.root.addChild(ground);

const box = new Mesh3D({
  geometry: new CubeGeometry({ width: 1, height: 1, depth: 1 }),
  material: new Material3D({ baseColor: 0xd9534f }),
  position: { x: 0, y: 0.5, z: 0 },
});
view3d.root.addChild(box);

app.ticker.add((ticker) => {
  box.rotation.y += ticker.deltaMS / 1000; // deltaTime counts frames
  orbit.update(ticker); // stepped here, like controls.update()
});
```

## Next steps

- [Quick start](getting-started-2.html.md): the same pieces built up one step at a time.
- [Environment and IBL](environment.html.md): tone mapping, exposure, fog and cube maps.
- [Shadows](scene-5.html.md): the shadow box, cascades and fixing artefacts.
- [Materials](materials.html.md): choosing between the physically based, Phong, flat and toon materials.
