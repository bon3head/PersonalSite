# Variable: instanceFetchBitGl

> `const` **instanceFetchBitGl**: [`ShaderBit`](rendering.ShaderBit.html.md)

**`Advanced`**

Sets each instance's `modelMatrix` on WebGL, for a pass's own template that draws meshes

List it in the pass descriptor's `bitsGl`. A material's shader fetches the same data already, so
listing it in a material's `descriptor` fails the compile. It fills the vertex template's
`{{input}}` slot with the matrix and the indices skinning and morphing read. WebGPU templates
read the same data themselves, so `bitsGpu` needs no counterpart.

## Example

```ts
const shaderDescriptor = {
  bitsGpu: [maskBit],
  bitsGl: [instanceFetchBitGl, maskBit],
  template: maskTemplate,
};
```
