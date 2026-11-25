#!/usr/bin/env bash
# Fallback when Docker Hub / Quay MinIO images are unavailable.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BIN="$ROOT/.local/bin/minio"
DATA="$ROOT/.local/minio-data"
RELEASE="${MINIO_RELEASE:-RELEASE.2024-11-07T00-52-20Z}"
mkdir -p "$(dirname "$BIN")" "$DATA"
if [[ ! -x "$BIN" ]]; then
  curl -fsSL "https://github.com/minio/minio/releases/download/${RELEASE}/minio.linux-amd64" -o "$BIN"
  chmod +x "$BIN"
fi
export MINIO_ROOT_USER="${MINIO_ACCESS_KEY:-dealplus_admin}"
export MINIO_ROOT_PASSWORD="${MINIO_SECRET_KEY:-LocalMinio@2026}"
exec "$BIN" server "$DATA" --address ":${MINIO_PORT:-9000}"