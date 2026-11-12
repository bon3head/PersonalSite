# Class: ContainerSource

**`Advanced`**

A [TextureSource](https://pixijs.download/release/docs/index.html) whose pixels are a live 2D PixiJS [Container](https://pixijs.download/release/docs/index.html)

The source behind [ContainerTexture](rendering.ContainerTexture.html.md), whose docs cover when to render and which way up the
picture is. Build one yourself to make several `Texture`s, each with its own frame, over one
container that renders once for all of them. [TextureSource#resize](https://pixijs.download/release/docs/index.html) changes its size.

## Example

```ts
import { Rectangle, Texture } from 'pixi.js';

const sheet = new ContainerSource({ container: icons, width: 256, height: 128, renderer: app.renderer });
const play = new Texture({ source: sheet, frame: new Rectangle(0, 0, 128, 128) });
const pause = new Texture({ source: sheet, frame: new Rectangle(128, 0, 128, 128) });
```

## Extends

- [`TextureSource`](https://pixijs.download/release/docs/index.html)

## Constructors

### Constructor

> **new ContainerSource**(`options`): `ContainerSource`

#### Parameters

##### options

[`ContainerSourceOptions`](rendering.ContainerSourceOptions.html.md)

#### Returns

`ContainerSource`

#### Overrides

`TextureSource.constructor`

## Accessors

### autoUpdate

#### Get Signature

> **get** **autoUpdate**(): `boolean`

Whether the source re-renders every frame; [ContainerSourceOptions#autoUpdate](rendering.ContainerSourceOptions.html#autoupdate) has the details

##### Returns

`boolean`

#### Set Signature

> **set** **autoUpdate**(`value`): `void`

Sets whether the source re-renders every frame

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

The 2D [Container](https://pixijs.download/release/docs/index.html) drawn into this source

##### Returns

[`Container`](https://pixijs.download/release/docs/index.html)

***

### renderer

#### Get Signature

> **get** **renderer**(): [`Renderer`](https://pixijs.download/release/docs/index.html) \| `null`

The renderer kept for [ContainerSource#render](#render) calls with no argument, or `null`

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

> **destroy**(`destroyContainer?`): `void`

Frees the render target and stops [ContainerSource#autoUpdate](#autoupdate), leaving the container
detached but intact unless you pass `true`

#### Parameters

##### destroyContainer?

`boolean` = `false`

Also destroy the container and its children.

#### Returns

`void`

#### Overrides

`TextureSource.destroy`

***

### render()

> **render**(`renderer?`): `void`

Renders the container into this source, as [ContainerTexture#render](rendering.ContainerTexture.html#render) describes

#### Parameters

##### renderer?

[`Renderer`](https://pixijs.download/release/docs/index.html)

Renderer to draw with, kept for later calls; omit to use the kept one.

#### Returns

`void`

***

### setContainer()

> **setContainer**(`container`): `void`

Swaps the [Container](https://pixijs.download/release/docs/index.html) this source renders, as [ContainerTexture#setContainer](rendering.ContainerTexture.html#setcontainer) describes

#### Parameters

##### container

[`Container`](https://pixijs.download/release/docs/index.html)

The new container to render.

#### Returns

`void`
