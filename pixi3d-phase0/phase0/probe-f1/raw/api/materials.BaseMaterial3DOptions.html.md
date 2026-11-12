# Interface: BaseMaterial3DOptions

Constructor options shared by every [BaseMaterial3D](materials.BaseMaterial3D.html.md) subclass

## Example

```ts
interface MyGlowMaterialOptions extends BaseMaterial3DOptions {
  intensity?: number;
}
```

## Extended by

- [`PortalMaterialOptions`](extras_materials.PortalMaterialOptions.html.md)
- [`ToonMaterialOptions`](extras_materials.ToonMaterialOptions.html.md)

## Properties

### alpha?

> `optional` **alpha?**: `number`

Base opacity; `alphaMode: 'opaque'` ignores it

#### Default

```ts
1
```

#### Example

```ts
new Material3D({ alphaMode: 'blend', alpha: 0.4 });
```

***

### alphaCutoff?

> `optional` **alphaCutoff?**: `number`

Alpha below which fragments are discarded when `alphaMode` is `'mask'`

#### Default

```ts
0.5
```

#### Example

```ts
new Material3D({ baseColorTexture: leafTexture, alphaMode: 'mask', alphaCutoff: 0.3 });
```

***

### alphaMode?

> `optional` **alphaMode?**: [`AlphaMode`](materials.AlphaMode.html.md)

How alpha is treated; see [AlphaMode](materials.AlphaMode.html.md)

#### Default

```ts
'opaque'
```

#### Example

```ts
new Material3D({ baseColorTexture: leafTexture, alphaMode: 'mask' });
```

***

### baseColor?

