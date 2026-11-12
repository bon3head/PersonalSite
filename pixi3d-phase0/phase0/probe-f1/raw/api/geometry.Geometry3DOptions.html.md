# Interface: Geometry3DOptions

Options for [Geometry3D](geometry.Geometry3D.html.md)

Each vertex attribute takes a typed array with its components packed vertex after vertex, or a
pixi `Attribute` whose `format` says how to read it, which is how quantized data comes in. An
`Attribute` is read by its format alone, not its `stride` or `offset`, so pack its data vertex
after vertex too, in a typed array with the format's bit width, such as an `Int16Array` for
`snorm16x4`. Pass an interleaved layout through `attributes`.

## Example

```ts
const options: Geometry3DOptions = { positions, normals, uvs, indices };
const geometry = new Geometry3D(options);
```

## Extended by

- [`CapsuleGeometryOptions`](geometry.CapsuleGeometryOptions.html.md)
- [`ConeGeometryOptions`](geometry.ConeGeometryOptions.html.md)
- [`CubeGeometryOptions`](geometry.CubeGeometryOptions.html.md)
- [`CylinderGeometryOptions`](geometry.CylinderGeometryOptions.html.md)
- [`IcosahedronGeometryOptions`](geometry.IcosahedronGeometryOptions.html.md)
- [`PlaneGeometryOptions`](geometry.PlaneGeometryOptions.html.md)
- [`SphereGeometryOptions`](geometry.SphereGeometryOptions.html.md)
- [`TorusGeometryOptions`](geometry.TorusGeometryOptions.html.md)
- [`TorusKnotGeometryOptions`](geometry.TorusKnotGeometryOptions.html.md)

## Properties

### attributes?

