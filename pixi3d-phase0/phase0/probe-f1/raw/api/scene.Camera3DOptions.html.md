# Interface: Camera3DOptions

Constructor options for [Camera3D](scene.Camera3D.html.md)

Every field has a default. The [Container3DOptions](scene.Container3DOptions.html.md) apply too, and `label` defaults to
`'Camera3D'`.

## Example

```ts
const camera = new Camera3D({
  mode: 'perspective',
  fov: 45,
  near: 0.1,
  far: 500,
  label: 'mainCamera',
});
```

## Extends

- [`Container3DOptions`](scene.Container3DOptions.html.md)

## Properties

### angle?

> `optional` **angle?**: [`PointData3D`](maths.PointData3D.html.md)

Local rotation as Euler angles in degrees: turns around Z, then Y, then X, each about the parent's axes

#### Default

```ts
{ x: 0, y: 0, z: 0 }
```

#### Example

```ts
const turned = new Container3D({ angle: { x: 0, y: 90, z: 0 } });
```

#### Inherited from

[`Container3DOptions`](scene.Container3DOptions.html.md).[`angle`](scene.Container3DOptions.html#angle)

***

### boundsVolume?

> `optional` **boundsVolume?**: [`Box`](maths.Box.html.md)

Fixed local-space box used in place of this node's subtree when measuring bounds; see
[Container3D.boundsVolume](scene.Container3D.html#boundsvolume)

#### Example

```ts
const swarm = new Container3D({ boundsVolume: new Box(new Vector3(-10, 0, -10), new Vector3(10, 5, 10)) });
```

#### Inherited from

[`Container3DOptions`](scene.Container3DOptions.html.md).[`boundsVolume`](scene.Container3DOptions.html#boundsvolume)

***

### children?

> `optional` **children?**: [`Container3D`](scene.Container3D.html.md)[]

Children to add, in order

#### Example

```ts
const car = new Container3D({ children: [body, frontWheels, rearWheels] });
```

#### Inherited from

[`Container3DOptions`](scene.Container3DOptions.html.md).[`children`](scene.Container3DOptions.html#children)

***

### clippingPlane?

> `optional` **clippingPlane?**: [`Plane`](maths.Plane.html.md) \| `null`

Plane that hides everything on the camera's side of it; see [Camera3D#clippingPlane](scene.Camera3D.html#clippingplane)

#### Default

```ts
null
```

#### Example

```ts
const reflectionCamera = new Camera3D({ clippingPlane: waterline });
```

***

### cursor?

> `optional` **cursor?**: `string` & `object` \| [`Cursor`](https://pixijs.download/release/docs/index.html) \| `null`

CSS cursor shown while this node is the pointer's target

Only the target's own cursor counts, as in 2D: a hit on a `'passive'` child shows its
interactive ancestor's cursor, so set it on the node with the listeners. `null` shows the
[View3D](scene.View3D.html.md)'s own cursor. Any CSS cursor value works, `url(...)` included.

#### Default

```ts
null
```

#### Example

```ts
button.cursor = 'pointer';
handle.cursor = 'grab';
blade.cursor = 'url("crosshair.png") 8 8, crosshair'; // custom, with a hotspot
```

#### See

[https://developer.mozilla.org/en-US/docs/Web/CSS/cursor](https://developer.mozilla.org/en-US/docs/Web/CSS/cursor) MDN Cursor Documentation

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`cursor`](events.IFederatedContainer3D.html#cursor)

***

### depth?

> `optional` **depth?**: `number`

Target depth along z; sets `scale.z` from the local bounds of the node and its `children`

#### Example

```ts
const bench = new Container3D({ children: [benchMesh], depth: 0.5 });
```

#### Inherited from

[`Container3DOptions`](scene.Container3DOptions.html.md).[`depth`](scene.Container3DOptions.html#depth)

***

### eventMode?

> `optional` **eventMode?**: [`EventMode`](https://pixijs.download/release/docs/index.html)

How this node takes part in pointer events, as on a pixi.js `Container`

- `'none'`: never picked, and neither is anything below it. The subtree costs nothing per
  pointer event.
- `'passive'` (default): fires no listeners and is never the target. Under an interactive
  ancestor it is still picked, and the hit goes to that ancestor with this node's surface
  data. So one `'static'` group makes its whole subtree clickable, with the group as target.
- `'auto'`: as `'passive'`, but ray-tested even with no interactive ancestor, which costs time
  and finds no target. Prefer `'passive'`.
- `'static'`: picked against its [hitVolume](events.IFederatedContainer3D.html#hitvolume), and fires
  listeners.
- `'dynamic'`: as `'static'`, and the [View3D](scene.View3D.html.md) also picks again while a mouse or pen is
  still, so a node that moves under it gets its enter and leave events.

The renderer's `eventMode` option only sets the default for 2D containers, and the View warns
once when it isn't `'passive'`. Picking costs time for each node that takes part, so set the
mode on the nodes and groups that need it.

#### Default

```ts
'passive'
```

#### Example

```ts
button.eventMode = 'static';   // a clickable mesh
spinner.eventMode = 'dynamic'; // it moves under a still pointer
panel.eventMode = 'none';      // decoration; skip it and its children

// A whole model that answers as one target; its meshes need no setup
robot.eventMode = 'static';
```

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`eventMode`](events.IFederatedContainer3D.html#eventmode)

***

### far?

> `optional` **far?**: `number`

Distance to the far clipping plane, in world units; see [Camera3D#far](scene.Camera3D.html#far)

#### Default

```ts
1000
```

#### Example

```ts
const camera = new Camera3D({ near: 1, far: 5000 });
```

***

### fov?

> `optional` **fov?**: `number`

Vertical field of view in degrees; see [Camera3D#fov](scene.Camera3D.html#fov)

#### Default

```ts
60
```

#### Example

```ts
const camera = new Camera3D({ fov: 45 });
```

***

### height?

> `optional` **height?**: `number`

Target height along y; sets `scale.y` from the local bounds of the node and its `children`

#### Example

```ts
const tree = new Container3D({ children: [treeMesh], height: 6 });
```

#### Inherited from

[`Container3DOptions`](scene.Container3DOptions.html.md).[`height`](scene.Container3DOptions.html#height)

***

### hitVolume?

> `optional` **hitVolume?**: [`HitVolume3DInput`](events.HitVolume3DInput.html.md)

Shape the pointer ray is tested against when picking this node, like `hitArea` in 2D

Setting it doesn't make the node interactive; [eventMode](events.IFederatedContainer3D.html#eventmode)
does that. Left `null`, a [Mesh3D](scene.Mesh3D.html.md) uses its geometry's bounding box and a plain
`Container3D` has no shape, so it only hears events from its children.

A shape you set also clips the node's descendants, as `hitArea` does in 2D: a descendant only
hits where the hit point is inside every such shape above it, whatever those nodes'
`eventMode`. A clipped hit doesn't block what is behind it. A `Geometry3D` clips by its bounding
box, an [IHitVolume3D](events.IHitVolume3D.html.md) only through its optional `containsPoint`, and the default
bounding box never clips. A ray that misses a `Box` or `Sphere` shape, or a `Geometry3D`'s
bounding box, skips the exact test of every descendant under it.

#### Default

```ts
null
```

#### Example

```ts
mesh.interactive = true;                  // picked by its bounding box
mesh.hitVolume = 'geometry';              // picked per triangle
mesh.hitVolume = new Sphere(center, 0.4); // a cheaper or tighter shape
mesh.hitVolume = null;                    // back to the bounding box

// Children of the porthole only pick inside its sphere
porthole.hitVolume = new Sphere(new Vector3(), 1);
```

#### See

[HitVolume3DInput](events.HitVolume3DInput.html.md) For what each accepted value resolves to.

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`hitVolume`](events.IFederatedContainer3D.html#hitvolume)

***

### interactive?

> `optional` **interactive?**: `boolean`

Shorthand for [eventMode](events.IFederatedContainer3D.html#eventmode), as on a pixi.js `Container`

`true` sets `'static'` and `false` sets `'passive'`. It reads `true` for `'static'` and
`'dynamic'`. `false` doesn't stop picking: under an interactive ancestor, a `'passive'` node is
still picked on that ancestor's behalf. Set `eventMode = 'none'` to take a node and its
subtree out of picking.

#### Example

```ts
mesh.interactive = true;  // eventMode = 'static'
mesh.interactive = false; // eventMode = 'passive'
```

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`interactive`](events.IFederatedContainer3D.html#interactive)

***

### interactiveChildren?

> `optional` **interactiveChildren?**: `boolean`

Whether this node's descendants can be picked, as on a pixi.js `Container`

`false` takes the whole subtree out of picking: descendants neither hit nor block what is
behind them, and cost nothing per pointer event. The node itself still picks by its own
`eventMode` and volume, so it can answer for the subtree.

#### Default

```ts
true
```

#### Example

```ts
menu.interactiveChildren = false; // nothing in the menu can be picked
menu.interactiveChildren = true;  // every button picks again, eventMode intact

// One sphere answers for the whole robot: one ray test instead of one per mesh
robot.eventMode = 'static';
robot.hitVolume = new Sphere(new Vector3(), 2);
robot.interactiveChildren = false;
```

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`interactiveChildren`](events.IFederatedContainer3D.html#interactivechildren)

***

### label?

> `optional` **label?**: `string` \| `null`

Name to find the node by; see [Container3D#label](scene.Container3D.html#label)

#### Default

```ts
null
```

#### Example

```ts
const turret = new Container3D({ label: 'turret' });
```

#### Inherited from

[`Container3DOptions`](scene.Container3DOptions.html.md).[`label`](scene.Container3DOptions.html#label)

***

### mode?

> `optional` **mode?**: [`CameraMode`](scene.CameraMode.html.md)

Projection mode; see [Camera3D#mode](scene.Camera3D.html#mode)

#### Default

```ts
'perspective'
```

#### Example

```ts
const mapCamera = new Camera3D({ mode: 'orthographic', orthographicSize: 20 });
```

***

### near?

> `optional` **near?**: `number`

Distance to the near clipping plane, in world units; see [Camera3D#near](scene.Camera3D.html#near)

#### Default

```ts
0.1
```

#### Example

```ts
const camera = new Camera3D({ near: 0.01, far: 100 });
```

***

### onclick?

> `optional` **onclick?**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

Property-based handler for the `click` event

Fired when a mouse click on this node completes, with any button but the right one.

#### Default

```ts
null
```

#### Example

```ts
mesh.eventMode = 'static';
mesh.onclick = (e) => {
  if (e.hit3D) marker.position.copyFrom(e.hit3D.point);
};
```

#### See

[IFederatedContainer3D#onpointertap](events.IFederatedContainer3D.html#onpointertap) For the equivalent for every pointer type.

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`onclick`](events.IFederatedContainer3D.html#onclick)

***

### oncontextmenu?

> `optional` **oncontextmenu?**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

Property-based handler for the `contextmenu` event

Fired when the browser is about to open its context menu over this node; call
`preventDefault()` to keep it closed.

#### Default

```ts
null
```

#### Example

```ts
mesh.oncontextmenu = (e) => {
  e.preventDefault();
  openMenuFor(mesh, e.global);
};
```

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`oncontextmenu`](events.IFederatedContainer3D.html#oncontextmenu)

***

### onglobalmousemove?

> `optional` **onglobalmousemove?**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

Property-based handler for the `globalmousemove` event

Fired on every mouse move, wherever the pointer is on the page.

#### Default

```ts
null
```

#### Example

```ts
mesh.onglobalmousemove = (e) => {
  if (dragging) dragTo(e.global);
};
```

#### See

[IFederatedContainer3D#onglobalpointermove](events.IFederatedContainer3D.html#onglobalpointermove) For the equivalent for every pointer type.

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`onglobalmousemove`](events.IFederatedContainer3D.html#onglobalmousemove)

***

### onglobalpointermove?

> `optional` **onglobalpointermove?**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

Property-based handler for the `globalpointermove` event

Fired on every pointer move on the page, whether or not the pointer is over this node. The
node still needs `eventMode` `'static'` or `'dynamic'` to hear it.

#### Default

```ts
null
```

#### Example

```ts
// Keep a drag going once the pointer runs off the dragged mesh
mesh.onglobalpointermove = (e) => {
  const hit = dragging && view3d.screenToWorld(e.global, ground);
  if (hit) mesh.position.copyFrom(hit);
};
```

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`onglobalpointermove`](events.IFederatedContainer3D.html#onglobalpointermove)

***

### onglobaltouchmove?

> `optional` **onglobaltouchmove?**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

Property-based handler for the `globaltouchmove` event

Fired on every touch move, wherever the touch is on the page.

#### Default

```ts
null
```

#### Example

```ts
mesh.onglobaltouchmove = (e) => {
  if (dragging) dragTo(e.global);
};
```

#### See

[IFederatedContainer3D#onglobalpointermove](events.IFederatedContainer3D.html#onglobalpointermove) For the equivalent for every pointer type.

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`onglobaltouchmove`](events.IFederatedContainer3D.html#onglobaltouchmove)

***

### onmousedown?

> `optional` **onmousedown?**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

Property-based handler for the `mousedown` event

Fired when a mouse button other than the right one goes down over this node.

#### Default

```ts
null
```

#### Example

```ts
mesh.onmousedown = (e) => {
  if (e.button === 1) startPan(e.global); // middle button
};
```

#### See

[IFederatedContainer3D#onpointerdown](events.IFederatedContainer3D.html#onpointerdown) For the equivalent for every pointer type.

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`onmousedown`](events.IFederatedContainer3D.html#onmousedown)

***

### onmouseenter?

> `optional` **onmouseenter?**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

Property-based handler for the `mouseenter` event

Fired when the mouse enters this node. Doesn't bubble.

#### Default

```ts
null
```

#### Example

```ts
mesh.onmouseenter = () => (tooltip.visible = true);
```

#### See

[IFederatedContainer3D#onpointerenter](events.IFederatedContainer3D.html#onpointerenter) For the equivalent for every pointer type.

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`onmouseenter`](events.IFederatedContainer3D.html#onmouseenter)

***

### onmouseleave?

> `optional` **onmouseleave?**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

Property-based handler for the `mouseleave` event

Fired when the mouse leaves this node. Doesn't bubble.

#### Default

```ts
null
```

#### Example

```ts
mesh.onmouseleave = () => (tooltip.visible = false);
```

#### See

[IFederatedContainer3D#onpointerleave](events.IFederatedContainer3D.html#onpointerleave) For the equivalent for every pointer type.

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`onmouseleave`](events.IFederatedContainer3D.html#onmouseleave)

***

### onmousemove?

> `optional` **onmousemove?**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

Property-based handler for the `mousemove` event

Fired while the mouse moves across this node.

#### Default

```ts
null
```

#### Example

```ts
mesh.onmousemove = (e) => tooltip.position.copyFrom(e.global);
```

#### See

[IFederatedContainer3D#onpointermove](events.IFederatedContainer3D.html#onpointermove) For the equivalent for every pointer type.

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`onmousemove`](events.IFederatedContainer3D.html#onmousemove)

***

### onmouseout?

> `optional` **onmouseout?**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

Property-based handler for the `mouseout` event

Fired when the mouse moves off this node. Bubbles, unlike `mouseleave`.

#### Default

```ts
null
```

#### Example

```ts
shelf.onmouseout = (e) => unhighlight(e.target3D);
```

#### See

[IFederatedContainer3D#onpointerout](events.IFederatedContainer3D.html#onpointerout) For the equivalent for every pointer type.

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`onmouseout`](events.IFederatedContainer3D.html#onmouseout)

***

### onmouseover?

> `optional` **onmouseover?**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

Property-based handler for the `mouseover` event

Fired when the mouse moves onto this node. Bubbles, unlike `mouseenter`.

#### Default

```ts
null
```

#### Example

```ts
// One handler on the shelf hears every item on it
shelf.onmouseover = (e) => highlight(e.target3D);
```

#### See

[IFederatedContainer3D#onpointerover](events.IFederatedContainer3D.html#onpointerover) For the equivalent for every pointer type.

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`onmouseover`](events.IFederatedContainer3D.html#onmouseover)

***

### onmouseup?

> `optional` **onmouseup?**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

Property-based handler for the `mouseup` event

Fired when a mouse button other than the right one is released over this node.

#### Default

```ts
null
```

#### Example

```ts
mesh.onmouseup = (e) => {
  if (e.button === 1) endPan();
};
```

#### See

[IFederatedContainer3D#onpointerup](events.IFederatedContainer3D.html#onpointerup) For the equivalent for every pointer type.

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`onmouseup`](events.IFederatedContainer3D.html#onmouseup)

***

### onmouseupoutside?

> `optional` **onmouseupoutside?**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

Property-based handler for the `mouseupoutside` event

Fired when a mouse button that went down on this node is released anywhere else.

#### Default

```ts
null
```

#### Example

```ts
mesh.onmouseupoutside = () => endPan();
```

#### See

[IFederatedContainer3D#onpointerupoutside](events.IFederatedContainer3D.html#onpointerupoutside) For the equivalent for every pointer type.

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`onmouseupoutside`](events.IFederatedContainer3D.html#onmouseupoutside)

***

### onpointercancel?

> `optional` **onpointercancel?**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

Property-based handler for the `pointercancel` event

Never called: pixi delivers no pointer cancellation, in 2D either.

#### Default

```ts
null
```

#### Example

```ts
// End a drag on these two instead
handle.onpointerup = endDrag;
handle.onpointerupoutside = endDrag;
```

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`onpointercancel`](events.IFederatedContainer3D.html#onpointercancel)

***

### onpointerdown?

> `optional` **onpointerdown?**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

Property-based handler for the `pointerdown` event

Fired when a pointer goes down on this node: mouse, touch or pen alike.

#### Default

```ts
null
```

#### Example

```ts
handle.eventMode = 'static';
handle.onpointerdown = (e) => {
  if (!e.hit3D) return;
  dragOffset.copyFrom(e.hit3D.localPoint); // where on the handle it was grabbed
  dragging = true;
};
```

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`onpointerdown`](events.IFederatedContainer3D.html#onpointerdown)

***

### onpointerenter?

> `optional` **onpointerenter?**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

Property-based handler for the `pointerenter` event

Fired when a pointer enters this node. Doesn't bubble, so an ancestor hears it only when the
pointer enters the ancestor itself.

#### Default

```ts
null
```

#### Example

```ts
button.eventMode = 'static';
button.onpointerenter = () => button.scale.set(1.1);
```

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`onpointerenter`](events.IFederatedContainer3D.html#onpointerenter)

***

### onpointerleave?

> `optional` **onpointerleave?**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

Property-based handler for the `pointerleave` event

Fired when a pointer leaves this node. Doesn't bubble.

#### Default

```ts
null
```

#### Example

```ts
button.onpointerleave = () => button.scale.set(1);
```

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`onpointerleave`](events.IFederatedContainer3D.html#onpointerleave)

***

### onpointermove?

> `optional` **onpointermove?**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

Property-based handler for the `pointermove` event

Fired while a pointer moves across this node.

#### Default

```ts
null
```

#### Example

```ts
// Trail the cursor across the surface it is over
table.eventMode = 'static';
table.onpointermove = (e) => {
  if (e.hit3D) cursorMarker.position.copyFrom(e.hit3D.point);
};
```

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`onpointermove`](events.IFederatedContainer3D.html#onpointermove)

***

### onpointerout?

> `optional` **onpointerout?**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

Property-based handler for the `pointerout` event

Fired when a pointer moves off this node. Bubbles, unlike `pointerleave`.

#### Default

```ts
null
```

#### Example

```ts
shelf.onpointerout = (e) => unhighlight(e.target3D);
```

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`onpointerout`](events.IFederatedContainer3D.html#onpointerout)

***

### onpointerover?

> `optional` **onpointerover?**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

Property-based handler for the `pointerover` event

Fired when a pointer moves onto this node. Bubbles, unlike `pointerenter`.

#### Default

```ts
null
```

#### Example

```ts
// One handler on the shelf hears every item on it
shelf.onpointerover = (e) => highlight(e.target3D);
```

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`onpointerover`](events.IFederatedContainer3D.html#onpointerover)

***

### onpointertap?

> `optional` **onpointertap?**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

Property-based handler for the `pointertap` event

Fired when a pointer completes a tap on this node, for any pointer type and any button, right
clicks included.

#### Default

```ts
null
```

#### Example

```ts
// Works for mouse, touch and pen alike
mesh.eventMode = 'static';
mesh.onpointertap = (e) => select(e.target3D);
```

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`onpointertap`](events.IFederatedContainer3D.html#onpointertap)

***

### onpointerup?

> `optional` **onpointerup?**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

Property-based handler for the `pointerup` event

Fired when a pointer is released over this node.

#### Default

```ts
null
```

#### Example

```ts
handle.onpointerup = () => {
  dragging = false;
};
```

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`onpointerup`](events.IFederatedContainer3D.html#onpointerup)

***

### onpointerupoutside?

> `optional` **onpointerupoutside?**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

Property-based handler for the `pointerupoutside` event

Fired when a pointer that went down on this node is released anywhere else. The event's
`target3D` is the node that was pressed, and `hit3D` is what the pointer was released over.

#### Default

```ts
null
```

#### Example

```ts
// The release that ends a drag usually happens off the mesh
handle.onpointerupoutside = () => {
  dragging = false;
};
```

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`onpointerupoutside`](events.IFederatedContainer3D.html#onpointerupoutside)

***

### onrightclick?

> `optional` **onrightclick?**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

Property-based handler for the `rightclick` event

Fired when a right click completes on this node.

#### Default

```ts
null
```

#### Example

```ts
mesh.onrightclick = () => openMenuFor(mesh);
```

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`onrightclick`](events.IFederatedContainer3D.html#onrightclick)

***

### onrightdown?

> `optional` **onrightdown?**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

Property-based handler for the `rightdown` event

Fired when the right mouse button goes down over this node.

#### Default

```ts
null
```

#### Example

```ts
mesh.onrightdown = (e) => startRotate(e.global);
```

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`onrightdown`](events.IFederatedContainer3D.html#onrightdown)

***

### onrightup?

> `optional` **onrightup?**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

Property-based handler for the `rightup` event

Fired when the right mouse button is released over this node.

#### Default

```ts
null
```

#### Example

```ts
mesh.onrightup = endRotate;
```

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`onrightup`](events.IFederatedContainer3D.html#onrightup)

***

### onrightupoutside?

> `optional` **onrightupoutside?**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

Property-based handler for the `rightupoutside` event

Fired when the right mouse button that went down on this node is released anywhere else.

#### Default

```ts
null
```

#### Example

```ts
mesh.onrightupoutside = endRotate;
```

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`onrightupoutside`](events.IFederatedContainer3D.html#onrightupoutside)

***

### ontap?

> `optional` **ontap?**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

Property-based handler for the `tap` event

Fired when a touch completes a tap on this node. Chrome gives each touch a new `pointerId`, and
`detail` only counts repeat taps by the same one, so it stays `1` there; time a double tap yourself.

#### Default

```ts
null
```

#### Example

```ts
let lastTap = 0;
mesh.ontap = (e) => {
  if (e.timeStamp - lastTap < 300) focusOn(mesh); // double tap
  lastTap = e.timeStamp;
};
```

#### See

[IFederatedContainer3D#onpointertap](events.IFederatedContainer3D.html#onpointertap) For the equivalent for every pointer type.

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`ontap`](events.IFederatedContainer3D.html#ontap)

***

### ontouchcancel?

> `optional` **ontouchcancel?**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

Property-based handler for the `touchcancel` event

Never called: pixi delivers no touch cancellation, in 2D either.

#### Default

```ts
null
```

#### Example

```ts
// End a drag on these two instead
handle.ontouchend = endDrag;
handle.ontouchendoutside = endDrag;
```

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`ontouchcancel`](events.IFederatedContainer3D.html#ontouchcancel)

***

### ontouchend?

> `optional` **ontouchend?**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

Property-based handler for the `touchend` event

Fired when a touch lifts off this node.

#### Default

```ts
null
```

#### Example

```ts
handle.ontouchend = endDrag;
```

#### See

[IFederatedContainer3D#onpointerup](events.IFederatedContainer3D.html#onpointerup) For the equivalent for every pointer type.

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`ontouchend`](events.IFederatedContainer3D.html#ontouchend)

***

### ontouchendoutside?

> `optional` **ontouchendoutside?**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

Property-based handler for the `touchendoutside` event

Fired when a touch that started on this node lifts off anywhere else.

#### Default

```ts
null
```

#### Example

```ts
handle.ontouchendoutside = endDrag;
```

#### See

[IFederatedContainer3D#onpointerupoutside](events.IFederatedContainer3D.html#onpointerupoutside) For the equivalent for every pointer type.

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`ontouchendoutside`](events.IFederatedContainer3D.html#ontouchendoutside)

***

### ontouchmove?

> `optional` **ontouchmove?**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

Property-based handler for the `touchmove` event

Fired while a touch moves across this node.

#### Default

```ts
null
```

#### Example

```ts
canvasMesh.hitVolume = 'geometry'; // per triangle, so hits carry a uv
canvasMesh.ontouchmove = (e) => {
  if (e.hit3D) paintAt(e.hit3D.uv);
};
```

#### See

[IFederatedContainer3D#onpointermove](events.IFederatedContainer3D.html#onpointermove) For the equivalent for every pointer type.

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`ontouchmove`](events.IFederatedContainer3D.html#ontouchmove)

***

### ontouchstart?

> `optional` **ontouchstart?**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

Property-based handler for the `touchstart` event

Fired when a touch lands on this node.

#### Default

```ts
null
```

#### Example

```ts
handle.ontouchstart = (e) => startDrag(e.pointerId);
```

#### See

[IFederatedContainer3D#onpointerdown](events.IFederatedContainer3D.html#onpointerdown) For the equivalent for every pointer type.

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`ontouchstart`](events.IFederatedContainer3D.html#ontouchstart)

***

### onwheel?

> `optional` **onwheel?**: [`Wheel3DEventHandler`](events.Wheel3DEventHandler.html.md) \| `null`

Property-based handler for the `wheel` event

Fired when the wheel turns while the pointer is over this node.

#### Default

```ts
null
```

#### Example

```ts
// Scroll to push the panel away from the camera
panel.eventMode = 'static';
panel.onwheel = (e) => {
  panel.position.z += e.deltaY * 0.01;
};
```

#### Inherited from

[`IFederatedContainer3D`](events.IFederatedContainer3D.html.md).[`onwheel`](events.IFederatedContainer3D.html#onwheel)

***

### origin?

> `optional` **origin?**: `number` \| [`PointData3D`](maths.PointData3D.html.md)

Point in local space that rotation and scale happen around; see [Container3D#origin](scene.Container3D.html#origin)

#### Default

```ts
{ x: 0, y: 0, z: 0 }
```

#### Example

```ts
const hinge = new Container3D({ origin: { x: 0.5, y: 0, z: 0 } });
```

#### Inherited from

[`Container3DOptions`](scene.Container3DOptions.html.md).[`origin`](scene.Container3DOptions.html#origin)

***

### orthographicSize?

> `optional` **orthographicSize?**: `number`

Half the view's width in world units for an orthographic camera; see
[Camera3D#orthographicSize](scene.Camera3D.html#orthographicsize)

#### Default

```ts
5
```

#### Example

```ts
const mapCamera = new Camera3D({ mode: 'orthographic', orthographicSize: 20 });
```

***

### parent?

> `optional` **parent?**: [`Container3D`](scene.Container3D.html.md)

Parent to add this node to, once everything else is applied

#### Example

```ts
const crate = new Container3D({ label: 'crate', parent: view.root });
```

#### Inherited from

[`Container3DOptions`](scene.Container3DOptions.html.md).[`parent`](scene.Container3DOptions.html#parent)

***

### position?

> `optional` **position?**: [`PointData3D`](maths.PointData3D.html.md)

Local position

#### Default

```ts
{ x: 0, y: 0, z: 0 }
```

#### Example

```ts
const lamp = new Container3D({ position: { x: 0, y: 3, z: 0 } });
```

#### Inherited from

[`Container3DOptions`](scene.Container3DOptions.html.md).[`position`](scene.Container3DOptions.html#position)

***

### quaternion?

> `optional` **quaternion?**: [`QuaternionData`](maths.QuaternionData.html.md)

Local rotation as a unit quaternion

#### Default

```ts
{ x: 0, y: 0, z: 0, w: 1 }
```

#### Example

```ts
const turned = new Container3D({ quaternion: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 } });
```

#### Inherited from

[`Container3DOptions`](scene.Container3DOptions.html.md).[`quaternion`](scene.Container3DOptions.html#quaternion)

***

### renderTexture?

> `optional` **renderTexture?**: [`RenderTexture`](https://pixijs.download/release/docs/index.html) \| `null`

Texture this camera draws into; see [Camera3D#renderTexture](scene.Camera3D.html#rendertexture)

#### Default

```ts
null
```

#### Example

```ts
const securityCamera = new Camera3D({ renderTexture: RenderTexture.create({ width: 256, height: 256 }) });
```

***

### rotation?

> `optional` **rotation?**: [`PointData3D`](maths.PointData3D.html.md)

Local rotation as Euler angles in radians: turns around Z, then Y, then X, each about the parent's axes

#### Default

```ts
{ x: 0, y: 0, z: 0 }
```

#### Example

```ts
const turned = new Container3D({ rotation: { x: 0, y: Math.PI / 2, z: 0 } });
```

#### Inherited from

[`Container3DOptions`](scene.Container3DOptions.html.md).[`rotation`](scene.Container3DOptions.html#rotation)

***

### scale?

> `optional` **scale?**: `number` \| [`PointData3D`](maths.PointData3D.html.md)

Local scale; a number scales all three axes

#### Default

```ts
1
```

#### Example

```ts
const giant = new Container3D({ scale: 3 });
```

#### Inherited from

[`Container3DOptions`](scene.Container3DOptions.html.md).[`scale`](scene.Container3DOptions.html#scale)

***

### visible?

> `optional` **visible?**: `boolean`

Whether this node and its descendants draw

#### Default

```ts
true
```

#### Example

```ts
const hiddenUntilSpawn = new Container3D({ visible: false });
```

#### Inherited from

[`Container3DOptions`](scene.Container3DOptions.html.md).[`visible`](scene.Container3DOptions.html#visible)

***

### width?

> `optional` **width?**: `number`

Target width along x; sets `scale.x` from the local bounds of the node and its `children`

#### Example

```ts
const crate = new Container3D({ children: [crateMesh], width: 2 });
```

#### Inherited from

[`Container3DOptions`](scene.Container3DOptions.html.md).[`width`](scene.Container3DOptions.html#width)

***

### x?

> `optional` **x?**: `number`

Local position on x; the same as `position.x`

#### Example

```ts
const left = new Container3D({ x: -2 });
```

#### Inherited from

[`Container3DOptions`](scene.Container3DOptions.html.md).[`x`](scene.Container3DOptions.html#x)

***

### y?

> `optional` **y?**: `number`

Local position on y; the same as `position.y`

#### Example

```ts
const shelf = new Container3D({ y: 1.2 });
```

#### Inherited from

[`Container3DOptions`](scene.Container3DOptions.html.md).[`y`](scene.Container3DOptions.html#y)

***

### z?

> `optional` **z?**: `number`

Local position on z; the same as `position.z`

#### Example

```ts
const back = new Container3D({ z: -5 });
```

#### Inherited from

[`Container3DOptions`](scene.Container3DOptions.html.md).[`z`](scene.Container3DOptions.html#z)

***

### zoom?

> `optional` **zoom?**: `number`

Zoom factor; see [Camera3D#zoom](scene.Camera3D.html#zoom)

#### Default

```ts
1
```

#### Example

```ts
const scope = new Camera3D({ zoom: 4 });
```
