#!/bin/sh
set -eu

: "${AWS_ACCESS_KEY_ID:?AWS_ACCESS_KEY_ID must be supplied by the private Render service}"
: "${AWS_SECRET_ACCESS_KEY:?AWS_SECRET_ACCESS_KEY must be supplied by the private Render service}"
: "${S3_BUCKET:?S3_BUCKET must be supplied by the private Render service}"

case "$S3_BUCKET" in
  sukoon-demo-staging) ;;
  *) echo "SeaweedFS configuration rejected: only the dedicated staging bucket is allowed." >&2; exit 1 ;;
esac

# The official single-node `weed mini` mode creates S3_BUCKET on first start.
# Render exposes this private service only on the environment's private network.
exec weed mini -dir=/data -ip.bind=0.0.0.0
