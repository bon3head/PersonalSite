# Variable: glossBit

> `const` **glossBit**: [`ShaderBit`](rendering.ShaderBit.html.md)

**`Advanced`**

Stylised wet-plastic gloss: a sharp reflection of the environment, strongest at grazing angles,
added on top of lighting

Add it to a [Material3D](materials.Material3D.html.md) or [PhongMaterial](materials.PhongMaterial.html.md) through `extraBits`. It reflects
[View3D#environment](scene.View3D.html#environment), so a view without one shows no gloss. Its strength and sharpness are
fixed, with nothing to set per material. For a physically based coat, use the `clearcoat` option
of [Material3D](materials.Material3D.html.md) instead.

## Example

```ts
const plastic = new Material3D({ baseColor: 0xe94f37, roughness: 0.6, extraBits: [glossBit] });
```
