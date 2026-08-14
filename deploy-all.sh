#!/usr/bin/env bash
set -e

# Build, push, then rollout everything except postgres (k8s/data).

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "==> Building & pushing decoys"
(cd services && bash build.sh)

echo "==> Building & pushing api"
(cd api && bash build.sh)

echo "==> Rolling out decoys"
(cd k8s/services/decoys && bash rollout.sh)

echo "==> Rolling out api"
(cd k8s/api && bash rollout.sh)

echo "==> Done"
