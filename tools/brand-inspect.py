#!/usr/bin/env python3
"""Brand asset inspection for tools/build-brand-assets.mjs.

Reads one GIF or PNG and prints a JSON inspection record:
format, dimensions, frame count, per-frame delays, loop duration,
transparency index, frame 0 transparent pixel count, palette
fingerprint, fringe counts, decoded bytes, and byte size.

Fingerprint rules:
- GIF: the union of the global color table and every frame local
  color table, parsed from the file bytes (no LZW decode needed).
  The visible fingerprint drops the transparency-index entry, since
  that entry never renders as a color.
- PNG: the sorted set of RGB values of pixels with alpha above 0.

Fringe rule: an edge pixel is an opaque or semi-opaque pixel with
a fully transparent 4-neighbour. Near white means every channel is
at least 240. Semi near-white pixels (alpha between 1 and 254 with
all channels at least 240) are counted separately, since they also
read as a white halo on a dark field.

With --extract-frame0 <out.png>, frame 0 is written as RGBA PNG.

Exit codes: 0 ok, 2 unusable input (unknown format, bad header).
"""
import hashlib
import json
import sys

import numpy as np
from PIL import Image


def gif_palette_tables(data):
    """Return (global entries, per-frame local entries) as RGB tuples."""
    if data[:6] not in (b"GIF87a", b"GIF89a"):
        raise ValueError("not a GIF")
    packed = data[10]
    pos = 13
    pal = set()
    if packed & 0x80:
        size = 2 ** ((packed & 0x07) + 1)
        for i in range(size):
            pal.add(tuple(data[pos + i * 3:pos + i * 3 + 3]))
        pos += size * 3
    while pos < len(data):
        block = data[pos]
        if block == 0x3B:
            break
        if block == 0x21:
            pos += 2
            while True:
                size = data[pos]
                pos += 1
                if size == 0:
                    break
                pos += size
        elif block == 0x2C:
            local_packed = data[pos + 9]
            pos += 10
            if local_packed & 0x80:
                size = 2 ** ((local_packed & 0x07) + 1)
                for i in range(size):
                    pal.add(tuple(data[pos + i * 3:pos + i * 3 + 3]))
                pos += size * 3
            pos += 1
            while True:
                size = data[pos]
                pos += 1
                if size == 0:
                    break
                pos += size
        else:
            raise ValueError("unknown GIF block 0x%02x at %d" % (block, pos))
    return pal


def hex_color(rgb):
    return "#%02X%02X%02X" % rgb


def main():
    args = sys.argv[1:]
    if not args:
        print("usage: brand-inspect.py <input> [--extract-frame0 <out.png>]",
              file=sys.stderr)
        return 2
    path = args[0]
    frame0_out = None
    if "--extract-frame0" in args:
        frame0_out = args[args.index("--extract-frame0") + 1]
    raw = open(path, "rb").read()
    im = Image.open(path)
    fmt = im.format
    width, height = im.size
    n_frames = getattr(im, "n_frames", 1)
    delays = []
    edge_px = 0
    near_white_edge = 0
    semi_near_white = 0
    frame0_transparent = None
    transparency_index = im.info.get("transparency")
    for i in range(n_frames):
        im.seek(i)
        delays.append(im.info.get("duration") or 0)
        rgba = np.asarray(im.convert("RGBA"), dtype=np.int16)
        alpha = rgba[:, :, 3]
        if i == 0:
            frame0_transparent = int((alpha == 0).sum())
            if frame0_out:
                im.seek(0)
                im.convert("RGBA").save(frame0_out, format="PNG")
        opaque = alpha > 0
        trans = alpha == 0
        neigh = np.zeros_like(trans)
        neigh[1:, :] |= trans[:-1, :]
        neigh[:-1, :] |= trans[1:, :]
        neigh[:, 1:] |= trans[:, :-1]
        neigh[:, :-1] |= trans[:, 1:]
        edge = opaque & neigh
        edge_px += int(edge.sum())
        near = (edge & (rgba[:, :, 0] >= 240)
                & (rgba[:, :, 1] >= 240) & (rgba[:, :, 2] >= 240))
        near_white_edge += int(near.sum())
        semi = ((alpha > 0) & (alpha < 255)
                & (rgba[:, :, 0] >= 240)
                & (rgba[:, :, 1] >= 240) & (rgba[:, :, 2] >= 240))
        semi_near_white += int(semi.sum())
    if fmt == "GIF":
        palette = gif_palette_tables(raw)
        fingerprint = sorted(hex_color(c) for c in palette)
        fingerprint_visible = fingerprint
        # The RGB carried by transparent pixels in frame 0, recorded
        # so a later hue gate can tell the transparent entry apart
        # from rendered colors without dropping it from the union.
        transparent_rgb = None
        if isinstance(transparency_index, int):
            im.seek(0)
            rgba0 = np.asarray(im.convert("RGBA"))
            mask = rgba0[:, :, 3] == 0
            if mask.any():
                transparent_rgb = hex_color(
                    tuple(int(v) for v in rgba0[mask][0][:3]))
        has_alpha = frame0_transparent is not None and frame0_transparent > 0
    elif fmt == "PNG":
        rgba = np.asarray(Image.open(path).convert("RGBA"))
        mask = rgba[:, :, 3] > 0
        colors = set(map(tuple, rgba[mask][:, :3].tolist())) if mask.any() else set()
        fingerprint = sorted(hex_color(c) for c in colors)
        fingerprint_visible = fingerprint
        transparent_rgb = None
        has_alpha = bool((rgba[:, :, 3] < 255).any())
    else:
        print("unsupported format: %s" % fmt, file=sys.stderr)
        return 2
    fingerprint_text = "\n".join(fingerprint_visible).encode()
    record = {
        "format": fmt,
        "width": width,
        "height": height,
        "frames": n_frames,
        "delaysMs": delays,
        "loopMs": sum(delays),
        "transparencyIndex": transparency_index,
        "frame0TransparentPx": frame0_transparent,
        "hasAlpha": has_alpha,
        "fingerprint": fingerprint_visible,
        "fingerprintCount": len(fingerprint_visible),
        "fingerprintAllCount": len(fingerprint),
        "transparentRgb": transparent_rgb,
        "fingerprintSha256": hashlib.sha256(fingerprint_text).hexdigest(),
        "fringeEdgePx": edge_px,
        "fringeNearWhiteEdgePx": near_white_edge,
        "fringeSemiNearWhitePx": semi_near_white,
        "decodedBytes": width * height * 4 * n_frames,
        "bytes": len(raw),
        "sha256": hashlib.sha256(raw).hexdigest(),
    }
    print(json.dumps(record))
    return 0


if __name__ == "__main__":
    sys.exit(main())
