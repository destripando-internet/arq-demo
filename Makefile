PORT ?= 8765

# Serves the app (no-store, so edited ES modules are reloaded) and opens it in
# the default browser. Idempotent: if it is already served, it only opens it.
.PHONY: devel
devel:
	@python3 tools/devel.py $(PORT)
