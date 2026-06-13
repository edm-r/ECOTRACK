#!/usr/bin/env python3
"""
Export the ECOTRACK OpenAPI spec to docs/api/openapi.yaml.

Usage (from backend/):
    python scripts/export_openapi.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import yaml  # noqa: E402  (after sys.path patch)
from app.main import app  # noqa: E402

spec = app.openapi()

out_dir = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "..", "docs", "api",
)
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, "openapi.yaml")

with open(out_path, "w", encoding="utf-8") as f:
    yaml.dump(spec, f, allow_unicode=True, sort_keys=False, default_flow_style=False)

print(f"OpenAPI spec exported → {os.path.abspath(out_path)}")
print(f"  {len(spec.get('paths', {}))} paths, "
      f"{len(spec.get('components', {}).get('schemas', {}))} schemas")
