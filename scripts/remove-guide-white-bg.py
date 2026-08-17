"""Remove white backgrounds from guide select PNGs (holes + fringe)."""
from collections import deque
from pathlib import Path
from PIL import Image

SRC_DIR = Path('public/guides')
# Near-white threshold for hard background
HARD = 248
# Softer candidate for fringe / holes
SOFT = 235


def _near_white(r, g, b, thresh):
    return r >= thresh and g >= thresh and b >= thresh


def remove_white_bg(img: Image.Image) -> Image.Image:
    rgba = img.convert('RGBA')
    w, h = rgba.size
    pix = list(rgba.getdata())

    def idx(x, y):
        return y * w + x

    # --- Pass 1: mark all near-white connected components that touch the border
    # or are fully enclosed white holes (also near-white). ---
    is_hard = [_near_white(r, g, b, HARD) for (r, g, b, a) in pix]
    visited = [False] * (w * h)
    clear = [False] * (w * h)

    def flood(seeds, mask_fn):
        q = deque(seeds)
        component = []
        while q:
            i = q.popleft()
            if visited[i]:
                continue
            if not mask_fn(i):
                continue
            visited[i] = True
            component.append(i)
            x, y = i % w, i // w
            if x + 1 < w:
                q.append(idx(x + 1, y))
            if x > 0:
                q.append(idx(x - 1, y))
            if y + 1 < h:
                q.append(idx(x, y + 1))
            if y > 0:
                q.append(idx(x, y - 1))
        return component

    # Border seeds for hard white
    border_seeds = []
    for x in range(w):
        border_seeds.append(idx(x, 0))
        border_seeds.append(idx(x, h - 1))
    for y in range(h):
        border_seeds.append(idx(0, y))
        border_seeds.append(idx(w - 1, y))

    for seed in border_seeds:
        if not visited[seed] and is_hard[seed]:
            for i in flood([seed], lambda j: is_hard[j] and not visited[j]):
                clear[i] = True

    # Enclosed hard-white holes (any remaining hard-white component)
    for i in range(w * h):
        if not visited[i] and is_hard[i]:
            for j in flood([i], lambda k: is_hard[k] and not visited[k]):
                clear[j] = True

    # Apply hard clear
    out = []
    for i, (r, g, b, a) in enumerate(pix):
        if clear[i]:
            out.append((r, g, b, 0))
        else:
            out.append((r, g, b, a))

    # --- Pass 2: fringe cleanup — fade near-white pixels next to transparency ---
    def has_clear_neighbor(x, y):
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1),
                       (x + 1, y + 1), (x - 1, y - 1), (x + 1, y - 1), (x - 1, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and out[idx(nx, ny)][3] == 0:
                return True
        return False

    for y in range(h):
        for x in range(w):
            i = idx(x, y)
            r, g, b, a = out[i]
            if a == 0:
                continue
            if not has_clear_neighbor(x, y):
                continue
            # Pull white fringe toward transparent
            m = min(r, g, b)
            avg = (r + g + b) / 3
            if avg < SOFT:
                # mild despill: reduce channel toward min to kill white halo
                if avg > 200:
                    spill = (avg - 200) / 55.0
                    nr = int(r - (r - m) * spill * 0.85)
                    ng = int(g - (g - m) * spill * 0.85)
                    nb = int(b - (b - m) * spill * 0.85)
                    na = int(a * (1 - spill * 0.35))
                    out[i] = (max(0, nr), max(0, ng), max(0, nb), max(0, min(255, na)))
                continue
            # Strong fringe (near white)
            t = (avg - SOFT) / (255 - SOFT)  # 0..1
            alpha = int(a * (1 - min(1.0, t * 1.35)))
            # Also despill remaining white
            nr = int(r - (255 - m) * t * 0.5)
            ng = int(g - (255 - m) * t * 0.5)
            nb = int(b - (255 - m) * t * 0.5)
            out[i] = (max(0, nr), max(0, ng), max(0, nb), max(0, alpha))

    # --- Pass 3: second fringe pass for stubborn halos ---
    for y in range(h):
        for x in range(w):
            i = idx(x, y)
            r, g, b, a = out[i]
            if a == 0 or not has_clear_neighbor(x, y):
                continue
            if min(r, g, b) >= 242:
                out[i] = (r, g, b, 0)
            elif min(r, g, b) >= 230 and a > 40:
                out[i] = (r, g, b, max(0, a // 3))

    result = Image.new('RGBA', (w, h))
    result.putdata(out)
    return result


def main():
    files = [f for f in sorted(SRC_DIR.glob('*.png')) if not f.name.startswith('_')]
    for f in files:
        out = remove_white_bg(Image.open(f))
        out.save(f, optimize=True)
        hist = out.split()[-1].histogram()
        print(f'{f.name}: transparent={hist[0]} opaque={sum(hist[1:])}')
    print('done')


if __name__ == '__main__':
    main()
