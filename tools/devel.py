#!/usr/bin/env python3
"""Serve the app for development and open it in the default browser.

Idempotent: if this app is already being served, it only opens the browser.
Otherwise it serves the repository on 127.0.0.1 in the foreground (Ctrl+C
stops it) with «Cache-Control: no-store», so the browser does not keep
running old copies of the ES modules after they are edited. The first line
it prints is the URL alone, for scripts to read it.

If another app has the port, it takes the next free one. It looks for this
app on the following ports first, so running it again finds the server it
started, and the same port keeps being chosen: the browser keeps
localStorage per origin, port included.
"""

import functools
import http.server
import pathlib
import sys
import threading
import urllib.request
import webbrowser

ROOT = pathlib.Path(__file__).resolve().parent.parent
TRIES = 20  # ports looked at, from the one asked for


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


def serving_this_app(url):
    """Whether url already serves this repository: same version.js."""
    try:
        with urllib.request.urlopen(url + 'version.js', timeout=1) as r:
            return r.read() == (ROOT / 'version.js').read_bytes()
    except OSError:
        return False


def first_free(ports, handler):
    """A server on the first of ports nobody is using, or None."""
    for port in ports:
        try:
            return http.server.ThreadingHTTPServer(('127.0.0.1', port), handler)
        except OSError:
            pass
    return None


def main():
    first = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    ports = range(first, first + TRIES)
    url = lambda port: f'http://127.0.0.1:{port}/'

    for port in ports:
        if serving_this_app(url(port)):
            print(url(port))
            print('Already being served: only opening the browser')
            webbrowser.open(url(port))
            return

    server = first_free(ports, functools.partial(Handler, directory=str(ROOT)))
    if server is None:
        sys.exit(f'Ports {first} to {first + TRIES - 1} are all taken by other apps')
    port = server.server_address[1]

    print(url(port))
    note = f', port {first} is taken by another app' if port != first else ''
    print(f'Serving {ROOT} (Ctrl+C to stop{note})', flush=True)
    # The socket is already listening, so the page loads at the first try.
    threading.Thread(target=webbrowser.open, args=(url(port),), daemon=True).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
