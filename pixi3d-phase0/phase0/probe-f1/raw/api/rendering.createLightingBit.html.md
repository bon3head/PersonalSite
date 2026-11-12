# Function: createLightingBit()

> **createLightingBit**(`opts`): [`ShaderBit`](rendering.ShaderBit.html.md)

**`Advanced`**

Builds a lighting `ShaderBit` around the shading math in `opts`

Call it once at module scope and list the bit in a material's `bitsGpu` and `bitsGl`.
[CreateLightingBitOptions](rendering.CreateLightingBitOptions.html.md) says what each snippet can read.

## Parameters

### opts

[`CreateLightingBitOptions`](rendering.CreateLightingBitOptions.html.md)

The lighting model's snippets and metadata

## Returns

[`ShaderBit`](rendering.ShaderBit.html.md)

The composed lighting bit

## Example

**A diffuse-only Lambert model**

```ts
export const lambertLightingBit = createLightingBit({
  name: 'lambertLighting',

  preLighting: {
    gpu: 'var directLight = vec3<f32>(0.0);',
    gl:  'vec3 directLight = vec3(0.0);',
  },

  perLight: {
    gpu: 'directLight += albedo * light.color * nDotL * attenuation * shadow;',
    gl:  'directLight += albedo * light.color * nDotL * attenuation * shadow;',
  },

  postLighting: {
    gpu: 'finalColor = directLight;',
    gl:  'finalColor = directLight;',
  },
});
```

The PBR material's Cook-Torrance lighting and the toon material's `toonLightingBit` are built the
same way.
