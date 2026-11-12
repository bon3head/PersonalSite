# Class: BackgroundPass

**`Advanced`**

Draws the view's [View3D#background](scene.View3D.html#background) behind the scene: a cubemap, a [Hemisphere](environment.Hemisphere.html.md)
sky/ground gradient, or a plain colour

The sky stays at infinity however the camera moves, and takes the view's [View3D#exposure](scene.View3D.html#exposure)
and [View3D#toneMapping](scene.View3D.html#tonemapping), so it matches materials that reflect the same environment. Fog in
the same colour as a plain colour background blends into it exactly. Switching between a cubemap
and a hemisphere or colour recompiles the pass's shader. The pass holds the old cubemap until a
frame draws another background, which a `null` background never does; destroying the cubemap
before then makes pixi warn.

It paints colour over whatever its target holds, with no depth test, so add it before its
camera's opaque draw. The default graph draws one for the view's camera; any other camera draws
no sky unless you add a `BackgroundPass` with that `camera` from a [Pass3D#build](rendering.Pass3D.html#build).

## Extends

- [`RenderPass`](rendering.RenderPass.html.md)

## Constructors

### Constructor

> **new BackgroundPass**(`options`): `BackgroundPass`

#### Parameters

##### options

[`BackgroundPassOptions`](rendering.BackgroundPassOptions.html.md)

#### Returns

`BackgroundPass`

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

Skips the frame when the view has no background

#### Parameters

##### session

[`RenderSession`](rendering.RenderSession.html.md)

The current frame's render session

#### Returns

`boolean`

Whether the view has a background to draw

#### Overrides

[`RenderPass`](rendering.RenderPass.html.md).[`condition`](rendering.RenderPass.html#condition)

***

### destroy()

> **destroy**(): `void`

Releases the pass's shader, sky cube, bind groups and uniform buffer; the view's background texture stays alive

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

Draws the sky with the view's current background

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

Declares colour and depth writes on its camera's target, or on the scene's

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

Frees the gradient's uniform buffer on the GPU; the next frame drawing a hemisphere or colour uploads it again

#### Returns

`void`
