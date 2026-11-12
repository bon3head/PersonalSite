# Class: OrbitCamera

Orbit, zoom and pan controller for a [View3D](scene.View3D.html.md)'s camera

Rotate with the left mouse button or one finger, zoom with the wheel, the middle button or a
two-finger pinch, and pan with the right button, ctrl/meta/shift + left button, or a two-finger
drag. Supports damping, zoom-to-cursor, angle and distance limits, auto-rotate, and saving and
restoring the camera.

Input comes from the View's pointer and wheel events, so a 3D node that stops propagation keeps
the camera still, and the View's `hitArea` bounds where input is read. The controller blocks the
browser's context menu over the View so the right button can pan; see
[preventContextMenu](#preventcontextmenu).

pixi listens for the wheel passively, so wheel zoom can't stop the page from scrolling, nor a
trackpad pinch from zooming the page. To stop both, add your own `wheel` listener on the canvas
with `{ passive: false }` that calls `preventDefault()`.

## Example

```ts
import { OrbitCamera } from '@pixi/3d/extras';

const orbit = new OrbitCamera({
  view: view3d,
  target: { x: 0, y: 1, z: 0 },
  enableDamping: true,
  minDistance: 2,
  maxDistance: 20,
});

orbit.on('change', () => console.log('camera moved'));

// On teardown:
orbit.destroy();
```

## See

 - [OrbitCameraOptions](extras_camera.OrbitCameraOptions.html.md) For all constructor options.
 - [FPSCamera](extras_camera.FPSCamera.html.md) For a first-person controller.

## Extends

- `EventEmitter`\<\{ `change`: \[\]; `end`: \[\]; `start`: \[\]; \}\>

## Constructors

### Constructor

> **new OrbitCamera**(`options`): `OrbitCamera`

Starts listening for input on `options.view` right away

#### Parameters

##### options

[`OrbitCameraOptions`](extras_camera.OrbitCameraOptions.html.md)

Options for the controller

#### Returns

`OrbitCamera`

#### Overrides

`` EventEmitter<{ /** * A pointer or wheel gesture started * @example * ```ts * orbit.on('start', () => (view3d.cursor = 'grabbing')); * ``` */ start: []; /** * A pointer or wheel gesture ended * @example * ```ts * orbit.on('end', () => (view3d.cursor = 'grab')); * ``` */ end: []; /** * The camera or target moved, or the camera zoomed * * An `update()` called from a `'change'` listener moves the camera without emitting again. * @example * ```ts * await app.init({ autoStart: false }); * orbit.on('change', () => app.render()); * ``` */ change: []; }>.constructor ``

## Properties

### autoRotate

> **autoRotate**: `boolean`

Orbit around the target on its own whenever no gesture is in progress

#### Example

```ts
let idleTimer: ReturnType<typeof setTimeout>;

orbit.on('start', () => {
  clearTimeout(idleTimer);
  orbit.autoRotate = false;
});
orbit.on('end', () => {
  idleTimer = setTimeout(() => (orbit.autoRotate = true), 3000);
});
```

***

### autoRotateSpeed

> **autoRotateSpeed**: `number` = `0`

Auto-rotate speed in revolutions per minute; negative values turn the other way

#### Example

```ts
orbit.autoRotateSpeed = -1;
```

***

### dampingFactor

> **dampingFactor**: `number` = `0`

Share of the remaining motion applied each update while `enableDamping` is on; lower values
glide longer

It applies per update, not per second, so the glide is shorter at higher frame rates.

#### Example

```ts
orbit.enableDamping = true;
orbit.dampingFactor = 0.15;
```

***

### enabled

> **enabled**: `boolean`

Whether the controller responds to input

Damping and auto-rotate carry on while it's off, and every update still turns the camera to
face the target, so turn [autoUpdate](#autoupdate) off too before aiming the
camera yourself.

#### Example

```ts
function setMode(mode: 'inspect' | 'build'): void {
  orbit.enabled = mode === 'inspect';
}
```

***

### enableDamping

> **enableDamping**: `boolean`

Ease rotation and panning out after input stops, instead of halting with the pointer

The glide happens in [update()](#update), so it needs
[autoUpdate](#autoupdate) on, or your own update call every frame.

#### Example

```ts
smoothCameraCheckbox.onchange = () => (orbit.enableDamping = smoothCameraCheckbox.checked);
```

***

### enablePan

> **enablePan**: `boolean`

Whether drags pan the camera; [pan()](#pan) works either way

#### Example

```ts
orbit.enablePan = false;
```

***

### enableRotate

> **enableRotate**: `boolean`

Whether drags rotate the camera; [rotate()](#rotate) works either way

#### Example

```ts
orbit.enableRotate = false;
orbit.mouseButtons.left = 'pan';
```

***

### enableZoom

> **enableZoom**: `boolean`

Whether the wheel, pinches and any button set to `'zoom'` zoom the camera;
[zoom()](#zoom) works either way

#### Example

```ts
orbit.enableZoom = false;
```

***

### maxAzimuthAngle

> **maxAzimuthAngle**: `number` = `0`

Largest [azimuth](#azimuthangle) the camera can reach, in radians;
[OrbitCamera#minAzimuthAngle](#minazimuthangle) covers how the pair of limits applies

#### Example

```ts
orbit.minAzimuthAngle = (3 * Math.PI) / 4;
orbit.maxAzimuthAngle = -(3 * Math.PI) / 4;
```

***

### maxDistance

> **maxDistance**: `number` = `0`

Maximum distance from `target`

#### Example

```ts
orbit.maxDistance = mesh.boundingSphere.radius * 10;
```

***

### maxPolarAngle

> **maxPolarAngle**: `number` = `0`

Largest [polar angle](#polarangle) the camera can reach, in radians

#### Example

```ts
orbit.maxPolarAngle = Math.PI / 2;
```

***

### maxZoom

> **maxZoom**: `number` = `0`

Largest `camera.zoom` an orthographic camera can reach

#### Example

```ts
view3d.camera.mode = 'orthographic';
orbit.maxZoom = 4;
```

***

### minAzimuthAngle

> **minAzimuthAngle**: `number` = `0`

Smallest [azimuth](#azimuthangle) the camera can reach, in radians

The azimuth limits apply only while both are finite. They wrap, so a minimum greater than the
maximum allows the arc that passes through ±π.

#### Example

```ts
orbit.minAzimuthAngle = -Math.PI / 4;
orbit.maxAzimuthAngle = Math.PI / 4;
```

***

### minDistance

> **minDistance**: `number` = `0`

Minimum distance from `target`

#### Example

```ts
orbit.minDistance = mesh.boundingSphere.radius * 1.5;
```

***

### minPolarAngle

> **minPolarAngle**: `number` = `0`

Smallest [polar angle](#polarangle) the camera can reach, in radians

#### Example

```ts
orbit.minPolarAngle = Math.PI / 6;
```

***

### minZoom

> **minZoom**: `number` = `0`

Smallest `camera.zoom` an orthographic camera can reach; a perspective camera zooms by distance
instead

#### Example

```ts
view3d.camera.mode = 'orthographic';
orbit.minZoom = 0.5;
```

***

### mouseButtons

> `readonly` **mouseButtons**: [`OrbitMouseButtons`](extras_camera.OrbitMouseButtons.html.md)

What each mouse button does; change a slot to remap that button

#### Example

```ts
orbit.mouseButtons.left = 'pan';
orbit.mouseButtons.right = 'rotate';
```

***

### panSpeed

> **panSpeed**: `number` = `0`

Multiplier on pan drags

#### Example

```ts
orbit.panSpeed = 2;
```

***

### preventContextMenu

> **preventContextMenu**: `boolean`

Whether the browser's context menu is kept from opening over the View, so a right-button drag
or a ctrl + click on macOS doesn't open it

It applies only within the View's `hitArea` and only while `enabled` is on. On Windows the menu
opens on release, so a right-button drag that ends outside the View still opens it.

#### Example

```ts
orbit.mouseButtons.right = 'none';
orbit.preventContextMenu = false;
```

***

### rotateSpeed

> **rotateSpeed**: `number` = `0`

Multiplier on rotate drags

#### Example

```ts
orbit.rotateSpeed = settings.mouseSensitivity;
```

***

### screenSpacePanning

> **screenSpacePanning**: `boolean`

`true` pans in the screen's plane; `false` pans across the plane at right angles to
[OrbitCamera#up](#up), so vertical drags move over the ground like a map

#### Example

```ts
orbit.screenSpacePanning = false;
```

***

### target

> `readonly` **target**: [`Vector3`](maths.Vector3.html.md)

World-space point the camera orbits; mutate freely, and the change shows on the next update

#### Example

```ts
model.on('pointertap', (event) => {
  if (event.hit3D) orbit.target.copyFrom(event.hit3D.point);
});
```

***

### touches

> `readonly` **touches**: [`OrbitTouches`](extras_camera.OrbitTouches.html.md)

What each touch gesture does; change a slot to remap that gesture

#### Example

```ts
orbit.touches.one = 'pan';
```

***

### view

> `readonly` **view**: [`View3D`](scene.View3D.html.md)

The [View3D](scene.View3D.html.md) this controller listens on and whose camera it drives

#### Example

```ts
orbit.view.hitArea = new Rectangle(0, 0, 400, 300);
```

***

### zoomSpeed

> **zoomSpeed**: `number` = `0`

Multiplier on zoom input from the wheel, pinches and zoom-button drags

#### Example

```ts
orbit.zoomSpeed = 0.5;
```

***

### zoomToCursor

> **zoomToCursor**: `boolean`

Zoom toward the point under the pointer, or between the fingers of a pinch, instead of toward
the target

The target follows the zoom, so later orbits pivot near what you zoomed to.

#### Example

```ts
orbit.zoomToCursor = true;
```

***

### defaultOptions

> `static` **defaultOptions**: [`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)\<[`Omit`](https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys)\<[`OrbitCameraOptions`](extras_camera.OrbitCameraOptions.html.md), `"view"`\>\>

Defaults for every new `OrbitCamera`; an option passed as `undefined` keeps its default

#### Example

```ts
OrbitCamera.defaultOptions.enableDamping = true;
```

## Accessors

### autoUpdate

#### Get Signature

> **get** **autoUpdate**(): `boolean`

Whether [update()](#update) runs from `Ticker.shared` every frame

A default pixi `Application` renders from `app.ticker`, not `Ticker.shared`, so damping and
auto-rotate usually land a frame late. Turn this off and update from `app.ticker` to keep them
in step with the render.

##### Example

```ts
orbit.autoUpdate = false;
app.ticker.add((ticker) => orbit.update(ticker));
```

##### Returns

`boolean`

#### Set Signature

> **set** **autoUpdate**(`value`): `void`

Sets whether `update()` runs from `Ticker.shared`

##### Parameters

###### value

`boolean`

`true` to update every frame

##### Returns

`void`

***

### azimuthAngle

#### Get Signature

> **get** **azimuthAngle**(): `number`

Current azimuth angle in radians, around `up`: 0 puts the camera on the target's +Z side, and
positive angles move it toward +X

##### Example

```ts
orbit.on('change', () => (compassNeedle.rotation = orbit.azimuthAngle));
```

##### Returns

`number`

***

### camera

#### Get Signature

> **get** **camera**(): [`Camera3D`](scene.Camera3D.html.md)

The [Camera3D](scene.Camera3D.html.md) being driven, always `view.camera`

Move it yourself and the controller adopts the new position, within its limits, on its next
update. It always turns the camera to face the target.

##### Example

```ts
orbit.camera.position.set(0, 2, 6);
orbit.update();
```

##### Returns

[`Camera3D`](scene.Camera3D.html.md)

***

### distance

#### Get Signature

> **get** **distance**(): `number`

Current world-space distance from the camera to [target](#target)

##### Example

```ts
orbit.on('change', () => (labels.visible = orbit.distance < 15));
```

##### Returns

`number`

***

### polarAngle

#### Get Signature

> **get** **polarAngle**(): `number`

Current polar angle in radians, measured from `up`: 0 puts the camera straight above the
target, π/2 level with it and π straight below

##### Example

```ts
orbit.on('change', () => (floorGrid.visible = orbit.polarAngle < Math.PI / 2));
```

##### Returns

`number`

***

### up

#### Get Signature

> **get** **up**(): [`Vector3`](maths.Vector3.html.md)

World-space up axis the orbit turns around

Assign a new value to change it, and the camera settles on the next update. Changing the
returned vector in place leaves the orbit turning around the old axis.

##### Example

```ts
orbit.up = { x: 0, y: 0, z: 1 };
```

##### Returns

[`Vector3`](maths.Vector3.html.md)

#### Set Signature

> **set** **up**(`value`): `void`

Sets the up axis

##### Parameters

###### value

[`PointData3D`](maths.PointData3D.html.md)

Direction to treat as up; normalized

##### Returns

`void`

## Methods

### destroy()

> **destroy**(): `void`

Removes its input listeners and every `start`, `end` and `change` listener, and stops
auto-updating

The View and its camera are left as they are.

#### Returns

`void`

#### Example

```ts
orbit.destroy();
const walker = new FPSCamera({ view: view3d, position: { x: 0, y: 1.7, z: 5 } });
```

***

### pan()

> **pan**(`deltaX`, `deltaY`): `void`

Pan as a drag of `(deltaX, deltaY)` View pixels would, and apply the update

Positive values move the scene right and down, following the drag. It works whatever
`enabled` and `enablePan` say, and `panSpeed` doesn't scale it.

#### Parameters

##### deltaX

`number`

Horizontal drag in View pixels

##### deltaY

`number`

Vertical drag in View pixels

#### Returns

`void`

#### Example

```ts
window.addEventListener('keydown', (event) => {
  if (event.code === 'KeyA') orbit.pan(40, 0);
  if (event.code === 'KeyD') orbit.pan(-40, 0);
});
```

***

### reset()

> **reset**(): `void`

Restore the last [saveState()](#savestate) snapshot (the construction pose by default)

#### Returns

`void`

#### Example

```ts
resetViewButton.on('pointertap', () => orbit.reset());
```

***

### rotate()

> **rotate**(`azimuth`, `polar`): `void`

Orbit around `target` by the given angles and apply the update

It works whatever `enabled` and `enableRotate` say, since those only gate input. With damping
on, the turn is spread over the following updates.

#### Parameters

##### azimuth

`number`

Angle around `up` in radians; positive moves the camera the way a rightward
  drag does

##### polar

`number`

Angle toward `up` in radians; positive raises the camera over the target, as a
  downward drag does

#### Returns

`void`

#### Example

```ts
window.addEventListener('keydown', (event) => {
  if (event.code === 'ArrowLeft') orbit.rotate(-0.1, 0);
  if (event.code === 'ArrowRight') orbit.rotate(0.1, 0);
});
```

***

### saveState()

> **saveState**(): `void`

Snapshot `target`, `camera.position`, and `camera.zoom` for a later [reset()](#reset)

#### Returns

`void`

#### Example

```ts
saveViewButton.on('pointertap', () => orbit.saveState());
```

***

### update()

> **update**(`ticker?`): `boolean`

Moves the camera to match the orbit, applying damping and auto-rotate

Runs every frame while [autoUpdate](#autoupdate) is on; call it yourself every
frame when it's off.

#### Parameters

##### ticker?

[`Ticker`](https://pixijs.download/release/docs/index.html)

The ticker driving this update; supplies frame timing for auto-rotate.
  Omitted, one 60 fps frame is assumed.

#### Returns

`boolean`

`true` when the camera changed enough to warrant a re-render

#### Example

```ts
orbit.autoUpdate = false;
app.ticker.add((ticker) => {
  if (orbit.update(ticker)) minimap.redraw();
});
```

***

### zoom()

> **zoom**(`factor`): `void`

Zoom by a multiplicative `factor` toward the target and apply the update

It works whatever `enabled` and `enableZoom` say, and `zoomSpeed` doesn't scale it.

#### Parameters

##### factor

`number`

`> 1` zooms in, `< 1` zooms out; an orthographic camera changes `camera.zoom`
  instead of moving

#### Returns

`void`

#### Example

```ts
zoomInButton.on('pointertap', () => orbit.zoom(1.25));
zoomOutButton.on('pointertap', () => orbit.zoom(0.8));
```
