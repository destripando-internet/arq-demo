#!/usr/bin/env python3
"""Sets version.js to the version of the next commit: 0.YYYYMMDD-n.

YYYYMMDD is today's date and n the number of the commit within the day, one
more than the commits already made today. The pre-commit hook
(.githooks/pre-commit) runs it, so that every commit carries its version.

    tools/bump_version.py [--show]

--show prints the version in version.js and changes nothing.
"""

import argparse
import re
import subprocess
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FILE = 'version.js'
VERSION = re.compile(r"export const VERSION = '(\d+)\.(\d{8})-(\d+)';")


def commits_today(today):
    """Commits of the current branch made today, by local committer date."""
    dates = subprocess.run(
        ['git', 'log', '--format=%cd', '--date=format-local:%Y%m%d'],
        cwd=ROOT, capture_output=True, text=True, check=True).stdout.split()
    return dates.count(today)


def main():
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--show', action='store_true', help='print the version, change nothing')
    args = parser.parse_args()

    path = ROOT / FILE
    source = path.read_text(encoding='utf-8')
    found = VERSION.search(source)
    if not found:
        print(f'{FILE}: no version found', file=sys.stderr)
        return 2

    major = found.group(1)
    old = f'{major}.{found.group(2)}-{found.group(3)}'
    if args.show:
        print(old)
        return 0

    today = date.today().strftime('%Y%m%d')
    new = f'{major}.{today}-{commits_today(today) + 1}'
    if new != old:
        path.write_text(source.replace(found.group(0), f"export const VERSION = '{new}';", 1),
                        encoding='utf-8')
    print(f'{FILE}: {old} → {new}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
