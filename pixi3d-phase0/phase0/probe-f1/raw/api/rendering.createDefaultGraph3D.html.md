# Function: createDefaultGraph3D()

> **createDefaultGraph3D**(`renderer`, `options`): `object`

**`Advanced`**

Builds the render graph a [View3D](scene.View3D.html.md) uses unless its `graph` option supplies one

Start from it in a custom `graph` builder to add passes the [Pass3D](rendering.Pass3D.html.md) stages can't
express. The passes run in this order, with each user pass built at its [PassStage](rendering.PassStage.html.md):

1. The shadow pass.
2. `'beforeOpaque'` user passes.
3. A depth reset over the view's rect, which clears each scene output but keeps any colour drawn
   before it, then the background and the opaque scene.
4. `'afterOpaque'` user passes.
5. Copies of the opaque depth and colour, then the transmissive, blended-refraction and
   transparent scene. Blended-refraction draws don't write scene outputs.
6. `'afterTransparent'` user passes.
7. The `'beforeToneMapping'` effects, in array order, then the tone curve, then the
   `'afterToneMapping'` effects. Unless the tone mapping is `'custom'`, an output pass applies the
   curve after a `'beforeToneMapping'` effect, and the scene draw applies it otherwise.

In composite mode the scene draws into textures at [View3D#resolution](scene.View3D.html#resolution), which the graph's
other textures inherit unless an effect sets its own. The scene's textures are multisampled when
the canvas has `antialias`, unless a scene output's format can't be (see [SceneOutput](rendering.SceneOutput.html.md)).
Each effect reads what the one before it wrote, and the last step stretches the image onto the
view's rect.

With a `'beforeToneMapping'` effect enabled, the scene colour and every colour texture made
without a format are `rgba16float`, so brightness above 1 reaches each of those effects. Unless
the tone mapping is `'custom'`, the `'afterToneMapping'` effects read `rgba8unorm`. An effect
whose `inputMips` is set gets an input with mipmaps.

The graph comes back compiled, so authoring mistakes throw here rather than on the first frame.

## Parameters

### renderer

[`WebGLRenderer`](https://pixijs.download/release/docs/index.html)\<[`HTMLCanvasElement`](https://developer.mozilla.org/docs/Web/API/HTMLCanvasElement)\> \| [`WebGPURenderer`](https://pixijs.download/release/docs/index.html)\<[`HTMLCanvasElement`](https://developer.mozilla.org/docs/Web/API/HTMLCanvasElement)\>

The renderer the graph draws with.

### options

[`DefaultGraph3DOptions`](rendering.DefaultGraph3DOptions.html.md)

What the view hands its `graph` builder; see [DefaultGraph3DOptions](rendering.DefaultGraph3DOptions.html.md).

## Returns

The compiled graph and the [DefaultGraph3DHandles](rendering.DefaultGraph3DHandles.html.md) its passes share.

### graph

> **graph**: [`RenderGraph`](rendering.RenderGraph.html.md)

The compiled render graph

### handles

> **handles**: [`DefaultGraph3DHandles`](rendering.DefaultGraph3DHandles.html.md)

Textures the default passes share

## Example

```ts
new View3D({
  graph: (renderer, options) => {
    const { graph, handles } = createDefaultGraph3D(renderer, options);
    graph.addPass(new MyHeatHazePass({ renderer, opaqueColorHandle: handles.opaqueColor }));
    return graph;
  },
});
```

## Throws

If a pass that isn't a [PostEffect](filters.PostEffect.html.md) claims the `'beforeToneMapping'` or
  `'afterToneMapping'` stage.

## Throws

If a `'beforeToneMapping'` effect is enabled on WebGL 2 without
  `EXT_color_buffer_float`, which the float scene needs.
