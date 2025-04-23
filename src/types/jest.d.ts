/**
 * Type declarations for Jest globals
 */

// Declare the Jest globals outside of any module
declare global {
  namespace jest {
    interface Matchers<R> {
      // Add any custom matchers here
    }
  }
}