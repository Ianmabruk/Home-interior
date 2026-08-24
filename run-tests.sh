#!/bin/bash
set -e

echo "=========================================="
echo "  HOK Interior Designs - Test Suite"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

run_test() {
    echo -e "${YELLOW}Running: $1${NC}"
    if eval "$2"; then
        echo -e "${GREEN}✓ $1 passed${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        exit 1
    fi
    echo ""
}

# Frontend tests
run_test "Frontend Unit Tests" "cd /home/ian-mabruk/home && npx vitest run 2>&1 | tail -20"

# Backend tests (requires database connection)
run_test "Backend Unit Tests" "cd /home/ian-mabruk/home/backend && npx jest --config jest.config.js --runInBand 2>&1 | tail -40"

# Lint checks
run_test "Frontend Lint" "cd /home/ian-mabruk/home && npx eslint src/ --max-warnings=0 2>&1 | tail -5"
run_test "Backend Lint" "cd /home/ian-mabruk/home/backend && npx eslint src/ --max-warnings=0 2>&1 | tail -5"

# Frontend build check
run_test "Frontend Build" "cd /home/ian-mabruk/home && npx vite build 2>&1 | tail -5"

echo "=========================================="
echo -e "${GREEN}  All tests passed!${NC}"
echo "=========================================="
