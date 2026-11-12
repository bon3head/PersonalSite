# Class: Geometry3D

A mesh's vertex and index data: positions plus optional normals, UVs, tangents, colours and
skinning data, in separate buffers or interleaved in one

Only positions are required. Inputs can be raw `Float32Array` data or pixi `Attribute`s,
including the quantized integer formats glTF files use (KHR_mesh_quantization).
[getAttributeData](geometry.getAttributeData.html.md) reads any attribute back as floats, however it is stored.

The first time a geometry is drawn it's copied into buffers shared with other geometries, so
later edits to its data don't show. Build a new geometry for a new shape, call
[unload](#unload) after an occasional edit, or make it
[Geometry3DOptions#dynamic](geometry.Geometry3DOptions.html#dynamic) if you rewrite it every frame.

## Example

```ts
const geometry = new Geometry3D({
  positions: new Float32Array([
    -1, -1, 0,
     1, -1, 0,
     0,  1, 0,
  ]),
  indices: new Uint16Array([0, 1, 2]),
});
```

## See

[Geometry3DOptions](geometry.Geometry3DOptions.html.md) For the constructor options

## Extends

- [`Geometry`](https://pixijs.download/release/docs/index.html)

## Extended by

- [`CapsuleGeometry`](geometry.CapsuleGeometry.html.md)
- [`ConeGeometry`](geometry.ConeGeometry.html.md)
- [`CubeGeometry`](geometry.CubeGeometry.html.md)
- [`CylinderGeometry`](geometry.CylinderGeometry.html.md)
- [`IcosahedronGeometry`](geometry.IcosahedronGeometry.html.md)
- [`PlaneGeometry`](geometry.PlaneGeometry.html.md)
- [`SphereGeometry`](geometry.SphereGeometry.html.md)
- [`TorusGeometry`](geometry.TorusGeometry.html.md)
- [`TorusKnotGeometry`](geometry.TorusKnotGeometry.html.md)

## Constructors

### Constructor

> **new Geometry3D**(`options`): `Geometry3D`

Creates a new `Geometry3D`

#### Parameters

##### options

[`Geometry3DOptions`](geometry.Geometry3DOptions.html.md)

See [Geometry3DOptions](geometry.Geometry3DOptions.html.md) for available options

#### Returns

`Geometry3D`

#### Overrides

`Geometry.constructor`

## Properties

### bounds3D

> **bounds3D**: [`Box`](maths.Box.html.md)

The geometry's local bounding box, used for picking and for a mesh's local bounds

Culling tests [Geometry3D#boundsSphere](#boundssphere) instead.

#### Example

```ts
const size = geometry.bounds3D.getSize();
```

***

### boundsSphere

> **boundsSphere**: [`Sphere`](maths.Sphere.html.md)

The sphere around [Geometry3D#bounds3D](#bounds3d), which frustum culling tests

Computed once, at construction, so later edits to the positions or to `bounds3D` don't reach
culling.

#### Example

```ts
const radius = geometry.boundsSphere.radius;
```

***

### dynamic

> `readonly` **dynamic**: `boolean`

**`Advanced`**

Whether the geometry stays out of the shared buffers; see [Geometry3DOptions#dynamic](geometry.Geometry3DOptions.html#dynamic)

***

### hasMorphNormals

> `readonly` **hasMorphNormals**: `boolean`

**`Advanced`**

Whether the morph targets bend the normals as well as the positions; see
[Geometry3DOptions#morphTargets](geometry.Geometry3DOptions.html#morphtargets)

***

### morphTargetCount

> `readonly` **morphTargetCount**: `number` = `0`

Count of morph targets; a mesh drawing the geometry takes one weight per target

#### Example

```ts
const weights = new Float32Array(geometry.morphTargetCount);
```

***

### defaultOptions

> `static` **defaultOptions**: [`Geometry3DOptions`](geometry.Geometry3DOptions.html.md)

Defaults for every new `Geometry3D`

Each primitive, such as [SphereGeometry](geometry.SphereGeometry.html.md), copies these into its own `defaultOptions` when
its module loads, so changing one of them here later doesn't reach the primitives; set theirs
instead.

#### Example

```ts
Geometry3D.defaultOptions.quantizeNormals = false;
```

## Accessors

### attributeKey

#### Get Signature

> **get** **attributeKey**(): `string`

**`Advanced`**

The attribute names and formats, ignoring strides, offsets and buffers

Geometries with the same key are packed into the same shared buffers. A geometry with
positions, normals and UVs has the key `aNormal:snorm16x4|aPosition:float32x3|aUV:float32x2|`.

##### Returns

`string`

***

### indices

#### Get Signature

> **get** **indices**(): [`Uint16Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint16Array)\<`ArrayBufferLike`\> \| [`Uint32Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint32Array)\<`ArrayBufferLike`\>

The index data

##### Example

```ts
const triangleCount = geometry.indices.length / 3;
```

##### Returns

[`Uint16Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint16Array)\<`ArrayBufferLike`\> \| [`Uint32Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint32Array)\<`ArrayBufferLike`\>

#### Set Signature

> **set** **indices**(`value`): `void`

Sets the index data

##### Parameters

###### value

[`Uint16Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint16Array)\<`ArrayBufferLike`\> \| [`Uint32Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint32Array)\<`ArrayBufferLike`\>

New indices, three per triangle for `triangle-list`

##### Returns

`void`

***

### normals

#### Get Signature

> **get** **normals**(): [`TypedArray`](https://pixijs.download/release/docs/index.html) \| `undefined`

The normal data as stored, or `undefined` when the geometry has no normals

With [Geometry3DOptions#quantizeNormals](geometry.Geometry3DOptions.html#quantizenormals) (the default) it's an `Int16Array` with four
values per vertex; on an interleaved geometry, the whole interleaved buffer as a `Uint8Array`.
To read normals as floats, three per vertex, use [getAttributeData](geometry.getAttributeData.html.md).

##### Example

```ts
const normals = getAttributeData(geometry, 'aNormal', 3);
const normal = new Vector3().fromArray(normals, vertexIndex * 3);
```

##### Returns

[`TypedArray`](https://pixijs.download/release/docs/index.html) \| `undefined`

#### Set Signature

> **set** **normals**(`value`): `void`

Sets the normal data; ignored when the geometry has no normals

##### Parameters

###### value

[`TypedArray`](https://pixijs.download/release/docs/index.html)

New data, in the format the normals are stored in

##### Returns

`void`

***

### positions

#### Get Signature

> **get** **positions**(): [`TypedArray`](https://pixijs.download/release/docs/index.html)

The position data as stored

A `Float32Array`, unless the geometry was built from quantized positions; on an interleaved
geometry, the whole interleaved buffer as a `Uint8Array`. On a
[dynamic](geometry.Geometry3DOptions.html#dynamic) geometry that isn't interleaved, write through it
and update its buffer. To read positions as floats, three per vertex, use
[getAttributeData](geometry.getAttributeData.html.md).

##### Example

```ts
const trail = new Geometry3D({ positions: new Float32Array(64 * 3), dynamic: true });

trail.positions.set(points);
trail.attributes.aPosition.buffer.update();
```

##### Returns

[`TypedArray`](https://pixijs.download/release/docs/index.html)

#### Set Signature

> **set** **positions**(`value`): `void`

Sets the position data

##### Parameters

###### value

[`TypedArray`](https://pixijs.download/release/docs/index.html)

New data, covering at least as many vertices as before

##### Returns

`void`

***

### tangents

#### Get Signature

> **get** **tangents**(): [`TypedArray`](https://pixijs.download/release/docs/index.html) \| `undefined`

The tangent data as stored, or `undefined` when the geometry has no tangents

With [Geometry3DOptions#quantizeTangents](geometry.Geometry3DOptions.html#quantizetangents) (the default) it is an `Int16Array` with four
values per vertex. Read tangents as floats, four per vertex, with [getAttributeData](geometry.getAttributeData.html.md).

##### Returns

[`TypedArray`](https://pixijs.download/release/docs/index.html) \| `undefined`

#### Set Signature

> **set** **tangents**(`value`): `void`

Sets the tangent data; ignored when the geometry has no tangents

##### Parameters

###### value

[`TypedArray`](https://pixijs.download/release/docs/index.html)

New data, in the format the tangents are stored in

##### Returns

`void`

***

### uvs

#### Get Signature

> **get** **uvs**(): [`TypedArray`](https://pixijs.download/release/docs/index.html) \| `undefined`

The UV data as stored, or `undefined` when the geometry has no UVs

Read them as floats, two per vertex, with [getAttributeData](geometry.getAttributeData.html.md).

##### Returns

[`TypedArray`](https://pixijs.download/release/docs/index.html) \| `undefined`

#### Set Signature

> **set** **uvs**(`value`): `void`

Sets the UV data; ignored when the geometry has no UVs

##### Parameters

###### value

[`TypedArray`](https://pixijs.download/release/docs/index.html)

New data, covering every vertex

##### Returns

`void`

***

### vertexCount

#### Get Signature

> **get** **vertexCount**(): `number`

Number of vertices

##### Example

```ts
const colors = new Float32Array(geometry.vertexCount * 4);
```

##### Returns

`number`

#### Overrides

`Geometry.vertexCount`

***

### EMPTY

#### Get Signature

> **get** `static` **EMPTY**(): `Geometry3D`

**`Advanced`**

A shared geometry with no vertices, which a [Mesh3D](scene.Mesh3D.html.md) holds until it's given a geometry

A mesh on it draws nothing and compiles no shader. Assign it to a mesh's `geometry` to stop the
mesh drawing; to hide a mesh for a while, `visible = false` is cheaper to toggle. Only `Mesh3D`
takes it: a [BatchedMesh3D](scene.BatchedMesh3D.html.md) slot in a pass needs a real geometry.

Its `destroy` does nothing, as with pixi's `Texture.EMPTY`, so destroying a mesh with
`geometry: true` can't free it from under other meshes.

##### Example

```ts
if (mesh.geometry === Geometry3D.EMPTY) mesh.geometry = new SphereGeometry();
```

##### Returns

`Geometry3D`

## Methods

### destroy()

> **destroy**(`destroyBuffers?`): `void`

Frees the geometry for good

Its own buffers are destroyed only with `destroyBuffers`, since other geometries may share
them. Calling it again does nothing.

#### Parameters

##### destroyBuffers?

`boolean`

Whether to destroy the geometry's own buffers as well

#### Returns

`void`

#### Example

```ts
view.root.removeChild(mesh);
mesh.geometry.destroy(true);
```

#### See

[Geometry3D.unload](#unload) To hand back the GPU memory but keep the geometry usable.

#### Overrides

`Geometry.destroy`

***

### unload()

> **unload**(): `void`

Unloads this geometry from the GPU, keeping its CPU data so it can be rebuilt

A [dynamic](geometry.Geometry3DOptions.html#dynamic) geometry frees its own GPU buffers; any other
leaves its place in the shared buffers, which never shrink, for later geometries. The next
render that draws it uploads it again, and the image comes out the same: a geometry out of the
scene comes back when its mesh does, one still drawn on the next frame. A
[BatchedMesh3D](scene.BatchedMesh3D.html.md) slot that draws it also needs [invalidate](scene.BatchedMesh3D.html#invalidate).
Safe to call more than once, and does nothing after [Geometry3D.destroy](#destroy).

#### Returns

`void`

#### Example

```ts
view.root.removeChild(mesh);
mesh.geometry.unload(); // adding the mesh again uploads it again
```

#### See

[Geometry3D.destroy](#destroy) To free the geometry for good.

#### Overrides

`Geometry.unload`
