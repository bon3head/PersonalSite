# Class: CopyOpaquePass

**`Advanced`**

Copies a camera's opaque picture into a texture for glass to sample

Glass can't sample the target it draws into, so transmissive and blended refractive materials
refract a copy taken after the opaque draw. [createDefaultGraph3D](rendering.createDefaultGraph3D.html.md) copies the view's camera
into [PassContext#opaqueColor](rendering.PassContext.html#opaquecolor). For another camera, add one after the draws it copies and
before the passes that sample it; passes on other targets can run in between. The graph skips the
copy on frames where nothing samples it.

On WebGL, give the renderer `useBackBuffer: true` when a view draws glass. Without it, a view
drawn straight to an opaque canvas (the default `backgroundAlpha: 1`) gets an empty copy, so its
glass refracts nothing. The pass warns once when it copies the view's picture with the setting off.

## Extends

- [`RenderPass`](rendering.RenderPass.html.md)

## Constructors

### Constructor

> **new CopyOpaquePass**(`options`): `CopyOpaquePass`

#### Parameters

##### options

[`CopyOpaquePassOptions`](rendering.CopyOpaquePassOptions.html.md)

#### Returns

`CopyOpaquePass`

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

### opaqueColorHandle

> `readonly` **opaqueColorHandle**: [`ColorHandle`](rendering.ColorHandle.html.md)

Colour texture the copy lands in, as given in [CopyOpaquePassOptions#opaqueColorHandle](rendering.CopyOpaquePassOptions.html#opaquecolorhandle)

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

Releases the GPU resources this pass owns alone

The graph calls it when the graph is destroyed. Override it to free the shaders, bind groups
or render targets your pass created, leaving alone anything it only borrowed.

#### Returns

`void`

#### Inherited from

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

Copies its camera's colour target into [CopyOpaquePass#opaqueColorHandle](#opaquecolorhandle)

#### Parameters

##### session

[`RenderSession`](rendering.RenderSession.html.md)

The current frame's render session

#### Returns

`void`

#### Overrides

[`RenderPass`](rendering.RenderPass.html.md).[`render`](rendering.RenderPass.html#render)

***

### setup()

> **setup**(`b`): `void`

Reads its camera's colour target and produces [CopyOpaquePass#opaqueColorHandle](#opaquecolorhandle)

#### Parameters

##### b

[`PassBuilder`](rendering.PassBuilder.html.md)

The builder recording this pass's resource accesses

#### Returns

`void`

#### Overrides

[`RenderPass`](rendering.RenderPass.html.md).[`setup`](rendering.RenderPass.html#setup)
