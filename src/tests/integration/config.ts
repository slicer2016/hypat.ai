/**
 * Integration Test Configuration
 * 
 * This file contains configuration for integration tests, including:
 * - Database configuration (in-memory SQLite)
 * - Test email services
 * - Logging settings
 * - Feature toggles for testing
 */

import { DataAccessConfig } from '../../data/index.js';
import { DateTime } from 'luxon';

/**
 * Integration test configuration settings
 */
export const integrationTestConfig = {
  // Database configuration for tests
  database: {
    // Use in-memory SQLite for tests
    type: 'sqlite' as const,
    filename: ':memory:',
    debug: false,
    migrate: true,
    // Limit pool to prevent test resource issues
    poolMin: 1,
    poolMax: 5
  },
  
  // Cache configuration for tests
  cache: {
    defaultTtl: 60, // 1 minute TTL for tests
    maxSize: 100 // Limit cache size for tests
  },
  
  // Email configuration for tests
  email: {
    // Don't actually send emails during tests
    transport: 'mock',
    // Store emails for verification
    captureEmails: true,
    // Default recipient for test emails
    defaultRecipient: 'test@example.com',
    // Simulated email address to use as sender
    senderAddress: 'hypat-test@example.com',
    senderName: 'Hypat.ai Test'
  },
  
  // Test acceleration settings
  acceleration: {
    // Disable timeouts in tests
    disableTimeouts: true,
    // Speed up scheduled tasks
    cronAccelerationFactor: 10,
    // Mock current date for predictable testing
    mockCurrentDate: DateTime.fromISO('2023-05-15T12:00:00Z').toJSDate()
  },
  
  // Logging settings for tests
  logging: {
    // Minimal logging during tests unless explicitly enabled
    level: process.env.TEST_LOG_LEVEL || 'error',
    // Disable file logging during tests
    disableFileLogging: true
  },
  
  // Feature toggles for tests
  features: {
    // Enable mock Gmail MCP client
    useMockGmailClient: true,
    // Enable deterministic ID generation
    deterministicIds: true,
    // Disable heavy processing during tests
    disableHeavyProcessing: true
  }
};

/**
 * Get data access configuration for integration tests
 */
export function getTestDataAccessConfig(): DataAccessConfig {
  return {
    database: integrationTestConfig.database,
    cache: integrationTestConfig.cache
  };
}