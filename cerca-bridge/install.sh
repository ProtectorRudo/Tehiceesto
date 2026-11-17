#!/usr/bin/env sh
# CERCA Bridge: only use on an already-provisioned VPS. Does not purchase services.
# Starts containers and explicitly creates the CERCA instance, but cannot link
# WhatsApp or send messages; those require separate pairing and Render settings.
set -eu
cd "$(dirname "$0")"
if [ ! -f .env ]; then
  printf '%s\n' 'Missing .env: copy .env.example and set independent secrets.' >&2
  exit 1
fi
chmod 600 .env
if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  printf '%s\n' 'Docker Engine with Docker Compose plugin is required.' >&2
  exit 1
fi
if ! command -v node >/dev/null 2>&1; then
  printf '%s\n' 'Node.js 22 is required for the non-destructive preflight.' >&2
  exit 1
fi
node --env-file=.env doctor.mjs
docker compose --env-file .env config --quiet
docker compose --env-file .env up -d
docker compose --env-file .env run --rm monitor node configure.mjs
docker compose --env-file .env ps
printf '%s\n' 'CERCA Bridge containers installed. WhatsApp NOT linked. CERCA messaging still disabled.'