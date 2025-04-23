/**
 * User Feedback Module
 * Main entry point for the User Feedback Module
 */

// Export all interfaces and types
export * from './interfaces.js';

// Export implementations
export { FeedbackCollectorImpl } from './feedback-collector.js';
export { VerificationRequestGeneratorImpl } from './verification-request-generator.js';
export { FeedbackAnalyzerImpl } from './feedback-analyzer.js';
export { DetectionImproverImpl } from './detection-improver.js';
export { FeedbackRepositoryImpl } from './feedback-repository.js';
export { FeedbackServiceImpl } from './feedback-service.js';

// Factory function to create and wire up all feedback components
import { NewsletterDetector } from '../detection/interfaces.js'; // This would be imported from the actual module
import { FeedbackCollectorImpl } from './feedback-collector.js';
import { VerificationRequestGeneratorImpl } from './verification-request-generator.js';
import { FeedbackAnalyzerImpl } from './feedback-analyzer.js';
import { DetectionImproverImpl } from './detection-improver.js';
import { FeedbackRepositoryImpl } from './feedback-repository.js';
import { FeedbackServiceImpl } from './feedback-service.js';

/**
 * Create the newsletter detector (mock implementation)
 * This would be replaced with the actual newsletter detector in production
 */
function createMockNewsletterDetector(): any {
  return {
    updateSenderReputation: async (sender: string, isNewsletter: boolean, weight: number) => {
      // Mock implementation
    },
    updateDomainReputation: async (domain: string, isNewsletter: boolean, weight: number) => {
      // Mock implementation
    },
    updateFeatureWeights: async (featureUpdates: Record<string, number>) => {
      // Mock implementation
    },
    trainPersonalizedModelForUser: async (userId: string, trainingData: any[]) => {
      // Mock implementation
      return true;
    }
  };
}

/**
 * Create and wire up all feedback components
 * @param newsletterDetector The newsletter detector to use (optional)
 * @param config Configuration options
 */
export function createFeedbackService(
  newsletterDetector?: any,
  config?: {
    verificationExpiryDays?: number;
    maxResendCount?: number;
    verificationBaseUrl?: string;
  }
) {
  // Create the repository
  const repository = new FeedbackRepositoryImpl();
  
  // Create the feedback collector
  const feedbackCollector = new FeedbackCollectorImpl(repository);
  
  // Create the verification request generator
  const verificationGenerator = new VerificationRequestGeneratorImpl(repository, {
    verificationExpiryDays: config?.verificationExpiryDays,
    maxResendCount: config?.maxResendCount,
    baseUrl: config?.verificationBaseUrl
  });
  
  // Create the feedback analyzer
  const feedbackAnalyzer = new FeedbackAnalyzerImpl(repository);
  
  // Create or use the newsletter detector
  const detector = newsletterDetector || createMockNewsletterDetector();
  
  // Create the detection improver
  const detectionImprover = new DetectionImproverImpl(repository, detector);
  
  // Create the feedback service
  const feedbackService = new FeedbackServiceImpl(
    feedbackCollector,
    verificationGenerator,
    feedbackAnalyzer,
    detectionImprover
  );
  
  return {
    feedbackCollector,
    verificationGenerator,
    feedbackAnalyzer,
    detectionImprover,
    repository,
    feedbackService
  };
}