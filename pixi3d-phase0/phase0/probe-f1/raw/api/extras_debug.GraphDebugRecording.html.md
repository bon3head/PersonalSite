# Class: GraphDebugRecording

**`Advanced`**

Stores one [GraphDebugSnapshot](extras_debug.GraphDebugSnapshot.html.md) per rendered frame, up to a frame cap

It captures nothing itself: pass each frame's snapshot to [GraphDebugRecording#record](#record)
between [GraphDebugRecording#start](#start) and [GraphDebugRecording#stop](#stop).

## Constructors

### Constructor

> **new GraphDebugRecording**(`options?`): `GraphDebugRecording`

#### Parameters

##### options?

[`GraphDebugRecordingOptions`](extras_debug.GraphDebugRecordingOptions.html.md) = `{}`

Options for the recording

#### Returns

`GraphDebugRecording`

## Properties

### defaultOptions

> `static` **defaultOptions**: [`GraphDebugRecordingOptions`](extras_debug.GraphDebugRecordingOptions.html.md)

Defaults for every new `GraphDebugRecording`; an option passed as `undefined` keeps its default

#### Example

```ts
GraphDebugRecording.defaultOptions.maxFrames = 600;
```

## Accessors

### active

#### Get Signature

> **get** **active**(): `boolean`

Whether frames are currently being recorded

##### Returns

`boolean`

***

### frames

#### Get Signature

> **get** **frames**(): readonly [`GraphDebugRecordedFrame`](extras_debug.GraphDebugRecordedFrame.html.md)[]

Frames recorded so far, in capture order

##### Returns

readonly [`GraphDebugRecordedFrame`](extras_debug.GraphDebugRecordedFrame.html.md)[]

***

### maxFrames

#### Get Signature

> **get** **maxFrames**(): `number`

Maximum number of frames one recording stores before stopping itself

##### Returns

`number`

## Methods

### record()

> **record**(`snapshot`, `timestamp?`): [`GraphDebugRecordResult`](extras_debug.GraphDebugRecordResult.html.md)

Stores a frame while recording; the frame that reaches the cap stops the recording

#### Parameters

##### snapshot

[`GraphDebugSnapshot`](extras_debug.GraphDebugSnapshot.html.md)

The frame's snapshot

##### timestamp?

`number` = `...`

Capture time in milliseconds

#### Returns

[`GraphDebugRecordResult`](extras_debug.GraphDebugRecordResult.html.md)

***

### start()

> **start**(`timestamp?`): `void`

Begin a new recording, discarding any previously recorded frames

#### Parameters

##### timestamp?

`number` = `...`

Start time in milliseconds; recorded `elapsedMs` values are relative to it

#### Returns

`void`

***

### stop()

> **stop**(`timestamp?`, `reason?`): `void`

Stop the active recording, keeping the recorded frames

#### Parameters

##### timestamp?

`number` = `...`

Stop time in milliseconds, closing the recording's duration

##### reason?

[`GraphDebugRecordingStopReason`](extras_debug.GraphDebugRecordingStopReason.html.md) = `'manual'`

Why the recording stopped

#### Returns

`void`

***

### toJSON()

> **toJSON**(): [`GraphDebugRecordingSnapshot`](extras_debug.GraphDebugRecordingSnapshot.html.md)

Returns the recording as JSON-serialisable data

#### Returns

[`GraphDebugRecordingSnapshot`](extras_debug.GraphDebugRecordingSnapshot.html.md)
