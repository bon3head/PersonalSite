# Class: PhongMaterial

A Blinn-Phong material: diffuse shading plus a specular highlight

Cheaper than [Material3D](materials.Material3D.html.md) and easy to art-direct: `shininess` sets the size of the
highlight and `specularColor` its tint. A Phong mesh and a PBR mesh read at the same brightness
under the same lights.

The view's `environment` adds diffuse fill only; highlights come from direct lights, so use
[Material3D](materials.Material3D.html.md) for surfaces that should reflect their surroundings. The specular and emissive
maps cost nothing unless you pass them at construction, and the normal map costs nothing until
you assign one.

`extraBits` run after the material's own maps and before lighting, so they see the textured
`albedo` and `alpha`. Their `end` code runs after lighting and before tone mapping.

## Example

```ts
const material = new PhongMaterial({
  baseColor: 0x2f6f8b,
  specularColor: 0x777777,
  shininess: 48,
});
```

## Extends

- [`BaseMaterial3D`](materials.BaseMaterial3D.html.md)\<[`PhongData`](materials.PhongData.html.md), [`PhongMaterialTextures`](materials.PhongMaterialTextures.html.md), [`PhongMaterialOptions`](materials.PhongMaterialOptions.html.md)\>

## Constructors

### Constructor

> **new PhongMaterial**(`options?`): `PhongMaterial`

#### Parameters

##### options?

[`PhongMaterialOptions`](materials.PhongMaterialOptions.html.md) = `{}`

#### Returns

`PhongMaterial`

#### Overrides

