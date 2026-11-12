# Class: FPSCamera

First-person controller for a [View3D](scene.View3D.html.md)'s camera

Drag, or move the mouse under pointer lock, to look around. WASD or the arrow keys walk and
strafe, and Space and Shift move along world Y. The [move](#move) vector takes
input from anything else, such as an on-screen joystick.

A look drag or pointer lock starts from a press on the View, within its `hitArea`. The controller
blocks the browser's context menu over the View so a right-button drag can look around; see
[preventContextMenu](#preventcontextmenu).

## Example

```ts
import { FPSCamera } from '@pixi/3d/extras';

const fpsCamera = new FPSCamera({
  view: view3d,
  position: { x: 0, y: 1.7, z: 5 },
  pointerLock: true,
  moveSpeed: 6,
});

fpsCamera.on('lock', () => (hud.hidden = true));
fpsCamera.on('unlock', () => (hud.hidden = false));

// On teardown:
fpsCamera.destroy();
```

## See

 - [FPSCameraOptions](extras_camera.FPSCameraOptions.html.md) For all constructor options.
 - [OrbitCamera](extras_camera.OrbitCamera.html.md) For orbiting, zooming and panning around a target.

## Extends

- `EventEmitter`\<\{ `change`: \[\]; `lock`: \[\]; `unlock`: \[\]; \}\>

## Constructors

### Constructor

> **new FPSCamera**(`options`): `FPSCamera`

Starts listening for input on `options.view` right away

#### Parameters

##### options

[`FPSCameraOptions`](extras_camera.FPSCameraOptions.html.md)

Options for the controller

#### Returns

`FPSCamera`

#### Overrides

`` EventEmitter<{ /** * The camera moved or turned * @example * ```ts * fpsCamera.on('change', () => (compass.rotation = -fpsCamera.yaw)); * ``` */ change: []; /** * Pointer lock was acquired on the canvas * @example * ```ts * fpsCamera.on('lock', () => (pauseMenu.visible = false)); * ``` */ lock: []; /** * Pointer lock was released, such as by the player pressing Escape * @example * ```ts * fpsCamera.on('unlock', () => (pauseMenu.visible = true)); * ``` */ unlock: []; }>.constructor ``

## Properties

### enabled

> **enabled**: `boolean`

Whether look input and movement apply

Disabling it doesn't release pointer lock, so a menu that needs the cursor has to exit the
lock itself.

#### Example

```ts
inventory.on('open', () => {
  fpsCamera.enabled = false;
  document.exitPointerLock();
});
```

***

### lookSpeed

> **lookSpeed**: `number` = `0`

Look sensitivity in radians per pixel

#### Example

```ts
fpsCamera.lookSpeed = 0.002 * settings.mouseSensitivity;
```

***

### maxPitch

> **maxPitch**: `number` = `0`

Pitch clamp in radians

#### Example

```ts
fpsCamera.maxPitch = Math.PI / 3;
```

***

### move

> `readonly` **move**: [`Vector3`](maths.Vector3.html.md)

Movement input from outside the keyboard, each axis -1 to 1

`x` strafes right, `y` rises along world Y and `z` walks forward. It adds to the keys on every
update, so the camera keeps moving until you set it back to zero.

#### Example

```ts
app.ticker.add(() => {
  const pad = navigator.getGamepads()[0];

  if (pad) fpsCamera.move.set(pad.axes[0], 0, -pad.axes[1]);
});
```

***

### moveSpeed

> **moveSpeed**: `number` = `0`

Movement speed in world units per second

Diagonal input isn't normalised, so moving forward and sideways at once is about 1.4 times
faster.

#### Example

```ts
window.addEventListener('keydown', (event) => {
  if (event.code === 'ControlLeft') fpsCamera.moveSpeed = 10;
});
window.addEventListener('keyup', (event) => {
  if (event.code === 'ControlLeft') fpsCamera.moveSpeed = 5;
});
```

***

### pointerLock

> **pointerLock**: `boolean`

Request pointer lock on the canvas when the View is pressed, so the mouse looks around without
a button held

Only a mouse press requests the lock; touch and pen still look by dragging.

#### Example

```ts
fpsCamera.pointerLock = settings.captureMouse;
```

***

### preventContextMenu

> **preventContextMenu**: `boolean`

Whether the browser's context menu is kept from opening over the View, so a right-button drag
doesn't open it

It applies only within the View's `hitArea` and only while `enabled` is on. On Windows the menu
opens on release, so a right-button drag that ends outside the View still opens it.

#### Example

```ts
fpsCamera.preventContextMenu = false;
```

***

### view

> `readonly` **view**: [`View3D`](scene.View3D.html.md)

The [View3D](scene.View3D.html.md) this controller listens on and whose camera it drives

#### Example

```ts
fpsCamera.view.cursor = 'crosshair';
```

***

### defaultOptions

> `static` **defaultOptions**: [`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)\<[`Omit`](https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys)\<[`FPSCameraOptions`](extras_camera.FPSCameraOptions.html.md), `"view"`\>\>

Defaults for every new `FPSCamera`; an option passed as `undefined` keeps its default

#### Example

```ts
FPSCamera.defaultOptions.pointerLock = true;
```

## Accessors

### autoUpdate

#### Get Signature

> **get** **autoUpdate**(): `boolean`

Whether [update()](#update) runs from `Ticker.shared` every frame

[OrbitCamera#autoUpdate](extras_camera.OrbitCamera.html#autoupdate) explains why updating from `app.ticker` keeps movement in step
with the render.

##### Example

```ts
fpsCamera.autoUpdate = false;
app.ticker.add((ticker) => fpsCamera.update(ticker));
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

### camera

#### Get Signature

> **get** **camera**(): [`Camera3D`](scene.Camera3D.html.md)

The [Camera3D](scene.Camera3D.html.md) being driven, always `view.camera`

Its rotation belongs to the controller, and the next look input overwrites a rotation set on
the camera directly. Turn it with [yaw](#yaw) and [pitch](#pitch).

##### Example

```ts
fpsCamera.on('change', () => {
  if (fpsCamera.camera.position.y < -10) respawn();
});
```

##### Returns

[`Camera3D`](scene.Camera3D.html.md)

***

### keyboard

#### Get Signature

> **get** **keyboard**(): `boolean`

Whether WASD / arrow keys, Space and Shift are read from `window`

Keys are matched by position (`KeyboardEvent.code`), so the same physical keys work on any
keyboard layout.

##### Example

```ts
chatInput.addEventListener('focus', () => (fpsCamera.keyboard = false));
chatInput.addEventListener('blur', () => (fpsCamera.keyboard = true));
```

##### Returns

`boolean`

#### Set Signature

> **set** **keyboard**(`value`): `void`

Sets whether movement keys are read from `window`

##### Parameters

###### value

`boolean`

`true` to read them

##### Returns

`void`

***

### locked

#### Get Signature

> **get** **locked**(): `boolean`

Whether the canvas currently holds pointer lock for this controller

##### Example

```ts
app.ticker.add(() => (clickToPlay.visible = fpsCamera.pointerLock && !fpsCamera.locked));
```

##### Returns

`boolean`

***

### pitch

#### Get Signature

> **get** **pitch**(): `number`

Pitch in radians, clamped to `±maxPitch`: 0 is level, and positive values look up

##### Example

```ts
fpsCamera.pitch = 0;
```

##### Returns

`number`

#### Set Signature

> **set** **pitch**(`value`): `void`

Sets the pitch and tilts the camera

##### Parameters

###### value

`number`

Pitch in radians; clamped to `±maxPitch`

##### Returns

`void`

***

### yaw

#### Get Signature

> **get** **yaw**(): `number`

Yaw in radians, around world Y: 0 faces -Z, and positive values turn left

##### Example

```ts
window.addEventListener('keydown', (event) => {
  if (event.code === 'KeyQ') fpsCamera.yaw += Math.PI / 4;
});
```

##### Returns

`number`

#### Set Signature

> **set** **yaw**(`value`): `void`

Sets the yaw and turns the camera

##### Parameters

###### value

`number`

Yaw in radians; unbounded

##### Returns

`void`

## Methods

### destroy()

> **destroy**(): `void`

Removes its input listeners and every `change`, `lock` and `unlock` listener, exits pointer lock
and stops auto-updating

The View and its camera are left as they are.

#### Returns

`void`

#### Example

```ts
fpsCamera.destroy();
const orbit = new OrbitCamera({ view: view3d });
```

***

### update()

> **update**(`ticker?`): `boolean`

Moves the camera by this frame's movement input

Runs every frame while [autoUpdate](#autoupdate) is on; call it yourself every
frame when it's off. Does nothing while `enabled` is off.

Walking follows the full view direction, pitch included, so walking forward while looking down
descends. Strafing stays level, and Space and Shift move along world Y whatever the pitch.

#### Parameters

##### ticker?

[`Ticker`](https://pixijs.download/release/docs/index.html)

The ticker driving this update; supplies the frame time. Omitted, one
  60 fps frame is assumed.

#### Returns

`boolean`

`true` when the camera moved

#### Example

```ts
fpsCamera.autoUpdate = false;
app.ticker.add((ticker) => {
  if (fpsCamera.update(ticker)) resolveWallCollisions(fpsCamera.camera.position);
});
```
