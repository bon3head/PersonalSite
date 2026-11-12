# Class: FullscreenPass

**`Advanced`**

One fullscreen draw of an `effect(uv)` fragment, reading graph handles and writing one

The building block of every post effect. A single-shader [PostEffect](filters.PostEffect.html.md) adds one for you;
a multi-pass effect adds several from its `build`, and a custom graph can add them directly.
The graph binds its inputs each frame and the pass supplies the helpers [EffectFragment](filters.EffectFragment.html.md)
lists, so the fragment only has to define `effect(uv)`.

## Example

```ts
graph.addPass(new FullscreenPass({ renderer, reads: { depth }, writes: ao, fragment: AO_FRAGMENT }));
```

## Extends

- [`RenderPass`](rendering.RenderPass.html.md)

## Extended by

- [`OutputPass`](rendering.OutputPass.html.md)

## Constructors

### Constructor

> **new FullscreenPass**(`options`): `FullscreenPass`

#### Parameters

##### options

[`FullscreenPassOptions`](rendering.FullscreenPassOptions.html.md)

#### Returns

`FullscreenPass`

#### Overrides

[`RenderPass`](rendering.RenderPass.html.md).[`constructor`](rendering.RenderPass.html#constructor)

## Properties

### attachedOutputs

> `readonly` **attachedOutputs**: readonly [`SceneOutput`](rendering.SceneOutput.html.md)[]

The scene outputs attached after the target colour; see [RenderPassOptions#attachedOutputs](rendering.ForwardRenderPassOptions.html#attachedoutputs)

#### Inherited from

[`RenderPass`](rendering.RenderPass.html.md).[`attachedOutputs`](rendering.RenderPass.html#attachedoutputs)

***

### bit

> **bit**: `number` = `0`

Bit for this pass: the built-in one it was given, or the one its name was assigned

#### Inherited from

[`RenderPass`](rendering.RenderPass.html.md).[`bit`](rendering.RenderPass.html#bit)

***

### camera

> `readonly` **camera**: [`Camera3D`](scene.Camera3D.html.md) \| `null`

Camera this pass draws from, or `null` to draw from the view's own camera

See [RenderPassOptions#camera](rendering.ForwardRenderPassOptions.html#camera). While `render` runs, the GPU viewport is the camera's rect.

#### Inherited from

[`RenderPass`](rendering.RenderPass.html.md).[`camera`](rendering.RenderPass.html#camera)

***

### description?

> `readonly` `optional` **description?**: `string`

Human-readable explanation of what this pass contributes to the frame

#### Inherited from

[`RenderPass`](rendering.RenderPass.html.md).[`description`](rendering.RenderPass.html#description)

***

### descriptor?

> `optional` **descriptor?**: [`PassDescriptor`](materials.PassDescriptor.html.md)

Shader, state and topology this pass uses for every mesh, from [RenderPassOptions#descriptor](rendering.ForwardRenderPassOptions.html#descriptor)

#### Inherited from

[`RenderPass`](rendering.RenderPass.html.md).[`descriptor`](rendering.RenderPass.html#descriptor)

***

### materialBits

> `readonly` **materialBits**: readonly [`ShaderBit`](rendering.ShaderBit.html.md)[]

Shader bits a material adds when it draws in this pass, so it writes the attached outputs

Each attached output's [bits](rendering.SceneOutput.html#bits) entry for this pass's name, in order. A
material with a template of its own ignores them.

#### Inherited from

[`RenderPass`](rendering.RenderPass.html.md).[`materialBits`](rendering.RenderPass.html#materialbits)

***

### name

> `readonly` **name**: `string`

The pass's name; see [RenderPassOptions#name](rendering.ForwardRenderPassOptions.html#name)

#### Inherited from

[`RenderPass`](rendering.RenderPass.html.md).[`name`](rendering.RenderPass.html#name)

***

### outputLocations

> `readonly` **outputLocations**: readonly `string`[]

The output each fragment location of a material shader in this pass writes: `color`, then each attached output

#### Inherited from

[`RenderPass`](rendering.RenderPass.html.md).[`outputLocations`](rendering.RenderPass.html#outputlocations)

***

### pipe

> `readonly` **pipe**: `View3DPipe`

The view pipe of the renderer this pass was built for

#### Inherited from

[`RenderPass`](rendering.RenderPass.html.md).[`pipe`](rendering.RenderPass.html#pipe)

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

[`RenderPass`](rendering.RenderPass.html.md).[`condition`](rendering.RenderPass.html#condition)

***

### destroy()

> **destroy**(): `void`

Releases the pass's shader and bind groups, leaving the `uniforms` it was given to their owner

#### Returns

`void`

#### Overrides

[`RenderPass`](rendering.RenderPass.html.md).[`destroy`](rendering.RenderPass.html#destroy)

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

[`RenderPass`](rendering.RenderPass.html.md).[`prepare`](rendering.RenderPass.html#prepare)

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

#### Overrides

[`RenderPass`](rendering.RenderPass.html.md).[`render`](rendering.RenderPass.html#render)

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

#### Overrides

[`RenderPass`](rendering.RenderPass.html.md).[`setup`](rendering.RenderPass.html#setup)
