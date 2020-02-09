#!/bin/bash

set -euo pipefail

docker exec -it internal-spoke_redis_1 redis-cli "$@"
