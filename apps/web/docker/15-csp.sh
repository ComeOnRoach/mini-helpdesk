#!/bin/sh
# Builds /etc/nginx/conf.d/csp.inc from CSP_ENABLED / CSP_REPORT_ONLY / VITE_API_URL.
# Mirrors the strict (preview) policy of the cspPlugin in apps/web/vite.config.ts.
set -eu

out=/etc/nginx/conf.d/csp.inc

if [ "${CSP_ENABLED:-false}" != "true" ]; then
  : > "$out"
  echo "15-csp.sh: CSP disabled"
  exit 0
fi

header=Content-Security-Policy
if [ "${CSP_REPORT_ONLY:-false}" = "true" ]; then
  header=Content-Security-Policy-Report-Only
fi

api=$(printf '%s' "${VITE_API_URL:-http://localhost:3000}" | sed 's#/*$##')
ws=$(printf '%s' "$api" | sed 's#^http#ws#')

policy="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' $api $ws; frame-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'self'; report-uri $api/api/csp-report"

printf 'add_header %s "%s" always;\n' "$header" "$policy" > "$out"
echo "15-csp.sh: $header enabled"
