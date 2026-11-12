# Class: ContainerTexture

A [Texture](https://pixijs.download/release/docs/index.html) that shows a live 2D PixiJS [Container](https://pixijs.download/release/docs/index.html)

Use it in any material texture slot, on any geometry. To make several textures over one
container, build a [ContainerSource](rendering.ContainerSource.html.md) and create `Texture`s from it.

Unless [autoUpdate](#autoupdate) is on, nothing redraws it. Call
[ContainerTexture#render](#render) after setup and after each change, before you render your scene,
or keep a renderer and set `autoUpdate` for animated content. Until its first render it's
transparent black; a `renderer` option renders it once as it's made, unless
[firstRender](rendering.ContainerSourceOptions.html#firstrender) is `false`.

In an opaque material, the parts the container leaves empty draw black;
[clearColor](rendering.ContainerSourceOptions.html#clearcolor) says how to keep their edges smooth.

The picture is stored the other way up from an image texture. It shows upright where `v` grows
upward, as on a default [PlaneGeometry](geometry.PlaneGeometry.html.md) or a [CubeGeometry](geometry.CubeGeometry.html.md)'s sides, and upside down
where an image shows upright, as on a [SphereGeometry](geometry.SphereGeometry.html.md), a plane with `flipV`, a loaded
model or a 2D `Sprite`. On a sprite, `sprite.scale.y = -1` with `sprite.anchor.y = 1` turns it
over in place.

## Example

```ts
const label = new ContainerTexture({ container: labelText, resolution: 2 });
sign.material = new FlatMaterial({ baseColorTexture: label });
label.render(app.renderer);

const screen = new ContainerTexture({ container: gameUi, renderer: app.renderer, autoUpdate: true });
monitor.material = new FlatMaterial({ baseColorTexture: screen });
```

## Extends

- [`Texture`](https://pixijs.download/release/docs/index.html)

## Constructors

### Constructor

> **new ContainerTexture**(`options`): `ContainerTexture`

#### Parameters

##### options

[`ContainerSourceOptions`](rendering.ContainerSourceOptions.html.md)

#### Returns

`ContainerTexture`

#### Overrides

`Texture.constructor`

## Accessors

### autoUpdate

#### Get Signature

> **get** **autoUpdate**(): `boolean`

Whether the texture re-renders every frame; [ContainerSourceOptions#autoUpdate](rendering.ContainerSourceOptions.html#autoupdate) has the details

##### Example

```ts
screen.autoUpdate = !paused;
```

##### Returns

`boolean`

#### Set Signature

> **set** **autoUpdate**(`value`): `void`

Sets whether the texture re-renders every frame

##### Parameters

###### value

`boolean`

`true` to re-render every frame.

##### Returns

`void`

***

### clearColor

#### Get Signature

> **get** **clearColor**(): [`Color`](https://pixijs.download/release/docs/index.html)

The colour [ContainerSourceOptions#clearColor](rendering.ContainerSourceOptions.html#clearcolor) describes; set it or change this one in place,
then render again

##### Example

```ts
screen.clearColor = 'black';
screen.render();
```

##### Returns

[`Color`](https://pixijs.download/release/docs/index.html)

#### Set Signature

> **set** **clearColor**(`value`): `void`

Sets the colour the next render clears to

##### Parameters

###### value

[`ColorSource`](https://pixijs.download/release/docs/index.html)

Any [ColorSource](https://pixijs.download/release/docs/index.html), such as `'black'`.

##### Returns

`void`

***

### container

#### Get Signature

> **get** **container**(): [`Container`](https://pixijs.download/release/docs/index.html)

The 2D [Container](https://pixijs.download/release/docs/index.html) drawn into this texture

##### Example

```ts
screen.container.addChild(scoreText);
screen.render();
```

##### Returns

[`Container`](https://pixijs.download/release/docs/index.html)

***

### containerSource

#### Get Signature

> **get** **containerSource**(): [`ContainerSource`](rendering.ContainerSource.html.md)

The [ContainerSource](rendering.ContainerSource.html.md) behind this texture

##### Example

```ts
import { Rectangle, Texture } from 'pixi.js';

const corner = new Texture({ source: screen.containerSource, frame: new Rectangle(0, 0, 64, 64) });
```

##### Returns

[`ContainerSource`](rendering.ContainerSource.html.md)

***

### renderer

#### Get Signature

> **get** **renderer**(): [`Renderer`](https://pixijs.download/release/docs/index.html) \| `null`

The renderer kept for [ContainerTexture#render](#render) calls with no argument, or `null`

##### Example

```ts
screen.renderer = app.renderer;
screen.render();
```

##### Returns

[`Renderer`](https://pixijs.download/release/docs/index.html) \| `null`

#### Set Signature

> **set** **renderer**(`value`): `void`

Sets the kept renderer

##### Parameters

###### value

[`Renderer`](https://pixijs.download/release/docs/index.html) \| `null`

A renderer, or `null` to release it.

##### Returns

`void`

***

### transform

#### Get Signature

> **get** **transform**(): [`Matrix`](https://pixijs.download/release/docs/index.html)

The capture matrix [ContainerSourceOptions#transform](rendering.ContainerSourceOptions.html#transform) describes; change it or assign a new
one, then render again

##### Example

```ts
screen.transform = new Matrix().translate(-scrollX, 0);
screen.render();
```

##### Returns

[`Matrix`](https://pixijs.download/release/docs/index.html)

#### Set Signature

> **set** **transform**(`value`): `void`

Sets the capture matrix, copying `value`

##### Parameters

###### value

[`Matrix`](https://pixijs.download/release/docs/index.html)

The new capture matrix.

##### Returns

`void`

## Methods

### destroy()

> **destroy**(`options?`): `void`

Destroys this texture, and optionally its source and its container

As with pixi's [Texture#destroy](https://pixijs.download/release/docs/index.html), `destroy()` leaves the [ContainerSource](rendering.ContainerSource.html.md) alive,
since other textures may share it, and with [ContainerTexture#autoUpdate](#autoupdate) on, still
rendering every frame. `destroy(true)` frees the source too. The container is yours unless you
pass `{ container: true }`, which destroys it with its children and frees the source.

#### Parameters

##### options?

`boolean` \| \{ `container?`: `boolean`; `source?`: `boolean`; \}

`true` also frees the source; an object picks `source` and `container` separately.

`boolean`

***

###### Type Literal

\{ `container?`: `boolean`; `source?`: `boolean`; \}

`true` also frees the source; an object picks `source` and `container` separately.

###### container?

`boolean`

Also destroy the 2D container and its children, which frees the source too

**Example**

```ts
screen.destroy({ container: true });
```

###### source?

`boolean`

Also free the [ContainerSource](rendering.ContainerSource.html.md) and its render target

**Example**

```ts
screen.destroy({ source: true });
```

#### Returns

`void`

#### Example

```ts
screen.destroy(true);
```

#### Overrides

`Texture.destroy`

***

### render()

> **render**(`renderer?`): `void`

Draws the container into this texture

Call it before you render your scene, never from code that runs during a render. A renderer
passed here is kept for later calls with no argument; with none passed or kept, it warns and
draws nothing.

#### Parameters

##### renderer?

[`Renderer`](https://pixijs.download/release/docs/index.html)

Renderer to draw with, kept for later calls; omit to use the kept one.

#### Returns

`void`

#### Example

```ts
scoreText.text = `${score}`;
scoreboard.render(app.renderer);
```

***

### setContainer()

> **setContainer**(`container`): `void`

Swaps the [Container](https://pixijs.download/release/docs/index.html) this texture renders, keeping its render target and size

A container other than the current one leaves its parent, the old one is left detached, and the
old picture stays until the next [ContainerTexture#render](#render).

#### Parameters

##### container

[`Container`](https://pixijs.download/release/docs/index.html)

The new container to render.

#### Returns

`void`

#### Example

```ts
screen.setContainer(pauseMenu);
screen.render();
```
