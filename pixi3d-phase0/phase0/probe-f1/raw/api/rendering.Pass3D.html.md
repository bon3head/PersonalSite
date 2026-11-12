# Abstract Class: Pass3D

Base class for everything added to [View3D#passes](scene.View3D.html#passes)

A pass needs no renderer to construct, can be shared across views, and holds the properties you
tune. When a view builds its render graph, it calls [Pass3D#build](#build) at the pass's
[PassStage](rendering.PassStage.html.md), and the pass adds its render passes there. Array order only matters between
passes at the same stage.

[MeshPass](rendering.MeshPass.html.md) redraws opted-in meshes with an override shader, and [PostEffect](filters.PostEffect.html.md) runs a
fullscreen fragment over the frame. Subclass this directly for anything else.

## Example

```ts
class MyRearViewPass extends Pass3D {
  public readonly stage = 'afterTransparent';

  public build(graph: RenderGraph, ctx: PassContext): void {
    graph.addPass(
      new ForwardRenderPass({ renderer: ctx.renderer, name: 'opaque', sort: 'key', camera: rearCamera }),
    );
  }
}

view.passes = [new MyRearViewPass()];
```

## Extended by

- [`PortalPass`](extras_post-processing.PortalPass.html.md)
- [`ExtractPass`](extras_post-processing.ExtractPass.html.md)
- [`PostEffect`](filters.PostEffect.html.md)
- [`MeshPass`](rendering.MeshPass.html.md)

## Constructors

### Constructor

> **new Pass3D**(`options?`): `Pass3D`

#### Parameters

##### options?

[`Pass3DOptions`](rendering.Pass3DOptions.html.md) = `{}`

#### Returns

`Pass3D`

## Properties

### enabled

> **enabled**: `boolean`

Whether this pass runs

Flipping it rebuilds the view's render graph on the next render, which suits a settings toggle
but not a change every frame; animate an effect's own properties instead. It can also
recompile the view's materials; [View3D#passes](scene.View3D.html#passes) says when.

#### Example

```ts
const wireframe = new MeshPass({ name: 'wireframe' });
view.passes = [wireframe];
wireframe.enabled = false;
```

***

### requiredOutputs?

> `readonly` `optional` **requiredOutputs?**: readonly [`SceneOutput`](rendering.SceneOutput.html.md)[]

Extra outputs the view's scene draw writes beside its colour while this pass is enabled

Each costs the scene draw a texture and the shader work to fill it, and any output makes the
view draw its scene into a texture first, as a post effect does. Reach an output's texture with
[RenderGraph#getSceneOutput](rendering.RenderGraph.html#getsceneoutput), to read it or draw into it.

#### Example

```ts
const objectIdOutput: SceneOutput = { name: 'objectId', format: 'r32uint' };

class MyPickingPass extends Pass3D {
  public readonly stage = 'afterTransparent';
  public readonly requiredOutputs = [objectIdOutput];
  public build(): void {}
}
```

***

### stage

> `abstract` `readonly` **stage**: [`PassStage`](rendering.PassStage.html.md)

The [PassStage](rendering.PassStage.html.md) at which the view calls [Pass3D#build](#build)

## Methods

### build()

> `abstract` **build**(`graph`, `ctx`): `void`

**`Advanced`**

Adds this pass's render passes and textures to the graph

Called once per graph build at this pass's stage. Handles become textures only inside a render
pass's `render(session)`, through [RenderGraph#getTexture](rendering.RenderGraph.html#gettexture), never here.

#### Parameters

##### graph

[`RenderGraph`](rendering.RenderGraph.html.md)

Render graph being built; add passes and transients to it.

##### ctx

[`PassContext`](rendering.PassContext.html.md)

Renderer and shared handles for this build.

#### Returns

`void`

***

### destroy()

> **destroy**(): `void`

Releases GPU resources the pass made outside the graph; the base class has none

The view never calls it, not on replacing `view.passes` nor on its own destroy, since a pass
can be shared. Call it yourself once the pass is retired. Override it only for resources of your
own: the render passes added in `build` go with the view's graph, and a plain `UniformGroup`
needs no release.

#### Returns

`void`

#### Example

```ts
view.passes = [];
wireframe.destroy();
```
