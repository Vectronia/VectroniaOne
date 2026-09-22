#!/usr/bin/env bash
# Baut das hochladbare Paket für einen Node-Hoster.
#
#   bash scripts/package.sh
#
# Ergebnis: dist/ mit server.js, und dist.zip zum Hochladen.
#
# `output: "standalone"` erzeugt den Server, kopiert aber weder `public` noch
# `.next/static` mit — ohne diesen Schritt lädt die Seite ohne Bilder und ohne
# Stylesheet. Das ist der Grund, warum es dieses Skript gibt.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "› Baue …"
npm run build >/dev/null

echo "› Schnüre Paket …"
rm -rf dist dist.zip
cp -r .next/standalone dist
cp -r public dist/public
mkdir -p dist/.next
cp -r .next/static dist/.next/static

if command -v zip >/dev/null 2>&1; then
  (cd dist && zip -qr ../dist.zip .)
fi

echo
echo "  dist/            $(du -sh dist | cut -f1)"
[ -f dist.zip ] && echo "  dist.zip         $(du -sh dist.zip | cut -f1)"
cat <<'TXT'

  Auf dem Server starten mit:   node server.js
  Die vier SMTP-Werte gehören in die Umgebungsvariablen des Hosters,
  nicht in eine Datei in diesem Paket.
TXT
