#!/usr/bin/env python3
"""Check every local HTML/CSS resource and sitemap entry without dependencies."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent / 'public'
errors = []
count = 0

def check(source, reference):
    global count
    url = urlsplit(reference)
    if url.scheme or url.netloc or not url.path:
        return
    count += 1
    target = ((ROOT / unquote(url.path).lstrip('/')) if url.path.startswith('/')
              else source.parent / unquote(url.path)).resolve()
    if not target.is_relative_to(ROOT.resolve()) or not (target.is_file() or (target / 'index.html').is_file()):
        errors.append(f'{source.relative_to(ROOT)}: {reference}')

class Links(HTMLParser):
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ('href', 'src', 'action', 'poster') and value:
                check(self.source, value)
            elif key == 'srcset' and value:
                for item in value.split(','):
                    check(self.source, item.strip().split()[0])

pages = list(ROOT.rglob('*.html'))
assert (ROOT / 'index.html').is_file() and (ROOT / 'ru/index.html').is_file()
assert (ROOT / '404.html').is_file()
for source in pages:
    parser = Links()
    parser.source = source
    parser.feed(source.read_text())
for source in ROOT.rglob('*.css'):
    for value in re.findall(r'url\(\s*[\'\"]?([^\)\'\"]+)', source.read_text()):
        check(source, value.strip())
manifest = ROOT / 'site.webmanifest'
for icon in json.loads(manifest.read_text())['icons']:
    check(manifest, icon['src'])
for location in ET.parse(ROOT / 'sitemap.xml').iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc'):
    check(ROOT / 'sitemap.xml', urlsplit(location.text).path)
for file in ROOT.rglob('*'):
    if file.is_symlink() or any(part.startswith('.') for part in file.relative_to(ROOT).parts):
        errors.append(f'Unexpected hidden file or symlink: {file}')
if errors:
    raise SystemExit('\n'.join(errors))
print(f'OK: {len(pages)} HTML pages; {count} local links, assets and sitemap entries; no broken references.')
