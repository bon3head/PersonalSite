# Class: MeshPass

**`Advanced`**

Redraws every mesh that opts in by name, with an override shader and state

A material joins by naming the pass in its `passes` option, as in `passes: { outline: true }`,
and a single mesh with [Mesh3D#enablePass](scene.Mesh3D.html#enablepass). This pass draws them again: for outlines,
wireframes, selection masks or decals. Batching, skinning and morph targets work as in the main
draw.

## Example

```ts
new View3D({ passes: [new MeshPass({ name: 'wireframe', descriptor: wireframeDescriptor })] });
new Material3D({ passes: { wireframe: true } });
```

## Extends

- [`Pass3D`](rendering.Pass3D.html.md)

## Extended by

- [`OutlinePass`](extras_post-processing.OutlinePass.html.md)
- [`WireframePass`](extras_post-processing.WireframePass.html.md)

## Constructors

### Constructor

> **new MeshPass**(`options`): `MeshPass`

#### Parameters

##### options

[`MeshPassOptions`](rendering.MeshPassOptions.html.md)

#### Returns

`MeshPass`

#### Overrides

[`Pass3D`](rendering.Pass3D.html.md).[`constructor`](rendering.Pass3D.html#constructor)

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

#### Inherited from

[`Pass3D`](rendering.Pass3D.html.md).[`enabled`](rendering.Pass3D.html#enabled)

***

### name

> `readonly` **name**: `string`

Pass name materials opt in with

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

#### Inherited from

[`Pass3D`](rendering.Pass3D.html.md).[`requiredOutputs`](rendering.Pass3D.html#requiredoutputs)

## Accessors

### stage

#### Get Signature

> **get** **stage**(): [`SceneStage`](rendering.SceneStage.html.md)

The stage the pass draws at; [MeshPassOptions#stage](rendering.MeshPassOptions.html#stage) says how it's picked when left out

##### Returns

[`SceneStage`](rendering.SceneStage.html.md)

The [PassStage](rendering.PassStage.html.md) at which the view calls [Pass3D#build](rendering.Pass3D.html#build)

#### Overrides

[`Pass3D`](rendering.Pass3D.html.md).[`stage`](rendering.Pass3D.html#stage)

## Methods

### build()

> **build**(`graph`, `ctx`): `void`

Adds the draw of this pass's meshes

#### Parameters

##### graph

[`RenderGraph`](rendering.RenderGraph.html.md)

Render graph being built.

##### ctx

[`PassContext`](rendering.PassContext.html.md)

Renderer and shared handles for this build.

#### Returns

`void`

#### Overrides

[`Pass3D`](rendering.Pass3D.html.md).[`build`](rendering.Pass3D.html#build)

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

#### Inherited from

[`Pass3D`](rendering.Pass3D.html.md).[`destroy`](rendering.Pass3D.html#destroy)
