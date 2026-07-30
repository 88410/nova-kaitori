#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
COMPANY_OUT="${COMPANY_OUT:-/tmp/novatekku-transfer/frontend-company}"
AI_OUT="${AI_OUT:-/tmp/novatekku-transfer/frontend-ai}"

patch_index_meta() {
  local dist_dir="$1"
  local title="$2"
  local description="$3"
  local keywords="$4"

  python3 - "$dist_dir/index.html" "$title" "$description" "$keywords" <<'PY'
from pathlib import Path
import re
import sys

path = Path(sys.argv[1])
title = sys.argv[2]
description = sys.argv[3]
keywords = sys.argv[4]

html = path.read_text()
html = re.sub(r"<title>.*?</title>", f"<title>{title}</title>", html, flags=re.S)
html = re.sub(
    r'<meta name="description" content=".*?" />',
    f'<meta name="description" content="{description}" />',
    html,
    flags=re.S,
)
html = re.sub(
    r'<meta name="keywords" content=".*?" />',
    f'<meta name="keywords" content="{keywords}" />',
    html,
    flags=re.S,
)
path.write_text(html)
PY
}

mkdir -p "$COMPANY_OUT" "$AI_OUT"

cd "$FRONTEND_DIR"

VITE_SITE_MODE=company npm run build
rsync -a --delete dist/ "$COMPANY_OUT/"
patch_index_meta \
  "$COMPANY_OUT" \
  "Novatech Co., Ltd. - NOVA AI Company Information" \
  "Official company page for Novatech Co., Ltd., introducing NOVA AI, company information, and the project development log." \
  "Novatech, NOVA AI, AI business development, iPhone buyback intelligence, trading operations"

VITE_SITE_MODE=product npm run build
rsync -a --delete dist/ "$AI_OUT/"
patch_index_meta \
  "$AI_OUT" \
  "NOVA AI - iPhone Buyback Price Comparison" \
  "Compare iPhone buyback prices in real time and get AI-assisted store recommendations." \
  "NOVA AI, iPhone buyback, buyback price comparison, smartphone trade-in, iPhone resale"

echo "Built company frontend: $COMPANY_OUT"
echo "Built AI frontend: $AI_OUT"
