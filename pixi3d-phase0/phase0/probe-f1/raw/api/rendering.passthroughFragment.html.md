# Variable: passthroughFragment

> `const` **passthroughFragment**: [`EffectFragment`](filters.EffectFragment.html.md)

**`Advanced`**

A fragment that copies its colour input unchanged, for a [FullscreenPass](rendering.FullscreenPass.html.md) with a `reads.color`

The input is stretched over the whole target, whatever their sizes.

## Example

```ts
graph.addPass(
  new FullscreenPass({ renderer, fragment: passthroughFragment, reads: { color: normals }, writes: copy }),
);
```
