# Variable: toonLightingBit

> `const` **toonLightingBit**: [`ShaderBit`](rendering.ShaderBit.html.md)

**`Advanced`**

Cel-shaded lighting: quantised diffuse bands, a stepped specular highlight and a rim term

Needs the `viewDir` and toon values [toonMaterialBit](extras_materials.toonMaterialBit.html.md) declares, so use the two together.
It's built with [createLightingBit](rendering.createLightingBit.html.md), which supplies the light loop and shadows.
