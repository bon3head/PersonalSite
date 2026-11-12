# Class: Sprite3D

A textured quad in the 3D scene, sized from its texture and, by default, turned to face the
camera

It's `texture pixels × pixelSize` world units across, with the familiar sprite API: `anchor`,
`tint`, `alpha`, `width` and `height`, plus `alphaMode` for cutouts. It draws with an unlit
[FlatMaterial](materials.FlatMaterial.html.md) unless you give it another material; a [Material3D](materials.Material3D.html.md) gives a lit
billboard, which a flat stand-in needs to match the lighting of the model it replaces.

## Batching

Sprites that share a material type, billboard mode, alpha mode and image source, such as the
frames of one sprite sheet, draw together as one instanced draw. On WebGPU, sprites with
materials of their own, as each sprite makes by default, need more than 16 in a row for that;
16 or fewer draw one each. Switching frames within a sheet costs almost nothing. The opaque pass
(`'mask'` and `'opaque'`) groups mixed modes and sources well. The transparent pass (`'blend'`)
sorts back to front, so every change of mode or source along that order starts a new draw: give
each blended effect one mode and one sprite sheet. Tint, alpha, size and position can vary
freely.

Turning to face the camera costs no CPU time; the GPU does it. Hundreds to a few thousand
sprites is what it's built for. For tens of thousands that you set and forget, fill
[BatchedMesh3D](scene.BatchedMesh3D.html.md) slots instead: give each one [PlaneGeometry.spriteQuad](geometry.PlaneGeometry.html#spritequad), a matrix
whose X and Y scale carry the texture's world size, and a `billboardMode`.

## Anchor and origin

- `'none'`: the anchor is exact, as on a 2D sprite.
- `'cylindrical'`: `anchor.y` is exact, so a tree anchored at its feet turns around its base.
  `anchor.x` swings around the spin axis.
- `'spherical'`: an off-centre anchor drifts as the camera orbits. The centred default is exact.

`origin` is in world size units, texture pixels × `pixelSize` before `scale`, and applies after
`anchor`. A 200×400 px texture at the default `pixelSize` is 2 × 4 units, so with the centred
anchor `origin = { x: 1, y: 2, z: 0 }` turns the sprite around its top-right corner. Under a
billboard mode it behaves like an off-centre anchor.

## Limitations

- Children inherit the texture size, so children and `toLocal` work in quad units, where the
  image spans -0.5 to 0.5. Treat a sprite as a leaf node.
- [reparentChild](scene.Container3D.html#reparentchild) would apply the texture size and anchor
  twice, so it isn't supported; plain `addChild` and `removeChild` are fine.
- A `ContainerTexture` draws upside down on a sprite.

## Example

```ts
import { Sprite3D, View3D } from '@pixi/3d';

const glow = new Sprite3D({ texture: glowTexture, tint: 0xffaa33 });
glow.position.set(0, 1.5, 0);
view.root.addChild(glow);

// A 4-unit-tall tree standing on the ground, cut out rather than blended.
// Width follows the texture's aspect ratio.
const tree = new Sprite3D({
  texture: treeTexture,
  billboardMode: 'cylindrical',
  anchor: { x: 0.5, y: 1 },
  alphaMode: 'mask',
  height: 4,
});

// Later, in world units; each accessor writes one axis of `scale`.
tree.height = 6;
```

## See

[Sprite3DOptions](scene.Sprite3DOptions.html.md) For the constructor options.

## Extends

- [`Mesh3D`](scene.Mesh3D.html.md)

## Constructors

### Constructor

> **new Sprite3D**(`options?`): `Sprite3D`

Creates a `Sprite3D`; add it under [view.root](scene.View3D.html#root) to draw it

A bare `Texture` is short for `{ texture }`, as with pixi's 2D `Sprite`. Throws when a
`material` you pass has no `baseColor` slot.

#### Parameters

##### options?

[`Texture`](https://pixijs.download/release/docs/index.html)\<[`TextureSource`](https://pixijs.download/release/docs/index.html)\<`any`\>\> \| [`Sprite3DOptions`](scene.Sprite3DOptions.html.md)

Construction options, or the texture to draw; see [Sprite3DOptions](scene.Sprite3DOptions.html.md).

#### Returns

`Sprite3D`

#### Example

```ts
const glow = new Sprite3D(glowTexture);
```

#### Overrides

[`Mesh3D`](scene.Mesh3D.html.md).[`constructor`](scene.Mesh3D.html#constructor)

## Properties

### boundsVolume

> **boundsVolume**: [`Box`](maths.Box.html.md) \| `null` = `null`

A fixed local-space box measured in place of this container and its subtree, or `null` to
measure the geometry

Set one on a large subtree whose extent you already know, such as a level chunk, to skip walking
it. [getLocalBounds](scene.Container3D.html#getlocalbounds) and the size members read it. It's pixi's
`boundsArea`; it doesn't change culling.

#### Example

```ts
swarm.boundsVolume = new Box(new Vector3(-10, 0, -10), new Vector3(10, 5, 10));
```

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`boundsVolume`](scene.Mesh3D.html#boundsvolume)

***

### children

> **children**: [`Container3D`](scene.Container3D.html.md)[] = `[]`

Child nodes

Their order doesn't decide what draws first. Read the array, but change it through
[addChild](scene.Container3D.html#addchild) and [removeChild](scene.Container3D.html#removechild).
To visit the whole subtree, use [traverse](scene.Container3D.html#traverse).

#### Example

```ts
for (const child of group.children) child.visible = false;
```

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`children`](scene.Mesh3D.html#children)

***

### cursor

> **cursor**: `string` & `object` \| [`Cursor`](https://pixijs.download/release/docs/index.html) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`cursor`](scene.Mesh3D.html#cursor)

***

### destroyed

> **destroyed**: `boolean` = `false`

Whether [destroy](scene.Container3D.html#destroy) has run, as in pixi's `Container`

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`destroyed`](scene.Mesh3D.html#destroyed)

***

### eventMode

> **eventMode**: [`EventMode`](https://pixijs.download/release/docs/index.html)

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

[`Mesh3D`](scene.Mesh3D.html.md).[`eventMode`](scene.Mesh3D.html#eventmode)

***

### hitVolume

> **hitVolume**: [`HitVolume3DInput`](events.HitVolume3DInput.html.md)

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

[`Mesh3D`](scene.Mesh3D.html.md).[`hitVolume`](scene.Mesh3D.html#hitvolume)

***

### interactive

> **interactive**: `boolean`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`interactive`](scene.Mesh3D.html#interactive)

***

### interactiveChildren

> **interactiveChildren**: `boolean`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`interactiveChildren`](scene.Mesh3D.html#interactivechildren)

***

### label

> **label**: `string` \| `null` = `null`

Name to find the node by, with [getChildByLabel](scene.Container3D.html#getchildbylabel)

Animation tracks find their target by it too. A plain `Container3D` starts with `null`;
built-in subclasses such as `Mesh3D` start with their class name.

#### Example

```ts
turret.label = 'turret';
tank.getChildByLabel('turret', true)?.lookAt(target);
```

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`label`](scene.Mesh3D.html#label)

***

### localTransform

> **localTransform**: [`Matrix4`](maths.Matrix4.html.md)

Local transform matrix, built from the position, rotation, scale and
[origin](scene.Container3D.html#origin)

It catches up with changes in the view's transform pass, or when you call
[updateLocalTransform](scene.Container3D.html#updatelocaltransform). Read it, but change the
components instead: the next rebuild overwrites it.

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`localTransform`](scene.Mesh3D.html#localtransform)

***

### onclick

> **onclick**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`onclick`](scene.Mesh3D.html#onclick)

***

### oncontextmenu

> **oncontextmenu**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`oncontextmenu`](scene.Mesh3D.html#oncontextmenu)

***

### onglobalmousemove

> **onglobalmousemove**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`onglobalmousemove`](scene.Mesh3D.html#onglobalmousemove)

***

### onglobalpointermove

> **onglobalpointermove**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`onglobalpointermove`](scene.Mesh3D.html#onglobalpointermove)

***

### onglobaltouchmove

> **onglobaltouchmove**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`onglobaltouchmove`](scene.Mesh3D.html#onglobaltouchmove)

***

### onmousedown

> **onmousedown**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`onmousedown`](scene.Mesh3D.html#onmousedown)

***

### onmouseenter

> **onmouseenter**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`onmouseenter`](scene.Mesh3D.html#onmouseenter)

***

### onmouseleave

> **onmouseleave**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`onmouseleave`](scene.Mesh3D.html#onmouseleave)

***

### onmousemove

> **onmousemove**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`onmousemove`](scene.Mesh3D.html#onmousemove)

***

### onmouseout

> **onmouseout**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`onmouseout`](scene.Mesh3D.html#onmouseout)

***

### onmouseover

> **onmouseover**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`onmouseover`](scene.Mesh3D.html#onmouseover)

***

### onmouseup

> **onmouseup**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`onmouseup`](scene.Mesh3D.html#onmouseup)

***

### onmouseupoutside

> **onmouseupoutside**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`onmouseupoutside`](scene.Mesh3D.html#onmouseupoutside)

***

### onpointercancel

> **onpointercancel**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`onpointercancel`](scene.Mesh3D.html#onpointercancel)

***

### onpointerdown

> **onpointerdown**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`onpointerdown`](scene.Mesh3D.html#onpointerdown)

***

### onpointerenter

> **onpointerenter**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`onpointerenter`](scene.Mesh3D.html#onpointerenter)

***

### onpointerleave

> **onpointerleave**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`onpointerleave`](scene.Mesh3D.html#onpointerleave)

***

### onpointermove

> **onpointermove**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`onpointermove`](scene.Mesh3D.html#onpointermove)

***

### onpointerout

> **onpointerout**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`onpointerout`](scene.Mesh3D.html#onpointerout)

***

### onpointerover

> **onpointerover**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`onpointerover`](scene.Mesh3D.html#onpointerover)

***

### onpointertap

> **onpointertap**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`onpointertap`](scene.Mesh3D.html#onpointertap)

***

### onpointerup

> **onpointerup**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`onpointerup`](scene.Mesh3D.html#onpointerup)

***

### onpointerupoutside

> **onpointerupoutside**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`onpointerupoutside`](scene.Mesh3D.html#onpointerupoutside)

***

### onrightclick

> **onrightclick**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`onrightclick`](scene.Mesh3D.html#onrightclick)

***

### onrightdown

> **onrightdown**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`onrightdown`](scene.Mesh3D.html#onrightdown)

***

### onrightup

> **onrightup**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`onrightup`](scene.Mesh3D.html#onrightup)

***

### onrightupoutside

> **onrightupoutside**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`onrightupoutside`](scene.Mesh3D.html#onrightupoutside)

***

### ontap

> **ontap**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`ontap`](scene.Mesh3D.html#ontap)

***

### ontouchcancel

> **ontouchcancel**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`ontouchcancel`](scene.Mesh3D.html#ontouchcancel)

***

### ontouchend

> **ontouchend**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`ontouchend`](scene.Mesh3D.html#ontouchend)

***

### ontouchendoutside

> **ontouchendoutside**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`ontouchendoutside`](scene.Mesh3D.html#ontouchendoutside)

***

### ontouchmove

> **ontouchmove**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`ontouchmove`](scene.Mesh3D.html#ontouchmove)

***

### ontouchstart

> **ontouchstart**: [`Pointer3DEventHandler`](events.Pointer3DEventHandler.html.md) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`ontouchstart`](scene.Mesh3D.html#ontouchstart)

***

### onwheel

> **onwheel**: [`Wheel3DEventHandler`](events.Wheel3DEventHandler.html.md) \| `null`

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

[`Mesh3D`](scene.Mesh3D.html.md).[`onwheel`](scene.Mesh3D.html#onwheel)

***

### parent

> **parent**: [`Container3D`](scene.Container3D.html.md) \| `null` = `null`

Parent node, or `null` for a node with none, such as a view's root

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`parent`](scene.Mesh3D.html#parent)

***

### receiveShadow

> **receiveShadow**: `boolean`

Whether this mesh is shadowed by lights that cast shadows

Only lit materials take shadows. After changing it at runtime, call
[invalidate](scene.Mesh3D.html#invalidate).

#### Example

```ts
water.receiveShadow = false;
water.invalidate();
```

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`receiveShadow`](scene.Mesh3D.html#receiveshadow)

***

### skeleton?

> `readonly` `optional` **skeleton?**: [`Skeleton`](scene.Skeleton.html.md)

Skeleton that deforms this mesh; `undefined` for a mesh that doesn't bend

Fixed at construction: to change it, build a new mesh.

#### Example

```ts
const head = mesh.skeleton?.indexOf('Head');
```

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`skeleton`](scene.Mesh3D.html#skeleton)

***

### uid

> `readonly` **uid**: `number`

**`Advanced`**

Unique id, assigned at construction

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`uid`](scene.Mesh3D.html#uid)

***

### worldTransform

> **worldTransform**: [`Matrix4`](maths.Matrix4.html.md)

World transform: the parent's world transform times this node's
[localTransform](scene.Container3D.html#localtransform)

The view updates it once per frame, before drawing, for visible nodes only, and not at all
while the view holds no mesh. So it can be out of date after a change this frame or while the
node or an ancestor is hidden, and a node outside any view keeps the identity matrix.
[getGlobalTransform](scene.Container3D.html#getglobaltransform) always works out a current one.

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`worldTransform`](scene.Mesh3D.html#worldtransform)

***

### defaultOptions

> `static` **defaultOptions**: [`Pick`](https://www.typescriptlang.org/docs/handbook/utility-types.html#picktype-keys)\<[`Required`](https://www.typescriptlang.org/docs/handbook/utility-types.html#requiredtype)\<[`Sprite3DOptions`](scene.Sprite3DOptions.html.md)\>, `"billboardMode"` \| `"tint"` \| `"alpha"` \| `"alphaMode"` \| `"alphaCutoff"` \| `"pixelSize"` \| `"castShadow"` \| `"receiveShadow"`\>

Defaults for every new `Sprite3D`; an option passed as `undefined` keeps its default

`tint`, `alpha`, `alphaMode` and `alphaCutoff` apply only to the [FlatMaterial](materials.FlatMaterial.html.md) the
sprite makes, never to a material you pass.

#### Example

```ts
// Author against a 32px-per-unit tile set:
Sprite3D.defaultOptions.pixelSize = 1 / 32;
```

#### Overrides

[`Mesh3D`](scene.Mesh3D.html.md).[`defaultOptions`](scene.Mesh3D.html#defaultoptions)

## Accessors

### alpha

#### Get Signature

> **get** **alpha**(): `number`

Opacity multiplied into the texture's alpha

It writes the material, so on a shared material it fades every sprite using it.

##### Example

```ts
ghost.alpha = 0.4;
```

##### Returns

`number`

#### Set Signature

> **set** **alpha**(`value`): `void`

Sets the opacity multiplied into the texture's alpha

##### Parameters

###### value

`number`

Opacity from 0 to 1.

##### Returns

`void`

***

### alphaCutoff

#### Get Signature

> **get** **alphaCutoff**(): `number`

Alpha below which `'mask'` mode cuts a pixel away; it writes the material

##### Example

```ts
leaf.alphaCutoff = 0.3;
```

##### Returns

`number`

#### Set Signature

> **set** **alphaCutoff**(`value`): `void`

Sets the alpha below which `'mask'` mode cuts a pixel away

##### Parameters

###### value

`number`

Alpha from 0 to 1.

##### Returns

`void`

***

### alphaMode

#### Get Signature

> **get** **alphaMode**(): [`AlphaMode`](materials.AlphaMode.html.md)

How the texture's alpha is used; see [Sprite3DOptions.alphaMode](scene.Sprite3DOptions.html#alphamode)

A blended sprite casts no shadow. It writes the material, so on a shared material it changes
every sprite using it.

##### Example

```ts
leaf.alphaMode = 'mask';
```

##### Returns

[`AlphaMode`](materials.AlphaMode.html.md)

#### Set Signature

> **set** **alphaMode**(`value`): `void`

Sets how the texture's alpha is used

##### Parameters

###### value

[`AlphaMode`](materials.AlphaMode.html.md)

How alpha is used.

##### Returns

`void`

***

### anchor

#### Get Signature

> **get** **anchor**(): [`ObservablePoint`](https://pixijs.download/release/docs/index.html)

Which point of the image sits on the node's origin, as a fraction of its size, with `y`
measured down from the top edge

`(0.5, 0.5)` is centred, and `y = 1` stands the sprite on the origin. Assign a point or a
single number for both axes, or change it in place. The Sprite3D class notes cover
how it behaves in each billboard mode.

##### Example

```ts
tree.anchor.set(0.5, 1);
```

##### Returns

[`ObservablePoint`](https://pixijs.download/release/docs/index.html)

#### Set Signature

> **set** **anchor**(`value`): `void`

Sets the anchor from a point or a single number for both axes

##### Parameters

###### value

`number` \| [`PointData`](https://pixijs.download/release/docs/index.html)

Fractions of the image's size, `y` measured from its top edge.

##### Returns

`void`

***

### angle

#### Get Signature

> **get** **angle**(): [`PointLike3D`](maths.PointLike3D.html.md)

[rotation](scene.Container3D.html#rotation) in degrees, as in pixi.js

It reads and writes `rotation`, so the two always agree. Reading converts back from radians, so
a value can come back a hair off, such as 30 as 29.999999999999996; compare with a tolerance.

##### Example

```ts
node.angle.y = 90; // same as node.rotation.y = Math.PI / 2
node.angle = { x: 0, y: 45, z: 0 };
```

##### Returns

[`PointLike3D`](maths.PointLike3D.html.md)

#### Set Signature

> **set** **angle**(`value`): `void`

Sets the Euler rotation and makes it the rotation in use, even when the values are unchanged

##### Parameters

###### value

[`PointData3D`](maths.PointData3D.html.md)

The new Euler angles, in degrees

##### Returns

`void`

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`angle`](scene.Mesh3D.html#angle)

***

### billboardMode

#### Get Signature

> **get** **billboardMode**(): [`BillboardMode`](scene.BillboardMode.html.md)

How this mesh turns to face the camera; see [BillboardMode](scene.BillboardMode.html.md) for the modes

Local `+Z` turns to face the viewer, so author a card facing `+Z`; any material works, lit or
unlit. A solid mesh keeps its depth and the scale along each axis as it turns, but loses the
shear of a non-uniformly scaled parent under a rotation. Its shadow and its culling use the
unturned mesh, so geometry off-centre from its origin can be culled while on screen, and meshes
with different modes don't share a draw.

##### Example

```ts
card.billboardMode = 'cylindrical';
```

##### Returns

[`BillboardMode`](scene.BillboardMode.html.md)

#### Set Signature

> **set** **billboardMode**(`value`): `void`

Sets how the mesh turns to face the camera

##### Parameters

###### value

[`BillboardMode`](scene.BillboardMode.html.md)

How to orient the mesh toward the camera, or `'none'` to draw it as authored.

##### Returns

`void`

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`billboardMode`](scene.Mesh3D.html#billboardmode)

***

### boundingSphere

#### Get Signature

> **get** **boundingSphere**(): [`Sphere`](maths.Sphere.html.md)

This mesh's bounding [Sphere](maths.Sphere.html.md) in world space, large enough for morph weights from 0 to 1

Cached until the world transform or geometry changes, so reading it often is cheap. It follows
[worldTransform](scene.Container3D.html#worldtransform), so it can be out of date after a change
this frame. Dynamic geometry gives an empty sphere (`radius < 0`). The sphere is shared: don't
change it, and `clone()` it to keep a copy.

##### Example

```ts
if (camera.frustum.intersectsSphere(enemy.boundingSphere)) enemy.lookAt(player.position);
```

##### Returns

[`Sphere`](maths.Sphere.html.md)

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`boundingSphere`](scene.Mesh3D.html#boundingsphere)

***

### castShadow

#### Get Signature

> **get** **castShadow**(): `boolean`

Whether this mesh casts shadows

A mesh whose material has `alphaMode: 'blend'`, or uses transmission, casts none even while
this is `true`. Setting it is `enablePass('shadow')` or `disablePass('shadow')`.

##### Example

```ts
grass.castShadow = false;
```

##### Returns

`boolean`

#### Set Signature

> **set** **castShadow**(`value`): `void`

Sets whether the mesh casts shadows, from the next render

##### Parameters

###### value

`boolean`

Whether the mesh casts shadows.

##### Returns

`void`

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`castShadow`](scene.Mesh3D.html#castshadow)

***

### depth

#### Get Signature

> **get** **depth**(): `number`

Depth along local z: `|scale.z| × local bounds depth`

Assigning writes `scale.z` only; see [width](scene.Container3D.html#width).

##### Example

```ts
bench.depth = 0.5;
```

##### Returns

`number`

#### Set Signature

> **set** **depth**(`value`): `void`

Scales along z so the depth becomes `value`

##### Parameters

###### value

`number`

Target depth along z

##### Returns

`void`

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`depth`](scene.Mesh3D.html#depth)

***

### geometry

#### Get Signature

> **get** **geometry**(): [`Geometry3D`](geometry.Geometry3D.html.md)

The geometry this mesh draws; [Geometry3D.EMPTY](geometry.Geometry3D.html#empty) until it's given one

##### Example

```ts
rock.geometry = isFar ? lowDetailRock : highDetailRock;
```

##### Returns

[`Geometry3D`](geometry.Geometry3D.html.md)

#### Set Signature

> **set** **geometry**(`value`): `void`

Swaps the geometry, refitting a `hitVolume` given as `'box'` or `'geometry'`

A geometry with as many morph targets as there are [Mesh3D#weights](scene.Mesh3D.html#weights) keeps them; one with
a different count gets new weights, all 0; one with none leaves `weights` undefined.

##### Parameters

###### value

[`Geometry3D`](geometry.Geometry3D.html.md)

Geometry to draw.

##### Returns

`void`

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`geometry`](scene.Mesh3D.html#geometry)

***

### height

#### Get Signature

> **get** **height**(): `number`

The sprite's height in world units: `|scale.y| × texture height × pixelSize`

Assigning writes `scale.y` only; see [Sprite3D#width](#width).

##### Example

```ts
tree.height = 6;
```

##### Returns

`number`

#### Set Signature

> **set** **height**(`value`): `void`

Sets `scale.y` for a height in world units

##### Parameters

###### value

`number`

Height in world units.

##### Returns

`void`

#### Overrides

[`Mesh3D`](scene.Mesh3D.html.md).[`height`](scene.Mesh3D.html#height)

***

### material

#### Get Signature

> **get** **material**(): [`BaseMaterial3D`](materials.BaseMaterial3D.html.md)

The material this mesh draws with; [BaseMaterial3D.EMPTY](materials.BaseMaterial3D.html#empty) until it's given one

Many meshes can draw one material, and a value written to it shows on all of them. A
[Model3D](scene.Model3D.html.md)'s meshes draw its source's materials, shared with every model built from that
source; [Model3D#materials](scene.Model3D.html#materials) gives one model copies of its own. For one mesh alone, assign
`mesh.material.clone({ baseColor: 0xff0000 })`, and destroy the copy when you're done with it.

##### Example

```ts
crate.material = selected ? highlightMaterial : crateMaterial;
```

##### Returns

[`BaseMaterial3D`](materials.BaseMaterial3D.html.md)

#### Set Signature

> **set** **material**(`value`): `void`

Swaps the material

##### Parameters

###### value

[`BaseMaterial3D`](materials.BaseMaterial3D.html.md)

Material to draw the geometry with.

##### Returns

`void`

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`material`](scene.Mesh3D.html#material)

***

### origin

#### Get Signature

> **get** **origin**(): [`ObservableVector3`](maths.ObservableVector3.html.md)

Point in local space that rotation and scale happen around, as in pixi.js

Unlike a pivot, it leaves an unrotated, unscaled node where it is: the origin sits at
`position + origin` in the parent. Assigning copies the values in, and a single number sets
all three axes.

##### Example

```ts
// Tip a crate over its bottom-right edge without moving it first.
crate.origin = { x: 0.5, y: -0.5, z: 0 };
crate.angle.z = -90;
```

##### Returns

[`ObservableVector3`](maths.ObservableVector3.html.md)

#### Set Signature

> **set** **origin**(`value`): `void`

Sets the origin; a number sets all three axes

##### Parameters

###### value

`number` \| [`PointData3D`](maths.PointData3D.html.md)

The new origin, in local space

##### Returns

`void`

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`origin`](scene.Mesh3D.html#origin)

***

### pixelSize

#### Get Signature

> **get** **pixelSize**(): `number`

World units per texture pixel, which sets the sprite's size without touching `scale`

##### Example

```ts
sprite.pixelSize = 1 / 64;
```

##### Returns

`number`

#### Set Signature

> **set** **pixelSize**(`value`): `void`

Re-sizes the sprite without touching `scale`

##### Parameters

###### value

`number`

World units per texture pixel.

##### Returns

`void`

***

### position

#### Get Signature

> **get** **position**(): [`ObservableVector3`](maths.ObservableVector3.html.md)

Local position

Assigning copies the values in; the object itself never changes.

##### Example

```ts
node.position.set(0, 1, 0);
node.position = { x: 0, y: 1, z: 0 };
```

##### Returns

[`ObservableVector3`](maths.ObservableVector3.html.md)

#### Set Signature

> **set** **position**(`value`): `void`

Sets the local position

##### Parameters

###### value

[`PointData3D`](maths.PointData3D.html.md)

The new position

##### Returns

`void`

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`position`](scene.Mesh3D.html#position)

***

### quaternion

#### Get Signature

> **get** **quaternion**(): [`ObservableQuaternion`](maths.ObservableQuaternion.html.md)

Local rotation as a unit quaternion; see [rotation](scene.Container3D.html#rotation) for which of
the two is in use

Assigning copies the values in, so `node.quaternion = other.quaternion` doesn't link the two.

##### Example

```ts
node.quaternion = other.quaternion;
node.quaternion = { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 };
```

##### Returns

[`ObservableQuaternion`](maths.ObservableQuaternion.html.md)

#### Set Signature

> **set** **quaternion**(`value`): `void`

Sets the quaternion and makes it the rotation in use, even when the values are unchanged

##### Parameters

###### value

[`QuaternionData`](maths.QuaternionData.html.md)

The new rotation, as a unit quaternion

##### Returns

`void`

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`quaternion`](scene.Mesh3D.html#quaternion)

***

### renderPassMask

#### Get Signature

> **get** **renderPassMask**(): `number`

**`Advanced`**

The [RenderPassBit](rendering.RenderPassBit.html.md) flags of the passes that draw this mesh: its material's passes, plus
`SHADOW` while it casts shadows, or none while it holds [Geometry3D.EMPTY](geometry.Geometry3D.html#empty) or
[BaseMaterial3D.EMPTY](materials.BaseMaterial3D.html#empty)

The mesh's own [Mesh3D#enablePass](scene.Mesh3D.html#enablepass) and [Mesh3D#disablePass](scene.Mesh3D.html#disablepass) win over its
material's, and a blended or transmissive material casts no shadow.

##### Example

```ts
const castsShadow = (mesh.renderPassMask & RenderPassBit.SHADOW) !== 0;
```

##### Returns

`number`

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`renderPassMask`](scene.Mesh3D.html#renderpassmask)

***

### rotation

#### Get Signature

> **get** **rotation**(): [`ObservableVector3`](maths.ObservableVector3.html.md)

Local rotation as Euler angles in radians: turns around Z, then Y, then X, each about the parent's axes

The node keeps both this and [quaternion](scene.Container3D.html#quaternion), and whichever you
set last is the rotation in use. Assigning copies the values in. Writing unchanged values to
either through a component, `set` or `copyFrom` doesn't switch which one is in use; assign it
whole.

##### Example

```ts
node.rotation.y = Math.PI / 2;
node.rotation = { x: 0, y: Math.PI / 2, z: 0 };
```

##### Returns

[`ObservableVector3`](maths.ObservableVector3.html.md)

#### Set Signature

> **set** **rotation**(`value`): `void`

Sets the Euler rotation and makes it the rotation in use, even when the values are unchanged

##### Parameters

###### value

[`PointData3D`](maths.PointData3D.html.md)

The new Euler angles, in radians

##### Returns

`void`

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`rotation`](scene.Mesh3D.html#rotation)

***

### scale

#### Get Signature

> **get** **scale**(): [`ObservableVector3`](maths.ObservableVector3.html.md)

Local scale

Assigning copies the values in, and a single number scales all three axes; the object itself
never changes.

##### Example

```ts
node.scale.set(2, 1, 1);
node.scale = 2; // uniform
```

##### Returns

[`ObservableVector3`](maths.ObservableVector3.html.md)

#### Set Signature

> **set** **scale**(`value`): `void`

Sets the local scale; a number sets all three axes

##### Parameters

###### value

`number` \| [`PointData3D`](maths.PointData3D.html.md)

The new scale

##### Returns

`void`

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`scale`](scene.Mesh3D.html#scale)

***

### texture

#### Get Signature

> **get** **texture**(): [`Texture`](https://pixijs.download/release/docs/index.html)

The image on the quad

Assigning another re-sizes the sprite; switching frames within one sprite sheet is cheap. It
writes the material's `baseColor` slot, so on a shared material it changes every sprite using
it. A sprite follows in-place changes only to a texture that was `dynamic` when it got it, as
pixi's 2D `Sprite` does.

##### Example

```ts
coin.texture = sheet.textures[`coin_${frame}.png`];
```

##### Returns

[`Texture`](https://pixijs.download/release/docs/index.html)

#### Set Signature

> **set** **texture**(`value`): `void`

Swaps the image and re-sizes the sprite; rotated sprite sheet frames work too

##### Parameters

###### value

[`Texture`](https://pixijs.download/release/docs/index.html)

Image to draw on the quad.

##### Returns

`void`

***

### tint

#### Get Signature

> **get** **tint**(): `number`

Colour multiplied into the texture

As with `Container.tint`, it takes any `ColorSource` and reads back as a hex number. Opacity
is [Sprite3D#alpha](#alpha). It writes the material's `baseColor`, so on a shared material it
recolours every sprite using it.

##### Example

```ts
glow.tint = 'orange';
```

##### Returns

`number`

#### Set Signature

> **set** **tint**(`value`): `void`

Sets the colour multiplied into the texture

##### Parameters

###### value

[`ColorSource`](https://pixijs.download/release/docs/index.html)

Colour to multiply by.

##### Returns

`void`

***

### view3d

#### Get Signature

> **get** **view3d**(): [`View3D`](scene.View3D.html.md)\<[`Container3D`](scene.Container3D.html.md)\> \| `null`

The [View3D](scene.View3D.html.md) this node is in, or `null` when it isn't in a scene

##### Returns

[`View3D`](scene.View3D.html.md)\<[`Container3D`](scene.Container3D.html.md)\> \| `null`

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`view3d`](scene.Mesh3D.html#view3d)

***

### visible

#### Get Signature

> **get** **visible**(): `boolean`

Whether this container and its descendants draw

Hiding is cheap, and a hidden node stays in the scene; to take it out, remove it with
[removeChild](scene.Container3D.html#removechild). Emits
[visibleChanged](scene.Container3DEvents.html#visiblechanged) when the value changes.

##### Example

```ts
door.visible = false;
```

##### Returns

`boolean`

#### Set Signature

> **set** **visible**(`value`): `void`

Shows or hides this container and its descendants

##### Parameters

###### value

`boolean`

Whether they draw

##### Returns

`void`

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`visible`](scene.Mesh3D.html#visible)

***

### weights

#### Get Signature

> **get** **weights**(): [`Float32Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Float32Array)\<`ArrayBufferLike`\> \| `undefined`

Morph target weights, one per target; `undefined` when the geometry has no morph targets

Change its values at any time rather than assigning a new array: a playing animation keeps
writing the old one, and the parts a model node's mesh splits into share one array, so a new
array cuts this mesh loose from both.

##### Example

```ts
if (face.weights) face.weights[smileIndex] = 0.8;
```

##### Returns

[`Float32Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Float32Array)\<`ArrayBufferLike`\> \| `undefined`

#### Set Signature

> **set** **weights**(`value`): `void`

Replaces the weights array; does nothing when the geometry has no morph targets or `value` is
`undefined`

##### Parameters

###### value

[`Float32Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Float32Array)\<`ArrayBufferLike`\> \| `undefined`

New weights, one per morph target.

##### Returns

`void`

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`weights`](scene.Mesh3D.html#weights)

***

### width

#### Get Signature

> **get** **width**(): `number`

The sprite's width in world units: `|scale.x| × texture width × pixelSize`

Assigning writes `scale.x` and leaves [Sprite3D#height](#height) alone, as on pixi's 2D `Sprite`;
to keep the aspect ratio, pass [width](scene.Sprite3DOptions.html#width) at construction.

##### Example

```ts
sign.width = 2;
```

##### Returns

`number`

#### Set Signature

> **set** **width**(`value`): `void`

Sets `scale.x` for a width in world units

##### Parameters

###### value

`number`

Width in world units.

##### Returns

`void`

#### Overrides

[`Mesh3D`](scene.Mesh3D.html.md).[`width`](scene.Mesh3D.html#width)

***

### worldVisible

#### Get Signature

> **get** **worldVisible**(): `number`

`1` when this node and every ancestor are visible, otherwise `0`

The view works it out once per frame, so it lags a `visible` change until the next render.

##### Returns

`number`

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`worldVisible`](scene.Mesh3D.html#worldvisible)

***

### x

#### Get Signature

> **get** **x**(): `number`

Local position on the x axis; the same as `position.x`

##### Example

```ts
player.x += speed * dt;
```

##### Returns

`number`

#### Set Signature

> **set** **x**(`value`): `void`

Sets `position.x`

##### Parameters

###### value

`number`

The new x position

##### Returns

`void`

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`x`](scene.Mesh3D.html#x)

***

### y

#### Get Signature

> **get** **y**(): `number`

Local position on the y axis; the same as `position.y`

##### Example

```ts
ball.y = Math.abs(Math.sin(time)) * 2;
```

##### Returns

`number`

#### Set Signature

> **set** **y**(`value`): `void`

Sets `position.y`

##### Parameters

###### value

`number`

The new y position

##### Returns

`void`

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`y`](scene.Mesh3D.html#y)

***

### z

#### Get Signature

> **get** **z**(): `number`

Local position on the z axis; the same as `position.z`

##### Example

```ts
if (car.z > finishLine) finish();
```

##### Returns

`number`

#### Set Signature

> **set** **z**(`value`): `void`

Sets `position.z`

##### Parameters

###### value

`number`

The new z position

##### Returns

`void`

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`z`](scene.Mesh3D.html#z)

## Methods

### addChild()

> **addChild**\<`U`\>(...`children`): `U`\[`0`\]

Adds one or more children to the end of this container's child list

A child with another parent leaves it first. A child that is already here moves to the end,
without events.

#### Type Parameters

##### U

`U` *extends* [`Container3D`](scene.Container3D.html.md)[]

#### Parameters

##### children

...`U`

The children to add

#### Returns

`U`\[`0`\]

The first added child

#### Example

```ts
view.root.addChild(crate, lamp);
```

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`addChild`](scene.Mesh3D.html#addchild)

***

### addChildAt()

> **addChildAt**\<`U`\>(`child`, `index`): `U`

Adds `child` at `index`, or moves it there when it is already a child of this container

A move within this container emits no events.

#### Type Parameters

##### U

`U` *extends* [`Container3D`](scene.Container3D.html.md)

#### Parameters

##### child

`U`

The child to add or move

##### index

`number`

The destination index

#### Returns

`U`

The added child

#### Example

```ts
rack.addChildAt(sword, 0);
```

#### Throws

When `index` is out of bounds.

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`addChildAt`](scene.Mesh3D.html#addchildat)

***

### destroy()

> **destroy**(`options?`): `void`

Destroys the sprite; the shared quad geometry always survives, even `destroy(true)`

A material the sprite made is always destroyed; one you gave it stays unless you pass
`material`. `texture` frees the sprite's texture, as on pixi's 2D `Sprite`, and
`textureSource` its source too; `textureSource` alone frees nothing. Children get your options
unchanged.

#### Parameters

##### options?

[`Destroy3DOptions`](scene.Destroy3DOptions.html.md)

Teardown flags; see [Destroy3DOptions](scene.Destroy3DOptions.html.md).

#### Returns

`void`

#### Example

```ts
sprite.destroy({ texture: true, textureSource: true });
```

#### Overrides

[`Mesh3D`](scene.Mesh3D.html.md).[`destroy`](scene.Mesh3D.html#destroy)

***

### disablePass()

> **disablePass**(`name`): `void`

Takes this mesh out of a render pass, whatever its material says

The mesh leaves the pass on the next render, and other meshes sharing the material stay in it.
`disablePass('opaque')` draws nothing of the mesh while it still casts its shadow. Only the
named pass is left, so a material that later turns `'blend'` brings the mesh into the
transparent pass. [Mesh3D#enablePass](scene.Mesh3D.html#enablepass) undoes it. Does nothing for a pass name nothing
has used yet.

#### Parameters

##### name

`string`

The pass's `name`, such as `'opaque'`.

#### Returns

`void`

#### Example

```ts
shadowProxy.disablePass('opaque');
```

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`disablePass`](scene.Mesh3D.html#disablepass)

***

### enablePass()

> **enablePass**(`name`): `void`

Adds this mesh to a render pass, whatever its material says

[BaseMaterial3D#enablePass](materials.BaseMaterial3D.html#enablepass) for one mesh: the pass draws this mesh from the next render,
and other meshes sharing the material don't follow. It undoes this mesh's own `disablePass`
for the pass. `'shadow'` is the same as setting `castShadow`.

#### Parameters

##### name

`string`

The pass's `name`, such as `'outline'`.

#### Returns

`void`

#### Example

```ts
hovered.enablePass('outline');
```

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`enablePass`](scene.Mesh3D.html#enablepass)

***

### getChildAt()

> **getChildAt**\<`U`\>(`index`): `U`

Gets the child at `index`

#### Type Parameters

##### U

`U` *extends* [`Container3D`](scene.Container3D.html.md)

#### Parameters

##### index

`number`

Index of the child to fetch

#### Returns

`U`

The child at `index`

#### Example

```ts
const first = group.getChildAt(0);
```

#### Throws

When `index` is out of bounds.

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`getChildAt`](scene.Mesh3D.html#getchildat)

***

### getChildByLabel()

> **getChildByLabel**(`label`, `deep?`): [`Container3D`](scene.Container3D.html.md) \| `null`

Returns the first child whose label matches, or `null`

Each container checks its direct children before searching inside them. An unlabelled node
never matches, even a pattern.

#### Parameters

##### label

`string` \| [`RegExp`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/RegExp)

Exact label, or a pattern to test labels against

##### deep?

`boolean` = `false`

Whether to search the whole subtree, not only direct children

#### Returns

[`Container3D`](scene.Container3D.html.md) \| `null`

The first match, or `null` when nothing matches

#### Example

```ts
const wheel = car.getChildByLabel('wheel_front_left', true);
const anyWheel = car.getChildByLabel(/^wheel_/, true);
```

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`getChildByLabel`](scene.Mesh3D.html#getchildbylabel)

***

### getChildIndex()

> **getChildIndex**(`child`): `number`

Gets the index of `child` within this container

#### Parameters

##### child

[`Container3D`](scene.Container3D.html.md)

The child to look up

#### Returns

`number`

The child's index

#### Example

```ts
const slot = rack.getChildIndex(sword);
```

#### Throws

When `child` is not a child of this container.

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`getChildIndex`](scene.Mesh3D.html#getchildindex)

***

### getChildrenByLabel()

> **getChildrenByLabel**(`label`, `deep?`, `out?`): [`Container3D`](scene.Container3D.html.md)[]

Collects every child whose label matches, in the order [Container3D.getChildByLabel](scene.Container3D.html#getchildbylabel)
visits them

#### Parameters

##### label

`string` \| [`RegExp`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/RegExp)

Exact label, or a pattern to test labels against

##### deep?

`boolean` = `false`

Whether to search the whole subtree, not only direct children

##### out?

[`Container3D`](scene.Container3D.html.md)[] = `[]`

Array the matches are appended to; a new one when omitted

#### Returns

[`Container3D`](scene.Container3D.html.md)[]

`out`

#### Example

```ts
const wheels = car.getChildrenByLabel(/^wheel_/, true);
```

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`getChildrenByLabel`](scene.Mesh3D.html#getchildrenbylabel)

***

### getGlobalPosition()

> **getGlobalPosition**(`out?`, `skipUpdate?`): [`Vector3`](maths.Vector3.html.md)

Returns this container's position in world space: `parent.toGlobal(this.position)`, or a copy
of `position` with no parent

#### Parameters

##### out?

[`Vector3`](maths.Vector3.html.md) = `...`

Point the result is written into. Defaults to a new [Vector3](maths.Vector3.html.md).

##### skipUpdate?

`boolean` = `false`

`true` to use the parent's cached world transform (see
  [Container3D.getGlobalTransform](scene.Container3D.html#getglobaltransform)); this node's own `position` is always read as it stands.

#### Returns

[`Vector3`](maths.Vector3.html.md)

#### Example

```ts
const screenPos = view3d.worldToScreen(mesh.getGlobalPosition());
```

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`getGlobalPosition`](scene.Mesh3D.html#getglobalposition)

***

### getGlobalTransform()

> **getGlobalTransform**(`out?`, `skipUpdate?`): [`Matrix4`](maths.Matrix4.html.md)

Works out this container's current world transform into `out`

It walks up the parent chain, so the result is right even before the view's transform pass
has run this frame. With `skipUpdate` it copies the cached
[worldTransform](scene.Container3D.html#worldtransform) instead, which is cheaper but can be stale.

#### Parameters

##### out?

[`Matrix4`](maths.Matrix4.html.md) = `...`

Matrix the result is written into. Defaults to a new `Matrix4`.

##### skipUpdate?

`boolean` = `false`

`true` to copy the cached world transform instead of recomputing.

#### Returns

[`Matrix4`](maths.Matrix4.html.md)

#### Example

```ts
const world = mesh.getGlobalTransform();
const localRay = ray.applyMatrix4(world.getInverse(world), new Ray());
```

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`getGlobalTransform`](scene.Mesh3D.html#getglobaltransform)

***

### getLocalBounds()

> **getLocalBounds**(`out?`): [`Box`](maths.Box.html.md)

Measures the bounding box of this container and its descendants, in this container's local
space

A subtree with a [boundsVolume](scene.Container3D.html#boundsvolume) counts as that box. Hidden
descendants are left out; this container counts whether or not it is visible. An empty subtree
measures as a zero box at the origin. Each call walks the subtree, so cache the result if you
need it every frame.

#### Parameters

##### out?

[`Box`](maths.Box.html.md) = `...`

Box to write into; a new one when omitted

#### Returns

[`Box`](maths.Box.html.md)

`out`

#### Example

```ts
const bounds = model.getLocalBounds();
const center = bounds.getCenter();
```

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`getLocalBounds`](scene.Mesh3D.html#getlocalbounds)

***

### getSize()

> **getSize**(`out?`): [`Size3D`](scene.Size3D.html.md)

Returns the sprite's size in world units, from the texture like [Sprite3D#width](#width)

A sprite is flat, so `depth` is always 0.

#### Parameters

##### out?

[`Size3D`](scene.Size3D.html.md) = `...`

Object to write into; a new one when omitted

#### Returns

[`Size3D`](scene.Size3D.html.md)

The size, written into `out`

#### Example

```ts
const { width, height } = sprite.getSize();
```

#### Overrides

[`Mesh3D`](scene.Mesh3D.html.md).[`getSize`](scene.Mesh3D.html#getsize)

***

### invalidate()

> **invalidate**(): `void`

Makes the mesh rebuild its shader and draw state on the next frame

Assigning `geometry`, `material` or `billboardMode` does this for you, and so do most material
changes; [BaseMaterial3D](materials.BaseMaterial3D.html.md) lists the ones that need this call. Call it too after changing
[receiveShadow](scene.Mesh3D.html#receiveshadow). It doesn't re-read vertex data edited in place;
call [Geometry3D.unload](geometry.Geometry3D.html#unload) for that.

#### Returns

`void`

#### Example

```ts
mesh.receiveShadow = false;
mesh.invalidate();
```

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`invalidate`](scene.Mesh3D.html#invalidate)

***

### isInteractive()

> **isInteractive**(): `boolean`

Whether this node fires listeners and can be an event target

True for `eventMode` `'static'` and `'dynamic'`, as in 2D.

#### Returns

`boolean`

#### Example

```ts
mesh.eventMode = 'dynamic';
mesh.isInteractive(); // true

mesh.eventMode = 'auto';
mesh.isInteractive(); // false: hit-tested, but never the target
```

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`isInteractive`](scene.Mesh3D.html#isinteractive)

***

### logHierarchy()

> **logHierarchy**(`depth?`): `void`

**`Advanced`**

Prints this container's subtree to the console as an indented tree of `ConstructorName "label"`
lines, for debugging

#### Parameters

##### depth?

`number` = `0`

Indentation level to start at; used by the recursion

#### Returns

`void`

#### Example

```ts
model.logHierarchy();
```

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`logHierarchy`](scene.Mesh3D.html#loghierarchy)

***

### lookAt()

> **lookAt**(`target`, `up?`): `void`

Turns this node so its forward axis, local +Z, points at a world-space `target`

Cameras and lights aim local -Z instead. The node aims from `position + origin`, and uses the
parent's current world transform, so a move earlier in the frame counts.

#### Parameters

##### target

[`PointData3D`](maths.PointData3D.html.md)

World-space point to face

##### up?

[`PointData3D`](maths.PointData3D.html.md) = `_lookAtDefaultUp`

World-space up reference; defaults to `(0, 1, 0)`

#### Returns

`void`

#### Example

```ts
turret.lookAt(enemy.getGlobalPosition());
```

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`lookAt`](scene.Mesh3D.html#lookat)

***

### removeChild()

> **removeChild**\<`U`\>(...`children`): `U`\[`0`\]

Removes one or more children from this container; a node that isn't a child is ignored

#### Type Parameters

##### U

`U` *extends* [`Container3D`](scene.Container3D.html.md)[]

#### Parameters

##### children

...`U`

The children to remove

#### Returns

`U`\[`0`\]

The first child passed in

#### Example

```ts
view.root.removeChild(crate);
```

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`removeChild`](scene.Mesh3D.html#removechild)

***

### removeChildAt()

> **removeChildAt**\<`U`\>(`index`): `U`

Removes the child at `index`

#### Type Parameters

##### U

`U` *extends* [`Container3D`](scene.Container3D.html.md)

#### Parameters

##### index

`number`

Index of the child to remove

#### Returns

`U`

The removed child

#### Example

```ts
const newest = queue.removeChildAt(queue.children.length - 1);
```

#### Throws

When `index` is out of bounds.

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`removeChildAt`](scene.Mesh3D.html#removechildat)

***

### removeChildren()

> **removeChildren**(`beginIndex?`, `endIndex?`): [`Container3D`](scene.Container3D.html.md)[]

Removes the children from `beginIndex` up to, but not including, `endIndex`

#### Parameters

##### beginIndex?

`number` = `0`

First index to remove

##### endIndex?

`number`

End of the range, exclusive; defaults to the child count

#### Returns

[`Container3D`](scene.Container3D.html.md)[]

The removed children, last child first

#### Example

```ts
const debris = level.removeChildren();
```

#### Throws

When `beginIndex` is negative or past `endIndex`, or equal to it while
this container has children.

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`removeChildren`](scene.Mesh3D.html#removechildren)

***

### removeFromParent()

> **removeFromParent**(): `void`

Removes this container from its parent, if it has one

#### Returns

`void`

#### Example

```ts
pickup.removeFromParent();
```

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`removeFromParent`](scene.Mesh3D.html#removefromparent)

***

### reparentChild()

> **reparentChild**\<`U`\>(...`child`): `U`\[`0`\]

Moves one or more nodes under this container without moving them in the world; see
[reparentChildAt](scene.Container3D.html#reparentchildat)

#### Type Parameters

##### U

`U` *extends* [`Container3D`](scene.Container3D.html.md)[]

#### Parameters

##### child

...`U`

The children to reparent

#### Returns

`U`\[`0`\]

The first reparented child

#### Example

```ts
hand.reparentChild(sword);
```

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`reparentChild`](scene.Mesh3D.html#reparentchild)

***

### reparentChildAt()

> **reparentChildAt**\<`U`\>(`child`, `index`): `U`

Moves `child` under this container at `index` without moving it in the world

Its local position, rotation and scale change so that it renders where it did, and it keeps
its [origin](scene.Container3D.html#origin). Unlike pixi, it uses current world transforms, so a
move earlier in the frame counts. A child that is already here only changes index.

#### Type Parameters

##### U

`U` *extends* [`Container3D`](scene.Container3D.html.md)

#### Parameters

##### child

`U`

The child to reparent

##### index

`number`

The destination index

#### Returns

`U`

The reparented child

#### Example

```ts
rack.reparentChildAt(sword, 0);
```

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`reparentChildAt`](scene.Mesh3D.html#reparentchildat)

***

### replaceChild()

> **replaceChild**\<`U`, `T`\>(`oldChild`, `newChild`): `void`

Replaces `oldChild` with `newChild` at the same index, copying `oldChild`'s local position,
rotation and scale onto `newChild`

`newChild` keeps its own [origin](scene.Container3D.html#origin), and its position is solved so it
sits exactly where `oldChild` did.

#### Type Parameters

##### U

`U` *extends* [`Container3D`](scene.Container3D.html.md)

##### T

`T` *extends* [`Container3D`](scene.Container3D.html.md)

#### Parameters

##### oldChild

`U`

The child to replace

##### newChild

`T`

The child that takes its place

#### Returns

`void`

#### Example

```ts
car.replaceChild(flatTyre, spareWheel);
```

#### Throws

When `oldChild` is not a child of this container.

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`replaceChild`](scene.Mesh3D.html#replacechild)

***

### setChildIndex()

> **setChildIndex**(`child`, `index`): `void`

Moves an existing `child` to `index` within this container

#### Parameters

##### child

[`Container3D`](scene.Container3D.html.md)

The child to move

##### index

`number`

The destination index

#### Returns

`void`

#### Example

```ts
rack.setChildIndex(sword, 0);
```

#### Throws

When `index` is out of bounds or `child` is not a child of this container.

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`setChildIndex`](scene.Mesh3D.html#setchildindex)

***

### setSize()

> **setSize**(`value`, `height?`, `_depth?`): `void`

Sizes the sprite in world units, from the texture like [Sprite3D#width](#width)

A single number sets both axes, and a missing `height` takes the width, as in pixi's 2D
`Sprite`. A sprite is flat, so any `depth` is ignored.

#### Parameters

##### value

`number` \| [`Pick`](https://www.typescriptlang.org/docs/handbook/utility-types.html#picktype-keys)\<[`Size3D`](scene.Size3D.html.md), `"width"`\> & [`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)\<[`Size3D`](scene.Size3D.html.md)\>

Target width, or an object with `width` and optional `height`

##### height?

`number`

Target height; defaults to the width

##### \_depth?

`number`

Ignored; a sprite is flat

#### Returns

`void`

#### Example

```ts
sprite.setSize(2, 1);
sprite.setSize({ width: 3 }); // 3 × 3
```

#### Overrides

[`Mesh3D`](scene.Mesh3D.html.md).[`setSize`](scene.Mesh3D.html#setsize)

***

### swapChildren()

> **swapChildren**\<`U`\>(`child`, `child2`): `void`

Swaps the places of two children in this container's list

#### Type Parameters

##### U

`U` *extends* [`Container3D`](scene.Container3D.html.md)

#### Parameters

##### child

`U`

The first child

##### child2

`U`

The second child

#### Returns

`void`

#### Example

```ts
rack.swapChildren(sword, shield);
```

#### Throws

When either argument is not a child of this container.

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`swapChildren`](scene.Mesh3D.html#swapchildren)

***

### toGlobal()

> **toGlobal**\<`T`\>(`position`, `out?`, `skipUpdate?`): `T`

Converts a point from this container's local space to world space

Pass the result to [View3D.worldToScreen](scene.View3D.html#worldtoscreen) to go on to 2D screen coordinates.

#### Type Parameters

##### T

`T` *extends* [`PointLike3D`](maths.PointLike3D.html.md) = [`Vector3`](maths.Vector3.html.md)

#### Parameters

##### position

[`PointData3D`](maths.PointData3D.html.md)

The local-space point to convert.

##### out?

`T`

Point the result is written into. Defaults to a new [Vector3](maths.Vector3.html.md).

##### skipUpdate?

`boolean` = `false`

`true` to use the cached world transform (see [Container3D.getGlobalTransform](scene.Container3D.html#getglobaltransform)).

#### Returns

`T`

#### Example

```ts
const aboveHead = player.toGlobal({ x: 0, y: 2, z: 0 });
```

#### See

[Container3D.getGlobalPosition](scene.Container3D.html#getglobalposition) For this container's own world position.

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`toGlobal`](scene.Mesh3D.html#toglobal)

***

### toLocal()

> **toLocal**\<`T`\>(`position`, `from?`, `out?`, `skipUpdate?`): `T`

Converts a point into this container's local space

#### Type Parameters

##### T

`T` *extends* [`PointLike3D`](maths.PointLike3D.html.md) = [`Vector3`](maths.Vector3.html.md)

#### Parameters

##### position

[`PointData3D`](maths.PointData3D.html.md)

The point to convert.

##### from?

[`Container3D`](scene.Container3D.html.md)

Container whose local space `position` is in. Defaults to world space.

##### out?

`T`

Point the result is written into. Defaults to a new [Vector3](maths.Vector3.html.md).

##### skipUpdate?

`boolean` = `false`

`true` to use cached world transforms (see [Container3D.getGlobalTransform](scene.Container3D.html#getglobaltransform)).

#### Returns

`T`

#### Example

```ts
const targetFromTurret = turret.toLocal({ x: 0, y: 0, z: 0 }, target);
```

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`toLocal`](scene.Mesh3D.html#tolocal)

***

### traverse()

> **traverse**(`callback`): `void`

Calls `callback` with this container, then with every container under it, depth first

Each container comes before its children, and hidden ones are visited too. A [Skeleton](scene.Skeleton.html.md)'s
bones and a [BatchedMesh3D](scene.BatchedMesh3D.html.md)'s [items](scene.BatchedMesh3D.html#items) aren't containers, so
the walk doesn't reach them. It can't stop early or skip a subtree.

The callback may remove, destroy or [replace](scene.Container3D.html#replacechild) the container
it's given. A container it adds with [addChild](scene.Container3D.html#addchild) is visited only if
its new parent hasn't been visited yet. Other changes to the tree during the walk can skip a
container or visit one twice.

#### Parameters

##### callback

(`container`) => `void`

Called once with each container, this one first

#### Returns

`void`

#### Example

```ts
const robot = new Model3D(source);

robot.traverse((container) => {
  if (container instanceof Mesh3D) container.enablePass('outline');
});
```

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`traverse`](scene.Mesh3D.html#traverse)

***

### unload()

> **unload**(): `void`

Unloads this mesh's geometry now

The vertex data stays on the CPU, so the next frame that draws the mesh uploads it again.
Remove the mesh from the scene first, or that happens straight away. The material is left
alone, since it's usually shared: call [BaseMaterial3D.unload](materials.BaseMaterial3D.html#unload) for that, or
[Model3D.unload](scene.Model3D.html#unload) to free a model's geometry and textures together.

#### Returns

`void`

#### Example

```ts
view.root.removeChild(mesh);
mesh.unload(); // adding it back re-uploads and re-packs the geometry
```

#### See

 - [Geometry3D.unload](geometry.Geometry3D.html#unload) For what this frees.
 - [Mesh3D.destroy](scene.Mesh3D.html#destroy) For permanent teardown.

#### Inherited from

[`Mesh3D`](scene.Mesh3D.html.md).[`unload`](scene.Mesh3D.html#unload)

***

### updateLocalTransform()

> **updateLocalTransform**(): `void`

**`Advanced`**

Rebuilds [localTransform](scene.Container3D.html#localtransform) with the texture's world size and
the anchor offset in it

A texture with no size yet, such as one still loading, shrinks the quad to a point.

#### Returns

`void`

#### Overrides

[`Mesh3D`](scene.Mesh3D.html.md).[`updateLocalTransform`](scene.Mesh3D.html#updatelocaltransform)

***

### from()

> `static` **from**(`source`, `skipCache?`): `Sprite3D`

Creates a self-contained sprite from a texture, or from anything `Texture.from` accepts: an
asset alias or URL already in the cache, an image, a canvas or a `TextureSource`

The 3D counterpart of pixi's `Sprite.from`. An alias the cache doesn't have draws nothing, and
pixi warns; load the asset first.

#### Parameters

##### source

[`Texture`](https://pixijs.download/release/docs/index.html)\<[`TextureSource`](https://pixijs.download/release/docs/index.html)\<`any`\>\> \| [`TextureSourceLike`](https://pixijs.download/release/docs/index.html)

The texture, or the source to build one from.

##### skipCache?

`boolean` = `false`

Build a fresh texture instead of reusing a cached one for `source`; an alias
or URL always comes from the cache.

#### Returns

`Sprite3D`

A sprite drawing that texture on its own [FlatMaterial](materials.FlatMaterial.html.md).

#### Example

```ts
await Assets.load('tree.png');
const tree = Sprite3D.from('tree.png');
```
