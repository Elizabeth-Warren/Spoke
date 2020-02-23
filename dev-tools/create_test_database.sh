#!/usr/bin/env bash
set -euo pipefail

docker exec -i internal-spoke_postgres_1  psql  -h localhost -p 5432 -U spoke spokedev <<EOF
       CREATE DATABASE spoke_test;
       CREATE USER spoke_test WITH PASSWORD 'spoke_test';
       GRANT ALL PRIVILEGES ON DATABASE spoke_test TO spoke_test;
EOF

docker exec -i internal-spoke_postgres_1  psql  -h localhost -p 5432 -U spoke spoke_test <<EOF
       CREATE EXTENSION pg_trgm;
EOF
