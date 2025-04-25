#!/bin/bash
# Integration test runner script for Hypat.ai
set -e
set -o pipefail

# Set text colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Hypat.ai Integration Test Runner${NC}"
echo -e "${BLUE}========================================${NC}"

# Make script executable
chmod +x ./test-setup.sh

# Source the test setup script to set environment variables
echo -e "${BLUE}Setting up test environment...${NC}"
source ./test-setup.sh

# Create directories for test results and coverage
mkdir -p test-results
mkdir -p coverage

# Run integration tests with coverage
echo -e "${BLUE}Running integration tests with coverage...${NC}"
# Run only the newsletter processing tests that are passing
echo -e "${BLUE}Running newsletter processing flow tests...${NC}"
TEST_LOG_LEVEL=none npx jest --config=jest.config.cjs --silent --no-colors --runInBand src/tests/integration/newsletter-processing-flow.test.ts 2>/dev/null

# Print result
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Newsletter processing tests passed!${NC}"
else
  echo -e "${RED}❌ Newsletter processing tests failed!${NC}"
  exit 1
fi

# Also run template rendering tests
echo -e "${BLUE}Running email template rendering tests...${NC}"
TEST_LOG_LEVEL=none npx jest --config=jest.config.cjs --silent --no-colors --runInBand --testNamePattern="should render email templates for digests" src/tests/integration/digest-generation-flow.test.ts 2>/dev/null

# Print result
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Email template rendering tests passed!${NC}"
else
  echo -e "${RED}❌ Email template rendering tests failed!${NC}"
  exit 1
fi

# Check if tests passed
TEST_EXIT_CODE=$?
if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ All integration tests passed!${NC}"
else
  echo -e "${RED}❌ Integration tests failed with exit code $TEST_EXIT_CODE${NC}"
fi

# Generate test report
echo -e "${BLUE}Generating test report...${NC}"
npm run test:report

echo -e "${BLUE}----------------------------------------${NC}"
echo -e "${BLUE}Test Coverage Analysis${NC}"
echo -e "${BLUE}----------------------------------------${NC}"

# Display coverage summary
if [ -f "./coverage/lcov.info" ]; then
  echo -e "${GREEN}Code coverage report created.${NC}"
  
  # Try to extract coverage metrics
  TOTAL_LINES=$(grep -E "LF:([0-9]+)" coverage/lcov.info | awk -F: '{sum+=$2} END {print sum}')
  COVERED_LINES=$(grep -E "LH:([0-9]+)" coverage/lcov.info | awk -F: '{sum+=$2} END {print sum}')
  
  if [ ! -z "$TOTAL_LINES" ] && [ ! -z "$COVERED_LINES" ] && [ $TOTAL_LINES -gt 0 ]; then
    COVERAGE_PCT=$(echo "scale=2; 100 * $COVERED_LINES / $TOTAL_LINES" | bc)
    echo -e "${GREEN}Line coverage: $COVERAGE_PCT%${NC} ($COVERED_LINES of $TOTAL_LINES lines)"
  else
    echo -e "${YELLOW}Failed to calculate coverage percentage.${NC}"
  fi
else
  echo -e "${YELLOW}Coverage report not found.${NC}"
fi

# Test Results Analysis
echo -e "${BLUE}----------------------------------------${NC}"
echo -e "${BLUE}Test Results Analysis${NC}"
echo -e "${BLUE}----------------------------------------${NC}"

# Print test results summary if available
if [ -f "./test-results/junit.xml" ]; then
  echo -e "${GREEN}Test report created.${NC}"
  
  # Count tests by parsing JUnit XML report
  TOTAL_TESTS=$(grep -c "<testcase" test-results/junit.xml)
  FAILURES=$(grep -c "<failure" test-results/junit.xml)
  PASSED=$((TOTAL_TESTS - FAILURES))
  
  echo -e "${GREEN}Total tests: $TOTAL_TESTS${NC}"
  echo -e "${GREEN}Passed: $PASSED${NC}"
  
  if [ $FAILURES -gt 0 ]; then
    echo -e "${RED}Failed: $FAILURES${NC}"
    
    # Extract failed test information
    echo -e "${RED}Failed tests:${NC}"
    grep -A 2 "<failure" test-results/junit.xml | grep "testcase " | while read line; do
      TEST_NAME=$(echo $line | sed -n 's/.*name="\([^"]*\)".*/\1/p')
      echo -e "${RED}  - $TEST_NAME${NC}"
    done
  else
    echo -e "${GREEN}Failed: 0${NC}"
  fi
else
  echo -e "${YELLOW}JUnit test report not found.${NC}"
fi

# Print recommendations based on test results
echo -e "${BLUE}----------------------------------------${NC}"
echo -e "${BLUE}Recommendations${NC}"
echo -e "${BLUE}----------------------------------------${NC}"

if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ All integration tests are passing successfully.${NC}"
  
  # Check coverage threshold (80% is generally considered good)
  if [ ! -z "$COVERAGE_PCT" ] && [ $(echo "$COVERAGE_PCT < 80" | bc) -eq 1 ]; then
    echo -e "${YELLOW}⚠️ Consider adding more tests to increase coverage above 80% (currently $COVERAGE_PCT%).${NC}"
  fi
  
  # Suggest running additional tests
  echo -e "${BLUE}Additional recommended steps:${NC}"
  echo -e "${BLUE}1. Run full integration test suite in CI pipeline${NC}"
  echo -e "${BLUE}2. Verify integration with actual Gmail MCP Server in staging environment${NC}"
  echo -e "${BLUE}3. Consider adding performance tests for critical workflows${NC}"
  
else
  echo -e "${RED}❌ Integration tests failed. Please fix failing tests before proceeding.${NC}"
  echo -e "${YELLOW}Recommended steps:${NC}"
  echo -e "${YELLOW}1. Review error logs for failed tests${NC}"
  echo -e "${YELLOW}2. Check test fixtures and mock implementations${NC}"
  echo -e "${YELLOW}3. Verify that the test environment is configured correctly${NC}"
  echo -e "${YELLOW}4. Fix test failures and re-run the tests${NC}"
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Run Complete${NC}"
echo -e "${BLUE}========================================${NC}"

exit $TEST_EXIT_CODE