# Class: RenderPass\<P\>

**`Advanced`**

Base class for all render passes in the pipeline

Each view runs its passes in order through its [RenderGraph](rendering.RenderGraph.html.md). A pass goes through these
steps:
- `setup(builder)` runs once, when the pass is added to the graph, and declares what the pass
  reads and writes.
- `condition(session)`, if the pass has one, can skip the pass for a frame.
- `prepare(session)` runs before any render target is bound.
- `render(session)` runs once the graph has bound the pass's target. A pass that declares only
  `produce`, `sample` or `read` accesses gets no target bound and does its own GPU work.

`P` is the pipe type. Leave it as `View3DPipe` to run on both backends.

## Extended by

- [`BackgroundPass`](rendering.BackgroundPass.html.md)
- [`CopyDepthPass`](rendering.CopyDepthPass.html.md)
- [`CopyOpaquePass`](rendering.CopyOpaquePass.html.md)
- [`ForwardRenderPass`](rendering.ForwardRenderPass.html.md)
- [`FullscreenPass`](rendering.FullscreenPass.html.md)

## Type Parameters

### P

`P` *extends* `View3DPipe` = `View3DPipe`

## Constructors

### Constructor

> **new RenderPass**\<`P`\>(`options`): `RenderPass`\<`P`\>

#### Parameters

##### options

[`RenderPassOptions`](rendering.RenderPassOptions.html.md)

#### Returns

`RenderPass`\<`P`\>

## Properties

### attachedOutputs

> `readonly` **attachedOutputs**: readonly [`SceneOutput`](rendering.SceneOutput.html.md)[]

The scene outputs attached after the target colour; see [RenderPassOptions#attachedOutputs](rendering.ForwardRenderPassOptions.html#attachedoutputs)

***

### bit

> **bit**: `number` = `0`

Bit for this pass: the built-in one it was given, or the one its name was assigned

***

### camera

> `readonly` **camera**: [`Camera3D`](scene.Camera3D.html.md) \| `null`

Camera this pass draws from, or `null` to draw from the view's own camera

See [RenderPassOptions#camera](rendering.ForwardRenderPassOptions.html#camera). While `render` runs, the GPU viewport is the camera's rect.

***

### description?

> `readonly` `optional` **description?**: `string`

Human-readable explanation of what this pass contributes to the frame

***

### descriptor?

> `optional` **descriptor?**: [`PassDescriptor`](materials.PassDescriptor.html.md)

Shader, state and topology this pass uses for every mesh, from [RenderPassOptions#descriptor](rendering.ForwardRenderPassOptions.html#descriptor)

***

### materialBits

> `readonly` **materialBits**: readonly [`ShaderBit`](rendering.ShaderBit.html.md)[]

Shader bits a material adds when it draws in this pass, so it writes the attached outputs

Each attached output's [bits](rendering.SceneOutput.html#bits) entry for this pass's name, in order. A
material with a template of its own ignores them.

***

### name

> `readonly` **name**: `string`

The pass's name; see [RenderPassOptions#name](rendering.ForwardRenderPassOptions.html#name)

***

### outputLocations

> `readonly` **outputLocations**: readonly `string`[]

The output each fragment location of a material shader in this pass writes: `color`, then each attached output

***

### pipe

> `readonly` **pipe**: `P`

The view pipe of the renderer this pass was built for

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

***

### destroy()

> **destroy**(): `void`

Releases the GPU resources this pass owns alone

The graph calls it when the graph is destroyed. Override it to free the shaders, bind groups
or render targets your pass created, leaving alone anything it only borrowed.

#### Returns

`void`

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

***

### render()

> **render**(`_session`): `void`

Draws this pass's contribution to the frame, once the graph has bound its target

The default does nothing.

#### Parameters

##### \_session

[`RenderSession`](rendering.RenderSession.html.md)

The current frame's render session

#### Returns

`void`

***

### setup()

> **setup**(`_builder`): `void`

Declares what resources this pass reads, writes, and samples

The graph calls it once, when the pass is added. The graph only runs a pass whose output the
frame needs, so a pass that keeps this default, which declares nothing, never runs.

#### Parameters

##### \_builder

[`PassBuilder`](rendering.PassBuilder.html.md)

The builder recording this pass's resource accesses

#### Returns

`void`
