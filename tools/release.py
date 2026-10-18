#!/usr/bin/env python3
"""Neue Version vorbereiten: python3 tools/release.py 1.11.1

- setzt APP.version in js/core.js
- setzt ?v=<version> an allen CSS/JS-Links in index.html (Browser und Service Worker laden dann sicher die neuen Dateien)
- zählt CACHE in sw.js hoch (gymlog-vNN)
"""
import re, sys, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
if len(sys.argv) != 2 or not re.fullmatch(r'\d+\.\d+\.\d+', sys.argv[1]):
    sys.exit('Aufruf: python3 tools/release.py <version>, z. B. 1.11.1')
ver = sys.argv[1]

core = root / 'js' / 'core.js'
s, n = re.subn(r"version: '[^']*'", f"version: '{ver}'", core.read_text(encoding='utf-8'), count=1)
assert n == 1, 'APP.version nicht gefunden'
core.write_text(s, encoding='utf-8')

index = root / 'index.html'
s, n = re.subn(r'((?:src|href)="(?:css|js)/[^"?]+)\?v=[^"]*"', rf'\g<1>?v={ver}"', index.read_text(encoding='utf-8'))
assert n > 0, 'keine CSS/JS-Links mit ?v= gefunden'
index.write_text(s, encoding='utf-8')

sw = root / 'sw.js'
txt = sw.read_text(encoding='utf-8')
m = re.search(r"const CACHE = 'gymlog-v(\d+)';", txt)
assert m, 'CACHE nicht gefunden'
cache = int(m.group(1)) + 1
sw.write_text(txt.replace(m.group(0), f"const CACHE = 'gymlog-v{cache}';"), encoding='utf-8')

print(f'Version {ver} · {n} Links in index.html · CACHE gymlog-v{cache}')
