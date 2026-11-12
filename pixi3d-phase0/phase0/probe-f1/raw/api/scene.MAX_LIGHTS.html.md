# Variable: MAX\_LIGHTS

> `const` **MAX\_LIGHTS**: `32` = `32`

**`Advanced`**

Most lights a view draws at once

Ambient lights don't count. Past the limit, the visible lights last in [View3D#lights](scene.View3D.html#lights)
are left out. It can't exceed 32, the bits of the light mask in `LightTiles.ts`.
