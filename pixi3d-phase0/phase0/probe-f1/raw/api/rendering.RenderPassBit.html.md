# Variable: RenderPassBit

> `const` **RenderPassBit**: `object`

The render passes a mesh can belong to, as bit flags

A mesh rarely needs these set by hand: its `castShadow` puts it in `SHADOW`, and its material
puts it in `OPAQUE`, in `TRANSPARENT` when its `alphaMode` is `'blend'`, or in `TRANSMISSION`
when it has `transmission`. [BatchedMesh3D](scene.BatchedMesh3D.html.md) slots are the exception, and take these
through [BatchedMesh3D#setPassesAt](scene.BatchedMesh3D.html#setpassesat).

A custom pass, such as an outline, gets its own bit, from bit 8 up, the first time anything uses
its name: the pass itself, a material's `passes` option, [BaseMaterial3D#enablePass](materials.BaseMaterial3D.html#enablepass) or
[Mesh3D#enablePass](scene.Mesh3D.html#enablepass). A page has room for 24 such names: a later name gets no bit, and its
pass draws no meshes, with no warning. The built-in passes answer to their names too, so
`passes: { shadow: ... }` on a material overrides the shadow pass.

## Type Declaration

### BACKGROUND

> `readonly` **BACKGROUND**: `number`

The sky drawn behind the scene

### BLENDED\_REFRACTION

> `readonly` **BLENDED\_REFRACTION**: `number`

Blended materials that refract, such as water, drawn over copies of the opaque colour and depth

Runs after [RenderPassBit.TRANSMISSION](#transmission) and before [RenderPassBit.TRANSPARENT](#transparent).

### NONE

> `readonly` **NONE**: `0` = `0`

No pass

A mesh with it draws nowhere. Give it to a custom pass that draws no meshes, such as a
fullscreen effect, so it uses up no bit; any number of such passes can share a view.

### OPAQUE

> `readonly` **OPAQUE**: `number`

Drawn in the opaque pass, where a material goes by default

### SHADOW

> `readonly` **SHADOW**: `number`

Casts shadows; set from the mesh's `castShadow`

### TRANSMISSION

> `readonly` **TRANSMISSION**: `number`

Glass and other transmissive materials, drawn over a copy of the opaque picture

Runs after the opaque copy and before [RenderPassBit.BLENDED\_REFRACTION](#blended_refraction).

### TRANSPARENT

> `readonly` **TRANSPARENT**: `number`

Drawn in the transparent pass, back to front; set by a material `alphaMode` of `'blend'`

## Example

```ts
batched.setPassesAt(0, RenderPassBit.OPAQUE | RenderPassBit.SHADOW);
```
