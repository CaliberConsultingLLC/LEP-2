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
the other sixty-five. It is measured, not listed: the bird's centre comes off
its top half where there is no branch, and the branch is whichever way the
bottom band reaches further.

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


def branch_runs_left(alpha):
    """Which way the branch reaches, measured off the bird rather than guessed."""
    ys, xs = np.nonzero(alpha > 24)
    y0, y1 = ys.min(), ys.max()
    upper = alpha[y0:y0 + (y1 - y0) // 2] > 24
    centre = np.nonzero(upper)[1].mean()
    band = alpha[y1 - int((y1 - y0) * 0.16):y1 + 1] > 24
    bxs = np.nonzero(band)[1]
    left, right = centre - bxs.min(), bxs.max() - centre
    return left > right * 1.25


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
            if branch_runs_left(np.array(im)[..., 3]):
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
