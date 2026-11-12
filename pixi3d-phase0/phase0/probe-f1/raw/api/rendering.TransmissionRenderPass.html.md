# Class: TransmissionRenderPass

**`Advanced`**

Draws transmissive (glass) materials over a copy of the opaque picture behind them

Draws the meshes whose material sets [Material3DOptions#transmission](materials.Material3DOptions.html#transmission). Each fragment
refracts the opaque colour copy, rough glass through the copy's blurred mip levels, so a
[CopyOpaquePass](rendering.CopyOpaquePass.html.md) on the same camera must run earlier in the graph.
[createDefaultGraph3D](rendering.createDefaultGraph3D.html.md) adds this pass and its copy for the view's camera.

The copy is taken before any glass draws, so glass behind glass doesn't show through it. Glass
writes depth by default, so it hides particles and anything else drawn behind it later. A frame
with no glass in the scene skips the copy, unless something else samples it.

## Extends

- [`ForwardRenderPass`](rendering.ForwardRenderPass.html.md)

## Constructors

### Constructor

> **new TransmissionRenderPass**(`options`): `TransmissionRenderPass`

#### Parameters

##### options

[`TransmissionRenderPassOptions`](rendering.TransmissionRenderPassOptions.html.md)

#### Returns

`TransmissionRenderPass`

#### Overrides

[`ForwardRenderPass`](rendering.ForwardRenderPass.html.md).[`constructor`](rendering.ForwardRenderPass.html#constructor)

## Properties

### attachedOutputs

> `readonly` **attachedOutputs**: readonly [`SceneOutput`](rendering.SceneOutput.html.md)[]

The scene outputs attached after the target colour; see [RenderPassOptions#attachedOutputs](rendering.ForwardRenderPassOptions.html#attachedoutputs)

#### Inherited from

[`ForwardRenderPass`](rendering.ForwardRenderPass.html.md).[`attachedOutputs`](rendering.ForwardRenderPass.html#attachedoutputs)

***

### bit

> **bit**: `number` = `0`

Bit for this pass: the built-in one it was given, or the one its name was assigned

#### Inherited from

[`ForwardRenderPass`](rendering.ForwardRenderPass.html.md).[`bit`](rendering.ForwardRenderPass.html#bit)

***

### camera

> `readonly` **camera**: [`Camera3D`](scene.Camera3D.html.md) \| `null`

Camera this pass draws from, or `null` to draw from the view's own camera

See [RenderPassOptions#camera](rendering.ForwardRenderPassOptions.html#camera). While `render` runs, the GPU viewport is the camera's rect.

#### Inherited from

[`ForwardRenderPass`](rendering.ForwardRenderPass.html.md).[`camera`](rendering.ForwardRenderPass.html#camera)

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

[`ForwardRenderPass`](rendering.ForwardRenderPass.html.md).[`descriptor`](rendering.ForwardRenderPass.html#descriptor)

***

### materialBits

> `readonly` **materialBits**: readonly [`ShaderBit`](rendering.ShaderBit.html.md)[]

Shader bits a material adds when it draws in this pass, so it writes the attached outputs

Each attached output's [bits](rendering.SceneOutput.html#bits) entry for this pass's name, in order. A
material with a template of its own ignores them.

#### Inherited from

[`ForwardRenderPass`](rendering.ForwardRenderPass.html.md).[`materialBits`](rendering.ForwardRenderPass.html#materialbits)

***

### name

> `readonly` **name**: `string`

The pass's name; see [RenderPassOptions#name](rendering.ForwardRenderPassOptions.html#name)

#### Inherited from

[`RenderPass`](rendering.RenderPass.html.md).[`name`](rendering.RenderPass.html#name)

***

### opaqueColorHandle

> `readonly` **opaqueColorHandle**: [`ColorHandle`](rendering.ColorHandle.html.md)

Opaque colour copy the glass refracts, as given in [TransmissionRenderPassOptions#opaqueColorHandle](rendering.TransmissionRenderPassOptions.html#opaquecolorhandle)

***

### outputLocations

> `readonly` **outputLocations**: readonly `string`[]

The output each fragment location of a material shader in this pass writes: `color`, then each attached output

#### Inherited from

[`ForwardRenderPass`](rendering.ForwardRenderPass.html.md).[`outputLocations`](rendering.ForwardRenderPass.html#outputlocations)

***

### pipe

> `readonly` **pipe**: `View3DPipe`

The view pipe of the renderer this pass was built for

#### Inherited from

[`ForwardRenderPass`](rendering.ForwardRenderPass.html.md).[`pipe`](rendering.ForwardRenderPass.html#pipe)

## Methods

### condition()

> **condition**(`session`): `boolean`

Skips the frame when no mesh in the view's scene belongs to this pass

Membership decides, not visibility: a pass whose meshes are all hidden still runs and draws
nothing.

#### Parameters

##### session

[`RenderSession`](rendering.RenderSession.html.md)

The current frame's render session

#### Returns

`boolean`

Whether the pass should run this frame

#### Inherited from

[`ForwardRenderPass`](rendering.ForwardRenderPass.html.md).[`condition`](rendering.ForwardRenderPass.html#condition)

***

### destroy()

> **destroy**(): `void`

Releases what this pass recorded for its draws

#### Returns

`void`

#### Inherited from

[`ForwardRenderPass`](rendering.ForwardRenderPass.html.md).[`destroy`](rendering.ForwardRenderPass.html#destroy)

***

### prepare()

> **prepare**(`session`): `void`

Builds and culls this pass's draws before any render target is bound, on WebGPU with `cache: 'auto'`

#### Parameters

##### session

[`RenderSession`](rendering.RenderSession.html.md)

The current frame's render session

#### Returns

`void`

#### Inherited from

[`ForwardRenderPass`](rendering.ForwardRenderPass.html.md).[`prepare`](rendering.ForwardRenderPass.html#prepare)

***

### render()

> **render**(`session`): `void`

Draws this pass's meshes from its camera

#### Parameters

##### session

[`RenderSession`](rendering.RenderSession.html.md)

The current frame's render session

#### Returns

`void`

#### Inherited from

[`ForwardRenderPass`](rendering.ForwardRenderPass.html.md).[`render`](rendering.ForwardRenderPass.html#render)

***

### setup()

> **setup**(`b`): `void`

Writes its camera's colour and depth, and samples the opaque colour copy

#### Parameters

##### b

[`PassBuilder`](rendering.PassBuilder.html.md)

The builder recording this pass's resource accesses

#### Returns

`void`

#### Overrides

[`ForwardRenderPass`](rendering.ForwardRenderPass.html.md).[`setup`](rendering.ForwardRenderPass.html#setup)

***

### unload()

> **unload**(): `void`

Gives back the GPU memory this pass recorded for its draws; the next render rebuilds it

#### Returns

`void`

#### Inherited from

[`ForwardRenderPass`](rendering.ForwardRenderPass.html.md).[`unload`](rendering.ForwardRenderPass.html#unload)
