# Function: getAttributeData()

> **getAttributeData**(`geometry`, `attributeId`, `size`, `out?`): [`Float32Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Float32Array)

Reads a vertex attribute as floats, `size` per vertex, however the geometry stores it

Use it for maths on a mesh on the CPU, such as merging, welding or sampling its surface. Getters
such as [Geometry3D#normals](geometry.Geometry3D.html#normals) return data as stored, which can be quantized integers or a
whole interleaved buffer; this decodes either.

Values come out as the vertex shader reads them: `snorm` formats as -1 to 1, `unorm` as 0 to 1,
and float and raw integer (`sint`, `uint`) formats as stored, so raw integer positions read in
the same space as [Geometry3D#bounds3D](geometry.Geometry3D.html#bounds3d), and the mesh's transform scales them. Morph
targets and skinning aren't applied.

It copies on every call, so read once and keep the result, or pass `out` to reuse an array.

## Parameters

### geometry

[`Geometry`](https://pixijs.download/release/docs/index.html)

A [Geometry3D](geometry.Geometry3D.html.md), or a pixi `Geometry` whose attributes give a `format`,
  and a `stride` and `offset` when they share a buffer

### attributeId

`string`

Shader attribute name, such as `aPosition`, `aNormal`, `aUV` or `aTangent`

### size

`number`

Components per vertex to read, at most what the format holds: 3 for positions and
  normals, 2 for UVs, 4 for tangents

### out?

[`Float32Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Float32Array)\<`ArrayBufferLike`\>

Array to fill from index 0, at least `size` floats per vertex; a new one is allocated
  when omitted

## Returns

[`Float32Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Float32Array)

`out`, or the new array

## Example

```ts
const normals = getAttributeData(geometry, 'aNormal', 3);
const normal = new Vector3().fromArray(normals, vertexIndex * 3);

const merged = new Float32Array((first.vertexCount + second.vertexCount) * 3);
getAttributeData(first, 'aPosition', 3, merged);
getAttributeData(second, 'aPosition', 3, merged.subarray(first.vertexCount * 3));
```
