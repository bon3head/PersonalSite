# Class: RenderGraphDebugger

**`Advanced`**

Captures a [GraphDebugSnapshot](extras_debug.GraphDebugSnapshot.html.md) of a view's last frame and explains what changed since
the previous capture

It only reads, and changes nothing about how the view renders. Causes compare against the
previous capture, so call [RenderGraphDebugger#capture](#capture) after every rendered frame: a
skipped frame folds its changes into the next one.

## Constructors

### Constructor

> **new RenderGraphDebugger**(`options`): `RenderGraphDebugger`

#### Parameters

##### options

[`RenderGraphDebuggerOptions`](extras_debug.RenderGraphDebuggerOptions.html.md)

Options for the debugger

#### Returns

`RenderGraphDebugger`

## Methods

### capture()

> **capture**(`captureGeometry?`): [`GraphDebugSnapshot`](extras_debug.GraphDebugSnapshot.html.md) \| `null`

Captures the view's last frame; `null` when there's no view, or it hasn't rendered yet

#### Parameters

##### captureGeometry?

(`geometry`) => `void`

Called once for each distinct geometry in the capture

#### Returns

[`GraphDebugSnapshot`](extras_debug.GraphDebugSnapshot.html.md) \| `null`

***

### reset()

> **reset**(): `void`

Forgets the previous capture, so the next one is a first capture numbered 1

#### Returns

`void`
