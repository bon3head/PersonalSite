# Variable: dissolveBit

> `const` **dissolveBit**: [`ShaderBit`](rendering.ShaderBit.html.md)

**`Advanced`**

Cuts a material's surface away where noise falls below `material.data.dissolve`, with an
optional glowing edge along the cut

The bit adds three fields to `material.data`, all 0 on a material built or cloned with it, so a
new copy draws whole, with no edge and the default hole size:

- `dissolve` runs from 0, which draws the surface whole, to 1, which cuts all of it away.
- `dissolveEdgeColor` is an RGB colour in linear light added along the cut, and black draws no
  edge. A tone curve rolls channels above 1 off; the default `toneMapping: 'none'` clips them.
- `dissolveHoleSize` is about how wide a hole is when half the surface is cut, in the mesh's
  stored units. 0 means 0.25. The edge widens with the holes.

The edge is added after lighting, so the bit works on every engine material, lit or unlit,
including the [FlatMaterial](materials.FlatMaterial.html.md) the glTF loader builds for unlit materials. The view's
exposure, fog and tone mapping apply to the edge as they do to the surface.

The noise reads the mesh's vertex positions as stored, before its transform, bones or morph
targets move them. So the holes stay on the surface as the model moves and animates, and models
built from one source cut the same holes. It's also why `dissolveHoleSize` is in stored units and
the holes grow when the model is scaled up. A mesh stored in centimetres, where the default cuts
speckle, needs about 25. For a quantized glTF, divide the hole size you want by the scale on its
node.

Shadows and outlines don't dissolve. The shadow pass and an [OutlinePass](extras_post-processing.OutlinePass.html.md) draw a mesh with
their own shaders, which leave out the material's extra bits. So a half-dissolved mesh still
casts a whole shadow, and its outline shows through the holes and stays as a solid silhouette
at `dissolve` 1. To drop the outline while a copy dissolves, take the copy out of that pass with
[BaseMaterial3D#disablePass](materials.BaseMaterial3D.html#disablepass): `copy.disablePass('outline')`.

## Example

```ts
enemy.materials = (material) => material.clone({ extraBits: [dissolveBit] });

for (const material of enemy.materials) {
  material.data.dissolve = progress;
  material.data.dissolveEdgeColor = [6, 2, 0.4];
}
```
