#!/usr/bin/env bash
# Build the Firefox (AMO) package: the Chrome extension plus gecko manifest settings.
# Chrome is not told about browser_specific_settings, so this is a separate build.
set -euo pipefail
cd "$(dirname "$0")/.."

VERSION=$(python3 -c 'import json; print(json.load(open("extension/manifest.json"))["version"])')
OUT="${1:-/downloads/letemcookie-firefox-$VERSION.zip}"
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

cp extension/* "$WORK"/
python3 - "$WORK/manifest.json" <<'PY'
import json, sys
p = sys.argv[1]
m = json.load(open(p))
m["browser_specific_settings"] = {
    "gecko": {
        "id": "letemcookie@letemcookie.com",
        "strict_min_version": "109.0",
        # Anonymous opt-out counters only: one random UUID per event; the server
        # keeps a daily-rotating IP hash for spam limits and deletes it within 48h.
        "data_collection_permissions": {"required": ["none"], "optional": ["technicalAndInteraction"]}
    }
}
# Firefox runs MV3 background as an event page; keep service_worker as the forward path.
m["background"]["scripts"] = ["background.js"]
json.dump(m, open(p, "w"), indent=2)
PY

rm -f "$OUT"
(cd "$WORK" && zip -q -X "$OUT" ./*)
sha256sum "$OUT"
