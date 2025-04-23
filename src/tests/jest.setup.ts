/**
 * Jest setup file
 */

// Global declarations for Jest
declare global {
  // Jest test functions
  const describe: (name: string, fn: () => void) => void;
  const beforeEach: (fn: () => void) => void;
  const test: (name: string, fn: () => Promise<void> | void) => void;
  const expect: any;
}

export {};