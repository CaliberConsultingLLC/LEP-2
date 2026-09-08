"""Take a drop of raw guide portraits and make them measurable.

The art arrives from an image generator as opaque RGB on a white ground, at
whatever aspect the generator felt like — in the September 2026 drop that was
1254x1254, 1024x1536 and 1086x1448 in the same batch. Everything downstream
reads the ALPHA channel and assumes a square frame:

  scripts/build-guide-anchors.mjs   refuses anything that is not 8-bit RGBA,
                                    and measures the opaque bounding box
  fitPortrait (guideGeometry.js)    sizes the frame off the drawn height and
                                    treats the frame as square

So a file that lands here opaque does not fail loudly — it measures as a bird
that fills the whole frame, every anchor points at the middle of nothing, and
the placement goes back to looking arbitrary with no visible cause. This is the
step that stops that.

Per file: lift the white ground to transparent, feather the halo the cutout
leaves behind, crop to what is actually drawn, pad that out to square, and
write it back as 8-bit RGBA at one size.

Padding to square is free now in a way it would not have been a week ago.
Nothing downstream reads the frame for size any more — `fitPortrait` sizes the
bird off its own measured height — so where the art sits inside its square is
no longer a thing anyone has to get right.

  python scripts/prep-guide-art.py "public/Guide Images v2" --out "public/Guide Images v2 prepped"
"""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

# Near-white that is definitely ground, and the softer edge of the halo the
# cutout leaves. Carried over from scripts/remove-guide-white-bg.py, which was
# tuned against this same art.
HARD = 248
SOFT = 228
OUT_SIZE = 1254
# Breathing room around the bird inside its square, as a share of the longest
# side. Not layout — layout is solved at render time — just somewhere for the
# feathered edge to live so it is never flush against the frame.
PAD = 0.02


def cut_out(rgb):
    """White ground to transparent, with the halo faded rather than cliffed."""
    lo = rgb.min(axis=2)

    # Only ground that reaches the border is ground. A white highlight in an
    # eye or on the compass is not, and flood-filling from the edge is what
    # keeps those.
    hard = lo >= HARD
    labels, n = ndimage.label(hard)
    if n:
        edge = np.concatenate([labels[0, :], labels[-1, :], labels[:, 0], labels[:, -1]])
        ground = np.isin(labels, np.unique(edge[edge > 0]))
    else:
        ground = np.zeros_like(hard)

    alpha = np.where(ground, 0.0, 1.0)

    # The halo: pixels just inside the cut that are part ground, part bird.
    # Fade them by how white they are instead of leaving a hard white rim,
    # which is what reads as a sticker cut out with scissors.
    band = ndimage.binary_dilation(ground, iterations=3) & ~ground
    t = np.clip((lo.astype(np.float32) - SOFT) / (255.0 - SOFT), 0, 1)
    alpha = np.where(band, np.minimum(alpha, 1.0 - t), alpha)

    # Despill: pull the white cast out of what is left of the halo so the
    # feathered edge is the bird's own colour and not a pale ghost of it.
    out = rgb.astype(np.float32)
    spill = np.where(band, t, 0)[..., None]
    out = out - (255.0 - lo[..., None].astype(np.float32)) * spill * 0.5

    return np.clip(out, 0, 255).astype(np.uint8), (alpha * 255).astype(np.uint8)


def square(rgb, alpha):
    """Crop to what is drawn, then pad that out to a square of one size."""
    ys, xs = np.nonzero(alpha > 24)
    if not len(ys):
        raise ValueError('nothing drawn')
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgba = np.dstack([rgb[y0:y1, x0:x1], alpha[y0:y1, x0:x1]])

    im = Image.fromarray(rgba, 'RGBA')
    inner = round(OUT_SIZE * (1 - 2 * PAD))
    scale = inner / max(im.width, im.height)
    im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS)

    canvas = Image.new('RGBA', (OUT_SIZE, OUT_SIZE), (0, 0, 0, 0))
    canvas.paste(im, ((OUT_SIZE - im.width) // 2, (OUT_SIZE - im.height) // 2))
    return canvas


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('--out', required=True)
    args = ap.parse_args()

    src, dst = Path(args.src), Path(args.out)
    dst.mkdir(parents=True, exist_ok=True)

    files = sorted(f for f in src.iterdir() if f.suffix.lower() == '.png')
    for i, f in enumerate(files, 1):
        rgb = np.array(Image.open(f).convert('RGB'))
        cut, alpha = cut_out(rgb)
        out = square(cut, alpha)
        name = f'raw_{i:02d}.png'
        out.save(dst / name)
        drawn = (np.array(out)[..., 3] > 24).mean()
        print(f'{name}  <- {f.name[:44]:44}  drawn {drawn * 100:4.1f}% of frame')
    print(f'\n{len(files)} files -> {dst}')


if __name__ == '__main__':
    main()
