# Class: BatchInstanceData

**`Advanced`**

The instance data of a [BatchedMesh3D](scene.BatchedMesh3D.html.md) as one float array, for rewriting many slots a frame

Field `name` of slot `i` is the four numbers from `offset + i * stride + fields[name]`. Call
[update](#update) once you're done, or the writes may never be uploaded:

```ts
const { data, stride, offset, fields } = batched.instanceData;

for (let i = 0, o = offset + fields.look; i < batched.size; i++, o += stride) {
  data[o + 3] = glow[i];
}

batched.instanceData.update();
```

Write `vec4<u32>` and `vec4<i32>` fields through [u32Data](#u32data), which
views the same memory at the same indices. The matrices are a separate array,
[BatchedMesh3D.matrices](scene.BatchedMesh3D.html#matrices), with their own `stride` and `offset`, and `update()` here uploads
none of them. Read `stride`, `offset` and `fields` rather than hard-coding them, since the layout
can change between releases.

## Properties

### fields

> `readonly` **fields**: [`Readonly`](https://www.typescriptlang.org/docs/handbook/utility-types.html#readonlytype)\<[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `number`\>\>

Each field's first float within a slot's row

***

### offset

> `readonly` **offset**: `number` = `0`

Float index of slot 0's row in [data](#data)

***

### stride

> `readonly` **stride**: `number` = `0`

Floats from one slot's row to the next in [data](#data)

## Accessors

### data

#### Get Signature

> **get** **data**(): [`Float32Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Float32Array)

The instance data as floats; it stays valid across `unload()`, but not past `destroy()`

##### Returns

[`Float32Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Float32Array)

***

### u32Data

#### Get Signature

> **get** **u32Data**(): [`Uint32Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint32Array)

The same memory as [data](#data), as unsigned integers

A negative number written here keeps its bits, so it reads back negative from a `vec4<i32>`
field.

##### Returns

[`Uint32Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint32Array)

## Methods

### update()

> **update**(`first?`, `count?`): `void`

Uploads the instance data written in place on the next render

Pass the range that changed to upload only those slots. Throws a `RangeError` for a range outside
the batch. Once it's called, every slot marked before the next render uploads as one span, from
the lowest to the highest, so for a few scattered slots use
[setInstanceDataAt](scene.BatchedMesh3D.html#setinstancedataat) alone.

#### Parameters

##### first?

`number` = `0`

The first slot that changed

##### count?

`number` = `...`

How many slots changed; defaults to every slot from `first` on

#### Returns

`void`
