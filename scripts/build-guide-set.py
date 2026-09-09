"""Turn the prepped drop into the set the app actually ships.

Reads scripts/guide-set-map.json — which raw file is which pose for which
guide — and writes two things from it:

  art-source/measure/<Guide>_<pose>.png    lossless, for the anchor builder,
                                           which reads PNG alpha and nothing else
  public/Guide Images/<Guide>_<pose>.webp  what the browser downloads

Two files because the anchor pass and the download want opposite things. The
anchors are measured once at build time and want every pixel of alpha intact;
the browser wants none of that weight. `getGuideAnchor` keys on the filename
with the extension stripped, so both halves answer to the same name.

Weight is the reason for WebP. The drop is 1.4MB a file, and the set the app
had before this was 72MB of PNG for 42 portraits — for art that is never drawn
larger than about 700 CSS pixels. At 1100px and q85 the same picture is ~150KB,
which is the difference between a guide that is there when the room opens and
one that fades in halfway through the reading.

Branch direction is normalised here too. The portraits are drawn with
`scaleX(-1)` wherever the guide stands full height, so a branch that runs right
in the file runs LEFT on screen — off the edge, behind the bird, which is what
it should do. Sixteen of the ninety ran the other way, which would have the
branch changing direction as the guide changed pose. Those are flipped to match
the other sixty-five, and it is measured rather than listed.

The measurement is taken off the COLOUR, and it used to be taken off the
silhouette. That got two of the seventy-eight wrong and shipped them: on
Mentor_think the cape hangs further right than the branch reaches left, and on
Roaster_map a sprig of leaves does the same, so the silhouette said "runs
right" about two pictures whose branches plainly run left. Both went out with
the branch pointing back into the page from whichever corner the guide stood
in. The branch is the one piece of brown wood in the drawing, so this asks
which edge of the lower half has wood crossing it, and a cape cannot answer.

  python scripts/build-guide-set.py
"""
import json
import shutil
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PREPPED = ROOT / 'art-source' / 'prepped'
MEASURE = ROOT / 'art-source' / 'measure'
SHIP = ROOT / 'public' / 'Guide Images'
MAP = ROOT / 'scripts' / 'guide-set-map.json'

SIZE = 1100
QUALITY = 85


def wood_at_edges(rgba):
    """How much branch crosses each side of the drawing, in pixels of wood.

    Mid-toned, red over green over blue: the branch and nothing else in the
    set. A navy cape, a red scarf and a pale wing all fail it, which is the
    whole point — those are what the silhouette used to mistake for a branch.

    This is the same rule as `WOOD` in scripts/build-guide-anchors.mjs. The two
    have to agree: this one decides which way a picture faces, that one records
    which way it ended up facing, and a disagreement would be invisible until a
    guide stood on nothing.
    """
    r, g, b, a = (rgba[..., i].astype(np.int16) for i in range(4))
    on = a > 24
    ys, xs = np.nonzero(on)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    w, h = x1 - x0 + 1, y1 - y0 + 1

    wood = on & (r > 60) & (r < 205) & (r - b > 28) & (r - b < 120)         & (r - g > 10) & (r - g < 80) & (g - b > 3)
    # Only the lower half, where a branch on its way out of the frame has to be.
    wood[:y0 + int(h * 0.55)] = False

    strip = max(3, round(w * 0.03))
    floor = strip * h * 0.02
    left = wood[:, x0:x0 + strip].sum()
    right = wood[:, x1 - strip + 1:x1 + 1].sum()
    return left > floor, right > floor


def reaches_further_left(alpha):
    """The old silhouette test, kept for the pictures the colour test cannot call.

    Where the branch crosses BOTH edges it does not matter which way round the
    picture is — the branch runs off on both sides either way — so the answer
    is whatever it was before, and none of that art moves.
    """
    ys, xs = np.nonzero(alpha > 24)
    y0, y1 = ys.min(), ys.max()
    upper = alpha[y0:y0 + (y1 - y0) // 2] > 24
    centre = np.nonzero(upper)[1].mean()
    band = alpha[y1 - int((y1 - y0) * 0.16):y1 + 1] > 24
    bxs = np.nonzero(band)[1]
    left, right = centre - bxs.min(), bxs.max() - centre
    return left > right * 1.25


def branch_runs_left(rgba):
    """True when this picture has to be flipped to get its branch running right."""
    left, right = wood_at_edges(rgba)
    if left != right:
        return left
    return reaches_further_left(rgba[..., 3])


def main():
    spec = json.loads(MAP.read_text())
    MEASURE.mkdir(parents=True, exist_ok=True)
    SHIP.mkdir(parents=True, exist_ok=True)

    flipped, total, weight = [], 0, 0
    for guide, poses in spec.items():
        if guide.startswith('_'):
            continue
        for pose, n in poses.items():
            if pose.startswith('_'):
                continue
            im = Image.open(PREPPED / f'raw_{n:02d}.png').convert('RGBA')
            if branch_runs_left(np.array(im)):
                im = im.transpose(Image.FLIP_LEFT_RIGHT)
                flipped.append(f'{guide}_{pose}')
            im = im.resize((SIZE, SIZE), Image.LANCZOS)

            name = f'{guide}_{pose}'
            im.save(MEASURE / f'{name}.png')
            out = SHIP / f'{name}.webp'
            im.save(out, 'WEBP', quality=QUALITY, method=6)
            weight += out.stat().st_size
            total += 1

    print(f'{total} portraits -> {SHIP}')
    print(f'shipping weight {weight / 1024 / 1024:.1f} MB  ({weight // total // 1024} KB each)')
    print(f'branch flipped to match the other sixty-five: {len(flipped)}')
    for f in flipped:
        print(f'  {f}')


if __name__ == '__main__':
    main()
