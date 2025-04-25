/**
 * Jest setup file for all tests
 */

import { DateTime } from 'luxon';

// Reduce console noise in tests
const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;
const originalConsoleDebug = console.debug;

if (process.env.TEST_LOG_LEVEL === 'none') {
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
  console.warn = () => {};
}

// Mock the uuid.v4 function to return deterministic IDs for tests
jest.mock('uuid', () => {
  let counter = 1;
  return {
    v4: () => `test-id-${counter++}`
  };
});

// Set up a fixed date for all tests
const mockDate = DateTime.fromISO('2023-05-15T12:00:00Z').toJSDate();
const originalDate = global.Date;

// Override the Date constructor
global.Date = class extends originalDate {
  constructor(...args: any[]) {
    if (args.length === 0) {
      return new originalDate(mockDate);
    }
    return new originalDate(...args);
  }
} as DateConstructor;

// Also override Date.now
global.Date.now = () => mockDate.getTime();

// Set up a global afterAll to ensure we clean up any remaining connections or resources
afterAll(async () => {
  if (global.testDatabaseManager) {
    try {
      await global.testDatabaseManager.closeAll();
    } catch (e) {
      // Ignore errors during cleanup
    }
    global.testDatabaseManager = null;
  }
  
  global.testRepositoryFactory = null;
  
  // Allow time for any pending operations to complete
  await new Promise(resolve => setTimeout(resolve, 100));
});

// Globals for test fixtures
global.testDatabaseManager = null;
global.testRepositoryFactory = null;
global.testEnvironment = true;

// Log when not in CI environment
if (!process.env.CI) {
  console.log('Jest setup complete - UUID and Date mocks configured');
}