#!/usr/bin/env bash
# Schemathesis health check with authentication setup
#
# Usage:
#   ./scripts/run-schemathesis.sh [BASE_URL] [SPEC_PATH]
#   — or via Nix —
#   nix run .#schemathesis-health-check -- [BASE_URL] [SPEC_PATH]
#
# Prerequisites:
#   - Backend running at BASE_URL
#   - gum installed (for formatted output)

set -euo pipefail

gum log --level info "Setting up hypothesis with writable cache dir"
export HYPOTHESIS_DATABASE="file:${TMPDIR:-/tmp}/hypothesis-cache"
gum log --level info "Succesfully created hypothesis cache at $HYPOTHESIS_DATABASE"

BASE_URL="${1:-http://localhost:8080/api}"
SPEC_PATH="${2:-specs/openapi.yaml}"

gum log --level info "Starting schemathesis health check"
gum log --level info "Base URL: $BASE_URL"
gum log --level info "Spec: $SPEC_PATH"

gum log --level info "Registering test user..."
if curl -X POST "${BASE_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "email": "test@example.com", "password": "testpassword123"}' \
  --silent --show-error >/tmp/register_response.json 2>&1; then
  gum log --level info "Test user registered successfully"
elif grep -q "already exists\|duplicate" /tmp/register_response.json 2>/dev/null; then
  gum log --level warn "Test user already exists, continuing..."
else
  gum log --level error "Failed to register test user"
  cat /tmp/register_response.json
  exit 1
fi

gum log --level info "Authenticating test user..."
if ! curl -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier": "testuser", "password": "testpassword123"}' \
  --silent --show-error >/tmp/login_response.json; then
  gum log --level error "Login request failed"
  cat /tmp/login_response.json
  exit 1
fi

gum log --level info "Login response received, extracting token..."
JWT_TOKEN=$(jq -r '.accessToken' /tmp/login_response.json 2>/dev/null)

if [[ -z $JWT_TOKEN || $JWT_TOKEN == "null" ]]; then
  gum log --level error "Failed to extract JWT token from login response"
  gum log --level debug "Response was: $(cat /tmp/login_response.json)"
  exit 1
fi

gum log --level info "Authentication successful, token obtained"

gum log --level info "Running schemathesis with authentication..."
gum style --foreground 212 --bold "Running API compliance tests..."

schemathesis run \
  --url "${BASE_URL}" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  "${SPEC_PATH}"

EXIT_CODE=$?

if [[ $EXIT_CODE -eq 0 ]]; then
  gum style --foreground 212 --bold "✓ All tests passed!"
  gum log --level info "Schemathesis health check completed successfully"
else
  gum style --foreground 212 --bold "✗ Some tests failed"
  gum log --level warn "Schemathesis found issues - review the output above"
fi

exit $EXIT_CODE
