# Interface: Material3DOptions

Options for [Material3D](materials.Material3D.html.md)

Each extension (`emissive`, `specular`, `iridescence`, `transmission`, `clearcoat`, `sheen`,
`anisotropy`) is a group that turns the feature on when passed, even empty: `clearcoat: {}` adds a
full-strength coat. Inside a group, each factor and strength defaults to 1 and each colour to
white; the glTF loader passes each extension's own defaults instead.

## Example

```ts
const options: Material3DOptions = { baseColor: 0x8c1c13, roughness: 0.4, clearcoat: {} };
const carPaint = new Material3D(options);
```

## Extends

- [`Omit`](https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys)\<[`BaseMaterial3DOptions`](materials.BaseMaterial3DOptions.html.md), `"descriptor"`\>

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

#### Inherited from

[`BaseMaterial3DOptions`](materials.BaseMaterial3DOptions.html.md).[`alpha`](materials.BaseMaterial3DOptions.html#alpha)

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

#### Inherited from

[`BaseMaterial3DOptions`](materials.BaseMaterial3DOptions.html.md).[`alphaCutoff`](materials.BaseMaterial3DOptions.html#alphacutoff)

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

#### Inherited from

[`BaseMaterial3DOptions`](materials.BaseMaterial3DOptions.html.md).[`alphaMode`](materials.BaseMaterial3DOptions.html#alphamode)

***

### anisotropy?

> `optional` **anisotropy?**: [`AnisotropyOptions`](materials.AnisotropyOptions.html.md)

Highlights stretched along one direction; passing the group turns it on

#### Example

```ts
const pan = new Material3D({ metallic: 1, anisotropy: {} });
```

***

### baseColor?

> `optional` **baseColor?**: [`ColorSource`](https://pixijs.download/release/docs/index.html)

Base colour tint; the source's alpha is ignored, [BaseMaterial3DOptions#alpha](materials.BaseMaterial3DOptions.html#alpha) sets opacity

#### Example

```ts
new Material3D({ baseColor: 0xff7733 });
```

#### Inherited from

[`BaseMaterial3DOptions`](materials.BaseMaterial3DOptions.html.md).[`baseColor`](materials.BaseMaterial3DOptions.html#basecolor)

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

#### Inherited from

[`BaseMaterial3DOptions`](materials.BaseMaterial3DOptions.html.md).[`baseColorTexture`](materials.BaseMaterial3DOptions.html#basecolortexture)

***

### clearcoat?

> `optional` **clearcoat?**: [`ClearcoatOptions`](materials.ClearcoatOptions.html.md)

Clear lacquer layer on top; passing the group turns it on

#### Example

```ts
const pianoBlack = new Material3D({ baseColor: 0x050505, clearcoat: {} });
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

#### Inherited from

[`BaseMaterial3DOptions`](materials.BaseMaterial3DOptions.html.md).[`doubleSided`](materials.BaseMaterial3DOptions.html#doublesided)

***

### emissive?

> `optional` **emissive?**: [`EmissiveOptions`](materials.EmissiveOptions.html.md)

The material's own glow; passing the group turns it on

#### Example

```ts
const lava = new Material3D({ emissive: { texture: lavaGlow, strength: 4 } });
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

#### Inherited from

[`BaseMaterial3DOptions`](materials.BaseMaterial3DOptions.html.md).[`extraBits`](materials.BaseMaterial3DOptions.html#extrabits)

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

#### Inherited from

[`BaseMaterial3DOptions`](materials.BaseMaterial3DOptions.html.md).[`flatShading`](materials.BaseMaterial3DOptions.html#flatshading)

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

#### Inherited from

[`BaseMaterial3DOptions`](materials.BaseMaterial3DOptions.html.md).[`fog`](materials.BaseMaterial3DOptions.html#fog)

***

### ior?

> `optional` **ior?**: `number`

Index of refraction, see [Material3D#ior](materials.Material3D.html#ior)

#### Default

```ts
1.5
```

#### Example

```ts
const water = new Material3D({ ior: 1.33, transmission: { thickness: 1 } });
```

***

### iridescence?

> `optional` **iridescence?**: [`IridescenceOptions`](materials.IridescenceOptions.html.md)

Thin-film colour shift; passing the group turns it on

#### Example

```ts
const soapBubble = new Material3D({ iridescence: {}, transmission: {} });
```

***

### label?

> `optional` **label?**: `string`

Name for debugging and for finding the material; the glTF loader sets it to the name in the file

#### Example

```ts
new Material3D({ label: 'Paint' });
```

#### Inherited from

[`BaseMaterial3DOptions`](materials.BaseMaterial3DOptions.html.md).[`label`](materials.BaseMaterial3DOptions.html#label)

***

### metallic?

> `optional` **metallic?**: `number`

Metalness, from 0 (non-metal) to 1 (metal)

#### Default

```ts
0
```

#### Example

```ts
const gold = new Material3D({ baseColor: 0xffc356, metallic: 1, roughness: 0.25 });
```

***

### metallicRoughnessTexture?

> `optional` **metallicRoughnessTexture?**: [`Texture`](https://pixijs.download/release/docs/index.html)\<[`TextureSource`](https://pixijs.download/release/docs/index.html)\<`any`\>\>

Map with roughness in green and metalness in blue, as in glTF; scales `roughness` and
`metallic`

#### Example

```ts
const rusty = new Material3D({ metallic: 1, metallicRoughnessTexture: rustMap });
```

***

### normalScale?

> `optional` **normalScale?**: `number`

Strength of the normal map's bumps

#### Default

```ts
1
```

#### Example

```ts
const shallow = new Material3D({ normalTexture: brickNormals, normalScale: 0.5 });
```

***

### normalTexture?

> `optional` **normalTexture?**: [`Texture`](https://pixijs.download/release/docs/index.html)\<[`TextureSource`](https://pixijs.download/release/docs/index.html)\<`any`\>\>

Tangent-space normal map, green up as in glTF and OpenGL

Invert the green channel of a DirectX-style map, or its bumps light from the wrong side. Needs UVs
on the geometry, and uses its tangents when it has them. Can be assigned later through
`material.textures.normal`; a material without one pays nothing for normal mapping.

#### Example

```ts
const bricks = new Material3D({ baseColorTexture: brickColour, normalTexture: brickNormals });
```

***

### occlusionStrength?

> `optional` **occlusionStrength?**: `number`

Multiplier on the occlusion, see [Material3D#occlusionStrength](materials.Material3D.html#occlusionstrength)

#### Default

```ts
1
```

#### Example

```ts
const softer = new Material3D({ occlusionTexture: crateOcclusion, occlusionStrength: 0.8 });
```

***

### occlusionTexture?

> `optional` **occlusionTexture?**: [`Texture`](https://pixijs.download/release/docs/index.html)\<[`TextureSource`](https://pixijs.download/release/docs/index.html)\<`any`\>\>

Ambient occlusion map, read from red; it darkens ambient and environment light only

#### Example

```ts
const crate = new Material3D({ baseColorTexture: crateColour, occlusionTexture: crateOcclusion });
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

#### Inherited from

[`BaseMaterial3DOptions`](materials.BaseMaterial3DOptions.html.md).[`passes`](materials.BaseMaterial3DOptions.html#passes)

***

### roughness?

> `optional` **roughness?**: `number`

Perceptual roughness, from 0 (mirror-like) to 1 (fully rough)

#### Default

```ts
1
```

#### Example

```ts
const polished = new Material3D({ roughness: 0.1 });
```

***

### sheen?

> `optional` **sheen?**: [`SheenOptions`](materials.SheenOptions.html.md)

Cloth sheen; passing the group turns it on

#### Example

```ts
const cushion = new Material3D({ sheen: { color: 0xffffff, roughness: 0.5 } });
```

***

### specular?

> `optional` **specular?**: [`SpecularOptions`](materials.SpecularOptions.html.md)

Strength and tint of non-metal reflections; passing the group turns it on

#### Example

```ts
const lacquer = new Material3D({ specular: { color: 0xfff4e0 } });
```

***

### textures?

> `optional` **textures?**: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, [`Texture`](https://pixijs.download/release/docs/index.html)\<[`TextureSource`](https://pixijs.download/release/docs/index.html)\<`any`\>\> \| `undefined`\>

**`Advanced`**

Textures by slot name, for the slots a `descriptor` or `extraBits` declares

The bits' `textures` arrays decide which slots exist; this map only fills them. A slot left out
gets `Texture.WHITE`. A `baseColor` entry here wins over
[BaseMaterial3DOptions#baseColorTexture](materials.BaseMaterial3DOptions.html#basecolortexture).

#### Example

```ts
new BaseMaterial3D({
  descriptor: { bitsGpu: [waterBit], bitsGl: [waterBit] },
  textures: { waterNormal: waterNormalTexture },
});
```

#### Inherited from

[`BaseMaterial3DOptions`](materials.BaseMaterial3DOptions.html.md).[`textures`](materials.BaseMaterial3DOptions.html#textures)

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

#### Inherited from

[`BaseMaterial3DOptions`](materials.BaseMaterial3DOptions.html.md).[`topology`](materials.BaseMaterial3DOptions.html#topology)

***

### transmission?

> `optional` **transmission?**: [`TransmissionOptions`](materials.TransmissionOptions.html.md)

Glass and other see-through surfaces; passing the group turns it on

#### Example

```ts
const pane = new Material3D({ roughness: 0, transmission: {} });
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

#### Inherited from

[`BaseMaterial3DOptions`](materials.BaseMaterial3DOptions.html.md).[`uvTransform`](materials.BaseMaterial3DOptions.html#uvtransform)

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

#### Inherited from

[`BaseMaterial3DOptions`](materials.BaseMaterial3DOptions.html.md).[`vertexColors`](materials.BaseMaterial3DOptions.html#vertexcolors)
