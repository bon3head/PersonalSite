# Class: RenderGraph

**`Advanced`**

The ordered passes a [View3D](scene.View3D.html.md) renders, and the textures they read and write

Each pass declares in `setup` what it reads and writes. From that the graph lends the passes
pooled textures for as long as they're used, binds each pass's target, and each frame skips any
pass whose output nothing uses. A view builds one with [createDefaultGraph3D](rendering.createDefaultGraph3D.html.md), or with its
`graph` option, then compiles and runs it.

## Constructors

### Constructor

> **new RenderGraph**(`opts`): `RenderGraph`

#### Parameters

##### opts

[`RenderGraphOptions`](rendering.RenderGraphOptions.html.md)

#### Returns

`RenderGraph`

## Properties

### defaultColor

> `readonly` **defaultColor**: [`ColorHandle`](rendering.ColorHandle.html.md)

The colour of the target the view draws into, such as the canvas: where the final picture goes

***

### defaultDepth

> `readonly` **defaultDepth**: [`DepthHandle`](rendering.DepthHandle.html.md)

Depth paired with [RenderGraph#defaultColor](#defaultcolor)

***

### globalTextureBindings

> `readonly` **globalTextureBindings**: [`GlobalTextureBindings`](rendering.GlobalTextureBindings.html.md)

The view's global texture bindings; passes reach them through [PassBuilder#globalTextureBindings](rendering.PassBuilder.html#globaltexturebindings)

***

### resolution

> **resolution**: `number` = `1`

Texels per logical pixel of the scene, which every texture with `resolution: 'inherit'` follows

The view sets it before each frame: its target's resolution when the scene draws straight to the
target, otherwise [View3D#resolution](scene.View3D.html#resolution).

***

### sceneColor

> `readonly` **sceneColor**: [`ColorHandle`](rendering.ColorHandle.html.md)

The colour the scene draws into: the texture made from [RenderGraphOptions#sceneColor](rendering.RenderGraphOptions.html#scenecolor), or
[RenderGraph#defaultColor](#defaultcolor) without one

***

### sceneDepth

> `readonly` **sceneDepth**: [`DepthHandle`](rendering.DepthHandle.html.md)

Depth paired with [RenderGraph#sceneColor](#scenecolor)

***

### sceneOutputs

> `readonly` **sceneOutputs**: readonly [`SceneOutput`](rendering.SceneOutput.html.md)[]

The scene outputs this graph attaches, as given in [RenderGraphOptions#sceneOutputs](rendering.RenderGraphOptions.html#sceneoutputs)

## Accessors

### passes

#### Get Signature

> **get** **passes**(): [`GraphRenderPass`](rendering.GraphRenderPass.html.md)[]

The passes in the order they run, in a new array each call

##### Returns

[`GraphRenderPass`](rendering.GraphRenderPass.html.md)[]

***

### sceneIsLinear

#### Get Signature

> **get** **sceneIsLinear**(): `boolean`

Whether [RenderGraph#sceneColor](#scenecolor) holds linear light, from a float or `-srgb` format in
[RenderGraphOptions#sceneColor](rendering.RenderGraphOptions.html#scenecolor)

If so, the view leaves the tone curve out of its materials and sky, and a pass in the graph must
apply it, as an [OutputPass](rendering.OutputPass.html.md) does; see [View3D#toneMapping](scene.View3D.html#tonemapping).

##### Returns

`boolean`

## Methods

### addPass()

> **addPass**\<`T`\>(`pass`): `T`

Adds a pass after those already added, and runs its `setup` now

Passes run in the order they're added. Keep the handles `setup` declares for `render`.

#### Type Parameters

##### T

`T` *extends* [`GraphRenderPass`](rendering.GraphRenderPass.html.md)

#### Parameters

##### pass

`T`

The pass to register.

#### Returns

`T`

The same pass, for inline capture.

***

### compile()

> **compile**(): `void`

Works out what each pass depends on and which target it binds; the view calls it once the graph
is built

It can run again, and starts afresh each time. It throws when a pass both writes and reads one
texture, or samples, through a global binding, a texture [PassBuilder#sample](rendering.PassBuilder.html#sample) says needs
the pass's own bind group.

#### Returns

`void`

***

### createColor()

> **createColor**(`options?`): [`ColorHandle`](rendering.ColorHandle.html.md)

Creates a colour texture the graph allocates; [TransientTextureOptions](rendering.TransientTextureOptions.html.md) sets its size and format

The graph takes it from pixi's `TexturePool` before the first pass that uses it each frame and
gives it back after the last, so don't count on its content in the next frame.

#### Parameters

##### options?

[`TransientTextureOptions`](rendering.TransientTextureOptions.html.md) = `{}`

Size, resolution, format and label; see [TransientTextureOptions](rendering.TransientTextureOptions.html.md).

#### Returns

[`ColorHandle`](rendering.ColorHandle.html.md)

The handle for the transient colour resource.

***

### createDepth()

> **createDepth**(`options?`): [`DepthHandle`](rendering.DepthHandle.html.md)

Creates a depth texture the graph allocates; see [RenderGraph#createColor](#createcolor)

#### Parameters

##### options?

[`TransientTextureOptions`](rendering.TransientTextureOptions.html.md) = `{}`

Size, resolution, format and label; see [TransientTextureOptions](rendering.TransientTextureOptions.html.md).

#### Returns

[`DepthHandle`](rendering.DepthHandle.html.md)

The handle for the transient depth resource.

***

### destroy()

> **destroy**(): `void`

Destroys the graph and its passes; imported textures are left alone, and pixi's `TexturePool`
keeps the textures the graph used

#### Returns

`void`

***

### getSceneOutput()

> **getSceneOutput**(`output`): [`ColorHandle`](rendering.ColorHandle.html.md)

The texture of a scene output this graph attaches, for a pass to read or draw into

Declare the access in the pass's `setup`, as for any graph texture. A `'beforeOpaque'` pass runs
before the scene writes it, and an `'afterOpaque'` pass runs before transparent and glass
surfaces do.

#### Parameters

##### output

[`SceneOutput`](rendering.SceneOutput.html.md)

An output in [RenderGraph#sceneOutputs](#sceneoutputs), which a pass's
  [Pass3D#requiredOutputs](rendering.Pass3D.html#requiredoutputs) puts there.

#### Returns

[`ColorHandle`](rendering.ColorHandle.html.md)

The output's texture handle.

#### Example

```ts
const normals = graph.getSceneOutput(normalOutput);
```

#### Throws

If the graph doesn't attach an output with this name.

***

### getTexture()

> **getTexture**(`handle`, `session`): [`Texture`](https://pixijs.download/release/docs/index.html)

The texture behind a handle, for a pass that binds it itself, such as raw WebGPU compute

Call it in the pass's `render`, for a handle the pass declared in `setup`;
[PassBuilder#sample](rendering.PassBuilder.html#sample) binds a texture for you instead. A texture the graph allocated lives
from the first pass that uses it to the last, and then the pool can hand it to another pass, so
don't keep it past `render`. Outside that span this throws.

On WebGPU, record on `renderer.encoder.commandEncoder`: work on an encoder of your own runs
before this frame's earlier passes, and reads what the texture held before this frame. A render
pass can still be open, so call `renderer.renderTarget.finishRenderPass()` first, and set
[RenderSession#activeTarget](rendering.RenderSession.html#activetarget) to `null` so the next pass binds its target again.
`renderer.texture.getGpuSource(texture.source)` gives the `GPUTexture`, and
`renderer.texture.getTextureView` gives a view it caches on the source, so a bind group made from
that view can be kept while the view stays the same.

A pooled texture can be larger than its content: `texture.frame` times
`texture.source.resolution` is the content rect in texels. A depth-stencil texture binds to a
WebGPU shader through a depth-only view, as in the example.

#### Parameters

##### handle

[`ResourceHandle`](rendering.ResourceHandle.html.md)

A resource the calling pass declared.

##### session

[`RenderSession`](rendering.RenderSession.html.md)

The frame's render session.

#### Returns

[`Texture`](https://pixijs.download/release/docs/index.html)

The texture, valid until the pass's `render` returns.

#### Example

```ts
const depth = graph.getTexture(depthHandle, session);
const depthView = renderer.texture.getTextureView(depth, { aspect: 'depth-only' });

renderer.renderTarget.finishRenderPass();
session.activeTarget = null;
const compute = renderer.encoder.commandEncoder.beginComputePass();
// bind depthView, dispatch
compute.end();
```

***

### hasSceneOutput()

> **hasSceneOutput**(`output`): `boolean`

Whether this graph attaches `output`, for a pass that uses it when the view has it and works
without it otherwise

It matches by name and content, so a different output that shares the name doesn't count.

#### Parameters

##### output

[`SceneOutput`](rendering.SceneOutput.html.md)

The output to look for.

#### Returns

`boolean`

Whether the graph attaches this output, by name and content.

#### Example

```ts
const normals = graph.hasSceneOutput(normalOutput) ? graph.getSceneOutput(normalOutput) : null;
```

***

### importColor()

> **importColor**(`getter`): [`ColorHandle`](rendering.ColorHandle.html.md)

Adds a colour texture you own, such as a render texture, for passes to draw into

`getter` runs each frame, so the graph follows a resized or swapped texture. A pass that writes
it runs even when no pass reads it, and the graph never clears it.

#### Parameters

##### getter

(`s`) => [`BindableTexture`](https://pixijs.download/release/docs/index.html)

Resolves the live texture for the frame.

#### Returns

[`ColorHandle`](rendering.ColorHandle.html.md)

The handle for the imported colour resource.

***

### importDepth()

> **importDepth**(`getter`): [`DepthHandle`](rendering.DepthHandle.html.md)

Adds a depth texture you own; see [RenderGraph#importColor](#importcolor)

#### Parameters

##### getter

(`s`) => [`BindableTexture`](https://pixijs.download/release/docs/index.html)

Resolves the live texture for the frame.

#### Returns

[`DepthHandle`](rendering.DepthHandle.html.md)

The handle for the imported depth resource.

***

### sceneViewport()

> **sceneViewport**(`session`, `out`): [`Rectangle`](https://pixijs.download/release/docs/index.html)

The scene's content rect in its own texels, available before any target is bound

When the scene draws straight into the view's target, it's the view's place there. Otherwise it
starts at the origin of the scene texture and is sized at [RenderGraph#resolution](#resolution).

#### Parameters

##### session

[`RenderSession`](rendering.RenderSession.html.md)

The frame's render session, with `viewport` filled.

##### out

[`Rectangle`](https://pixijs.download/release/docs/index.html)

Receives the rect.

#### Returns

[`Rectangle`](https://pixijs.download/release/docs/index.html)

`out`, for inline use.

***

### setViewportUvScale()

> **setViewportUvScale**(`pixelWidth`, `pixelHeight`, `out`): `void`

Writes the scale from view UVs, 0 to 1, to the content of a scene-sized graph texture, which the
pool can make larger than its content

#### Parameters

##### pixelWidth

`number`

Scene width in texels, from [RenderGraph#sceneViewport](#sceneviewport).

##### pixelHeight

`number`

Scene height in texels.

##### out

[`PointData`](https://pixijs.download/release/docs/index.html)

Destination for the scale.

#### Returns

`void`

***

### unload()

> **unload**(): `void`

Frees the GPU memory each pass can rebuild, such as the shadow map, through its
[GraphRenderPass#unload](rendering.GraphRenderPass.html#unload); the graph keeps rendering

Textures the graph allocates are back in pixi's `TexturePool` between frames, and stay there.

#### Returns

`void`
