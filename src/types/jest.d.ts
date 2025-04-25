/**
 * Type declarations for Jest globals
 */

import { DatabaseManager, RepositoryFactory } from '../data/interfaces.js';

// Declare the Jest globals outside of any module
declare global {
  var testDatabaseManager: DatabaseManager | null;
  var testRepositoryFactory: RepositoryFactory | null;
  var testEnvironment: boolean;
  
  namespace jest {
    interface Matchers<R> {
      // Add any custom matchers here
    }
  }
}