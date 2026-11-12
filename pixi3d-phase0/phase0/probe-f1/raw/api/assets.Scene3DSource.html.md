# Class: Scene3DSource

The geometries, materials, textures and animations loaded from a glTF or GLB file

A source is a template: add `new Model3D(source)` to a view, never the source itself. Every model
spawned from one source shares its geometries, materials and textures, so a change to a source
material shows on every model that draws it. [Model3D#materials](scene.Model3D.html#materials) gives one model materials
of its own.

The plural lists (`textures`, `materials`, `geometries`) hold everything, by index in the file.
The singular records (`texture`, `material`, `geometry`) hold only what the file named.

[loadGltf](assets.loadGltf.html.md) lists the texture formats a file can use and the imports they need.

## Example

```ts
import { Assets } from 'pixi.js';
import { Model3D, Scene3DSource } from '@pixi/3d';

const source = await Assets.load<Scene3DSource>('robot.glb');

// Two models sharing the same geometry, materials and textures
const robotA = new Model3D(source);
const robotB = new Model3D(source);

view3d.root.addChild(robotA, robotB);

// Repaints both robots
source.material['Helmet'].baseColor = 0xff0000;
```

## Properties

### animations

> `readonly` **animations**: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, [`Animation`](animation.Animation.html.md)\> = `{}`

Animation clips keyed by name; an unnamed clip is keyed `anim_<index>`

#### Example

```ts
const walkSeconds = source.animations['Walk'].duration;
```

***

### destroyed

> **destroyed**: `boolean` = `false`

Whether [Scene3DSource#destroy](#destroy) has run

#### Example

```ts
if (!source.destroyed) view3d.root.addChild(new Model3D(source));
```

***

### geometries

> `readonly` **geometries**: [`Geometry3D`](geometry.Geometry3D.html.md)[][] = `[]`

Every mesh's geometries, by its index in the file: one per primitive of the mesh

#### Example

```ts
const [body, glass] = source.geometries[0];
```

***

### geometry

> `readonly` **geometry**: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, [`Geometry3D`](geometry.Geometry3D.html.md)\> = `{}`

The geometry of each mesh the file names, keyed by mesh name

A mesh with several primitives maps to its first; [Scene3DSource#geometries](#geometries) has them all.

#### Example

```ts
const rock = new Mesh3D({ geometry: source.geometry['Rock'], material: new Material3D() });
```

***

### material

> `readonly` **material**: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, [`BaseMaterial3D`](materials.BaseMaterial3D.html.md)\> = `{}`

The materials the file names, keyed by name

#### Example

```ts
source.material['Paint'].baseColor = 0x3366ff;
```

***

### materials

> `readonly` **materials**: [`BaseMaterial3D`](materials.BaseMaterial3D.html.md)\<[`MaterialData`](materials.MaterialData.html.md), [`MaterialTextures`](materials.MaterialTextures.html.md), [`BaseMaterial3DOptions`](materials.BaseMaterial3DOptions.html.md)\>[] = `[]`

Every material, by its index in the file

Unlit materials load as [FlatMaterial](materials.FlatMaterial.html.md), the rest as [Material3D](materials.Material3D.html.md). When a mesh
primitive names no material, the glTF default material, a white `Material3D` with `metallic` and
`roughness` at 1, is added after the file's own.

#### Example

```ts
const pbrMaterials = source.materials.filter((material) => material instanceof Material3D);
```

***

### scene

> `readonly` **scene**: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, [`Scene3DEntry`](assets.Scene3DEntry.html.md)\> = `{}`

The scenes the file names, keyed by name

Pass a name as [Model3DOptions#scene](scene.Model3DOptions.html#scene) to spawn that scene instead of the default one.

#### Example

```ts
const showroom = new Model3D({ source, scene: 'Showroom' });
```

***

### texture

> `readonly` **texture**: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, [`Texture`](https://pixijs.download/release/docs/index.html)\> = `{}`

The textures the file names, keyed by name

#### Example

```ts
const logo = new Sprite(source.texture['Logo']);
```

***

### textures

> `readonly` **textures**: [`Texture`](https://pixijs.download/release/docs/index.html)\<[`TextureSource`](https://pixijs.download/release/docs/index.html)\<`any`\>\>[] = `[]`

Every texture, by its index in the file

Textures in the file that use the same image share one `Texture` and its style, so an entry can
repeat. The file's samplers set the style, and glTF's defaults (repeat wrapping, linear
filtering, mipmaps) fill whatever a sampler leaves out.

#### Example

```ts
for (const texture of source.textures) texture.source.style.maxAnisotropy = 8;
```

## Methods

### destroy()

> **destroy**(): `void`

Destroys every geometry, material and texture the source holds; a second call does nothing

Every [Model3D](scene.Model3D.html.md) spawned from this source draws these resources, so destroy or stop
rendering those models first. For a source from `Assets.load`, call `Assets.unload(url)`
instead. It destroys the source and also unloads every image the file referenced from the
loader's cache, even when another loaded asset still uses one.

#### Returns

`void`

#### Example

```ts
const source = await Assets.load<Scene3DSource>('robot.glb');
const robot = new Model3D(source);

// Later, once no model from it is rendered any more
robot.destroy();
await Assets.unload('robot.glb'); // calls source.destroy()
```
