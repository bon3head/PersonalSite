# Function: createRaycastHit3D()

> **createRaycastHit3D**(): [`RaycastHit3D`](events.RaycastHit3D.html.md)

Creates an empty [RaycastHit3D](events.RaycastHit3D.html.md), for [View3D#raycast](scene.View3D.html#raycast) to fill again and again

`target` is unset until a raycast hits, so read it only after one returns the hit.

## Returns

[`RaycastHit3D`](events.RaycastHit3D.html.md)

The new hit

## Example

```ts
const hover = createRaycastHit3D();
app.ticker.add(() => {
  if (view3d.raycast(pointer, hover)) cursor3d.position.copyFrom(hover.point);
});
```
