# Class: View3D\<TRoot\>

A 3D scene drawn inside pixi's 2D display list

A `View3D` is a pixi display object: add it to the stage, then move, mask or filter it like a
sprite. Everything 3D goes under its [root](#root).

The view holds the [camera](#camera) and the settings for the whole scene: tone
mapping, exposure, fog, environment light, background and shadows. A change to some of them
recompiles the materials, so don't change those every frame; each one's doc says which.

The view also sends pointer events into the scene. Set [eventMode](events.IFederatedContainer3D.html#eventmode)
on a node and it gets pixi's pointer events, hit-tested against its
[hitVolume](events.IFederatedContainer3D.html#hitvolume). [raycast](events.IView3DEvents.html#raycast) picks without
sending an event. The view itself starts with `eventMode` `'static'`, so it catches the pointer
anywhere in its rectangle.

## Example

```ts
import { Application } from 'pixi.js';
import { View3D, DirectionalLight } from '@pixi/3d';

const app = new Application();
await app.init({ resizeTo: window });

// Fills the screen and follows it when the canvas resizes.
const view = new View3D({ autoResize: true, shadowQuality: 'high', toneMapping: 'aces' });
app.stage.addChild(view);

view.camera.position.set(0, 2.5, 7);

const light = new DirectionalLight({ intensity: 3, castShadow: true });
view.root.addChild(light);
view.root.addChild(mesh);

// A fixed-size inset.
const inset = new View3D({ width: 320, height: 240 });
```

## See

[View3DOptions](scene.View3DOptions.html.md) For all constructor options.

## Extends

- `View3D`.[`ViewContainer`](https://pixijs.download/release/docs/index.html)\<`View3DGlobalData`\>

## Type Parameters

### TRoot

`TRoot` *extends* [`Container3D`](scene.Container3D.html.md) = [`Container3D`](scene.Container3D.html.md)

Type of [View3D#root](#root), inferred from the `root` you pass.

## Constructors

### Constructor

> **new View3D**\<`TRoot`\>(`options?`): `View3D`\<`TRoot`\>

#### Parameters

##### options?

[`View3DOptions`](scene.View3DOptions.html.md)\<`TRoot`\> = `{}`

See [View3DOptions](scene.View3DOptions.html.md).

#### Returns

`View3D`\<`TRoot`\>

#### Inherited from

`PixiMixins.View3D.constructor`

## Properties

### autoResize

> **autoResize**: `boolean`

Whether the view matches the renderer's screen size on every render

Setting [width](#width), [height](#height) or
[setSize](#setsize) turns it off. The view reads the screen size at the start of
each render, so until its first render it reports the `width` and `height` it was built with.

#### Example

```ts
const view = new View3D({ autoResize: true });

view.setSize(320, 240); // autoResize is now false
view.autoResize = true; // follows the screen again from the next render
```

#### Default

```ts
false
```

***

### events

> `readonly` **events**: [`EventBoundary3D`](events.EventBoundary3D.html.md)

Sends the pointer events pixi delivers to the view on to the 3D nodes under the pointer; the
3D counterpart of pixi's `EventBoundary`

It listens on the view itself, so `view.removeAllListeners()`, or `view.off(type)` without a
handler, stops 3D events for good; pass your handler to `off`.

#### Example

```ts
const view = new View3D({ width: 800, height: 600 });

view.events.enableGlobalMoveEvents = false;
```

#### See

[View3D#raycast](events.IView3DEvents.html#raycast) For a one-off ray cast that dispatches nothing.

***

### exposure

> **exposure**: `number` = `1.0`

Brightness multiplier for the whole scene, background and fog included, applied before tone
mapping

It scales unlit materials too, in linear light, so at 2 an unlit colour draws about 1.37 times
as bright on screen. Free to change every frame.

#### Example

```ts
view.exposure = 1.5;
```

#### Default

```ts
1.0
```

***

### lights

> **lights**: [`Light`](scene.Light.html.md)[] = `[]`

Every [Light](scene.Light.html.md) in the scene, in the order they joined it

The view keeps the list in step with the scene, so read it but don't change it: add a light by
putting it under [root](#root).

#### Example

```ts
for (const light of view.lights) light.intensity *= 0.5;
```

***

### resolution

> **resolution**: `number` \| `"inherit"`

Texels per logical pixel the scene is drawn at, or `'inherit'` to take the resolution of the
2D target the view lands on

Absolute, like a pixi filter's `resolution`: `1` on a DPR 2 screen draws the scene at half the
physical size and stretches it over the view. Lower it for dynamic resolution when a device
falls behind. Post effects' textures follow it unless an effect sets its own, and
`Camera3D.jitter` comes out in the scene's pixels.

A resolution other than the target's turns on [composite mode](scene.View3DOptions.html#composite).
Turning composite mode on or off rebuilds the render graph on the next render, like assigning
[View3D#passes](#passes), so a dynamic-resolution loop that returns to the target's resolution
rebuilds at every crossing; `composite: true`, or an enabled post effect, keeps that to once at
most. Any other change rebuilds nothing, and allocates new textures only when the size crosses
a power of two or the canvas size.

#### Default

```ts
'inherit'
```

#### Example

```ts
// Draw the scene at two thirds of the screen's width and height
view.resolution = app.renderer.resolution * 0.67;
```

***

### root

> **root**: `TRoot`

Root of the 3D scene

Add meshes and lights under it, at any depth, and the view finds them. Pass it in the options
rather than assigning it later: the view only tracks the root it was built with.

Typed as whatever you passed as `root`, so a view built around a [Model3D](scene.Model3D.html.md) keeps the
model's API here.

#### Example

```ts
view.root.addChild(mesh);
view.root.addChild(light);

const modelView = new View3D({ root: new Model3D(source) });
modelView.root.player?.play('Wave');
```

***

### shadowQuality

> **shadowQuality**: [`ShadowQuality`](rendering.ShadowQuality.html.md)

Size of each shadow map; see [ShadowQuality](rendering.ShadowQuality.html.md)

#### Default

```ts
'medium'
```

#### Example

```ts
view.shadowQuality = isMobile ? 'low' : 'high';
```

***

### defaultOptions

> `static` **defaultOptions**: [`View3DOptions`](scene.View3DOptions.html.md)

Defaults for every new `View3D`; an option passed as `undefined` keeps its default

Don't set `root` or `camera` here: every view would share the one object.

#### Example

```ts
View3D.defaultOptions.shadowQuality = 'high';
View3D.defaultOptions.toneMapping = 'reinhard';

const view = new View3D();
```

## Accessors

### anchor

#### Get Signature

> **get** **anchor**(): [`ObservablePoint`](https://pixijs.download/release/docs/index.html)

Where the view's origin sits, as a fraction of its size, like a sprite's anchor

`0` puts the origin at the top-left corner, `0.5` centers it, and `1` puts it at the
bottom-right. Assign a number for both axes or a point for each.

##### Example

```ts
view.anchor = 0.5; // centered
view.anchor = { x: 0, y: 1 }; // bottom-left
```

##### Returns

[`ObservablePoint`](https://pixijs.download/release/docs/index.html)

#### Set Signature

> **set** **anchor**(`value`): `void`

Sets the anchor

##### Parameters

###### value

`number` \| [`PointData`](https://pixijs.download/release/docs/index.html)

A number for both axes, or a point.

##### Returns

`void`

***

### background

#### Get Signature

> **get** **background**(): `number` \| [`CubeTexture`](https://pixijs.download/release/docs/index.html) \| [`Hemisphere`](environment.Hemisphere.html.md) \| `null`

Drawn behind the scene: a cube map, a [Hemisphere](environment.Hemisphere.html.md) gradient, a plain colour, or `null`
for none

Exposure and tone mapping apply to it. Set it to the same object as the
[environment](#environment) and the sky you see matches the light and reflections
the scene receives. A hemisphere's fields are read every frame, so changing them is free. A view
with no meshes draws nothing, background included, until a mesh joins its scene.

A colour takes any `ColorSource` in display (sRGB) space and reads back as a hex number; its
alpha is ignored. Exposure and the tone curve shift it on screen: under `'aces'`, white draws
as light grey. To fade distant geometry into it, give the fog the same
[color](environment.Fog.html#color). For a flat backdrop with no fog that shows the exact colour, leave
`background` null and set the app's `backgroundColor`, which is never tone-mapped.

##### Example

```ts
const env = await Assets.load<CubeTexture>('env.cubemap');
view.environment = env;
view.background = env; // show the same cube map behind the scene

// One hemisphere lights the scene and draws the sky behind it
const sky: Hemisphere = { skyColor: 0x88ccff, groundColor: 0x553311 };
view.environment = sky;
view.background = sky;
sky.skyColor = 0xff8800; // sunset, on the next frame

// Distant geometry fades into a plain background
view.background = 'skyblue';
view.fog = { type: 'linear', color: 'skyblue', near: 20, far: 60 };
view.background; // 0x87ceeb
```

##### Returns

`number` \| [`CubeTexture`](https://pixijs.download/release/docs/index.html) \| [`Hemisphere`](environment.Hemisphere.html.md) \| `null`

#### Set Signature

> **set** **background**(`value`): `void`

Sets the background

##### Parameters

###### value

[`ColorSource`](https://pixijs.download/release/docs/index.html) \| [`CubeTexture`](https://pixijs.download/release/docs/index.html) \| [`Hemisphere`](environment.Hemisphere.html.md) \| `null`

Cube map, hemisphere gradient, display-space colour, or `null` for none.

##### Returns

`void`

***

### camera

#### Get Signature

> **get** **camera**(): [`Camera3D`](scene.Camera3D.html.md)

The camera this view draws from

Assigning a camera with no parent adds it to [root](#root). Assigning one that has
a parent outside this view's scene throws: add it, or its ancestor, under `view.root` first.
A render with meshes to draw throws while the camera or any of its parents is hidden, or once
it leaves the scene without a new camera assigned.

##### Example

```ts
view.camera.fov = 45;
view.camera.position.set(0, 2.5, 7);

const closeUp = new Camera3D({ fov: 30 });
view.camera = closeUp;
```

##### Returns

[`Camera3D`](scene.Camera3D.html.md)

#### Set Signature

> **set** **camera**(`value`): `void`

Sets the camera

##### Parameters

###### value

[`Camera3D`](scene.Camera3D.html.md)

Camera to draw from.

##### Returns

`void`

***

### cull

#### Get Signature

> **get** **cull**(): [`CullMode`](scene.CullMode.html.md)

How this view culls its meshes outside the camera's view; see [CullMode](scene.CullMode.html.md)

A change rebuilds nothing. A [BatchedMesh3D](scene.BatchedMesh3D.html.md) ignores it and culls by its own
[cull](scene.BatchedMesh3D.html#cull).

##### Default

```ts
'gpu'
```

##### Example

```ts
view.cull = gpuBound ? 'cpu' : 'gpu';
```

##### Returns

[`CullMode`](scene.CullMode.html.md)

#### Set Signature

> **set** **cull**(`value`): `void`

Sets how this view culls its meshes

##### Parameters

###### value

[`CullMode`](scene.CullMode.html.md)

The culling mode.

##### Returns

`void`

***

### environment

#### Get Signature

> **get** **environment**(): [`CubeTexture`](https://pixijs.download/release/docs/index.html) \| [`Hemisphere`](environment.Hemisphere.html.md) \| `null`

Light from the surroundings, which fills in where the direct lights don't reach

- A `CubeTexture`: image-based lighting from a cube map, reflections included. The first frame
  that uses a cube map prefilters it, once, into a copy 128 to 256 pixels wide per face that
  lighting and reflections read, so faces wider than 256 sharpen the background but not
  reflections. The copy stays on the GPU until the cube map is destroyed with `destroy(true)` or
  `Assets.unload`, even after the view switches away. A float cube, such as one [loadHdr](assets.loadHdr.html.md)
  makes from an `.hdr` file, is read as linear light, so an HDR environment keeps highlights
  brighter than white; any other format is read as sRGB. On WebGL the prefilter needs
  `EXT_color_buffer_float`, and throws without it.
- A [Hemisphere](environment.Hemisphere.html.md): a cheap gradient from sky to ground, with no textures. A good default
  on mobile.
- `null`: none, and the cheapest.

Switching between kinds recompiles the materials on the next frame, like changing
[toneMapping](#tonemapping). Changing a hemisphere's colours is free.

##### Example

```ts
view.environment = { skyColor: 0x88ccff, groundColor: 0x553311 };

view.environment = await Assets.load<CubeTexture>('studio.cubemap');

// An HDR panorama keeps the sun brighter than white
view.environment = await Assets.load<CubeTexture>('sunset.hdr');
```

##### Returns

[`CubeTexture`](https://pixijs.download/release/docs/index.html) \| [`Hemisphere`](environment.Hemisphere.html.md) \| `null`

#### Set Signature

> **set** **environment**(`value`): `void`

Sets the environment

##### Parameters

###### value

[`CubeTexture`](https://pixijs.download/release/docs/index.html) \| [`Hemisphere`](environment.Hemisphere.html.md) \| `null`

Cube map, hemisphere gradient, or `null` for none.

##### Returns

`void`

***

### fog

#### Get Signature

> **get** **fog**(): [`Fog`](environment.Fog.html.md) \| `null`

Distance fog, or `null` for none

The view keeps the object you assign, so changing its `color`, `near`, `far` or `density`
later is free. A new curve, or turning fog on or off, recompiles the materials on the next
frame, like changing [toneMapping](#tonemapping).

##### Example

```ts
const haze: Fog = { type: 'linear', color: 0xadb2ba, near: 30, far: 55 };

view.fog = haze;
haze.far = 80;
view.fog = null;
```

##### See

[Fog](environment.Fog.html.md) For the settings and their defaults.

##### Returns

[`Fog`](environment.Fog.html.md) \| `null`

#### Set Signature

> **set** **fog**(`value`): `void`

Sets the fog

##### Parameters

###### value

[`Fog`](environment.Fog.html.md) \| `null`

Fog settings, or `null` for none.

##### Returns

`void`

***

### height

#### Get Signature

> **get** **height**(): `number`

Height of the 3D viewport in pixels; setting it resizes the viewport, as
[width](#width) does

##### Example

```ts
view.height = 240;
```

##### See

[View3D#setSize](#setsize) For setting width and height in one update.

##### Returns

`number`

#### Set Signature

> **set** **height**(`value`): `void`

Sets the height

##### Parameters

###### value

`number`

Height in pixels.

##### Returns

`void`

***

### onRender

#### Get Signature

> **get** **onRender**(): ((`renderer`) => `void`) \| `null`

Callback pixi runs at the start of every render of the stage this view is on, or `null`

It runs before the view updates its scene, so changes made in it show in the same frame.

##### Example

```ts
view.onRender = () => {
  spinner.rotation.y += 0.01;
};
```

##### Returns

((`renderer`) => `void`) \| `null`

#### Set Signature

> **set** **onRender**(`func`): `void`

Sets the per-render callback

##### Parameters

###### func

((`renderer`) => `void`) \| `null`

Callback run at the start of every render; `null` removes it.

##### Returns

`void`

***

### passes

#### Get Signature

> **get** **passes**(): readonly [`Pass3D`](rendering.Pass3D.html.md)[]

Passes and post effects added to this view

One list holds both kinds: a [MeshPass](rendering.MeshPass.html.md) redraws the meshes that opt in at its stage, a
[PostEffect](filters.PostEffect.html.md) filters the scene's light or the finished picture, and any other
[Pass3D](rendering.Pass3D.html.md) runs where it says. Items at the same stage run in array order, and the post
effects run `'beforeToneMapping'` ones first, then the tone curve, then `'afterToneMapping'`
ones.

Assigning a new array rebuilds the render graph on the next render; changing the array in
place does nothing. Flipping an item's `enabled` also rebuilds the graph, which suits a
settings toggle; for changes every frame, use each item's own properties. Turning a scene
output on or off recompiles the materials on the next frame, and so does turning on the first
`'beforeToneMapping'` effect or turning off the last.

The items stay yours: replacing the list never destroys them, and one instance can serve
several views.

##### Example

```ts
view.passes = [new OutlinePass({ width: 0.05 }), new SsaoEffect()];
view.passes[1].enabled = false;
view.passes = [];
```

##### Returns

readonly [`Pass3D`](rendering.Pass3D.html.md)[]

#### Set Signature

> **set** **passes**(`value`): `void`

Sets the pass list; `null` clears it

##### Parameters

###### value

readonly [`Pass3D`](rendering.Pass3D.html.md)[] \| `null`

Passes and post effects to run; the array is copied.

##### Returns

`void`

***

### shadowFilter

#### Get Signature

> **get** **shadowFilter**(): [`ShadowFilter`](rendering.ShadowFilter.html.md)

How soft the edges of this view's shadows are; see [ShadowFilter](rendering.ShadowFilter.html.md)

Once a light in the view casts shadows, a change recompiles the materials on the next frame;
before that it compiles nothing.

##### Default

```ts
'pcf'
```

##### Example

```ts
view.shadowFilter = isMobile ? 'hard' : 'pcf-high';
```

##### Returns

[`ShadowFilter`](rendering.ShadowFilter.html.md)

#### Set Signature

> **set** **shadowFilter**(`value`): `void`

Sets the shadow filter

##### Parameters

###### value

[`ShadowFilter`](rendering.ShadowFilter.html.md)

Edge filtering for the shadows this view draws.

##### Returns

`void`

***

### toneMapping

#### Get Signature

> **get** **toneMapping**(): [`ToneMapping`](environment.ToneMapping.html.md)

Tone mapping for everything the view draws; see [ToneMapping](environment.ToneMapping.html.md)

With no enabled `'beforeToneMapping'` effect in [passes](#passes), the curve is
built into the material shaders, and a change recompiles them on the next frame. With one, the
scene draws as linear light, so the effects see brightness above 1, and the curve runs once
over the whole image after the last of them; a change rebuilds the render graph. Either way, don't change it every
frame.

The two look the same apart from see-through surfaces: with an effect, transparent surfaces
blend, and glass refracts, in linear light before the curve.

##### Example

```ts
view.toneMapping = 'reinhard';
```

##### Returns

[`ToneMapping`](environment.ToneMapping.html.md)

#### Set Signature

> **set** **toneMapping**(`value`): `void`

Sets the tone mapping

##### Parameters

###### value

[`ToneMapping`](environment.ToneMapping.html.md)

The curve for everything the view draws.

##### Returns

`void`

***

### width

#### Get Signature

> **get** **width**(): `number`

Width of the 3D viewport in pixels

Unlike a plain pixi.js `Container`, setting it resizes the viewport instead of scaling
the view, the same as `TilingSprite.width`.

##### Example

```ts
view.width = 320;
```

##### See

[View3D#setSize](#setsize) For setting width and height in one update.

##### Returns

`number`

#### Set Signature

> **set** **width**(`value`): `void`

Sets the width

##### Parameters

###### value

`number`

Width in pixels.

##### Returns

`void`

## Methods

### destroy()

> **destroy**(`options?`): `void`

Destroys this view and the GPU resources it owns

The view's own GPU state always goes, whatever `options` says. With the `children` flag,
[root](#root) is destroyed too, with the same `options`, so the `geometry`,
`material` and `texture` flags apply to it. Without the flag, the scene's nodes survive for you
to reuse, but they're removed from `root`, which is left empty.

#### Parameters

##### options?

[`Destroy3DOptions`](scene.Destroy3DOptions.html.md)

Teardown options; see [Destroy3DOptions](scene.Destroy3DOptions.html.md). A boolean stands in for every
  flag. Leaving it out destroys nothing shared.

#### Returns

`void`

#### Example

```ts
view.destroy({ children: true });
```

***

### getSize()

> **getSize**(`out?`): [`Size`](https://pixijs.download/release/docs/index.html)

Returns the viewport size in pixels

#### Parameters

##### out?

[`Size`](https://pixijs.download/release/docs/index.html)

Object to write into instead of allocating a new one.

#### Returns

[`Size`](https://pixijs.download/release/docs/index.html)

The `out` object, or a new one.

#### Example

```ts
const { width, height } = view.getSize();
```

***

### raycast()

> **raycast**(`position`, `out?`): [`RaycastHit3D`](events.RaycastHit3D.html.md) \| `null`

Casts a ray through a 2D point and returns the closest hit

`position` is in the space of `event.global`, as for [View3D#screenToRay](#screentoray). Use it to pick
outside pointer events: placing decals, line of sight, drag-and-drop targets.

#### Parameters

##### position

[`PointData`](https://pixijs.download/release/docs/index.html)

2D global point to cast through (e.g. `event.global`).

##### out?

[`RaycastHit3D`](events.RaycastHit3D.html.md)

Hit to write into, returned on a hit and untouched on a miss.
Defaults to a new one for each hit.

#### Returns

[`RaycastHit3D`](events.RaycastHit3D.html.md) \| `null`

The closest hit, or `null` on a miss or when the point falls outside the View's 2D rect.

#### Remarks

- Only nodes that take part in picking can be hit: interactive nodes and, under them, nodes
  with a shape (see [IFederatedContainer3D#eventMode](events.IFederatedContainer3D.html#eventmode)). In a scene where nothing is
  interactive it always returns `null`.
- Without `out` it allocates a new [RaycastHit3D](events.RaycastHit3D.html.md) for each hit. Pass a hit from
  [createRaycastHit3D](events.createRaycastHit3D.html.md) as `out` to pick every frame without garbage.
- It uses the transforms and visibility from the last render, so a node or camera moved, shown
  or hidden since then is picked as it was drawn.
- Hidden nodes, and nodes under a hidden ancestor, neither hit nor block what is behind them.
- A [hitVolume](scene.Container3D.html#hitvolume) you set on an ancestor clips its descendants'
  hits, as it does for pointer events.

#### Example

```ts
// Drop a decal wherever the user taps.
view3d.on('pointertap', (e) => {
  const hit = view3d.raycast(e.global);
  if (hit) decal.position.copyFrom(hit.point); // world-space hit point
});

// Follow the pointer every frame, reusing one hit.
const hover = createRaycastHit3D();
app.ticker.add(() => {
  if (view3d.raycast(pointer, hover)) cursor3d.position.copyFrom(hover.point);
});
```

#### See

[View3D#screenToRay](#screentoray) For the ray on its own, without a scene pick.

#### Inherited from

`PixiMixins.View3D.raycast`

***

### screenToRay()

> **screenToRay**(`position`, `out?`, `skipUpdate?`): [`Ray`](maths.Ray.html.md)

Builds the world-space [Ray](maths.Ray.html.md) through a point in pixi's global 2D coordinates, such as
`event.global`

The inverse of [worldToScreen](#worldtoscreen): every point on the ray projects
back to `position`. A perspective camera's ray starts at the camera; an orthographic camera's
starts on the camera's plane and runs along its forward axis. Either way, `ray.at(t)` is `t`
world units from the camera, which for a perspective camera is distance along a slanted ray,
not depth.

When the view or the camera's viewport has zero area, it warns once and returns a ray with a
zero origin and direction.

#### Parameters

##### position

[`PointData`](https://pixijs.download/release/docs/index.html)

2D global point to cast through, such as `event.global`.

##### out?

[`Ray`](maths.Ray.html.md) = `...`

Ray the result is written into. Defaults to a new `Ray`.

##### skipUpdate?

`boolean` = `false`

`true` to use cached transforms (see [Container3D#getGlobalTransform](scene.Container3D.html#getglobaltransform)).

#### Returns

[`Ray`](maths.Ray.html.md)

#### Example

```ts
view3d.on('pointermove', (e) => {
  const ray = view3d.screenToRay(e.global);
  const hit = ray.intersectPlane(ground, cursorPos);
});
```

#### See

[View3D#screenToWorld](#screentoworld) For going straight to a point on a plane or at a distance.

***

### screenToWorld()

Implementation of the overloads above

#### Param

**position**

2D global point to convert.

#### Param

**target**

Distance along the ray, or the world-space plane to intersect.

#### Param

**out**

Point the result is written into. Defaults to a new [Vector3](maths.Vector3.html.md).

#### Param

**skipUpdate**

`true` to use cached transforms.

#### Example

```ts
const spot = view3d.screenToWorld(e.global, ground) ?? view3d.screenToWorld(e.global, 20);
```

#### Call Signature

> **screenToWorld**(`position`, `distance`, `out?`, `skipUpdate?`): [`Vector3`](maths.Vector3.html.md)

Converts a point in pixi's global 2D coordinates, such as `event.global`, to the world-space
point `distance` units along its [ray](#screentoray)

##### Parameters

###### position

[`PointData`](https://pixijs.download/release/docs/index.html)

2D global point to convert.

###### distance

`number`

Distance along the ray, in world units from the camera.

###### out?

[`Vector3`](maths.Vector3.html.md)

Point the result is written into. Defaults to a new [Vector3](maths.Vector3.html.md).

###### skipUpdate?

`boolean`

`true` to use cached transforms (see [Container3D#getGlobalTransform](scene.Container3D.html#getglobaltransform)).

##### Returns

[`Vector3`](maths.Vector3.html.md)

##### Example

```ts
marker.position.copyFrom(view3d.screenToWorld(e.global, 10));
```

##### See

[View3D#worldToScreen](#worldtoscreen) For the reverse direction.

#### Call Signature

> **screenToWorld**(`position`, `plane`, `out?`, `skipUpdate?`): [`Vector3`](maths.Vector3.html.md) \| `null`

Converts a point in pixi's global 2D coordinates, such as `event.global`, to where its
[ray](#screentoray) meets a plane: the usual way to find the spot on the ground
under the pointer

Returns `null` when the ray points away from the plane or runs parallel to it.

##### Parameters

###### position

[`PointData`](https://pixijs.download/release/docs/index.html)

2D global point to convert.

###### plane

[`Plane`](maths.Plane.html.md)

World-space plane to intersect.

###### out?

[`Vector3`](maths.Vector3.html.md)

Point the result is written into. Defaults to a new [Vector3](maths.Vector3.html.md).

###### skipUpdate?

`boolean`

`true` to use cached transforms (see [Container3D#getGlobalTransform](scene.Container3D.html#getglobaltransform)).

##### Returns

[`Vector3`](maths.Vector3.html.md) \| `null`

##### Example

```ts
const ground = new Plane(new Vector3(0, 1, 0), 0);

view3d.on('pointertap', (e) => {
  const hit = view3d.screenToWorld(e.global, ground);
  if (hit) tree.position.copyFrom(hit);
});
```

##### See

[View3D#worldToScreen](#worldtoscreen) For the reverse direction.

***

### setSize()

> **setSize**(`value`, `height?`): `void`

Resizes the 3D viewport in one update and turns [autoResize](#autoresize) off

#### Parameters

##### value

`number` \| [`Optional`](https://pixijs.download/release/docs/index.html)\<[`Size`](https://pixijs.download/release/docs/index.html), `"height"`\>

Width in pixels, or an object with `width` and optional `height`.

##### height?

`number`

Height in pixels; defaults to the width.

#### Returns

`void`

#### Example

```ts
view.setSize(512); // 512 × 512
view.setSize({ width: 800, height: 600 });
```

***

### unload()

> **unload**(): `void`

Frees this view's GPU memory now, for a scene you'll show again later

The next render that draws the view rebuilds everything, so nothing needs re-creating by
hand. It frees the view's draw state, shadow map, uniforms and buffers, and keeps CPU data:
the scene and every typed array, the way a 2D texture keeps its source image across `unload`.
The scene's geometry and textures stay on the GPU; [Container3D#unload](scene.Container3D.html#unload) says how to free them.

pixi's garbage collector calls it for a view that has been out of the stage for
`gcMaxUnusedTime`. It never collects a view still in a stage, even a hidden one, nor one that
is a render group or left the stage inside one (`isRenderGroup`, `cacheAsTexture`, or rendered
directly, as `extract` does); set `autoGarbageCollect` to `false` to keep any view.

#### Returns

`void`

#### Example

```ts
view.visible = false; // hiding alone never frees anything
view.unload();
```

#### See

[View3D#destroy](#destroy) For permanent teardown.

***

### worldToScreen()

> **worldToScreen**\<`P`\>(`position`, `out?`, `skipUpdate?`): `P` \| `null`

Projects a world-space point, such as one from [Container3D#getGlobalPosition](scene.Container3D.html#getglobalposition), to pixi's
global 2D coordinates

The result is in the same space as `event.global`, so you can assign it straight to a 2D
object's position. It accounts for the view's [anchor](#anchor), its place on the
stage, and the camera's [viewport](scene.Camera3D.html#viewport). Convert a point in a node's own
space with [Container3D#toGlobal](scene.Container3D.html#toglobal) first.

Returns `null` for a point at or behind a perspective camera: the cue to hide a label that
tracks it. Also returns `null`, and warns once, when the view or the camera's viewport has
zero area. With [autoResize](#autoresize), the view takes the screen size only as
it draws, so a label placed from `app.ticker` lags a frame after a resize; size a view that
carries labels from the renderer's `resize` event instead.

#### Type Parameters

##### P

`P` *extends* [`PointData`](https://pixijs.download/release/docs/index.html) = [`Point`](https://pixijs.download/release/docs/index.html)

#### Parameters

##### position

[`PointData3D`](maths.PointData3D.html.md)

World-space point to project.

##### out?

`P`

2D point the result is written into. Defaults to a new `Point`.

##### skipUpdate?

`boolean` = `false`

`true` to use cached transforms (see [Container3D#getGlobalTransform](scene.Container3D.html#getglobaltransform)).

#### Returns

`P` \| `null`

#### Example

```ts
const label = new Text({ text: 'player' });
const world = new Vector3();
const screen = new Point();
app.stage.addChild(label);

app.ticker.add(() => {
  // Reused out objects keep the per-frame code from allocating
  const p = view3d.worldToScreen(mesh.getGlobalPosition(world), screen);
  label.visible = p !== null;
  if (p) label.position.copyFrom(p);
});
```

#### See

[View3D#screenToRay](#screentoray) / [View3D#screenToWorld](#screentoworld) For the reverse direction.

***

### from()

> `static` **from**(`source`, `options?`): `View3D`\<[`Model3D`](scene.Model3D.html.md)\>

Builds a view whose root is a [Model3D](scene.Model3D.html.md) of `source`, with a camera and light ready to
render it

The camera is `options.camera`, else the file's first camera, else a new [Camera3D](scene.Camera3D.html.md) on
the model's +Z side, facing it, just far enough back that the sphere around the model's bounds
fits the view. An auto-sized view places that camera on its first render, once it knows its
aspect. That camera's near and far planes sit at a hundredth and a hundred times its distance
from the model. A file with no lights gets one; see [View3DFromOptions#light](scene.View3DFromOptions.html#light).

#### Parameters

##### source

[`Scene3DSource`](assets.Scene3DSource.html.md)

The loaded glTF or GLB to build the scene from.

##### options?

[`View3DFromOptions`](scene.View3DFromOptions.html.md) = `{}`

View options plus the per-instance model options; see [View3DFromOptions](scene.View3DFromOptions.html.md).

#### Returns

`View3D`\<[`Model3D`](scene.Model3D.html.md)\>

#### Example

```ts
const view = View3D.from(await Assets.load('robot.glb'), { autoResize: true, environment });
app.stage.addChild(view);
view.root.player?.play('Wave');
```
