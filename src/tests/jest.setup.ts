/**
 * Jest setup file for all tests
 */

import { DateTime } from 'luxon';

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

console.log('Jest setup complete - UUID and Date mocks configured');