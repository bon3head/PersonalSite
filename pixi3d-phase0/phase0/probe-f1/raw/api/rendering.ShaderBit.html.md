# Type Alias: ShaderBit\<VERTEX_TAGS, FRAGMENT_TAGS, BIND_GROUPS\>

> **ShaderBit**\<`VERTEX_TAGS`, `FRAGMENT_TAGS`, `BIND_GROUPS`\> = `object`

**`Advanced`**

One piece of a shader: the attributes, varyings, bindings and code it adds to a template

A [ShaderDescriptor](rendering.ShaderDescriptor.html.md) lists the bits, and the compiler merges them into one program per
backend, filling each template slot with the bits' code in list order.

The type parameters narrow the slot and group names a bit may use:
- `VERTEX_TAGS`: the vertex slots, such as `['input', 'beforeTransform', 'afterTransform', 'end']`
- `FRAGMENT_TAGS`: the fragment slots, such as `['material', 'lighting', 'end']`
- `BIND_GROUPS`: the bind group names, such as `['global', 'camera', 'material']`

## Example

```ts
const colorBit: ShaderBit = {
  name: "color",
  attributes: {
    aPosition: "float32x3",
    aColor: "float32x4",
  },
  interStage: {
    vColor: "vec4<f32>",
  },
  bindings: {
    global: { uTime: "f32" },
    material: { uColor: "vec4<f32>" },
  },
  gpu: {
    vertex: { input: "output.vColor = input.aColor;" },
    fragment: { material: "albedo *= input.vColor.rgb * material.uColor.rgb;" },
  },
  gl: {
    vertex: { input: "vColor = aColor;" },
    fragment: { material: "albedo *= vColor.rgb * material.uColor.rgb;" },
  },
};
```

## Type Parameters

### VERTEX_TAGS

`VERTEX_TAGS` *extends* readonly `string`[] = readonly `string`[]

### FRAGMENT_TAGS

`FRAGMENT_TAGS` *extends* readonly `string`[] = readonly `string`[]

### BIND_GROUPS

`BIND_GROUPS` *extends* readonly `string`[] = readonly `string`[]

## Properties

### attributes?

