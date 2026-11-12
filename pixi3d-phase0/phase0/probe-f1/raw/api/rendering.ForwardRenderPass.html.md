# Class: ForwardRenderPass

**`Advanced`**

Draws the scene meshes in one pass membership from one camera

The default graph's opaque, transparent and glass passes are forward passes, and a
[MeshPass](rendering.MeshPass.html.md) builds one. It draws every mesh whose material belongs to its `name`, a
built-in membership such as `'opaque'` or a name materials join through their `passes` option.

Construct one in a [Pass3D#build](rendering.Pass3D.html#build) to draw a membership again from another camera, as
[PortalPass](extras_post-processing.PortalPass.html.md) does for `'opaque'` and `'transparent'`. It writes colour and depth on its
camera's target, or the scene's when it has no camera.

## Extends

- [`RenderPass`](rendering.RenderPass.html.md)

## Extended by

- [`BlendedRefractionPass`](rendering.BlendedRefractionPass.html.md)
- [`TransmissionRenderPass`](rendering.TransmissionRenderPass.html.md)

## Constructors

### Constructor

> **new ForwardRenderPass**(`options`): `ForwardRenderPass`

#### Parameters

##### options

[`ForwardRenderPassOptions`](rendering.ForwardRenderPassOptions.html.md)

#### Returns

`ForwardRenderPass`

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

#### Overrides

[`RenderPass`](rendering.RenderPass.html.md).[`condition`](rendering.RenderPass.html#condition)

***

### destroy()

> **destroy**(): `void`

Releases what this pass recorded for its draws

#### Returns

`void`

#### Overrides

[`RenderPass`](rendering.RenderPass.html.md).[`destroy`](rendering.RenderPass.html#destroy)

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

#### Overrides

[`RenderPass`](rendering.RenderPass.html.md).[`prepare`](rendering.RenderPass.html#prepare)

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

#### Overrides

[`RenderPass`](rendering.RenderPass.html.md).[`render`](rendering.RenderPass.html#render)

***

### setup()

> **setup**(`b`): `void`

Declares writes of its camera's target colour, attached outputs and depth; a subclass that also
samples a texture, such as an opaque copy, overrides it

#### Parameters

##### b

[`PassBuilder`](rendering.PassBuilder.html.md)

The builder recording this pass's resource accesses

#### Returns

`void`

#### Overrides

[`RenderPass`](rendering.RenderPass.html.md).[`setup`](rendering.RenderPass.html#setup)

***

### unload()

> **unload**(): `void`

Gives back the GPU memory this pass recorded for its draws; the next render rebuilds it

#### Returns

`void`
