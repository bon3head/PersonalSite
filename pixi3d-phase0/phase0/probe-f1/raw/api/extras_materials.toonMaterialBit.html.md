# Variable: toonMaterialBit

> `const` **toonMaterialBit**: [`ShaderBit`](rendering.ShaderBit.html.md)

**`Advanced`**

Sets up the inputs [toonLightingBit](extras_materials.toonLightingBit.html.md) reads

Declares the `baseColor` texture slot and the fields [ToonData](extras_materials.ToonData.html.md) lists, tints `albedo` and
`alpha` by the base colour and its texture, and declares `viewDir` and the toon values for the
lighting bit. The texture is sampled only on geometry with UVs.
