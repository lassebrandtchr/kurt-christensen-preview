#!/bin/sh
# Bygger sitet som ikke-indekseret preview og udgiver det på GitHub Pages (gren gh-pages).
# Kør fra site/: npm run deploy:preview   (kør igen efter ændringer i Sanity)
set -e
OUT="$(mktemp -d)/kurt-preview"
SITE_BASE=/kurt-christensen-preview PUBLIC_NOINDEX=true PUBLIC_SITE_URL=https://lassebrandtchr.github.io \
  npx astro build --outDir "$OUT"
touch "$OUT/.nojekyll"
REMOTE="$(git remote get-url origin)"
cd "$OUT"
git init -q -b gh-pages
git add -A
git commit -qm "Preview-build $(date '+%Y-%m-%d %H:%M')"
git push -qf "$REMOTE" gh-pages
echo "Udgivet: https://lassebrandtchr.github.io/kurt-christensen-preview/"
