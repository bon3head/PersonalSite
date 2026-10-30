#!/usr/bin/env python3
"""Palette receipt: OKLab distance of every DESIGN.md color to 51 reference blues, and WCAG contrast of every pair in contrastPairs.
Usage: python3 -I spec/astryx/tools/palette-receipt.py spec/astryx/DESIGN.md   (exit 1 on any failure)"""
import math,sys
def s2l(c):
    c/=255; return c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4
def l2s(c):
    v = 12.92*c if c<=0.0031308 else 1.055*c**(1/2.4)-0.055
    return max(0,min(255,round(v*255)))
def hex2rgb(h): h=h.lstrip('#'); return [int(h[i:i+2],16) for i in (0,2,4)]
def rgb2oklab(rgb):
    r,g,b=[s2l(x) for x in rgb]
    l=0.4122214708*r+0.5363325363*g+0.0514459929*b
    m=0.2119034982*r+0.6806995451*g+0.1073969566*b
    s=0.0883024619*r+0.2817188376*g+0.6299787005*b
    l,m,s=[x**(1/3) for x in (l,m,s)]
    return (0.2104542553*l+0.7936177850*m-0.0040720468*s,1.9779984951*l-2.4285922050*m+0.4505937099*s,0.0259040371*l+0.7827717662*m-0.8086757660*s)
def oklch(h):
    L,a,b=rgb2oklab(hex2rgb(h)); return L,math.hypot(a,b),(math.degrees(math.atan2(b,a))%360)
def oklch2hex(L,C,H):
    a=C*math.cos(math.radians(H)); b=C*math.sin(math.radians(H))
    l=L+0.3963377774*a+0.2158037573*b; m=L-0.1055613458*a-0.0638541728*b; s=L-0.0894841775*a-1.2914855480*b
    l,m,s=l**3,m**3,s**3
    r=4.0767416621*l-3.3077115913*m+0.2309699292*s; g=-1.2684380046*l+2.6097574011*m-0.3413193965*s; bb=-0.0041960863*l-0.7034186147*m+1.7076147010*s
    inside=all(-0.0005<=x<=1.0005 for x in (r,g,bb))
    return '#%02X%02X%02X'%tuple(l2s(x) for x in (r,g,bb)), inside
def lum(h):
    r,g,b=[s2l(x) for x in hex2rgb(h)]; return 0.2126*r+0.7152*g+0.0722*b
def cr(a,b):
    A,B=lum(a),lum(b); A,B=max(A,B),min(A,B); return (A+0.05)/(B+0.05)
def de(a,b):
    x=rgb2oklab(hex2rgb(a)); y=rgb2oklab(hex2rgb(b)); return math.dist(x,y)
BRANDS={'Meta/Astryx accent':'#0064E0','Meta 0082FB':'#0082FB','Astryx accent dark':'#2694FE','Astryx text-accent dark':'#3E9EFB','Astryx text-blue dark':'#AFD7FF','Astryx text-blue light':'#042F97','Facebook':'#1877F2','LinkedIn':'#0A66C2','X legacy':'#1DA1F2','Vercel':'#0070F3','Docker':'#2496ED','VS Code':'#007ACC','Zoom':'#0B5CFF','Intel':'#0071C5','Samsung':'#1428A0','Linear':'#5E6AD2','Discord':'#5865F2','Bluesky':'#1185FE','Codeberg':'#2185D0','GitHub dark link':'#2F81F7','GitHub light link':'#0969DA','Material blue 500':'#2196F3','Bootstrap':'#0D6EFD','Signal':'#3A76F0','IBM blue 60':'#0F62FE'}
TW={'sky-200':'#BAE6FD','sky-300':'#7DD3FC','sky-400':'#38BDF8','sky-500':'#0EA5E9','sky-600':'#0284C7','sky-700':'#0369A1','sky-800':'#075985','sky-900':'#0C4A6E','blue-200':'#BFDBFE','blue-300':'#93C5FD','blue-400':'#60A5FA','blue-500':'#3B82F6','blue-600':'#2563EB','blue-700':'#1D4ED8','blue-800':'#1E40AF','blue-900':'#1E3A8A','indigo-200':'#C7D2FE','indigo-300':'#A5B4FC','indigo-400':'#818CF8','indigo-500':'#6366F1','indigo-600':'#4F46E5','indigo-700':'#4338CA','indigo-800':'#3730A3','indigo-900':'#312E81','cyan-300':'#67E8F9','cyan-400':'#22D3EE'}
ALL={**BRANDS,**{'tailwind '+k:v for k,v in TW.items()}}
import json, re, sys
def load_tokens(path):
    src = open(path, encoding='utf-8').read()
    m = re.search(r"```json design-tokens\n(.*?)\n```", src, re.S)
    if not m: sys.exit('design-tokens block not found')
    return json.loads(m.group(1))
def resolve(col, name):
    node = col
    for part in name.split('.'):
        node = node[part]
    return node[:7]
def main():
    t = load_tokens(sys.argv[1] if len(sys.argv) > 1 else 'spec/astryx/DESIGN.md')
    col = t['color']; fail = 0
    print('== Distinctness (identity colors must be >= 0.050 from every reference, >= 0.10 from Meta)')
    meta = ['#0064E0', '#2694FE', '#0082FB', '#1877F2']
    for name in ['signal', 'signalDim', 'ink', 'field.ground']:
        hx = resolve(col, name)
        d, ref = min((de(hx, c), k) for k, c in ALL.items())
        dm = min(de(hx, c) for c in meta)
        ok = d >= 0.0495 and dm >= 0.10
        fail += not ok
        print(f"{'PASS' if ok else 'FAIL'} {name:14s} {hx} nearest={ref} dE={d:.3f} dE_meta={dm:.3f}")
    print('== Contrast')
    for a, b, need in t['contrastPairs']:
        r = cr(resolve(col, a), resolve(col, b)); ok = r >= need; fail += not ok
        print(f"{'PASS' if ok else 'FAIL'} {a:12s} on {b:13s} {r:5.2f} (need {need})")
    sys.exit(1 if fail else 0)
if __name__ == '__main__':
    main()
