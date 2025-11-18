#!/bin/bash

# Script to run E2E tests with proper setup

set -e

echo "Setting up test environment..."

# Generate certificates if missing
if [ ! -f ../certs/device.key ]; then
    echo "Generating SSL certificates..."
    cd ../certs
    bash create.sh <<EOF
US
CA
SF
Darc
Darc
localhost
test@test.com
EOF
    cd ../e2e-tests
fi

# Kill any existing vite servers
pkill -f "vite" || true
sleep 2

# Run the tests
echo "Running Playwright tests..."
npx playwright test "$@"
