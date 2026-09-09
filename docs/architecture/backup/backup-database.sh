#!/usr/bin/env bash
set -euo pipefail
echo "Template only: configure a secure PostgreSQL connection via environment, never commit credentials."
echo "Use pg_dump or the current Supabase-supported backup tooling for your environment."
exit 1
