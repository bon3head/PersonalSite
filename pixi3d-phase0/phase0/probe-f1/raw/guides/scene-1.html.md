# Meshes

A [Mesh3D](scene.Mesh3D.html.md) draws a shape. It pairs a [Geometry3D](geometry.Geometry3D.html.md), the vertices that make up the shape, with a material, which decides how its surface looks. A mesh is a [Container3D](scene.Container3D.html.md), a node in the scene tree like a 2D `Container`, so you position, rotate, scale and group it as [Scene graph and transforms](core-concepts.html.md) shows.

## Creating a mesh

Pass a geometry and a material to the constructor, then add the mesh under the view's [root](scene.View3D.html#root):

```ts
import { CubeGeometry, Material3D, Mesh3D } from '@pixi/3d';

const cube = new Mesh3D({
  geometry: new CubeGeometry({ width: 0.8, height: 0.8, depth: 0.8 }),
  material: new Material3D({ baseColor: 0xdd4444, roughness: 0.5 }),
});

cube.position.y = 0.4; // the cube is centred on its origin, so this puts its base at y = 0
view3d.root.addChild(cube);
```

The constructor also takes node options such as `position`, and mesh settings such as `castShadow: false`; [Mesh3DOptions](scene.Mesh3DOptions.html.md) lists them. A mesh without a geometry or a material draws nothing and logs no warning.

Unlike a 2D sprite or mesh, a `Mesh3D` has no `texture`, `tint` or `alpha`. Colour, textures and opacity belong to its material. A [Sprite3D](scene.Sprite3D.html.md) has all three, and they write to its material. To fade a mesh, set its material's [alphaMode](materials.BaseMaterial3D.html#alphamode) to `'blend'`. A [Material3D](materials.Material3D.html.md), [PhongMaterial](materials.PhongMaterial.html.md) or [FlatMaterial](materials.FlatMaterial.html.md) starts at `'opaque'`, which ignores its [alpha](materials.BaseMaterial3D.html#alpha). [Materials](materials.html.md) covers the modes.

## Sharing geometry and materials

Any number of meshes can use one geometry or material. Build each shape once and share it. Meshes draw together in one draw call, a single request to the GPU, only when they share the same geometry object. [Performance](core-concepts-5.html.md) explains when meshes with different materials still share a draw call.

```ts
import { CubeGeometry, Material3D, Mesh3D } from '@pixi/3d';

const geometry = new CubeGeometry();
const materials = [0x4f9ed9, 0xd96c4f, 0x6fbf5c].map((color) => new Material3D({ baseColor: color, roughness: 0.7 }));

for (let i = 0; i < 30; i++) {
  const crate = new Mesh3D({ geometry, material: materials[i % materials.length] });

  crate.position.set(((i % 6) - 2.5) * 1.25, 0.5, (Math.floor(i / 6) - 2) * 1.25);
  view3d.root.addChild(crate);
}
```

