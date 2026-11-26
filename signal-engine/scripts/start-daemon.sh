#!/usr/bin/env bash
# Mac/Linux: start the always-on engine (it sleeps until 9:00 ET on trading days).
cd "$(dirname "$0")/.." || exit 1
source .venv/bin/activate
exec python -m kcsignals daemon
