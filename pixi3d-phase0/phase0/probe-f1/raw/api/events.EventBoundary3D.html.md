# Class: EventBoundary3D

**`Advanced`**

Pointer events for one [View3D](scene.View3D.html.md), the 3D counterpart of pixi.js's `EventBoundary`

Each View makes one, at `view3d.events`. It sends each pointer event the View gets on to the 3D
node under the pointer and its ancestors, with capture, target and bubble phases as in 2D.

You rarely need it directly: set [eventMode](events.IFederatedContainer3D.html#eventmode) on nodes
and listen on them. It holds the settings that apply to the whole View.

## Example

```ts
// Events on a 3D node work as they do in 2D.
mesh.eventMode = 'static';
mesh.cursor = 'pointer';
mesh.on('pointertap', (e) => console.log(e.hit3D?.point)); // world-space hit point

// The boundary itself is only needed for View-wide settings.
view3d.events.enableGlobalMoveEvents = false;
```

## See

 - [View3D#raycast](events.IView3DEvents.html#raycast) For a one-off pick outside the pointer pipeline.
 - [Event3DFields](events.Event3DFields.html.md) For the 3D data carried on the dispatched events.

## Constructors

### Constructor

> **new EventBoundary3D**(`view`): `EventBoundary3D`

Each [View3D](scene.View3D.html.md) makes its own, before you can add listeners, so the View's plain
`view3d.on(type, …)` listeners see the 3D fields; [Event3DFields](events.Event3DFields.html.md) covers the rest

#### Parameters

##### view

[`View3D`](scene.View3D.html.md)

The View this boundary serves.

#### Returns

`EventBoundary3D`

## Properties

### enableGlobalMoveEvents

> **enableGlobalMoveEvents**: `boolean` = `true`

Whether interactive 3D nodes hear `globalpointermove` on every pointer move on the page

The usual tool for a drag that keeps tracking after the pointer leaves the object;
`globalmousemove` and `globaltouchmove` come with it. It also needs the renderer's
`eventFeatures.globalMove` option on, as 2D's global moves do.

#### Remarks

- Each interactive, visible node hears each move once, in no particular order.
- It costs a little time per node that takes part in picking on every move; turn it off in
  crowded scenes that don't use it.

#### Default

```ts
true
```
