#!/usr/bin/env python3
"""Serve a local site with the same exact _redirects rules as Render."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

class Handler(SimpleHTTPRequestHandler):
    def send_head(self):
        path = urlsplit(self.path).path
        local = Path(self.translate_path(path))
        if path in self.server.redirects and not (local.is_file() or (local / 'index.html').is_file()):
            self.send_response(301)
            self.send_header('Location', '/')
            self.send_header('Content-Length', '0')
            self.end_headers()
            return None
        return super().send_head()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--directory', type=Path, default=Path(__file__).resolve().parent / 'public')
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()
    rules = set()
    for line in (args.directory / '_redirects').read_text().splitlines():
        if line and not line.startswith('#'):
            source, target, status = line.split()
            if target != '/' or status != '301' or '*' in source:
                raise SystemExit('Unsupported local redirect rule')
            rules.add(source)
    server = ThreadingHTTPServer(('127.0.0.1', args.port), partial(Handler, directory=str(args.directory.resolve())))
    server.redirects = rules
    print(f'Local website: http://127.0.0.1:{args.port}; {len(rules)} redirects', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
