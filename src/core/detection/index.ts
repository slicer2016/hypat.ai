/**
 * Newsletter Detection Module
 * Main entry point for the newsletter detection system
 */

// Export interfaces
export * from './interfaces.js';

// Export analyzers
export { HeaderAnalyzer } from './analyzers/header-analyzer.js';
export { ContentStructureAnalyzer } from './analyzers/content-structure-analyzer.js';
export { SenderReputationTracker } from './analyzers/sender-reputation-tracker.js';

// Export utilities
export { DetectionConfidenceCalculator } from './utils/detection-confidence-calculator.js';
export { UserFeedbackIntegrator } from './utils/user-feedback-integrator.js';

// Export main implementation
export { NewsletterDetectorImpl } from './newsletter-detector-impl.js';

// Factory function to create a newsletter detector instance
import { NewsletterDetector } from './interfaces.js';
import { NewsletterDetectorImpl } from './newsletter-detector-impl.js';

/**
 * Create a new instance of the newsletter detector
 * @returns A configured newsletter detector
 */
export function createNewsletterDetector(): NewsletterDetector {
  return new NewsletterDetectorImpl();
}