> `optional` **baseColor?**: [`ColorSource`](https://pixijs.download/release/docs/index.html)

Base colour tint; the source's alpha is ignored, [BaseMaterial3DOptions#alpha](#alpha) sets opacity

#### Example

```ts
new Material3D({ baseColor: 0xff7733 });
```

***

### baseColorTexture?

> `optional` **baseColorTexture?**: [`Texture`](https://pixijs.download/release/docs/index.html)\<[`TextureSource`](https://pixijs.download/release/docs/index.html)\<`any`\>\>

Base colour (albedo) texture

#### Default

```ts
Texture.WHITE
```

#### Example

```ts
new Material3D({ baseColorTexture: crateTexture });
```

***

### descriptor?

> `optional` **descriptor?**: [`ShaderDescriptorOptions`](rendering.ShaderDescriptorOptions.html.md)

**`Advanced`**

Shader bits for the material's main pass, for a custom material

The material's textures and data are laid out from `bitsGpu`, so `bitsGl` must declare the same
texture names in the same order, or the constructor throws. A material whose bits change with
its settings overrides [BaseMaterial3D#getPrimaryDescriptor](materials.BaseMaterial3D.html#getprimarydescriptor) instead.

#### Example

```ts
new BaseMaterial3D({
  descriptor: { bitsGpu: [myBit], bitsGl: [myBit] },
});
```

***

### doubleSided?

> `optional` **doubleSided?**: `boolean`

When `true`, back faces are drawn too and lit with their normal flipped

Fixed at construction.

#### Default

```ts
false
```

#### Example

```ts
new Material3D({ baseColorTexture: leafTexture, alphaMode: 'mask', doubleSided: true });
```

***

### extraBits?

> `optional` **extraBits?**: readonly [`ShaderBit`](rendering.ShaderBit.html.md)[]

**`Advanced`**

Extra shader bits composed into the material's shader, fixed for its lifetime

[Material3D](materials.Material3D.html.md), [PhongMaterial](materials.PhongMaterial.html.md) and [FlatMaterial](materials.FlatMaterial.html.md) each document where they sit
in their bit list; on a material built from a raw `descriptor`, as `ToonMaterial` and
`PortalMaterial` are, they follow its bits. A bit may declare material fields and textures;
fill its textures through the `textures` option, or later through
[BaseMaterial3D#textures](materials.BaseMaterial3D.html#textures). A bit that uses `PI` or `INV_PI` lists
[mathConstantsBit](rendering.mathConstantsBit.html.md) in its [ShaderBit#requires](rendering.ShaderBit.html#requires) rather than declaring them, and one that
calls `screenUVFromWorld` or `sampleScreenCopy` lists [screenSpaceFuncsBit](rendering.screenSpaceFuncsBit.html.md). To add bits to a
material that exists, such as one the glTF loader built, `material.clone({ extraBits })` makes a
copy with them and everything else the material has. For billboarding, set
[Mesh3D#billboardMode](scene.Mesh3D.html#billboardmode) instead.

#### Example

```ts
new Material3D({ baseColor: 0xff3355, extraBits: [glossBit] });
```

***

### flatShading?

> `optional` **flatShading?**: `boolean`

When `true`, each triangle is shaded with its face normal instead of the smooth vertex normal

Gives a faceted, low-poly look with no duplicated vertices, so one geometry can draw smooth or
faceted depending on its material. A normal map still applies on top. No visible effect on an
unlit material such as [FlatMaterial](materials.FlatMaterial.html.md). Fixed at construction.

#### Default

```ts
false
```

#### Example

```ts
new Material3D({ baseColor: 0x8a7f72, flatShading: true });
```

***

### fog?

> `optional` **fog?**: `boolean`

Whether the view's distance [fog](scene.View3D.html#fog) may reach this material

Turn it off for skyboxes, water and anything else with its own distance falloff; a sky dome
past the fog's far distance would turn flat fog colour. Fixed at construction.

#### Default

```ts
true
```

#### Example

```ts
new Material3D({ baseColorTexture: skyTexture, fog: false });
```

***

### label?

> `optional` **label?**: `string`

Name for debugging and for finding the material; the glTF loader sets it to the name in the file

#### Example

```ts
new Material3D({ label: 'Paint' });
```

***

### passes?

> `optional` **passes?**: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `boolean` \| [`PassDescriptorOptions`](materials.PassDescriptorOptions.html.md)\>

Extra render passes this material draws in, keyed by the pass's `name`

- `true`: draw in the pass with the pass's own shader and state.
- a [PassDescriptorOptions](materials.PassDescriptorOptions.html.md) object: draw in it with your own shader, state or topology.
  [PassDescriptor](materials.PassDescriptor.html.md) says how these combine with the pass's own; they can't change later.
- `false`, or left out: don't draw in it. Useful for opting out of a pass that spread options
  or a subclass default turned on.

A material can name a pass before the pass exists. A page has room for 24 custom pass names,
`'outline'` included, each taken the first time anything names it; a name past that joins
nothing, and a pass with it draws no meshes, without a warning.

#### Example

```ts
view.passes = [new OutlinePass({ width: 0.05 })];
const hero = new Material3D({ baseColor: 0xff7733, passes: { outline: true } });
```

***

### textures?

> `optional` **textures?**: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, [`Texture`](https://pixijs.download/release/docs/index.html)\<[`TextureSource`](https://pixijs.download/release/docs/index.html)\<`any`\>\> \| `undefined`\>

**`Advanced`**

Textures by slot name, for the slots a `descriptor` or `extraBits` declares

The bits' `textures` arrays decide which slots exist; this map only fills them. A slot left out
gets `Texture.WHITE`. A `baseColor` entry here wins over
[BaseMaterial3DOptions#baseColorTexture](#basecolortexture).

#### Example

```ts
new BaseMaterial3D({
  descriptor: { bitsGpu: [waterBit], bitsGl: [waterBit] },
  textures: { waterNormal: waterNormalTexture },
});
```

***

### topology?

> `optional` **topology?**: [`Topology`](https://pixijs.download/release/docs/index.html)

Primitive topology for every pass that doesn't set its own; left out, the geometry's is used

`'line-list'` joins the indices in pairs, so a triangle index buffer drawn that way isn't a
wireframe: it draws some edges and misses others. Use a geometry with line indices for that.

#### Example

```ts
new FlatMaterial({ baseColor: 0x00ff00, topology: 'point-list' });
```

***

### uvTransform?

> `optional` **uvTransform?**: [`Matrix`](https://pixijs.download/release/docs/index.html)

UV transform for every texture of the material; see [BaseMaterial3D#uvTransform](materials.BaseMaterial3D.html#uvtransform)

Leave it out to let a framed (spritesheet) base colour texture set the transform.

#### Example

```ts
new Material3D({ baseColorTexture: tileTexture, uvTransform: new Matrix().scale(4, 4) });
```

***

### vertexColors?

> `optional` **vertexColors?**: `boolean`

Whether a geometry's vertex colours (its `colors`) tint this material; see
[BaseMaterial3D#vertexColors](materials.BaseMaterial3D.html#vertexcolors)

#### Default

```ts
false
```

#### Example

```ts
new Material3D({ vertexColors: true });
```
