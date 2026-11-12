# Introduction

PixiJS 3D, the `@pixi/3d` package, draws 3D scenes in a PixiJS application. A [View3D](scene.View3D.html.md) holds the scene. It's a display object you add to the stage like a sprite. [Hello cube](/3d/examples?example=start_hello-cube) shows the smallest scene, a cube and a light in a view.

## How 2D and 3D fit together

2D content later in the display list draws over the scene. 2D content earlier in the list shows behind it, unless you give the view a [background](scene.View3D.html#background). By default the view [catches pointer events](events.IView3DEvents.html#containspoint) anywhere in its rectangle, so the user can't click, tap or hover 2D content behind it. [Interaction](events.html.md) shows the ways around this.

The scene inside a view is its own tree of [Container3D](scene.Container3D.html.md) nodes under the view's [root](scene.View3D.html#root). A 2D display object can't go in that tree, and a 3D node can't go on the stage. To show 2D content on a 3D surface, draw it into a [ContainerTexture](rendering.ContainerTexture.html.md) ([Rendering 2D into 3D](rendering.html.md)). To pin a 2D label over a 3D object, use [worldToScreen](scene.View3D.html#worldtoscreen) ([View3D and 2D content](core-concepts-1.html.md)).

Inside the scene, +Y points up, and the defaults expect one unit to be a metre, not a pixel. A camera draws nothing past its [far](scene.Camera3D.html#far) distance, 1000 units by default, so it cuts off a scene built at pixel sizes.

## Features

Some parts come from `@pixi/3d/extras`, another entry point that [Installation](getting-started-1.html.md) explains.

- **Scene graph.** Meshes, models, lights and cameras are all nodes. Each has a position, rotation and scale relative to its parent. See [Scene graph and transforms](core-concepts.html.md) and [Scene objects](scene.html.md).
- **Meshes.** A [Mesh3D](scene.Mesh3D.html.md) draws a geometry with a material. The geometry is the shape, and the material is how its surface looks. Built-in geometries such as [CubeGeometry](geometry.CubeGeometry.html.md) make common shapes, and a [Geometry3D](geometry.Geometry3D.html.md) holds your own vertex data. See [Meshes](scene-1.html.md) and [Geometry](geometry.html.md). [Resources and cleanup](core-concepts-2.html.md) covers sharing geometries and materials between meshes and freeing their GPU memory.
- **Sprites and batched meshes.** A [Sprite3D](scene.Sprite3D.html.md) is a flat textured rectangle that turns to face the camera [by default](scene.Sprite3DOptions.html#billboardmode). [BatchedMesh3D](scene.BatchedMesh3D.html.md) draws thousands of rigid meshes from one node. See [Sprite3D](scene-6.html.md) and [Batched meshes](scene-7.html.md).
- **Models.** `Assets.load` reads glTF, an open standard format for 3D models, from `.gltf` and `.glb` files. A [Model3D](scene.Model3D.html.md) builds a loaded file's meshes, lights and cameras as nodes under itself. See [Loading models](assets.html.md) and [Compressed models](assets-1.html.md).
- **Animation.** The model's [player](scene.Model3D.html#player) [plays](animation.AnimationPlayer.html#play) a file's animation clips by name and [blends](animation.AnimationState.html#weight) them. See [Animation](animation.html.md).
- **Materials.** [Material3D](materials.Material3D.html.md) is physically based, so it shades a surface the way real materials reflect light. [PhongMaterial](materials.PhongMaterial.html.md) costs less per pixel, [FlatMaterial](materials.FlatMaterial.html.md) draws with no lighting, and the extras add [ToonMaterial](extras_materials.ToonMaterial.html.md) for cartoon shading. See [Materials](materials.html.md).
- **Lights and shadows.** A [DirectionalLight](scene.DirectionalLight.html.md) shines one way everywhere, like the sun. A [PointLight](scene.PointLight.html.md) shines every way from one point, like a bulb, and a [SpotLight](scene.SpotLight.html.md) shines in a cone, like a torch. An [AmbientLight](scene.AmbientLight.html.md) shines from no direction. Directional and spot lights can [cast shadows](scene.Light.html#castshadow). See [Lights](scene-4.html.md) and [Shadows](scene-5.html.md).
- **Environment.** The view's [environment](scene.View3D.html#environment) lights the scene from its surroundings. Use a [Hemisphere](environment.Hemisphere.html.md) for a sky-and-ground gradient, or a cube map for a picture of the surroundings on the six faces of a cube. See [Environment](environment.html.md).
- **Cameras.** A [Camera3D](scene.Camera3D.html.md)'s [mode](scene.Camera3D.html#mode) is perspective, where far things look smaller, or orthographic, where they don't. The extras' [OrbitCamera](extras_camera.OrbitCamera.html.md) lets the user drag the camera around a target point, and [FPSCamera](extras_camera.FPSCamera.html.md) gives first-person controls. See [Cameras](scene-2.html.md) and [Camera controls](extras_camera.html.md).
- **Interaction.** 3D nodes take PixiJS's pointer events. Set a node's [eventMode](scene.Container3D.html#eventmode) and listen on it as in 2D. See [Interaction](events.html.md).
- **Particles.** The extras' [ParticleSystem3D](extras_particles.ParticleSystem3D.html.md) emits and moves particles for effects such as fire and snow, and [ParticleContainer3D](scene.ParticleContainer3D.html.md) draws particles that your own code moves. See [Particles](extras_particles.html.md).
- **Post-processing.** The extras hold effects and passes. An effect changes the finished picture, and [BloomEffect](extras_post-processing.BloomEffect.html.md) is one that adds a glow. A pass is an extra drawing step that redraws meshes, and [OutlinePass](extras_post-processing.OutlinePass.html.md) is one that draws ink outlines. Both go in the view's [passes](scene.View3D.html#passes). See [Post-processing](extras_post-processing.html.md).
- **Math.** PixiJS 3D has [Vector3](maths.Vector3.html.md) and [Matrix4](maths.Matrix4.html.md), [Quaternion](maths.Quaternion.html.md) for rotations, and shapes such as [Ray](maths.Ray.html.md), [Plane](maths.Plane.html.md) and [Box](maths.Box.html.md). See [Math](maths.html.md).
- **Debugging.** The extras' [GraphDebugOverlay](extras_debug.GraphDebugOverlay.html.md) records frames and lists what each one drew. See [Debugging](extras_debug.html.md).

There's no physics engine; bring your own.

## Renderers and performance

PixiJS 3D draws with WebGPU or WebGL2. [WebGL and WebGPU](core-concepts-3.html.md) covers choosing one.

[Performance](core-concepts-5.html.md) explains what keeps a frame cheap and has a checklist for phones.

## Next steps

- [Installation](getting-started-1.html.md): install `@pixi/3d` and the `pixi.js` version it needs.
- [Quick start](getting-started-2.html.md): build a first scene step by step, then load a model into it.
- [View3D and 2D content](core-concepts-1.html.md): size a view and mix it with 2D content.
- [Scene graph and transforms](core-concepts.html.md): the axes and units, and where 3D differs from 2D.
