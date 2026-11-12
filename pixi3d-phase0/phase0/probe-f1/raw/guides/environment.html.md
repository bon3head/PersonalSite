# Environment and IBL

A [DirectionalLight](scene.DirectionalLight.html.md) lights a scene from one direction. Real places also get light from everywhere else, such as the sky, the ground and the walls of a room. The view's [environment](scene.View3D.html#environment) adds that light from all around, and it's what shiny surfaces reflect. That light casts no shadows, not even from a sun in a photo of the sky, so add a [DirectionalLight](scene.DirectionalLight.html.md) with [castShadow](scene.Light.html#castshadow) for those.

[Material3D](materials.Material3D.html.md), the material most glTF models load with, takes both its light and its reflections from the environment. [PhongMaterial](materials.PhongMaterial.html.md) takes its light from it but doesn't reflect it, and [FlatMaterial](materials.FlatMaterial.html.md) ignores it. A view has no environment by default, so a metal looks dark apart from its highlights. An [AmbientLight](scene.AmbientLight.html.md) doesn't brighten it either, as [Lights](scene-4.html.md) explains.

[Environment light](/3d/examples?example=lighting_environment) lights a metal PixiJS logo from nothing but its environment, and switches that environment between a cube map, a sky and ground gradient, and a single colour.

## A sky and ground gradient

A [Hemisphere](environment.Hemisphere.html.md) is the simplest environment. It holds a sky colour and a ground colour. A surface facing up takes the sky colour, one facing down takes the ground colour, and the sides blend the two. It needs no image and costs less to draw than a cube map, as the [checklist for phones](core-concepts-5.html.md) notes.

The view reads the object every frame, so keep a reference to it and change its colours or [intensity](environment.Hemisphere.html#intensity) at any time, for example to fade from day to dusk:

```ts
import type { Hemisphere } from '@pixi/3d';

const sky: Hemisphere = { skyColor: 0x8ec5ff, groundColor: 0x8a6a4a };

view3d.environment = sky;

// Later, at dusk
sky.skyColor = 0xff8f6b;
sky.groundColor = 0x3a2a55;
sky.intensity = 0.8;
```

## A cube map

A cube map is six square images of the surroundings, one for each side of a cube around the scene. Lighting a scene from one is called image-based lighting, or IBL. Surfaces pick up the colours around them. Shiny ones also reflect a picture of the place, sharp on a smooth surface and blurred on a rough one. `@pixi/3d` adds a [loader](assets.loadCubemap.html.md) to `Assets` for `.cubemap` files, which list the six images:

```ts
import { Assets } from 'pixi.js';
import type { CubeTexture } from 'pixi.js';

const sunset = await Assets.load<CubeTexture>('https://pixijs.com/assets/3d/venice-sunset/venice-sunset.cubemap');

view3d.environment = sunset;
```

[Environment light](/3d/examples?example=lighting_environment) lights a metal PixiJS logo with this cube map. The logo sits between a chrome ball that shows the cube map's reflections and a matte ball that shows its soft light.

On the first frame that lights a scene with a cube map, PixiJS 3D makes a copy of it for lighting and reflections to read. The copy is at most 256 pixels wide per face, so faces wider than 256 pixels sharpen the background but not the reflections. Making the copy takes GPU time once for each cube map, as [How a frame renders](core-concepts-4.html.md) notes. On WebGL2 the copy needs the `EXT_color_buffer_float` extension, and rendering throws on a device without it. [WebGL and WebGPU](core-concepts-3.html.md) covers such devices.

## Loading cube maps

A `.cubemap` file is JSON that names an image for each face, with paths relative to the file:

```json
{
  "right": "px.jpg",
  "left": "nx.jpg",
  "top": "py.jpg",
  "bottom": "ny.jpg",
  "front": "pz.jpg",
  "back": "nz.jpg"
}
```

`right`, `top` and `front` are the +X, +Y and +Z sides. A camera looking down -Z, as the default camera does, sees `back` straight ahead.

A JPG sky stops at white, so its sun is no brighter than a white cloud. A Radiance `.hdr` panorama keeps light brighter than white, and sites such as Poly Haven publish their skies in that format. A JPG panorama loads as a flat texture, which `environment` doesn't take, but `Assets.load` turns an `.hdr` panorama into a cube map:

```ts
const sky = await Assets.load<CubeTexture>('venice_sunset_1k.hdr');

view3d.environment = sky;
view3d.background = sky;
```

The conversion runs on the main thread while the file loads, so the page freezes for a moment. [loadHdr](assets.loadHdr.html.md) gives timings.

[HDR environment](/3d/examples?example=lighting_hdr-environment) splits the screen between the Venice sunset as an `.hdr` and the same sunset as a `.cubemap` of six JPGs, with a metal logo in each half. Both halves start two stops darker, at a quarter of the light. The `.hdr` sun still shows as a bright glint in the metal, and the JPG sun has turned grey.

Destroying a view, or switching it to another environment, doesn't free a cube map or its copy. To free a cube map you loaded, call `Assets.unload` with its URL once no view uses it, such as after you destroy the view. If it was a background you replaced, wait until the view has drawn a frame with another background that isn't `null`. Unloading frees the cube map, its images and the copy:

```ts
await Assets.unload('https://pixijs.com/assets/3d/venice-sunset/venice-sunset.cubemap');
```

## The background

[background](scene.View3D.html#background) draws behind the scene. It takes a cube map, a sky and ground gradient, or a plain colour. With none, the default, the 2D content behind the view shows through, as [View3D](core-concepts-1.html.md) describes.

Give it the same object as the environment, and the sky you see matches the light on the scene. The two can also differ. This view lights its model with the sunset but draws a dark gradient behind it, so the model stands out:

```ts
const view3d = new View3D({
  autoResize: true,
  environment: sunset,
  background: { skyColor: 0x2b2738, groundColor: 0x0d0c12 },
});
```

The background is infinitely far away, so moving the camera never changes it, but turning the camera shows another part of it. With an [orthographic camera](scene-2.html.md), one where nothing shrinks with distance, leave it `null` and give the app a background colour instead.

## Tone mapping and exposure

Lighting can make a colour brighter than the screen's white. [toneMapping](scene.View3D.html#tonemapping) decides how the view turns the scene's light into screen colours. Under the default, `'none'`, anything brighter than white clips. At an exposure of 1, a colour you give a [FlatMaterial](materials.FlatMaterial.html.md), a [Sprite3D](scene.Sprite3D.html.md) or a plain background then draws exactly as it would in 2D. A filmic curve such as `'aces'` instead eases bright light toward white. It changes other colours too, unlit ones included, so a white background draws light grey. [ToneMapping](environment.ToneMapping.html.md) lists the curves.

Use a curve for a scene lit by a bright sky or strong lights, and keep `'none'` where the 3D should match your 2D art. Changing it later can stall a frame while new shaders compile, as [How a frame renders](core-concepts-4.html.md) explains, so set it when you create the view.

[exposure](scene.View3D.html#exposure) multiplies the scene's light, background and fog included, before the tone mapping curve. It's free to change every frame. Photographers count exposure in stops, where each stop doubles the light:

```ts
view3d.exposure = 2 ** stops; // -1 halves the light, +1 doubles it
```

## Fog

[fog](scene.View3D.html#fog) fades surfaces toward a colour the farther they are in front of the camera, which hides where the scene ends. Fog doesn't apply to the background, so give the background the same colour. Surfaces in full fog then match it with no visible edge, whatever the tone mapping and exposure. Fog distances count from the camera, so set them from how far the camera is from what it frames:

```ts
const view3d = new View3D({
  autoResize: true,
  background: 0x14131c,
  fog: { type: 'linear', color: 0x14131c, near: distance, far: distance + 12 },
});
```

The app's own `background` colour matches the fog only under the default tone mapping at an exposure of 1.

Fog also fades the model once it's farther than `near` in front of the camera. To keep it off the model with an [OrbitCamera](extras_camera.OrbitCamera.html.md) that zooms out, set `near` beyond its [maxDistance](extras_camera.OrbitCamera.html#maxdistance) plus the model's radius. A floor's edge stays visible unless it's beyond `far` wherever the camera goes. The farther away the fade starts, the thinner the strip it fills at the horizon. A floor much brighter or darker than the fog then ends in a hard band, so give the fog a colour close to the floor's lit colour.

[type](environment.Fog.html#type) picks a [FogType](environment.FogType.html.md). `'linear'`, the default, runs from no fog at `near` to full fog at `far`. `'exponential'` and `'exp2'` thicken at a rate set by [density](environment.Fog.html#density) instead. Density is 0 by default, so set it, or these curves show no fog.

The view keeps the object you assign, so changing its colour or distances later is free. Its `type` is read-only, so assign a new object to switch curves, or `null` to turn fog off. Turning fog on or off, or switching its curve, can stall a frame while shaders compile, just as a tone mapping change can. A material created with [fog](materials.BaseMaterial3DOptions.html#fog) set to `false` ignores the fog.

## Next steps

- [Lights](scene-4.html.md): the direct lights that work alongside an environment.
- [PBR materials](materials-1.html.md): how metalness and roughness decide what a surface reflects.
- [Post-processing](extras_post-processing.html.md): effects such as bloom, which work on the scene's light before tone mapping.
