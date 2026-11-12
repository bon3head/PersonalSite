# Class: AnimationPlayer

Plays animations on a [Container3D](scene.Container3D.html.md) and its children

A [Model3D](scene.Model3D.html.md) loaded with animations already has one as [player](scene.Model3D.html#player).
Build your own to play animations authored in code.

Each animation gets one [AnimationState](animation.AnimationState.html.md) per player, holding its time, speed and weight.
Any number can play at once. Where two playing states drive the same property through tracks
with the same label, the player blends their values by [AnimationState#weight](animation.AnimationState.html#weight), which is
how crossfades work. Playback
advances on [Ticker.shared](https://pixijs.download/release/docs/index.html) unless [AnimationPlayer#autoUpdate](#autoupdate) is off.

## Example

```ts
const player = new AnimationPlayer({ target: robot, animations: [idle, walk] });
const walking = player.play('walk');

walking.animationSpeed = 1.5;
```

## Constructors

### Constructor

> **new AnimationPlayer**(`options`): `AnimationPlayer`

#### Parameters

##### options

[`AnimationPlayerOptions`](animation.AnimationPlayerOptions.html.md)

#### Returns

`AnimationPlayer`

## Properties

### target

> `readonly` **target**: [`Container3D`](scene.Container3D.html.md)

**`Advanced`**

Root of the hierarchy this player animates

***

### defaultOptions

> `static` **defaultOptions**: [`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)\<[`AnimationPlayerOptions`](animation.AnimationPlayerOptions.html.md)\>

Defaults for every new `AnimationPlayer`; an option passed as `undefined` keeps its default

A [Model3D](scene.Model3D.html.md) passes its own `autoUpdate` and `autoPlay`, so its player follows
[Model3D.defaultOptions](scene.Model3D.html#defaultoptions) instead.

#### Example

```ts
AnimationPlayer.defaultOptions.autoUpdate = false;
```

## Accessors

### animationLabels

#### Get Signature

> **get** **animationLabels**(): readonly `string`[]

Labels of every registered animation, in registration order

Pass one to [AnimationPlayer#play](#play) or [AnimationPlayer#getState](#getstate).

##### Example

```ts
for (const label of player.animationLabels) {
  addButton(label, () => player.play(label));
}
```

##### Returns

readonly `string`[]

***

### autoUpdate

#### Get Signature

> **get** **autoUpdate**(): `boolean`

Whether playback advances on [Ticker.shared](https://pixijs.download/release/docs/index.html)

Turn it off to drive playback from your own ticker or fixed-step loop with
[AnimationPlayer#update](#update).

##### Example

```ts
player.autoUpdate = false;
app.ticker.add((ticker) => player.update(ticker));
```

##### Returns

`boolean`

#### Set Signature

> **set** **autoUpdate**(`value`): `void`

Sets whether playback advances on `Ticker.shared`

##### Parameters

###### value

`boolean`

`false` to call `update` yourself

##### Returns

`void`

***

### destroyed

#### Get Signature

> **get** **destroyed**(): `boolean`

Whether [AnimationPlayer#destroy](#destroy) has been called on this player

##### Example

```ts
if (!player.destroyed) player.play('idle');
```

##### Returns

`boolean`

***

### playing

#### Get Signature

> **get** **playing**(): `boolean`

Whether any animation on this player is playing

##### Example

```ts
if (!player.playing) player.play('idle');
```

##### Returns

`boolean`

## Methods

### addAnimations()

> **addAnimations**(`animations`): `void`

Registers animations for playback

Array entries are keyed by each animation's own label. Record entries are keyed
by the record property name.

#### Parameters

##### animations

[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, [`Animation`](animation.Animation.html.md)\> \| [`Animation`](animation.Animation.html.md)[]

Animations to register

#### Returns

`void`

#### Example

```ts
player.addAnimations([wave]);
player.addAnimations({ cheer: celebrate });
player.play('cheer');
```

***

### destroy()

> **destroy**(): `void`

Stops every animation and takes the player off the ticker for good

Calling it again does nothing, and `play` and `gotoAndStop` on an [AnimationState](animation.AnimationState.html.md) kept
from before are ignored. A [Model3D](scene.Model3D.html.md) destroys its own player; call this for one you built.

#### Returns

`void`

#### Example

```ts
player.destroy();
crate.destroy();
```

***

### getAnimation()

> **getAnimation**(`label`): [`Animation`](animation.Animation.html.md) \| `undefined`

Returns a registered animation by label

#### Parameters

##### label

`string`

Registered animation label

#### Returns

[`Animation`](animation.Animation.html.md) \| `undefined`

The animation, or `undefined` when nothing is registered under the label

#### Example

```ts
const walkDuration = player.getAnimation('walk')?.duration ?? 0;
```

***

### getState()

> **getState**(`animation`): [`AnimationState`](animation.AnimationState.html.md)

Returns the reusable playback state for an animation without starting playback

Each animation has one state per player, created on first request. Throws for a label nothing
is registered under; [AnimationPlayer#getAnimation](#getanimation) returns `undefined` instead.

#### Parameters

##### animation

`string` \| [`Animation`](animation.Animation.html.md)

The animation, or the label it's registered under

#### Returns

[`AnimationState`](animation.AnimationState.html.md)

The playback state for the animation

#### Example

```ts
const jump = player.getState('jump');

jump.loop = false;
jump.gotoAndPlay(0);
```

***

### play()

> **play**(`animation`): [`AnimationState`](animation.AnimationState.html.md)

Starts or resumes an animation from its state's current time

Animations already playing carry on and blend with it; call [AnimationPlayer#stop](#stop)
first to switch from one to another. [AnimationState#play](animation.AnimationState.html#play) covers restarting a one-shot
animation that already finished.

#### Parameters

##### animation

`string` \| [`Animation`](animation.Animation.html.md)

The animation, or the label it's registered under

#### Returns

[`AnimationState`](animation.AnimationState.html.md)

The playback state for the animation

#### Example

```ts
player.stop();
player.play('run');
```

***

### stop()

> **stop**(): `void`

Stops every playing animation, each holding its current time and pose

#### Returns

`void`

#### Example

```ts
menu.on('open', () => player.stop());
```

***

### update()

> **update**(`ticker?`): `void`

Advances all playing states and applies the blended results to their targets

Runs every frame from `Ticker.shared` while [autoUpdate](#autoupdate)
is on and something is playing. Call it yourself when driving playback from your own loop.

`onComplete` and `onLoop` callbacks run once every pose is applied, so they see this frame's
final pose and may play, stop or seek any state. A state they start begins advancing on the
next update.

#### Parameters

##### ticker?

[`Ticker`](https://pixijs.download/release/docs/index.html)

The ticker driving this update; its `deltaMS` sets how far playback
  advances. Omitted, one 60 fps frame is assumed.

#### Returns

`void`

#### Example

```ts
player.autoUpdate = false;
app.ticker.add((ticker) => player.update(ticker));
```
