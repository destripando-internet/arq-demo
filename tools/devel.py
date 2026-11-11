#!/usr/bin/env python3
"""Serve the app for development and open it in the default browser.

Idempotent: if this app is already being served on the port, it only opens
the browser. Otherwise it serves the repository on 127.0.0.1 in the
foreground (Ctrl+C stops it) with «Cache-Control: no-store», so the browser
does not keep running old copies of the ES modules after they are edited.
"""

import functools
import http.server
import pathlib
import sys
import threading
import urllib.request
import webbrowser

ROOT = pathlib.Path(__file__).resolve().parent.parent


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


def serving_this_app(url):
    """Whether url already serves this repository: same version.js."""
    try:
        with urllib.request.urlopen(url + 'version.js', timeout=2) as r:
            return r.read() == (ROOT / 'version.js').read_bytes()
    except OSError:
        return False


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    url = f'http://127.0.0.1:{port}/'

    if serving_this_app(url):
        print(f'Already serving on {url}')
        webbrowser.open(url)
        return

    handler = functools.partial(Handler, directory=str(ROOT))
    try:
        server = http.server.ThreadingHTTPServer(('127.0.0.1', port), handler)
    except OSError as e:
        sys.exit(f'Port {port} is taken by something else: {e}')

    print(f'Serving {ROOT} on {url} (Ctrl+C to stop)', flush=True)
    # The socket is already listening, so the page loads at the first try.
    threading.Thread(target=webbrowser.open, args=(url,), daemon=True).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
