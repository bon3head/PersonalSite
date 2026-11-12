# Class: OutputPass

**`Advanced`**

Finishes a view's image: applies the tone curve and display encode to a scene that holds linear
light, or copies the image unchanged (see [View3D#toneMapping](scene.View3D.html#tonemapping))

A see-through background keeps its edges over the 2D content beneath. Unless it copies, the pass
also dithers so smooth gradients don't band in an 8-bit target. A custom graph whose scene is linear
([RenderGraph#sceneIsLinear](rendering.RenderGraph.html#sceneislinear)) needs one to finish the image. Inside a
[graph](scene.View3DOptions.html#graph) builder, pass the builder's `options.toneMapping`, so a
change to [View3D#toneMapping](scene.View3D.html#tonemapping) reaches the pass when the graph rebuilds.

## Example

```ts
graph.addPass(new OutputPass({ renderer, source: graph.sceneColor, toneMapping: options.toneMapping }));
```

## Extends

- [`FullscreenPass`](rendering.FullscreenPass.html.md)

## Constructors

### Constructor

> **new OutputPass**(`options`): `OutputPass`

#### Parameters

##### options

[`OutputPassOptions`](rendering.OutputPassOptions.html.md)

#### Returns

`OutputPass`

#### Overrides

[`FullscreenPass`](rendering.FullscreenPass.html.md).[`constructor`](rendering.FullscreenPass.html#constructor)

## Properties

### attachedOutputs

> `readonly` **attachedOutputs**: readonly [`SceneOutput`](rendering.SceneOutput.html.md)[]

The scene outputs attached after the target colour; see [RenderPassOptions#attachedOutputs](rendering.ForwardRenderPassOptions.html#attachedoutputs)

#### Inherited from

[`FullscreenPass`](rendering.FullscreenPass.html.md).[`attachedOutputs`](rendering.FullscreenPass.html#attachedoutputs)

***

### bit

> **bit**: `number` = `0`

Bit for this pass: the built-in one it was given, or the one its name was assigned

#### Inherited from

[`FullscreenPass`](rendering.FullscreenPass.html.md).[`bit`](rendering.FullscreenPass.html#bit)

***

### camera

> `readonly` **camera**: [`Camera3D`](scene.Camera3D.html.md) \| `null`

Camera this pass draws from, or `null` to draw from the view's own camera

See [RenderPassOptions#camera](rendering.ForwardRenderPassOptions.html#camera). While `render` runs, the GPU viewport is the camera's rect.

#### Inherited from

[`FullscreenPass`](rendering.FullscreenPass.html.md).[`camera`](rendering.FullscreenPass.html#camera)

***

### description?

> `readonly` `optional` **description?**: `string`

Human-readable explanation of what this pass contributes to the frame

#### Inherited from

[`FullscreenPass`](rendering.FullscreenPass.html.md).[`description`](rendering.FullscreenPass.html#description)

***

### descriptor?

> `optional` **descriptor?**: [`PassDescriptor`](materials.PassDescriptor.html.md)

Shader, state and topology this pass uses for every mesh, from [RenderPassOptions#descriptor](rendering.ForwardRenderPassOptions.html#descriptor)

#### Inherited from

[`FullscreenPass`](rendering.FullscreenPass.html.md).[`descriptor`](rendering.FullscreenPass.html#descriptor)

***

### materialBits

> `readonly` **materialBits**: readonly [`ShaderBit`](rendering.ShaderBit.html.md)[]

Shader bits a material adds when it draws in this pass, so it writes the attached outputs

Each attached output's [bits](rendering.SceneOutput.html#bits) entry for this pass's name, in order. A
material with a template of its own ignores them.

#### Inherited from

[`FullscreenPass`](rendering.FullscreenPass.html.md).[`materialBits`](rendering.FullscreenPass.html#materialbits)

***

### name

> `readonly` **name**: `string`

The pass's name; see [RenderPassOptions#name](rendering.ForwardRenderPassOptions.html#name)

#### Inherited from

[`FullscreenPass`](rendering.FullscreenPass.html.md).[`name`](rendering.FullscreenPass.html#name)

***

### outputLocations

> `readonly` **outputLocations**: readonly `string`[]

The output each fragment location of a material shader in this pass writes: `color`, then each attached output

#### Inherited from

[`FullscreenPass`](rendering.FullscreenPass.html.md).[`outputLocations`](rendering.FullscreenPass.html#outputlocations)

***

### pipe

> `readonly` **pipe**: `View3DPipe`

The view pipe of the renderer this pass was built for

#### Inherited from

[`FullscreenPass`](rendering.FullscreenPass.html.md).[`pipe`](rendering.FullscreenPass.html#pipe)

## Methods

### condition()?

> `optional` **condition**(`session`): `boolean`

Optional per-frame check; returning `false` skips the pass, `prepare` and `render` included

The graph asks it before any pass draws, once the scene's transforms and the view's camera are
up to date for the frame. Without one, the pass runs every frame.

#### Parameters

##### session

[`RenderSession`](rendering.RenderSession.html.md)

The current frame's render session

#### Returns

`boolean`

Whether the pass should run this frame

#### Inherited from

[`FullscreenPass`](rendering.FullscreenPass.html.md).[`condition`](rendering.FullscreenPass.html#condition)

***

### destroy()

> **destroy**(): `void`

Releases the pass's shader and bind groups, leaving the `uniforms` it was given to their owner

#### Returns

`void`

#### Inherited from

[`FullscreenPass`](rendering.FullscreenPass.html.md).[`destroy`](rendering.FullscreenPass.html#destroy)

***

### prepare()

> **prepare**(`_session`): `void`

Runs before any pass draws or any render target is bound, once every pass's camera is current

Override it to upload GPU buffers early. The default does nothing.

#### Parameters

##### \_session

[`RenderSession`](rendering.RenderSession.html.md)

The current frame's render session

#### Returns

`void`

#### Inherited from

[`FullscreenPass`](rendering.FullscreenPass.html.md).[`prepare`](rendering.FullscreenPass.html#prepare)

***

### render()

> **render**(`session`): `void`

Draws the effect for this frame, binding its groups in the order the effect template declares

#### Parameters

##### session

[`RenderSession`](rendering.RenderSession.html.md)

Per-frame render session supplying the resolved textures.

#### Returns

`void`

#### Inherited from

[`FullscreenPass`](rendering.FullscreenPass.html.md).[`render`](rendering.FullscreenPass.html#render)

***

### setup()

> **setup**(`b`): `void`

Declares the pass's reads and its write

When it draws to the view's target, it declares that target's depth too, as
[PassBuilder#writeColor](rendering.PassBuilder.html#writecolor) requires.

#### Parameters

##### b

[`PassBuilder`](rendering.PassBuilder.html.md)

Builder collecting the pass's resource dependencies.

#### Returns

`void`

#### Inherited from

[`FullscreenPass`](rendering.FullscreenPass.html.md).[`setup`](rendering.FullscreenPass.html#setup)
