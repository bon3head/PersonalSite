# Class: ShaderDescriptor

**`Advanced`**

The [ShaderBit](rendering.ShaderBit.html.md)s a shader is built from, per backend, with its template and overrides

A material's `descriptor` option sets the bits of its main shader. Its `passes` option gives an
extra render pass, such as an outline, a descriptor of its own, keyed by pass name, as options
or as a built descriptor. The renderer adds the bits a mesh needs, such as skinning, so a
material lists only its own.

## Example

```ts
new BaseMaterial3D({
  descriptor: { bitsGpu: [myBit], bitsGl: [myBit] },
});

new BaseMaterial3D({
  descriptor: { bitsGpu: [myBit], bitsGl: [myBit] },
  passes: {
    outline: {
      shaderDescriptor: {
        bitsGpu: [outlineBit], bitsGl: [outlineBit],
        template: outlineTemplate,
      },
    },
  },
});
```

## Constructors

### Constructor

> **new ShaderDescriptor**(`options`): `ShaderDescriptor`

#### Parameters

##### options

[`ShaderDescriptorOptions`](rendering.ShaderDescriptorOptions.html.md)

#### Returns

`ShaderDescriptor`

## Properties

### bitsGl

> **bitsGl**: [`ShaderBit`](rendering.ShaderBit.html.md)[]

Shader bits for the WebGL (GLSL) backend

***

### bitsGpu

> **bitsGpu**: [`ShaderBit`](rendering.ShaderBit.html.md)[]

Shader bits for the WebGPU (WGSL) backend

***

### includeCamera?

> `optional` **includeCamera?**: `boolean`

See [ShaderDescriptorOptions#includeCamera](rendering.ShaderDescriptorOptions.html#includecamera)

***

### includeGlobal?

> `optional` **includeGlobal?**: `boolean`

See [ShaderDescriptorOptions#includeGlobal](rendering.ShaderDescriptorOptions.html#includeglobal)

***

### outputLocations

> **outputLocations**: readonly `string`[]

Which output each location writes, by name; see [ShaderDescriptorOptions#outputLocations](rendering.ShaderDescriptorOptions.html#outputlocations)

***

### overrides?

> `optional` **overrides?**: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `number`\>

Values for the bits' specialization constants; see [ShaderDescriptorOptions#overrides](rendering.ShaderDescriptorOptions.html#overrides)

***

### template?

> `optional` **template?**: [`ShaderBitTemplate`](rendering.ShaderBitTemplate.html.md)

Custom shader template; see [ShaderDescriptorOptions#template](rendering.ShaderDescriptorOptions.html#template)

## Methods

### update()

> **update**(`options`): `this`

Replaces every field from `options`, as the constructor would; a field left out goes back to
its default

#### Parameters

##### options

[`ShaderDescriptorOptions`](rendering.ShaderDescriptorOptions.html.md)

The new descriptor contents

#### Returns

`this`

This descriptor, for chaining
