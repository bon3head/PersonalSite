# Interface: View3DOptions\<TRoot\>

Constructor options for [View3D](scene.View3D.html.md)

pixi's own container options, such as `label`, `position`, `eventMode` and the `on*` handlers,
work too.

## Example

```ts
const view = new View3D({
  width: 1280,
  height: 720,
  anchor: 0.5,
  shadowQuality: 'high',
  toneMapping: 'aces',
  exposure: 1.2,
  fog: { type: 'linear', color: 0xadb2ba, near: 30, far: 55 },
  environment: { skyColor: 0x88ccff, groundColor: 0x553311 },
});
```

## Extends

- `View3DOptions`.[`Omit`](https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys)\<[`ViewContainerOptions`](https://pixijs.download/release/docs/index.html), `"children"` \| `"isRenderGroup"`\>

## Type Parameters

### TRoot

`TRoot` *extends* [`Container3D`](scene.Container3D.html.md) = [`Container3D`](scene.Container3D.html.md)

Type of [root](#root), inferred from the `root` you pass.

## Properties

### anchor?

> `optional` **anchor?**: `number` \| [`PointData`](https://pixijs.download/release/docs/index.html)

Where the view's origin sits, as a fraction of its size; see [View3D#anchor](scene.View3D.html#anchor)

#### Default

```ts
0
```

#### Example

```ts
const view = new View3D({ width: 400, height: 300, anchor: 0.5 });
```

***

### autoResize?

> `optional` **autoResize?**: `boolean`

Match the renderer's screen size on every render, following it when the canvas resizes;
see [View3D#autoResize](scene.View3D.html#autoresize)

#### Default

```ts
false
```

#### Example

```ts
const view = new View3D({ autoResize: true });
```

***

### background?

> `optional` **background?**: [`ColorSource`](https://pixijs.download/release/docs/index.html) \| [`CubeTexture`](https://pixijs.download/release/docs/index.html) \| [`Hemisphere`](environment.Hemisphere.html.md) \| `null`

Drawn behind the scene: a cube map, a [Hemisphere](environment.Hemisphere.html.md) gradient, a plain colour, or `null`
for none; see [View3D#background](scene.View3D.html#background)

#### Default

```ts
null
```

#### Example

```ts
const view = new View3D({ environment: sky, background: sky });

// Pass the fog the same colour and distant geometry melts into the background
const misty = new View3D({ background: 0x968c34, fog: { color: 0x968c34, near: 20, far: 60 } });
```

***

### camera?

> `optional` **camera?**: [`Camera3D`](scene.Camera3D.html.md)

Camera to draw from, added to [root](#root) when it has no parent; see
[View3D#camera](scene.View3D.html#camera)

#### Default

```ts
new Camera3D()
```

#### Example

```ts
const view = new View3D({ camera: new Camera3D({ fov: 45 }) });
```

***

### composite?

> `optional` **composite?**: `boolean`

Draw the scene into its own texture, then onto the screen, instead of straight to the screen

The view does this anyway while it has an enabled post effect, an enabled pass that
[requires](rendering.Pass3D.html#requiredoutputs) a scene output, or a [View3D#resolution](scene.View3D.html#resolution) other
than its target's; [View3D#resolution](scene.View3D.html#resolution) says when to set it yourself. On a canvas with
`antialias` the texture is multisampled too, unless a scene output's format rules that out; see
[SceneOutput](rendering.SceneOutput.html.md).

#### Default

```ts
false
```

#### Example

```ts
const view = new View3D({ width: 320, height: 240, composite: true });
```

***

### cull?

> `optional` **cull?**: [`CullMode`](scene.CullMode.html.md)

How the view culls its meshes outside the camera's view; see [CullMode](scene.CullMode.html.md)

#### Default

```ts
'gpu'
```

#### Example

```ts
const view = new View3D({ cull: 'off' });
```

***

### environment?

> `optional` **environment?**: [`CubeTexture`](https://pixijs.download/release/docs/index.html) \| [`Hemisphere`](environment.Hemisphere.html.md) \| `null`

Light from the surroundings: a cube map, a [Hemisphere](environment.Hemisphere.html.md) gradient, or `null` for none;
see [View3D#environment](scene.View3D.html#environment)

#### Default

```ts
null
```

#### Example

```ts
const view = new View3D({ environment: { skyColor: 0x88ccff, groundColor: 0x553311 } });
```

***

### exposure?

> `optional` **exposure?**: `number`

Brightness multiplier applied before tone mapping; see [View3D#exposure](scene.View3D.html#exposure)

#### Default

```ts
1.0
```

#### Example

```ts
const view = new View3D({ exposure: 1.4 });
```

***

### fog?

> `optional` **fog?**: [`Fog`](environment.Fog.html.md)

Distance fog, left out for none; see [View3D#fog](scene.View3D.html#fog)

#### Example

```ts
const view = new View3D({ fog: { type: 'linear', color: 0xadb2ba, near: 30, far: 55 } });
```

***

### graph?

> `optional` **graph?**: (`renderer`, `options`) => [`RenderGraph`](rendering.RenderGraph.html.md)

Builds the render graph for this view

Runs on the first render and again each time the view rebuilds its graph, such as after
[View3D#passes](scene.View3D.html#passes) is assigned, a pass's `enabled` flips, or [View3D#unload](scene.View3D.html#unload). A rebuild
destroys the old graph and its passes, so make the passes inside the callback.

Leave it out to use [createDefaultGraph3D](rendering.createDefaultGraph3D.html.md); to add passes to that pipeline, use
[View3DOptions#passes](#passes) instead. For a different pipeline, start from
`createDefaultGraph3D` and append, or build a bare [RenderGraph](rendering.RenderGraph.html.md). Forward `options`
either way: it carries what every graph needs, and keeps `passes`, `composite` and
`toneMapping` working. A pass that uses a scene output the graph doesn't attach throws when the
view builds it.

#### Parameters

##### renderer

[`WebGLRenderer`](https://pixijs.download/release/docs/index.html)\<[`HTMLCanvasElement`](https://developer.mozilla.org/docs/Web/API/HTMLCanvasElement)\> \| [`WebGPURenderer`](https://pixijs.download/release/docs/index.html)\<[`HTMLCanvasElement`](https://developer.mozilla.org/docs/Web/API/HTMLCanvasElement)\>

##### options

[`DefaultGraph3DOptions`](rendering.DefaultGraph3DOptions.html.md)

#### Returns

[`RenderGraph`](rendering.RenderGraph.html.md)

#### Example

**Modify the default graph**

```ts
new View3D({
  width,
  height,
  graph: (renderer, options) => {
    const { graph } = createDefaultGraph3D(renderer, options);
    graph.addPass(new MyOutlinePass({ renderer }));
    return graph;
  },
});
```

***

### height?

> `optional` **height?**: `number`

Height of the 3D viewport in pixels; see [width](#width)

#### Default

```ts
256
```

#### Example

```ts
const view = new View3D({ width: 800, height: 600 });
```

#### Overrides

`Omit.height`

***

### passes?

> `optional` **passes?**: readonly [`Pass3D`](rendering.Pass3D.html.md)[]

Passes and post effects for this view, the same as assigning [View3D#passes](scene.View3D.html#passes) later

#### Example

```ts
const view = new View3D({ passes: [new OutlinePass({ width: 0.05 }), new BloomEffect()] });
```

***

### resolution?

> `optional` **resolution?**: `number` \| `"inherit"`

Texels per logical pixel the scene is drawn at, or `'inherit'` for the target's; see
[View3D#resolution](scene.View3D.html#resolution)

#### Default

```ts
'inherit'
```

#### Example

```ts
const view = new View3D({ resolution: 1 });
```

***

### root?

> `optional` **root?**: `TRoot`

Root of the 3D scene; see [View3D#root](scene.View3D.html#root)

#### Default

```ts
new Container3D()
```

#### Example

```ts
const view = new View3D({ root: new Model3D(source) });

view.root.player?.play('Wave');
```

***

### shadowFilter?

> `optional` **shadowFilter?**: [`ShadowFilter`](rendering.ShadowFilter.html.md)

How soft shadow edges are; see [View3D#shadowFilter](scene.View3D.html#shadowfilter)

#### Default

```ts
'pcf'
```

#### Example

```ts
const view = new View3D({ shadowFilter: 'hard' });
```

***

### shadowQuality?

> `optional` **shadowQuality?**: [`ShadowQuality`](rendering.ShadowQuality.html.md)

Size of the shadow maps; see [View3D#shadowQuality](scene.View3D.html#shadowquality)

#### Default

```ts
'medium'
```

#### Example

```ts
const view = new View3D({ shadowQuality: 'low' });
```

***

### toneMapping?

> `optional` **toneMapping?**: [`ToneMapping`](environment.ToneMapping.html.md)

Tone mapping curve; see [View3D#toneMapping](scene.View3D.html#tonemapping)

#### Default

```ts
'none'
```

#### Example

```ts
const view = new View3D({ toneMapping: 'aces' });
```

***

### width?

> `optional` **width?**: `number`

Width of the 3D viewport in pixels

#### Default

```ts
256
```

#### Example

```ts
const view = new View3D({ width: 800, height: 600 });
```

#### Overrides

`Omit.width`
