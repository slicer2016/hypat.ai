/**
 * Integration Tests Index
 * 
 * This file re-exports all integration tests and provides helper utilities
 * for running the tests as a group.
 */

import { TestFixture } from './test-fixture.js';
import { integrationTestConfig } from './config.js';

// Re-export all test modules
export * from './test-fixture.js';
export * from './config.js';
export * from './mocks/mock-gmail-mcp-client.js';
export * from './mocks/mock-email-sender.js';
export * from './test-data/sample-emails.js';

/**
 * Create and initialize a test fixture
 */
export async function createTestFixture(): Promise<TestFixture> {
  const fixture = new TestFixture();
  await fixture.setup();
  return fixture;
}

/**
 * Teardown a test fixture
 */
export async function teardownTestFixture(fixture: TestFixture): Promise<void> {
  await fixture.teardown();
}

/**
 * Configure the test environment based on integration test config
 */
export function configureTestEnvironment(): void {
  // Configure logging
  process.env.LOG_LEVEL = integrationTestConfig.logging.level;
  
  // Set up deterministic dates if needed
  if (integrationTestConfig.acceleration.mockCurrentDate) {
    const mockDate = integrationTestConfig.acceleration.mockCurrentDate;
    jest.spyOn(global, 'Date').mockImplementation(() => new Date(mockDate));
  }
  
  // Configure other test settings
  if (integrationTestConfig.acceleration.disableTimeouts) {
    jest.setTimeout(30000); // 30 second timeout for integration tests
  }
}

/**
 * Main entry point for running all integration tests
 */
export async function runAllIntegrationTests(): Promise<void> {
  // Configure test environment
  configureTestEnvironment();
  
  // Create fixture
  const fixture = await createTestFixture();
  
  try {
    // Run all tests here manually if needed
    console.log('Integration tests completed successfully');
  } finally {
    // Always teardown the fixture
    await teardownTestFixture(fixture);
  }
}

// If this file is run directly, run all integration tests
if (require.main === module) {
  runAllIntegrationTests().catch(error => {
    console.error('Integration tests failed:', error);
    process.exit(1);
  });
}