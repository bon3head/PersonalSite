# Variable: screenSpaceFuncsBit

> `const` **screenSpaceFuncsBit**: [`ShaderBit`](rendering.ShaderBit.html.md)

**`Advanced`**

Shader helpers that sample the opaque pass's colour or depth copy at a world position, for custom
material bits such as refraction or water

List it in your bit's `requires` to get:

- `screenUVFromWorld(worldPos)`: the UV of a world position in a screen copy, for an offset
  refraction tap or a depth `textureLoad`. A copy can be larger than the view, so the UV is scaled
  and clamped to the part the view fills.
- `sampleScreenCopy(tex, [sampler,] worldPos, lod)`: samples a colour copy there at mip `lod`,
  keeping a blurred tap inside the view's part of the copy. WGSL takes a sampler and GLSL doesn't.
  Colour only: load depth with `textureLoad`.
