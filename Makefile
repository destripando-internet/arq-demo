PORT ?= 8765

# python3 -m http.server with «Cache-Control: no-store»: otherwise the browser
# may keep running old copies of the ES modules after they are edited.
.PHONY: devel
devel:
	python3 -c "import http.server as s; h = s.SimpleHTTPRequestHandler; e = h.end_headers; \
	h.end_headers = lambda self: (self.send_header('Cache-Control', 'no-store'), e(self)); \
	s.test(HandlerClass=h, port=$(PORT), bind='127.0.0.1')"
