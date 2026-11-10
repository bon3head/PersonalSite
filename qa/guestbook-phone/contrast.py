# Worst-case contrast of each guestbook text against the pixels behind it.
# Usage: python3 -I qa/guestbook-phone/contrast.py <outDir>
import json, sys, re
from PIL import Image
out = sys.argv[1]
rep = json.load(open(f"{out}/report.json"))
def lin(c):
    c /= 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
def lum(p): return 0.2126 * lin(p[0]) + 0.7152 * lin(p[1]) + 0.0722 * lin(p[2])
rows = []
for t in rep["contrast"]:
    fg = [float(x) for x in re.findall(r"[\d.]+", t["color"])[:3]]
    lf = lum(fg)
    im = Image.open(f"{out}/{t['bg']}").convert("RGB")
    x, y, w, h = [round(v * 2) for v in t["box"]]
    crop = im.crop((max(0, x), max(0, y), min(im.width, x + w), min(im.height, y + h)))
    worst = min(((max(lf, lum(p)) + 0.05) / (min(lf, lum(p)) + 0.05)) for p in crop.getdata())
    rows.append({"state": t["state"], "target": t["sel"], "kind": t["kind"], "worst": round(worst, 2), "pass": worst >= 4.5})
rep["contrastResult"] = rows
json.dump(rep, open(f"{out}/report.json", "w"), indent=2)
for r in rows: print(r)
print("ALL PASS" if all(r["pass"] for r in rows) else "FAIL")
