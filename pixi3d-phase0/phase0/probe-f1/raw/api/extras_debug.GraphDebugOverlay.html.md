# Class: GraphDebugOverlay

**`Advanced`**

HTML panel for recording a view's frames and reviewing how each one was drawn

Press Record, use the app, then Stop. The review steps through the recorded frames in two tabs:
Workload lists each scene pass's batches and draws, and why draws were rebuilt or WebGPU
bundles re-recorded; Render Graph lists the graph's passes, their dependencies and the
lifetime of each resource. Copy Frame and Copy Recording put the data on the clipboard as
JSON.

Nothing is captured outside a recording, so an idle overlay costs next to nothing.

## Example

```ts
const overlay = new GraphDebugOverlay({ view: view3d, renderer: app.renderer });
```

## Constructors

### Constructor

> **new GraphDebugOverlay**(`options`): `GraphDebugOverlay`

#### Parameters

##### options

[`GraphDebugOverlayOptions`](extras_debug.GraphDebugOverlayOptions.html.md)

Options for the overlay

#### Returns

`GraphDebugOverlay`

## Properties

### defaultOptions

> `static` **defaultOptions**: [`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)\<[`Omit`](https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys)\<[`GraphDebugOverlayOptions`](extras_debug.GraphDebugOverlayOptions.html.md), `"view"` \| `"renderer"`\>\>

Defaults for every new `GraphDebugOverlay`; an option passed as `undefined` keeps its default

#### Example

```ts
GraphDebugOverlay.defaultOptions.maxRecordedFrames = 600;
```

## Accessors

### autoUpdate

#### Get Signature

> **get** **autoUpdate**(): `boolean`

Whether [refresh()](#refresh) runs after each screen render of
[renderer](#renderer)

Renders into a texture don't count, so a recording holds only frames drawn to the screen.

##### Example

```ts
const overlay = new GraphDebugOverlay({ view: () => view3d, renderer: app.renderer });

overlay.autoUpdate = false; // pause; refresh() is yours to call until it's back on
```

##### Returns

`boolean`

#### Set Signature

> **set** **autoUpdate**(`value`): `void`

Sets whether `refresh()` runs after each screen render

##### Parameters

###### value

`boolean`

`true` to refresh after each one

##### Returns

`void`

***

### renderer

#### Get Signature

> **get** **renderer**(): [`Renderer`](https://pixijs.download/release/docs/index.html) \| `null`

The renderer whose screen renders run [refresh()](#refresh) while
[autoUpdate](#autoupdate) is on; `null` leaves `refresh()` to the caller

##### Returns

[`Renderer`](https://pixijs.download/release/docs/index.html) \| `null`

#### Set Signature

> **set** **renderer**(`value`): `void`

Sets the renderer to follow; ignored once the overlay is destroyed

##### Parameters

###### value

[`Renderer`](https://pixijs.download/release/docs/index.html) \| `null`

The renderer to follow, or `null` for none

##### Returns

`void`

## Methods

### destroy()

> **destroy**(): `void`

Stops following the renderer and removes the overlay from the DOM

#### Returns

`void`

***

### refresh()

> **refresh**(): `void`

Captures the frame just rendered while a recording runs; outside one it only updates the panel,
enabling Record once the view has rendered

Runs after every screen render while [autoUpdate](#autoupdate) is on
and a [renderer](#renderer) is set. Otherwise call it yourself after each
render.

#### Returns

`void`

#### Example

```ts
const overlay = new GraphDebugOverlay({ view: view3d });

app.ticker.add(() => overlay.refresh(), undefined, UPDATE_PRIORITY.UTILITY);
```
