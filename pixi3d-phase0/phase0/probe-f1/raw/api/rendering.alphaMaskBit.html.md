# Variable: alphaMaskBit

> `const` **alphaMaskBit**: [`ShaderBit`](rendering.ShaderBit.html.md)

**`Advanced`**

The cutout for `alphaMode: 'mask'`: discards fragments with alpha below the material's
`alphaCutoff` and makes the rest fully opaque

List it after the bit that sets `alpha` from the base colour.
