# Variable: mathConstantsBit

> `const` **mathConstantsBit**: [`ShaderBit`](rendering.ShaderBit.html.md)

**`Advanced`**

Declares the constants `PI` and `INV_PI` for a bit that lists it in `requires`

The lighting of [Material3D](materials.Material3D.html.md) and [PhongMaterial](materials.PhongMaterial.html.md) requires it already, so a bit for
either must not declare its own `PI` or `INV_PI`: the second declaration fails the compile.

## Example

```ts
const ringsBit: ShaderBit = {
  name: 'rings',
  requires: [mathConstantsBit],
  gpu: { fragment: { material: 'albedo *= 0.75 + 0.25 * cos(input.vUV.x * 8.0 * PI);' } },
  gl: { fragment: { material: 'albedo *= 0.75 + 0.25 * cos(vUV.x * 8.0 * PI);' } },
};
```
