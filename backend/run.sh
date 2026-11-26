#!/usr/bin/env bash
# Start the API (creates .env with fresh keys on first run)
cd "$(dirname "$0")"
[ -d .venv ] || python3 -m venv .venv
. .venv/bin/activate
pip install -q -r requirements.txt
[ -f .env ] || python generate_keys.py
uvicorn app.main:app --reload --port 8000