[`BaseMaterial3D`](materials.BaseMaterial3D.html.md).[`constructor`](materials.BaseMaterial3D.html#constructor)

## Properties

### colorSpace

> **colorSpace**: [`ColorSpace`](materials.ColorSpace.html.md) = `'linear'`

**`Advanced`**

The colour space this material's shader works in; see [ColorSpace](materials.ColorSpace.html.md)

`'display'` takes effect only on an unlit material, in a view with `toneMapping: 'none'` and no
enabled `'beforeToneMapping'` effect, on a mesh no fog or vertex colours reach. Anywhere else
the shader works in linear light. To change it after the material has rendered, see
[BaseMaterial3D](materials.BaseMaterial3D.html.md).

Bits on a `'display'` material should read colours through these helpers, which exist in both
shader stages and return the colour in the shader's space:

- `decodeColor(c: vec3)`: a display colour, such as a texture sample.
- `inputTint(linearTint: vec4, displayTint: vec4)`: pass `material.baseColor` and
  `material.displayBaseColor`, which the material fills once a bit declares them in
  `bindings.material`.
- `decodeFrame(c: vec3)`: a colour from a frame this view drew, such as a render-texture feed.

Multiplying colours read this way gives the same bytes in both spaces. Adding, blending or
scaling them by a number doesn't, so the result changes when fog moves the shader to linear
light. On the display path, a [SceneOutput](rendering.SceneOutput.html.md) bit that reads `albedo` sees display colours.

#### Default

```ts
'linear'
```

#### Example

```ts
class MyStickerMaterial extends BaseMaterial3D {
  public override colorSpace: ColorSpace = 'display';
  public override lit = false;
}
```

#### Inherited from

[`BaseMaterial3D`](materials.BaseMaterial3D.html.md).[`colorSpace`](materials.BaseMaterial3D.html#colorspace)

***

### data

> **data**: [`PhongData`](materials.PhongData.html.md)

The values the material's shader reads, one property per field its bits declare; see
[MaterialData](materials.MaterialData.html.md) for how they read and write

#### Example

```ts
const toon = new ToonMaterial({ bands: 3 });
toon.data.bands = 5;
```

#### Inherited from

[`BaseMaterial3D`](materials.BaseMaterial3D.html.md).[`data`](materials.BaseMaterial3D.html#data)

***

### destroyed

> **destroyed**: `boolean` = `false`

Whether `destroy()` has run

#### Inherited from

[`BaseMaterial3D`](materials.BaseMaterial3D.html.md).[`destroyed`](materials.BaseMaterial3D.html#destroyed)

***

### doubleSided

> `readonly` **doubleSided**: `boolean`

Whether back faces are drawn too, lit with their normal flipped; set by the `doubleSided` option

#### Inherited from

[`BaseMaterial3D`](materials.BaseMaterial3D.html.md).[`doubleSided`](materials.BaseMaterial3D.html#doublesided)

***

### emissive?

> `readonly` `optional` **emissive?**: [`EmissiveProps`](materials.EmissiveProps.html.md)

Runtime glow controls; present only when the material was built with an `emissive` group

#### Example

```ts
const lantern = new PhongMaterial({ emissive: { color: 0xffaa33 } });
lantern.emissive!.strength = 3;
```

***

### extraBits

> `readonly` **extraBits**: readonly [`ShaderBit`](rendering.ShaderBit.html.md)[]

**`Advanced`**

The shader bits this material was built with on top of its own, from the
[extraBits](materials.BaseMaterial3DOptions.html#extrabits) option

Fixed for the material's lifetime. [BaseMaterial3D#clone](materials.BaseMaterial3D.html#clone) makes a copy with more.

#### Example

```ts
const dissolving = materials.filter((material) => material.extraBits.includes(dissolveBit));
```

#### Inherited from

[`BaseMaterial3D`](materials.BaseMaterial3D.html.md).[`extraBits`](materials.BaseMaterial3D.html#extrabits)

***

### flatShading

> `readonly` **flatShading**: `boolean`

Whether triangles are shaded with their face normal; set by the
[flatShading](materials.BaseMaterial3DOptions.html#flatshading) option

#### Example

```ts
const rock = new Material3D({ baseColor: 0x8a7f72, flatShading: true });
```

#### Inherited from

[`BaseMaterial3D`](materials.BaseMaterial3D.html.md).[`flatShading`](materials.BaseMaterial3D.html#flatshading)

***

### fog

> `readonly` **fog**: `boolean`

Whether the view's [fog](scene.View3D.html#fog) may reach this material; set by the
[fog](materials.BaseMaterial3DOptions.html#fog) option

#### Example

```ts
const sky = new Material3D({ baseColorTexture: skyTexture, fog: false });
```

#### Inherited from

[`BaseMaterial3D`](materials.BaseMaterial3D.html.md).[`fog`](materials.BaseMaterial3D.html#fog)

***

### label?

> `optional` **label?**: `string`

Name for debugging and for finding the material, such as the glTF material name the loader
gives it; a [Model3DOptions#materials](scene.Model3DOptions.html#materials) record matches it

#### Example

```ts
const paint = source.materials.filter((material) => material.label === 'Paint');
```

#### Inherited from

[`BaseMaterial3D`](materials.BaseMaterial3D.html.md).[`label`](materials.BaseMaterial3D.html#label)

***

### lit

> **lit**: `boolean` = `true`

Whether the material's shader does lighting

Set it to `false` for a shader that does none, as [FlatMaterial](materials.FlatMaterial.html.md) does. That leaves out
`calculateShadow`, so a shader that calls it fails to compile. To change it after the material
has rendered, see [BaseMaterial3D](materials.BaseMaterial3D.html.md).

#### Default

```ts
true
```

#### Example

```ts
class MyUnlitMaterial extends BaseMaterial3D {
  public override lit = false;
}
```

#### Inherited from

[`BaseMaterial3D`](materials.BaseMaterial3D.html.md).[`lit`](materials.BaseMaterial3D.html#lit)

***

### state

> **state**: [`State`](https://pixijs.download/release/docs/index.html)

Render state (blending, depth, culling) for every draw with this material

`alphaMode` and `doubleSided` set parts of it. To change a field after the material has
rendered, see [BaseMaterial3D](materials.BaseMaterial3D.html.md). `polygonOffset` works on WebGL only; WebGPU ignores it.

#### Example

```ts
// 'blend' draws it after the opaque meshes, so with no depth test it shows through them
const overlay = new FlatMaterial({ baseColor: 0xffcc00, alphaMode: 'blend' });
overlay.state.depthTest = false;
```

#### Inherited from

[`BaseMaterial3D`](materials.BaseMaterial3D.html.md).[`state`](materials.BaseMaterial3D.html#state)

***

### textures

> **textures**: [`PhongMaterialTextures`](materials.PhongMaterialTextures.html.md)

The material's textures by slot name, the same names the `textures` option takes

Assigning swaps the slot, and a name the material doesn't have throws. A swap reuses the
compiled shader, except that a real map in the `normal` slot, or the default put back, switches
normal mapping on or off.

Wrap mode, filtering and anisotropy come from each texture's `source.style`, which clamps by
default. To tile a texture, set `texture.source.style.addressMode = 'repeat'`, then call
`style.update()`.

#### Example

```ts
material.textures.baseColor = crateTexture;
```

#### Inherited from

[`BaseMaterial3D`](materials.BaseMaterial3D.html.md).[`textures`](materials.BaseMaterial3D.html#textures)

***

### topology?

> `readonly` `optional` **topology?**: [`Topology`](https://pixijs.download/release/docs/index.html)

Primitive topology for every pass that doesn't set its own; set by the
[topology](materials.BaseMaterial3DOptions.html#topology) option, and [PassDescriptor](materials.PassDescriptor.html.md) lists what overrides it

#### Inherited from

[`BaseMaterial3D`](materials.BaseMaterial3D.html.md).[`topology`](materials.BaseMaterial3D.html#topology)

***

### uid

> **uid**: `number`

**`Advanced`**

Unique id for this material instance

#### Inherited from

[`BaseMaterial3D`](materials.BaseMaterial3D.html.md).[`uid`](materials.BaseMaterial3D.html#uid)

***

### vertexColors

> **vertexColors**: `boolean` = `false`

Whether a geometry's vertex colours (its `colors`) tint this material

Off by default, since exporters often fill the colour set with masks or weights; put data that
isn't colour in [colors1](geometry.Geometry3DOptions.html#colors1) when you can. The glTF loader turns
it on, as glTF's `COLOR_0` is a base colour multiplier in linear light; convert colours picked
in sRGB with [srgbToLinear](materials.srgbToLinear.html.md). To change it after the material has rendered, see
[BaseMaterial3D](materials.BaseMaterial3D.html.md).

#### Default

```ts
false
```

#### Example

```ts
const painted = new Material3D();
painted.vertexColors = true;
```

#### Inherited from

[`BaseMaterial3D`](materials.BaseMaterial3D.html.md).[`vertexColors`](materials.BaseMaterial3D.html#vertexcolors)

## Accessors

### alpha

#### Get Signature

> **get** **alpha**(): `number`

Base opacity, from 0 to 1; `alphaMode: 'opaque'` ignores it

##### Default

```ts
1
```

##### Example

```ts
material.alphaMode = 'blend';
material.alpha = 0.5;
```

##### Returns

`number`

#### Set Signature

> **set** **alpha**(`value`): `void`

Sets the base opacity

##### Parameters

###### value

`number`

From 0 (transparent) to 1 (opaque)

##### Returns

`void`

#### Inherited from

[`BaseMaterial3D`](materials.BaseMaterial3D.html.md).[`alpha`](materials.BaseMaterial3D.html#alpha)

***

### alphaCutoff

#### Get Signature

> **get** **alphaCutoff**(): `number`

Alpha below which fragments are discarded while [BaseMaterial3D#alphaMode](materials.BaseMaterial3D.html#alphamode) is `'mask'`

##### Default

```ts
0.5
```

##### Example

```ts
material.alphaMode = 'mask';
material.alphaCutoff = 0.3;
```

##### Returns

`number`

#### Set Signature

> **set** **alphaCutoff**(`value`): `void`

Sets the alpha cutoff

##### Parameters

###### value

`number`

Alpha below which fragments are discarded

##### Returns

`void`

#### Inherited from

[`BaseMaterial3D`](materials.BaseMaterial3D.html.md).[`alphaCutoff`](materials.BaseMaterial3D.html#alphacutoff)

***

### alphaMode

#### Get Signature

> **get** **alphaMode**(): [`AlphaMode`](materials.AlphaMode.html.md)

How the material treats alpha; see [AlphaMode](materials.AlphaMode.html.md)

Setting it also sets the blending and depth writes of `state`. `'blend'` turns depth writes
off, and its meshes cast no shadow. On a material built from a raw `descriptor`, `'mask'`
discards only if the descriptor's bits include [alphaMaskBit](rendering.alphaMaskBit.html.md).

##### Example

```ts
material.alphaMode = 'blend';
material.alpha = 0.5;
```

##### Returns

[`AlphaMode`](materials.AlphaMode.html.md)

#### Set Signature

> **set** **alphaMode**(`value`): `void`

Sets the alpha mode

##### Parameters

###### value

[`AlphaMode`](materials.AlphaMode.html.md)

How alpha is treated

##### Returns

`void`

#### Inherited from

[`BaseMaterial3D`](materials.BaseMaterial3D.html.md).[`alphaMode`](materials.BaseMaterial3D.html#alphamode)

***

### baseColor

#### Get Signature

> **get** **baseColor**(): `number`

Base colour tint, read back as a hex number

Takes any `ColorSource` in display (sRGB) space, like `Container.tint`. The source's alpha is
ignored; [BaseMaterial3D#alpha](materials.BaseMaterial3D.html#alpha) is the opacity.

##### Example

```ts
material.baseColor = 'tomato';
material.baseColor; // 0xff6347
```

##### Returns

`number`

#### Set Signature

> **set** **baseColor**(`value`): `void`

Sets the base colour tint

##### Parameters

###### value

[`ColorSource`](https://pixijs.download/release/docs/index.html)

Display colour; its alpha is ignored

##### Returns

`void`

#### Inherited from

[`BaseMaterial3D`](materials.BaseMaterial3D.html.md).[`baseColor`](materials.BaseMaterial3D.html#basecolor)

***

### normalScale

#### Get Signature

> **get** **normalScale**(): `number`

Strength of the normal map's bumps, as glTF's `normalTextureInfo.scale`; 1 leaves the map as
authored

##### Example

```ts
material.normalScale = 2;
```

##### Returns

`number`

#### Set Signature

> **set** **normalScale**(`value`): `void`

Sets the strength of the normal map's bumps

##### Parameters

###### value

`number`

Multiplier on the bumps

##### Returns

`void`

***

### shininess

#### Get Signature

> **get** **shininess**(): `number`

Specular exponent: higher gives a smaller, sharper highlight

Values below 1 act as 1.

##### Example

```ts
material.shininess = 80;
```

##### Returns

`number`

#### Set Signature

> **set** **shininess**(`value`): `void`

Sets the specular exponent

##### Parameters

###### value

`number`

Specular exponent

##### Returns

`void`

***

### specularColor

#### Get Signature

> **get** **specularColor**(): `number`

Specular tint (rgb); takes any [ColorSource](https://pixijs.download/release/docs/index.html) and reads back a hex number, like
`Container.tint`

##### Example

```ts
material.specularColor = 'white';
```

##### Returns

`number`

#### Set Signature

> **set** **specularColor**(`value`): `void`

Sets the specular tint

##### Parameters

###### value

[`ColorSource`](https://pixijs.download/release/docs/index.html)

Display colour

##### Returns

`void`

***

### specularStrength

#### Get Signature

> **get** **specularStrength**(): `number`

Scales the whole highlight, Fresnel rim included; 0 removes it

A specular map multiplies on top of it.

##### Example

```ts
material.specularStrength = 0.5;
```

##### Returns

`number`

#### Set Signature

> **set** **specularStrength**(`value`): `void`

Sets the highlight scale

##### Parameters

###### value

`number`

Scale; 0 removes the highlight

##### Returns

`void`

***

### uvTransform

#### Get Signature

> **get** **uvTransform**(): [`Matrix`](https://pixijs.download/release/docs/index.html) \| `undefined`

The UV transform you set, or `undefined` while the base colour texture's frame sets it

One transform, as glTF's `KHR_texture_transform` defines it, applies to every texture of the
material. Setting a matrix takes over from a framed (spritesheet) base colour texture, and a
framed texture assigned while it's set warns that its frame is ignored; setting `undefined`
hands it back. Either is a data write, never a shader rebuild. On a material whose bits lack
[uvTransformBit](rendering.uvTransformBit.html.md), setting a matrix warns and does nothing.

A UV `(u, v)` becomes `(a * u + b * v + tx, c * u + d * v + ty)`, transposed from pixi's
`Matrix.apply`, so `new Matrix().rotate(rotation).scale(sx, sy).translate(x, y)` gives the
`KHR_texture_transform` result for those values. The getter returns the material's own matrix;
changing it in place does nothing until you assign it again.

##### Example

```ts
material.uvTransform = new Matrix().scale(4, 4);
material.uvTransform = undefined;
```

##### Returns

[`Matrix`](https://pixijs.download/release/docs/index.html) \| `undefined`

#### Set Signature

> **set** **uvTransform**(`m`): `void`

Sets the UV transform

##### Parameters

###### m

[`Matrix`](https://pixijs.download/release/docs/index.html) \| `undefined`

The transform, or `undefined` to follow the base colour texture's frame

##### Returns

`void`

#### Inherited from

[`BaseMaterial3D`](materials.BaseMaterial3D.html.md).[`uvTransform`](materials.BaseMaterial3D.html#uvtransform)

***

### EMPTY

#### Get Signature

> **get** `static` **EMPTY**(): [`BaseMaterial3D`](materials.BaseMaterial3D.html.md)

**`Advanced`**

A shared material with no shader, which a [Mesh3D](scene.Mesh3D.html.md) holds until it's given a material

A mesh on it draws nothing and compiles no shader, though its skeleton and morph targets still
upload. Assign it to a mesh's `material` to stop the mesh drawing; to hide a mesh for a
while, `visible = false` is cheaper. Don't give it to a [BatchedMesh3D](scene.BatchedMesh3D.html.md) slot that's in a
pass, even a hidden one: such a slot needs a real material.

Every waiting mesh shares it, so don't edit it. Its `destroy` does nothing, as with pixi's
`Texture.EMPTY`.

##### Example

```ts
if (mesh.material === BaseMaterial3D.EMPTY) mesh.material = new Material3D();
```

##### Returns

[`BaseMaterial3D`](materials.BaseMaterial3D.html.md)

#### Inherited from

[`BaseMaterial3D`](materials.BaseMaterial3D.html.md).[`EMPTY`](materials.BaseMaterial3D.html#empty)

## Methods

### clone()

> **clone**(`options?`): `this`

Makes a material of the same class that draws as this one does now, with the options you pass
changed

`options` are the class's constructor options. `clone` reads this material's current values
back as those options, merges yours over them, and passes the result to the class's
constructor. An option left out, or set to `undefined`, keeps this material's value. One that
takes an object, such as a feature group or `passes`, is merged one level deep:
`emissive: { strength: 2 }` on a [Material3D](materials.Material3D.html.md) keeps its emissive colour. `descriptor` is
replaced whole. A group the material doesn't have, such as `clearcoat`, adds the feature.

`extraBits` adds to this material's [BaseMaterial3D#extraBits](materials.BaseMaterial3D.html#extrabits), skipping a bit it already
has. Fields a new bit declares start at 0 and its texture slots hold `Texture.WHITE`, so set
them on the copy. The fields of the extra bits it already had keep their values.

A raw-`descriptor` material, or any class that inherits `BaseMaterial3D`'s `_toOptions`
unchanged, keeps every field value and texture it has, except those an option you pass sets.

What isn't an option comes across too: `colorSpace`, `lit`, the passes joined with
[BaseMaterial3D#enablePass](materials.BaseMaterial3D.html#enablepass), and `state` with any change made through it, except the
flags an option you pass sets, such as `alphaMode`'s blending. Colour options read back as
8-bit hex, as their getters return them.

Textures are shared, not copied. Everything else belongs to the copy: assign it to meshes and
`destroy()` it when you're done, which leaves the shared textures alive. Materials with the same
bits share compiled shaders, so a copy compiles nothing new unless its bits are new.

#### Parameters

##### options?

[`PhongMaterialOptions`](materials.PhongMaterialOptions.html.md)

Constructor options to change on the copy; left out, it's a plain copy.

#### Returns

`this`

The copy, of the same class.

#### Example

```ts
const dissolving = mesh.material.clone({ extraBits: [dissolveBit] });
dissolving.data.dissolve = 0.5;
mesh.material = dissolving;

const ghost = mesh.material.clone({ alphaMode: 'blend', alpha: 0.4 });
```

#### Inherited from

[`BaseMaterial3D`](materials.BaseMaterial3D.html.md).[`clone`](materials.BaseMaterial3D.html#clone)

***

### destroy()

> **destroy**(`options?`): `void`

Frees the material for good, as [BaseMaterial3D#destroy](materials.BaseMaterial3D.html#destroy) does

#### Parameters

##### options?

[`TypeOrBool`](https://pixijs.download/release/docs/index.html)\<[`TextureDestroyOptions`](https://pixijs.download/release/docs/index.html)\>

Whether to destroy the textures too

#### Returns

`void`

#### Example

```ts
mesh.material.destroy();
```

#### Overrides

[`BaseMaterial3D`](materials.BaseMaterial3D.html.md).[`destroy`](materials.BaseMaterial3D.html#destroy)

***

### disablePass()

> **disablePass**(`name`): `void`

Removes this material from a custom render pass

Meshes using the material leave the pass on the next render, except one that joined it through
[Mesh3D#enablePass](scene.Mesh3D.html#enablepass). An override given for the pass in the `passes` option is kept, so
[BaseMaterial3D#enablePass](materials.BaseMaterial3D.html#enablepass) brings it back.

#### Parameters

##### name

`string`

The pass's `name`, such as `'outline'`.

#### Returns

`void`

#### Example

```ts
material.disablePass('outline');
```

#### Inherited from

[`BaseMaterial3D`](materials.BaseMaterial3D.html.md).[`disablePass`](materials.BaseMaterial3D.html#disablepass)

***

### enablePass()

> **enablePass**(`name`): `void`

Adds this material to a custom render pass, such as an [OutlinePass](extras_post-processing.OutlinePass.html.md), as naming it `true`
in the `passes` option does

Meshes using the material draw in the pass from the next render, except one that left it
through [Mesh3D#disablePass](scene.Mesh3D.html#disablepass). [BatchedMesh3D](scene.BatchedMesh3D.html.md) slots take their passes from
[BatchedMesh3D#setPassesAt](scene.BatchedMesh3D.html#setpassesat) instead. Overrides for the pass can only be given at
construction, and the [passes](materials.BaseMaterial3DOptions.html#passes) option has the limit on
custom pass names.

#### Parameters

##### name

`string`

The pass's `name`, such as `'outline'`.

#### Returns

`void`

#### Example

```ts
view.passes = [new OutlinePass()];
material.enablePass('outline');
```

#### Inherited from

[`BaseMaterial3D`](materials.BaseMaterial3D.html.md).[`enablePass`](materials.BaseMaterial3D.html#enablepass)

***

### getPrimaryDescriptor()

> **getPrimaryDescriptor**(`view`): [`ShaderDescriptor`](rendering.ShaderDescriptor.html.md)

**`Advanced`**

The shader descriptor for a view, one per kind of environment

#### Parameters

##### view

[`View3D`](scene.View3D.html.md)

View whose environment picks the descriptor

#### Returns

[`ShaderDescriptor`](rendering.ShaderDescriptor.html.md)

#### Overrides

[`BaseMaterial3D`](materials.BaseMaterial3D.html.md).[`getPrimaryDescriptor`](materials.BaseMaterial3D.html#getprimarydescriptor)

***

### unload()

> **unload**(): `void`

Frees the GPU memory of this material's textures until a frame draws them again

The next frame that draws the material re-uploads them from their CPU copies, so it keeps
drawing the same. Texture sources are shared, so every other material using one re-uploads it
too, as with `texture.source.unload()`. The engine's default textures are skipped, and so are
render textures and [ContainerTexture](rendering.ContainerTexture.html.md)s, whose pixels exist only on the GPU.

Call [BatchedMesh3D#invalidate](scene.BatchedMesh3D.html#invalidate) for each batch slot that draws the material. Does nothing
once the material is destroyed.

#### Returns

`void`

#### Example

```ts
view.root.removeChild(model);
material.unload(); // hand the texture memory back until the model is shown again
```

#### See

[Model3D.unload](scene.Model3D.html#unload) For giving back a whole model's geometry and textures at once.

#### Inherited from

[`BaseMaterial3D`](materials.BaseMaterial3D.html.md).[`unload`](materials.BaseMaterial3D.html#unload)

***

### update()

> **update**(): `void`

Queues this material's data for upload

Property setters and `data` field assignments call it for you. Call it yourself after writing
into a `data` vector in place. Calls in one frame upload once.

#### Returns

`void`

#### Example

```ts
const scroll = material.data.scrollOffset;
scroll[0] += 0.01;
material.update();
```

#### Inherited from

[`BaseMaterial3D`](materials.BaseMaterial3D.html.md).[`update`](materials.BaseMaterial3D.html#update)
