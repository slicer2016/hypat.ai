# Hypat.ai Integration Tests

This directory contains integration tests for the Hypat.ai newsletter processing system. The tests validate that different modules work together correctly to fulfill the system's core functionalities.

## Test Structure

The integration tests are organized by major functional areas:

1. **Newsletter Processing Flow** - Tests the complete flow of detecting newsletters in an inbox, processing their content, and storing the results.

2. **Categorization Flow** - Tests the automatic and manual categorization of newsletters, including theme detection and relationship generation.

3. **Digest Generation Flow** - Tests the creation of daily and weekly digests, rendering email templates, and sending digest emails.

4. **Feedback Flow** - Tests the verification request generation, processing of user feedback, and improvement of detection based on that feedback.

## Test Configuration

Tests use a specialized configuration defined in `config.ts` that provides:

- In-memory SQLite database for fast, isolated testing
- Mock email sender service
- Mock Gmail MCP client
- Accelerated scheduling for time-dependent features
- Deterministic ID generation for reproducible tests

## Running the Tests

To run all integration tests:

```bash
npm test -- src/tests/integration
```

To run a specific integration test suite:

```bash
npm test -- src/tests/integration/newsletter-processing-flow.test.ts
```

## Test Fixtures

Tests use the `TestFixture` class to set up and tear down test resources. The fixture:

1. Creates an in-memory database
2. Runs database migrations
3. Sets up sample data (users, categories)
4. Configures mock external services
5. Provides helper methods for test setup

## Mock Implementations

The tests use mock implementations of external dependencies:

- **MockGmailMcpClient** - Provides sample email data without requiring Gmail access
- **MockEmailSender** - Captures sent emails for verification without actually sending them

## Sample Test Data

Test data is provided in the `test-data` directory:

- **sample-emails.ts** - Contains sample newsletter and non-newsletter emails
- Additional test data is created dynamically within each test suite

## Interpreting Test Results

When tests run successfully, all aspects of the system are working together correctly. The tests validate:

1. **Data Flow** - Information flows correctly between components
2. **Integration Points** - Components correctly call and use one another
3. **End-to-End Functionality** - Complete user workflows function as expected

If a test fails, the error message and test name should help identify which part of the system isn't working as expected.

## Adding New Integration Tests

When adding new features to Hypat.ai, corresponding integration tests should be added to ensure they work correctly with the rest of the system. Follow the existing pattern of:

1. Using the `TestFixture` for setup and teardown
2. Creating necessary test data
3. Testing complete workflows rather than individual functions
4. Verifying both the API contract and the actual stored/processed data

## Troubleshooting

If tests are failing, check:

1. **Database Schema** - Ensure migrations are up to date
2. **External Dependencies** - Check if mock implementations need updating
3. **Test Data** - Verify test data matches expectations
4. **Test Configuration** - Ensure test configuration is appropriate

For detailed debugging, you can enable more verbose logging by setting the `TEST_LOG_LEVEL` environment variable:

```bash
TEST_LOG_LEVEL=debug npm test -- src/tests/integration
```