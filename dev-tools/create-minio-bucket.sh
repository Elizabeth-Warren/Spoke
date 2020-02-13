#!/bin/bash

set -euo pipefail

MINIO_CONTAINER_ID="$(docker-compose ps -q minio)"
MINIO_CONTAINER_IP="$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $MINIO_CONTAINER_ID)"
MINIO_CONTAINER_NETWORK="$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.NetworkID}}{{end}}' $MINIO_CONTAINER_ID)"

docker run --rm --name minio-client -it \
    --env MINIO_SERVER_HOST="$MINIO_CONTAINER_IP" \
    --env MINIO_SERVER_ACCESS_KEY="DEVACCESSKEY" \
    --env MINIO_SERVER_SECRET_KEY="DEVSECRETKEY" \
    --network "$MINIO_CONTAINER_NETWORK" \
    bitnami/minio-client \
    mb minio/spoke-local --ignore-existing