A change to a shared material, such as `crate.material.baseColor = 0xff0000`, shows on every mesh that uses it. To change one mesh, give it a material of its own. Make a copy with [clone](materials.BaseMaterial3D.html#clone), such as `crate.material = crate.material.clone({ baseColor: 0xff0000 })`, or use a different material, as the hover highlight in the next section does.

Destroying a mesh you build with `new Mesh3D` leaves its geometry and material alone, since they're often shared. `destroy(true)` destroys them and the material's textures, even while other meshes use them. [Resources and cleanup](core-concepts-2.html.md) covers the [Destroy3DOptions](scene.Destroy3DOptions.html.md) flags that pick which of them to destroy.

## Swapping geometry and material

Assign a new [geometry](scene.Mesh3D.html#geometry) or [material](scene.Mesh3D.html#material) at any time, and the mesh draws with it from the next render. The mesh doesn't destroy the old one, so you can swap back to it or destroy it yourself once nothing uses it. A hover highlight is a common use:

```ts
import { Material3D } from '@pixi/3d';

const highlight = new Material3D({ baseColor: 0xffe08a, roughness: 0.3 });

// Then, for each crate inside the loop above:
const plain = crate.material;

crate.eventMode = 'static';
crate.on('pointerover', () => {
  crate.material = highlight;
});
crate.on('pointerout', () => {
  crate.material = plain;
});
```

A [Model3D](scene.Model3D.html.md), the tree of nodes built from a glTF model file, holds `Mesh3D`s too, and they share the file's materials with every model built from it. [model.materials](scene.Model3D.html#materials) swaps the materials of every mesh in one model at once and leaves the other models as they were. Set it to a function, and the function runs once for each of the file's materials. This one gives every mesh in the model a clay material:

```ts
import { Material3D } from '@pixi/3d';

const clay = new Material3D({ baseColor: 0xe91e63, roughness: 0.45 });

model.materials = () => clay;
```

To give a model its own copies of the file's materials instead, see [Loading models](assets.html.md).

## Bounding sphere

[boundingSphere](scene.Mesh3D.html#boundingsphere) is a sphere that encloses the mesh. It's in world space, the coordinates of the scene as a whole. Testing it against the camera's [frustum](scene.Camera3D.html#frustum), the volume the camera sees, tells you roughly whether the mesh is on screen. Use it in game logic, such as skipping work for enemies nobody can see:

```ts
const inView = view3d.camera.frustum.intersectsSphere(enemy.boundingSphere);
```

A [Model3D](scene.Model3D.html.md) has no sphere of its own; test the meshes inside it.

Don't use the sphere to hide off-screen meshes as you might in 2D. The view already skips drawing them by default, as [Performance](core-concepts-5.html.md) explains. A hidden mesh's sphere also stops following the mesh when it moves, so a mesh you hid can stay hidden after it moves back into view.

- The sphere follows the mesh's [worldTransform](scene.Container3D.html#worldtransform), which the view updates as it renders. A move you make, or a mesh you add, shows up in the sphere only after the next render.
- The sphere doesn't bend with a skeleton, so an animated character's limbs can reach outside it.
- A mesh whose geometry is [dynamic](geometry.Geometry3DOptions.html#dynamic), such as a [ParticleContainer3D](scene.ParticleContainer3D.html.md), has an empty sphere, so the frustum test always says it's off screen.

## Other mesh settings

- **Shadows.** Once a light in the view casts shadows, a mesh you build with `new Mesh3D` casts and receives them by default. [Shadows](scene-5.html.md) covers [castShadow](scene.Mesh3D.html#castshadow) and [receiveShadow](scene.Mesh3D.html#receiveshadow), and the materials that cast no shadows or show none.
- **Back faces.** By default a material draws only the front of each triangle, so a plane seen from behind disappears unless you build its material with [doubleSided](materials.BaseMaterial3DOptions.html#doublesided) on. See [Materials](materials.html.md). To face a mesh the other way, turn it with its [rotation](scene.Container3D.html#rotation), not a negative scale as you'd flip a 2D sprite. A mesh that [faces the camera](scene-6.html.md) ignores a negative `scale.x` and a turn about its up axis, so neither flips it.
- **Facing the camera.** [billboardMode](scene.Mesh3D.html#billboardmode) turns a mesh to face the camera as it's drawn, as a [Sprite3D](scene.Sprite3D.html.md) does by default. [Sprite3D](scene-6.html.md) covers the modes.
- **Bending.** A skinned mesh, one that bends with a skeleton of bones like a character's limbs, has a [skeleton](scene.Mesh3D.html#skeleton). A mesh whose geometry has morph targets, extra shapes it can blend toward, has [weights](scene.Mesh3D.html#weights). [Animation](animation.html.md) covers both.
- **Pointer events.** A mesh takes pointer events once you set its [eventMode](scene.Container3D.html#eventmode) to `'static'`. The hit test uses the bounding box of the mesh's geometry unless you give the mesh a [hitVolume](scene.Container3D.html#hitvolume). See [Interaction](events.html.md).
- **Render passes.** A render pass is one drawing step of a frame, such as drawing outlines. [enablePass](scene.Mesh3D.html#enablepass) adds one mesh to a pass and [disablePass](scene.Mesh3D.html#disablepass) takes it out, without changing a material it shares with other meshes. `enablePass('outline')` shows nothing until you add an [OutlinePass](extras_post-processing.OutlinePass.html.md) to the view's [passes](scene.View3D.html#passes). [Mesh passes](extras_post-processing.html.md) shows how, and [Passes per mesh](/3d/examples?example=post_passes-per-mesh) outlines one of several meshes that share a material.

## Next steps

- [Geometry](geometry.html.md): the built-in shapes and building your own.
- [Materials](materials.html.md): choosing a material and its features.
- [Loading models](assets.html.md): meshes from glTF files.
- [Batched meshes](scene-7.html.md): thousands of copies from one node.
