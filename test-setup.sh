#!/bin/bash
# Test setup script for Hypat.ai integration tests

# Set environment variables for testing
export NODE_ENV=test
export TEST_LOG_LEVEL=info
export TEST_DB_MEMORY=true
export TEST_DISABLE_TIMEOUTS=true
export TEST_MOCK_SERVICES=true

# Create test results directory if it doesn't exist
mkdir -p ./test-results

echo "Test environment setup complete. Running with:"
echo "NODE_ENV: $NODE_ENV"
echo "TEST_LOG_LEVEL: $TEST_LOG_LEVEL"
echo "Using in-memory database: $TEST_DB_MEMORY"
echo "Timeouts disabled: $TEST_DISABLE_TIMEOUTS"
echo "Using mock services: $TEST_MOCK_SERVICES"

# Additional test setup can be added here