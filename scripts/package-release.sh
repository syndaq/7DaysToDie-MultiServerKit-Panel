#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="${1:-}"

if [[ -z "$VERSION" ]]; then
  echo "Usage: $0 <version>" >&2
  exit 1
fi

OUTPUT_DIR="$ROOT/dist"
ARCHIVE="$OUTPUT_DIR/7DaysToDie-MultiServerKit-Panel-${VERSION}.tar.gz"
mkdir -p "$OUTPUT_DIR"

git -C "$ROOT" archive --format=tar.gz \
  --prefix="7DaysToDie-MultiServerKit-Panel-${VERSION}/" \
  -o "$ARCHIVE" \
  HEAD

echo "Done: $ARCHIVE"
