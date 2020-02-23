#!/usr/bin/env bash
set -euo pipefail

PGPASSWORD=spoke_test psql -h localhost -p 5432 -U spoke_test spoke_test <<EOF
       CREATE EXTENSION pg_trgm;
EOF