> `optional` **attributes?**: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, [`VertexFormat`](https://pixijs.download/release/docs/index.html)\>

The vertex attributes this bit reads; a name redeclared with another format warns, and the first wins

***

### bindings?

> `optional` **bindings?**: [`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)\<[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`BIND_GROUPS`\[`number`\], [`BindingGroup`](rendering.BindingGroup.html.md)\>\>

The bindings this bit adds, keyed by bind group name

Fields in the `material` group are per-material values, read as `material.<name>` in every
stage slot but the vertex `input` slot, which WebGL runs before declaring `material`. A
`header` helper can't see `material`, so pass it the values as arguments. A field is `f32`,
`i32`, `u32`, `mat2x2<f32>` or a `vec2`, `vec3` or `vec4` of `f32`, and other value types
throw. Texture and sampler types there are dropped; declare textures in `textures`. A material
can have any number of fields, but a write to one uploads them all, and a draw that merges
materials reads all of them in each stage, one texel per 16 bytes.

Fields in the `instance` group are the per-slot values of a [BatchedMesh3D](scene.BatchedMesh3D.html.md), read as
`instance.<name>` in the same slots. Each must match a field of the batch's `instanceData`
option by name and type. A custom template adds `{{vertexStoreAccess}}` and
`{{fragmentStoreAccess}}` to its WGSL, the vertex one after it declares `inst` as the engine's
template does, and `{{storeAccess}}` to each GLSL stage, after the vertex `{{input}}`. A pass's
descriptor also lists [instanceFetchBitGl](rendering.instanceFetchBitGl.html.md) in its `bitsGl`.

Don't add fields of your own to `global` or `camera`, which the engine fills from fixed
buffers, or the draw can fail. A material's shader always has the engine's fields there, so
a bit reads them without declaring them, as `camera.uCameraPosition` in WGSL or
`uCameraPosition` in GLSL.

***

### gl?

> `optional` **gl?**: `object`

The GLSL code for WebGL; [ShaderBitTemplate](rendering.ShaderBitTemplate.html.md) says which slot each key fills

#### fragment?

> `optional` **fragment?**: [`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)\<[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`FRAGMENT_TAGS`\[`number`\], `string`\>\>

Code for the fragment stage's slots, keyed by slot name

#### header?

> `optional` **header?**: `string`

Code for the `{{header}}` slot of both stages' templates, such as functions and constants

#### vertex?

> `optional` **vertex?**: [`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)\<[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`VERTEX_TAGS`\[`number`\], `string`\>\>

Code for the vertex stage's slots, keyed by slot name

***

### gpu?

> `optional` **gpu?**: `object`

The WGSL code for WebGPU; [ShaderBitTemplate](rendering.ShaderBitTemplate.html.md) says which slot each key fills

The compiler doesn't check that a `textureSample`, `dpdx` or `dpdy` sits in uniform control
flow, so keep it there yourself. A branch on a `material` value is uniform. Under a branch on a
per-fragment value, the derivative, and so the mip level, is undefined.

#### fragment?

> `optional` **fragment?**: [`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)\<[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`FRAGMENT_TAGS`\[`number`\], `string`\>\>

Code for the fragment stage's slots, keyed by slot name

#### header?

> `optional` **header?**: `string`

Code for the template's `{{header}}` slot, such as functions and constants

#### vertex?

> `optional` **vertex?**: [`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)\<[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`VERTEX_TAGS`\[`number`\], `string`\>\>

Code for the vertex stage's slots, keyed by slot name

***

### interStage?

> `optional` **interStage?**: [`InterStage`](rendering.InterStage.html.md)

The varyings this bit declares; a name redeclared with another type warns, and the first wins

***

### name

> **name**: `string`

A unique name; shaders are cached by their bits' names, so two different bits with one name throw

***

### outputs?

> `optional` **outputs?**: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, [`FragmentOutputType`](rendering.FragmentOutputType.html.md)\>

The fragment outputs this bit declares, keyed by name, such as `{ normal: 'vec4<f32>' }`

The fragment stage writes one as `outputs.normal`, and every field starts at zero.
[ShaderDescriptorOptions#outputLocations](rendering.ShaderDescriptorOptions.html#outputlocations) says which output each location writes, and an
output with no location is dropped, so a bit can write one without knowing which passes use it.
In a view with scene outputs, a material on the engine's template can write any
[SceneOutput](rendering.SceneOutput.html.md) by its name.

The engine's template declares `color` as `vec4<f32>` and fills it from `finalColor` and
`alpha` after the `end` slot, so set those rather than `outputs.color`. Two bits that declare
one name with different types throw. A custom template needs the output slots: in WGSL
`{{fragmentDeclareOutputs}}` and `{{fragmentWriteOutputs}}`, returning `FragmentOutput`, and in
the GLSL fragment template `{{declareOutputs}}` and `{{writeOutputs}}`.

#### Example

```ts
const depthOutputBit: ShaderBit = {
  name: 'myDepthOutput',
  outputs: { depth: 'f32' },
  gpu: { fragment: { end: 'outputs.depth = input.position.z;' } },
  gl: { fragment: { end: 'outputs.depth = gl_FragCoord.z;' } },
};
```

***

### overrideDefs?

> `optional` **overrideDefs?**: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, [`ShaderOverrideDef`](rendering.ShaderOverrideDef.html.md)\>

Specialization constants, keyed by name; see [ShaderOverrideType](rendering.ShaderOverrideType.html.md)

***

### requires?

> `optional` **requires?**: `ShaderBit`[]

Other bits this bit needs in the shader, such as one that declares a helper function it calls

The compiler adds each required bit once, just ahead of the first bit that requires it, so two
bits can share a helper without declaring it twice. A material need not list them.

A required bit should hold only shader code, such as helpers and constants: one the material
doesn't list can't add texture slots, `material` fields or `instance` fields. Declare those on
a listed bit, and list it ahead of any bit that requires it.

#### Example

```ts
const luminanceBit: ShaderBit = {
  name: 'luminance',
  gpu: { header: 'fn luminance(c: vec3<f32>) -> f32 { return dot(c, vec3<f32>(0.2126, 0.7152, 0.0722)); }' },
  gl: { fragment: { header: 'float luminance(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }' } },
};

const desaturateBit: ShaderBit = {
  name: 'desaturate',
  requires: [luminanceBit],
  gpu: { fragment: { material: 'albedo = vec3<f32>(luminance(albedo));' } },
  gl: { fragment: { material: 'albedo = vec3(luminance(albedo));' } },
};
```

***

### structs?

> `optional` **structs?**: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, [`StructDefinition`](rendering.StructDefinition.html.md)\>

WGSL structs this bit declares, keyed by struct name

The first bit to declare a name wins and later ones are dropped without a warning, so bits that
share a struct should import one definition.

***

### textures?

> `optional` **textures?**: `string`[]

The textures this bit samples, as camelCase names such as `'transmission'`

In a material's shader, each name gets two helpers in both languages, which
[BaseMaterial3DOptions#textures](materials.BaseMaterial3DOptions.html#textures) fills by name. `sampleX(uv)`, such as
`sampleTransmission(uv)`, picks its mip level from the fragment's derivatives, so it works in
the fragment stage only, and `sampleXDirect(uv)` reads mip 0 in either stage. Pixi uploads
images with their alpha premultiplied by default, so divide a sample's `rgb` by its `a`, as in
`c.rgb / max(c.a, 0.001)`, to read the colour the image stores.

#### Example

```ts
const myBit: ShaderBit = {
  name: 'myFeature',
  textures: ['myCustomMap'],
  gpu: { fragment: { material: 'let color = sampleMyCustomMap(input.vUV);' } }
}
```
