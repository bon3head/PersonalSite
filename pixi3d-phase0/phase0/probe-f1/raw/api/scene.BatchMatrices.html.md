# Class: BatchMatrices

**`Advanced`**

The slot matrices of a [BatchedMesh3D](scene.BatchedMesh3D.html.md) as one float array, for rewriting many slots a frame

Slot `i`'s matrix is the 16 floats from `offset + i * stride`, column-major and affine, as
[setMatrixAt](scene.BatchedMesh3D.html#setmatrixat) takes it. Call [update](#update)
once you're done, or the writes may never be uploaded:

```ts
const { data, stride, offset } = batched.matrices;

for (let i = 0, o = offset; i < batched.size; i++, o += stride) {
  // Rotation and scale live in 0-2, 4-6 and 8-10; translation in 12-14.
  data[o + 12] = x[i];
  data[o + 13] = y[i];
  data[o + 14] = z[i];
}

batched.matrices.update();
```

A new slot's matrix is all zeros, so set each full matrix once before writing only the lanes that
move. Write only a slot's 16 floats: the floats between matrices hold engine data, such as the
slot's material and visibility. Read `stride` and `offset` rather than hard-coding them, since the
layout can change between releases.

## Properties

### offset

> `readonly` **offset**: `number` = `0`

Float index of slot 0's matrix in [data](#data)

***

### stride

> `readonly` **stride**: `number` = `MESH3D_STORE_STRIDE`

Floats from one slot's matrix to the next in [data](#data)

## Accessors

### data

#### Get Signature

> **get** **data**(): [`Float32Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Float32Array)

The float array holding every slot's matrix; it stays valid across `unload()`, but not past `destroy()`

##### Returns

[`Float32Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Float32Array)

## Methods

### update()

> **update**(`first?`, `count?`): `void`

Uploads the matrices written through [data](#data) on the next render, for
drawing, culling and shadows alike

Pass the range that changed, or nothing for every slot. Throws a `RangeError` for a range outside
the batch. The next render then uploads every matrix from slot 0 to the end of the range in one
go, so for a few scattered slots use `setMatrixAt` alone.

#### Parameters

##### first?

`number` = `0`

The first slot that changed

##### count?

`number` = `...`

How many slots changed; defaults to every slot from `first` on

#### Returns

`void`
