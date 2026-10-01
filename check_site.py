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

from urllib.robotparser import RobotFileParser
policy = RobotFileParser()
policy.parse((ROOT / 'robots.txt').read_text().splitlines())
assert 'Sitemap: https://newspectrum.org/sitemap.xml' in (ROOT / 'robots.txt').read_text()
class RobotsMeta(HTMLParser):
    def __init__(self):
        super().__init__()
        self.directives = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'meta' and attrs.get('name', '').lower() in ('robots', 'googlebot', 'bingbot', 'yandex'):
            self.directives += re.split(r'[\s,]+', attrs.get('content', '').lower())
for source in pages:
    if source.name == '404.html':
        continue
    meta = RobotsMeta()
    meta.feed(source.read_text())
    assert not {'noindex', 'nofollow', 'none'} & set(meta.directives), f'Blocked indexing: {source}'
    path = '/' + str(source.relative_to(ROOT)).removesuffix('index.html')
    assert all(policy.can_fetch(bot, path) for bot in ('Googlebot', 'bingbot', 'YandexBot')), path
for location in ET.parse(ROOT / 'sitemap.xml').iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc'):
    assert location.text.startswith('https://newspectrum.org/')
    assert not location.text.endswith('404.html')
rules = [line.split() for line in (ROOT / '_redirects').read_text().splitlines() if line and not line.startswith('#')]
for source, target, status in rules:
    assert source.startswith('/') and source != '/' and '*' not in source
    assert target == '/' and status == '301'
    assert not (ROOT / source.lstrip('/')).exists(), source
print(f'OK: {len(pages)-2} indexable pages; sitemap excludes 404; {len(rules)} legacy redirects without conflicts.')
