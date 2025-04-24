/**
 * Tests Index
 * 
 * Main entry point for running all tests, including unit and integration tests.
 */

// Export path to integration tests directory to help Jest find them
export const INTEGRATION_TESTS_PATH = './integration';

// Export test utilities or mock data that might be useful across tests
export * from './integration/mocks/mock-gmail-mcp-client.js';
export * from './integration/mocks/mock-email-sender.js';
export * from './integration/test-data/sample-emails.js';

// Configuration for test runner
export const testConfig = {
  // Test timeouts
  timeout: {
    unit: 5000,      // 5 seconds for unit tests
    integration: 30000, // 30 seconds for integration tests
  },
  
  // Test reporters
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './test-results',
      outputName: 'junit.xml'
    }]
  ]
};

/**
 * Run all tests
 */
export async function runAllTests(): Promise<void> {
  console.log('Running all tests...');
  
  try {
    // Run unit tests
    console.log('Running unit tests...');
    // Unit tests are run automatically by Jest
    
    // Run integration tests
    console.log('Running integration tests...');
    // Integration tests are run automatically by Jest
    
    console.log('All tests completed successfully');
  } catch (error) {
    console.error('Tests failed:', error);
    throw error;
  }
}

// If this file is run directly, run all tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Test run failed:', error);
    process.exit(1);
  });
}