> `optional` **attributes?**: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, [`Attribute`](https://pixijs.download/release/docs/index.html)\>

A prebuilt attribute map, keyed by shader attribute name

Use it to supply your own buffers or interleaved layout. The names the other options fill are
`aPosition`, `aUV`, `aNormal`, `aTangent`, `aJoints`, `aWeights`, `aColor` and `aColor1`.

With a map, the per-attribute options build nothing, so pass `bounds3D` too: a geometry with
empty bounds is never culled, and picking never hits it.

#### Example

```ts
const geometry = new Geometry3D({
  attributes: { aPosition: { buffer, format: 'float32x3', stride: 12, offset: 0 } },
  bounds3D: new Box(new Vector3(-1, -1, -1), new Vector3(1, 1, 1)),
});
```

***

### bounds3D?

> `optional` **bounds3D?**: [`Box`](maths.Box.html.md)

The geometry's local bounding box; computed from float `positions` when omitted

Pass it when you already know the box, to skip scanning the positions. Integer positions throw
without it, and need it in the values their format reads as: within -1 to 1 for `snorm16x4`,
the stored integers for `sint16x4`.

#### Example

```ts
const geometry = new Geometry3D({
  positions,
  bounds3D: new Box(new Vector3(-1, -1, -1), new Vector3(1, 1, 1)),
});
```

***

### colors?

> `optional` **colors?**: [`Float32Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Float32Array)\<`ArrayBufferLike`\> \| [`Uint8Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)\<`ArrayBufferLike`\> \| [`Uint16Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint16Array)\<`ArrayBufferLike`\> \| [`Attribute`](https://pixijs.download/release/docs/index.html)

Vertex colours, four components per vertex (RGBA)

A `Float32Array` is used as floats; an integer array is read as normalized, 0 to 1. Widen RGB
colours to RGBA with an opaque alpha first. [BaseMaterial3D#vertexColors](materials.BaseMaterial3D.html#vertexcolors) decides whether
they tint.

#### Example

```ts
const red = new Uint8Array([255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255]);
const geometry = new Geometry3D({ positions, colors: red });
```

***

### colors1?

> `optional` **colors1?**: [`Float32Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Float32Array)\<`ArrayBufferLike`\> \| [`Uint8Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)\<`ArrayBufferLike`\> \| [`Uint16Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint16Array)\<`ArrayBufferLike`\> \| [`Attribute`](https://pixijs.download/release/docs/index.html)

A second set of vertex colours, read as `aColor1`, with the same rules as `colors`

Materials never tint with it; only a custom shader bit that declares `aColor1` reads it, which
makes it the place for data that isn't really a colour, such as a wind mask.

#### Example

```ts
const geometry = new Geometry3D({ positions, colors1: windMask });
```

***

### dynamic?

> `optional` **dynamic?**: `boolean`

Draw the geometry from its own buffers, so later writes to them reach the screen

Set it when you rewrite the vertices every frame, as a trail or a particle system does. A
dynamic geometry is never frustum-culled. Fixed at construction.

#### Default

```ts
false
```

#### Example

```ts
const trail = new Geometry3D({ positions: new Float32Array(64 * 3), dynamic: true });

app.ticker.add(() => {
  writeTrailPoints(trail.positions);
  trail.attributes.aPosition.buffer.update();
});
```

***

### indexCount?

> `optional` **indexCount?**: `number`

How many indices to draw, when that is fewer than the index buffer holds

`0` draws the whole buffer. Only a `dynamic` geometry honours it; any other draws its whole
index buffer. Use it to draw a prefix of an index buffer several geometries share.

#### Default

```ts
0
```

#### Example

```ts
const firstTen = new Geometry3D({ positions, indices: sharedQuadIndices, indexCount: 10 * 6, dynamic: true });
```

***

### indices?

> `optional` **indices?**: [`Uint16Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint16Array)\<`ArrayBufferLike`\> \| [`Uint32Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint32Array)\<`ArrayBufferLike`\> \| [`Buffer`](https://pixijs.download/release/docs/index.html)

Vertex indices, three per triangle for the default `triangle-list` topology

Left out, the vertices are drawn in order. A `Uint16Array` of odd length is copied into a
`Uint32Array`. A `Buffer` is used as it is, so several geometries can share one.

#### Example

```ts
const quad = new Geometry3D({
  positions: new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]),
  indices: new Uint16Array([0, 1, 2, 0, 2, 3]),
});
```

***

### interleave?

> `optional` **interleave?**: `boolean`

Whether to pack the attributes into one interleaved buffer

Only a `dynamic` geometry draws from its own buffers; for any other, this changes how its own
data is laid out, not how it draws. Per-triangle picking, a
[hitVolume](scene.Container3D.html#hitvolume) of `'geometry'`, never hits an interleaved geometry.

#### Default

```ts
false
```

#### Example

```ts
const trail = new Geometry3D({ positions, colors, interleave: true, dynamic: true });
```

***

### joints?

> `optional` **joints?**: [`Uint8Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)\<`ArrayBufferLike`\> \| [`Uint16Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint16Array)\<`ArrayBufferLike`\> \| [`Attribute`](https://pixijs.download/release/docs/index.html)

Four bone indices per vertex, for skinning

#### Example

```ts
const geometry = new Geometry3D({ positions, joints: new Uint8Array(vertexCount * 4), weights });
```

***

### morphTargets?

> `optional` **morphTargets?**: `object`[]

Morph targets (blend shapes), each a set of per-vertex offsets from `positions`

A [Mesh3D](scene.Mesh3D.html.md) drawing the geometry blends the targets by its [Mesh3D#weights](scene.Mesh3D.html#weights).
Normal offsets are used only when every target has them. A geometry morphs in one renderer
only: once a second renderer draws it, even a new `Application` made after the first is
destroyed, it draws unmorphed from then on and warns once.

Culling allows for weights from 0 to 1. For weights outside that range, pass a larger
`bounds3D`.

#### normals?

> `optional` **normals?**: [`Float32Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Float32Array)\<`ArrayBufferLike`\>

Offsets from the base normals, three floats per vertex

##### Example

```ts
const geometry = new Geometry3D({
  positions,
  normals,
  morphTargets: [{ positions: bulgeOffsets, normals: bulgeNormalOffsets }],
});
```

#### positions

> **positions**: [`Float32Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Float32Array)

Offsets from the base positions, three floats per vertex

##### Example

```ts
const raise = new Float32Array(vertexCount * 3);
for (let i = 1; i < raise.length; i += 3) raise[i] = 0.5;
const geometry = new Geometry3D({ positions, morphTargets: [{ positions: raise }] });
```

#### Example

```ts
const geometry = new Geometry3D({ positions, morphTargets: [{ positions: smileOffsets }] });
const face = new Mesh3D({ geometry, material, weights: new Float32Array([0.5]) });
```

***

### normals?

> `optional` **normals?**: [`Float32Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Float32Array)\<`ArrayBufferLike`\> \| [`Attribute`](https://pixijs.download/release/docs/index.html)

Vertex normals, three floats per vertex

Without them the geometry shades as if every normal were `(0, 0, 1)`, which suits unlit
billboards and ribbons. `quantizeNormals` decides how they are stored.

#### Example

```ts
const geometry = new Geometry3D({ positions, normals });
```

***

### positions?

> `optional` **positions?**: [`Float32Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Float32Array)\<`ArrayBufferLike`\> \| [`Attribute`](https://pixijs.download/release/docs/index.html)

Vertex positions, three floats per vertex

Integer positions come in as an `Attribute`, since only its format says how to read them:
`snorm` as -1 to 1, `unorm` as 0 to 1, and `sint` or `uint` as the stored integers. An integer
typed array throws. Pad 8- and 16-bit xyz to four components per vertex, and pass `bounds3D`.

#### Example

```ts
const triangle = new Geometry3D({ positions: new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0]) });
```

***

### quantizeNormals?

> `optional` **quantizeNormals?**: `boolean`

Whether to store `Float32Array` normals as 16-bit signed integers

They then take 8 bytes per vertex instead of 12, with negligible visual difference. Read them
back as floats with [getAttributeData](geometry.getAttributeData.html.md).

#### Default

```ts
true
```

#### Example

```ts
const geometry = new Geometry3D({ positions, normals, quantizeNormals: false });
```

***

### quantizeTangents?

> `optional` **quantizeTangents?**: `boolean`

Whether to store `Float32Array` tangents as 16-bit signed integers

They then take 8 bytes per vertex instead of 16, with negligible visual difference. Read them
back as floats with [getAttributeData](geometry.getAttributeData.html.md).

#### Default

```ts
true
```

#### Example

```ts
const geometry = new Geometry3D({ positions, normals, tangents, quantizeTangents: false });
```

***

### shrinkBuffersToFit?

> `optional` **shrinkBuffersToFit?**: `boolean`

Whether the geometry's own GPU buffers may shrink to fit their data when it gets smaller

#### Default

```ts
false
```

#### Example

```ts
const geometry = new Geometry3D({ positions, shrinkBuffersToFit: true });
```

***

### tangents?

> `optional` **tangents?**: [`Float32Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Float32Array)\<`ArrayBufferLike`\> \| [`Attribute`](https://pixijs.download/release/docs/index.html)

Vertex tangents, four floats per vertex: the tangent direction, then `1` or `-1` for which way
the bitangent points

Normal maps use them when present and otherwise derive a tangent frame per pixel.
`quantizeTangents` decides how they are stored.

#### Example

```ts
const geometry = new Geometry3D({ positions, normals, uvs, tangents });
```

***

### topology?

> `optional` **topology?**: [`Topology`](https://pixijs.download/release/docs/index.html)

Primitive topology used when drawing the mesh

#### Default

```ts
'triangle-list'
```

#### Example

```ts
const wireframe = new Geometry3D({ positions, indices: edgeIndices, topology: 'line-list' });
```

***

### uvs?

> `optional` **uvs?**: [`Float32Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Float32Array)\<`ArrayBufferLike`\> \| [`Attribute`](https://pixijs.download/release/docs/index.html)

Texture coordinates, two floats per vertex

Integer coordinates come in as an `Attribute`, read as integer positions are: `unorm16x2` as
0 to 1, `uint16x2` as the stored integers, which the material's
[BaseMaterial3D#uvTransform](materials.BaseMaterial3D.html#uvtransform) has to scale back down.

#### Example

```ts
const quad = new Geometry3D({ positions, uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]) });
```

***

### weights?

> `optional` **weights?**: [`Float32Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Float32Array)\<`ArrayBufferLike`\> \| [`Uint8Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)\<`ArrayBufferLike`\> \| [`Uint16Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint16Array)\<`ArrayBufferLike`\> \| [`Attribute`](https://pixijs.download/release/docs/index.html)

Four bone weights per vertex, matching `joints`

A `Float32Array` is used as floats; an integer array is read as normalized, 0 to 1.

#### Example

```ts
const geometry = new Geometry3D({ positions, joints, weights: new Float32Array(vertexCount * 4) });
```
