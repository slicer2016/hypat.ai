/**
 * Feedback Service Implementation
 * Orchestrates all feedback components to collect and process user feedback
 */

import { 
  DetectionImprover, 
  FeedbackAnalyzer, 
  FeedbackCollector, 
  FeedbackService, 
  FeedbackType, 
  VerificationRequestGenerator,
  UserFeedback,
  FeedbackItem,
  VerificationRequest
} from './interfaces.js';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../../utils/logger.js';

/**
 * Implementation of the FeedbackService interface
 */
export class FeedbackServiceImpl implements FeedbackService {
  private logger: Logger;
  private feedbackCollector: FeedbackCollector;
  private verificationGenerator: VerificationRequestGenerator;
  private feedbackAnalyzer: FeedbackAnalyzer;
  private detectionImprover: DetectionImprover;
  
  // Cache for email details (would be replaced by database or API in production)
  private emailDetailsCache: Map<string, { messageId: string; sender: string; subject: string }> = new Map();
  
  constructor(
    feedbackCollector: FeedbackCollector,
    verificationGenerator: VerificationRequestGenerator,
    feedbackAnalyzer: FeedbackAnalyzer,
    detectionImprover: DetectionImprover
  ) {
    this.logger = new Logger('FeedbackService');
    this.feedbackCollector = feedbackCollector;
    this.verificationGenerator = verificationGenerator;
    this.feedbackAnalyzer = feedbackAnalyzer;
    this.detectionImprover = detectionImprover;
  }

  /**
   * Get the verification request generator
   * Required for tests
   */
  getVerificationRequestGenerator(): VerificationRequestGenerator {
    return this.verificationGenerator;
  }

  /**
   * Get the feedback analyzer
   * Required for tests
   */
  getFeedbackAnalyzer(): FeedbackAnalyzer {
    return this.feedbackAnalyzer;
  }

  /**
   * Get the detection improver
   * Required for tests
   */
  getDetectionImprover(): DetectionImprover {
    return this.detectionImprover;
  }

  /**
   * Submit feedback for a newsletter
   * @param feedback Feedback object with userId, newsletterId, feedbackType, and optional comment
   */
  async submitFeedback(feedback: {
    userId: string,
    newsletterId: string,
    feedbackType: FeedbackType | 'confirm' | 'reject',
    comment?: string
  }): Promise<UserFeedback> {
    try {
      this.logger.info(`Submitting feedback for user ${feedback.userId}, newsletter ${feedback.newsletterId}: type=${feedback.feedbackType}`);
      
      // Handle string feedback types
      const feedbackType = typeof feedback.feedbackType === 'string' 
        ? (feedback.feedbackType === 'confirm' ? FeedbackType.CONFIRM : FeedbackType.REJECT)
        : feedback.feedbackType;
      
      // Collect the feedback
      const result = await this.feedbackCollector.collectFeedback(
        feedback.userId,
        feedback.newsletterId,
        feedbackType,
        feedback.comment
      );
      
      // Convert the UserFeedback to a FeedbackItem before applying it to improve detection
      const feedbackItem: FeedbackItem = {
        ...result,
        confidence: 0.5, // Default confidence
        features: {},    // Default empty features
      };
      
      await this.detectionImprover.applyFeedback(feedbackItem);
      
      this.logger.info(`Successfully submitted and processed feedback for user ${feedback.userId}, newsletter ${feedback.newsletterId}`);
      return result;
    } catch (error) {
      this.logger.error(`Error submitting feedback: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to submit feedback: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Legacy method for compatibility
   * @deprecated
   */
  async submitFeedbackLegacy(
    userId: string, 
    emailId: string, 
    isNewsletter: boolean
  ): Promise<void> {
    try {
      this.logger.info(`Submitting feedback for user ${userId}, email ${emailId}: isNewsletter=${isNewsletter}`);
      
      // Determine the feedback type based on the isNewsletter flag
      const feedbackType = isNewsletter ? FeedbackType.CONFIRM : FeedbackType.REJECT;
      
      // Collect the feedback
      const feedback = await this.feedbackCollector.collectFeedback(
        userId,
        emailId,
        feedbackType
      );
      
      // Convert the UserFeedback to a FeedbackItem before applying it to improve detection
      const feedbackItem: FeedbackItem = {
        ...feedback,
        confidence: 0.5, // Default confidence
        features: {},    // Default empty features
      };
      
      await this.detectionImprover.applyFeedback(feedbackItem);
      
      this.logger.info(`Successfully submitted and processed feedback for user ${userId}, email ${emailId}`);
    } catch (error) {
      this.logger.error(`Error submitting feedback: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to submit feedback: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Process a verification token
   * @param token The verification token
   * @param isNewsletter Whether the user considers this a newsletter
   */
  async processVerification(
    token: string, 
    isNewsletter: boolean
  ): Promise<void> {
    try {
      this.logger.info(`Processing verification token ${token}: isNewsletter=${isNewsletter}`);
      
      // Determine the feedback type based on the isNewsletter flag
      const feedbackType = isNewsletter ? FeedbackType.CONFIRM : FeedbackType.REJECT;
      
      // Process the verification response
      await this.feedbackCollector.processVerificationResponse(token, feedbackType, "Verification response");
      
      this.logger.info(`Successfully processed verification token ${token}`);
    } catch (error) {
      this.logger.error(`Error processing verification: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to process verification: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate a verification request for an email
   * @param userId The ID of the user
   * @param emailId The ID of the email
   */
  async requestVerification(
    userId: string, 
    emailId: string
  ): Promise<void> {
    try {
      this.logger.info(`Generating verification request for user ${userId}, email ${emailId}`);
      
      // In a real implementation, we would determine the confidence from the detection result
      const confidence = 0.5; // Default confidence for demonstration
      
      // Get additional details like sender and subject
      const emailDetails = await this.getEmailDetails(emailId);
      
      // Generate the verification request
      const request = await this.verificationGenerator.generateVerificationRequest(
        userId,
        emailId,
        confidence
      );
      
      // Format the verification email
      const emailContent = await this.verificationGenerator.formatVerificationEmail(request);
      
      // In a real implementation, we would send the email here using an email sender
      // For now, we just log the info
      this.logger.info(`Verification email generated for request ${request.id}. Subject: ${emailContent.subject}`);
      
      this.logger.info(`Successfully generated verification request for user ${userId}, email ${emailId}`);
    } catch (error) {
      this.logger.error(`Error requesting verification: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to request verification: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate verification requests for newsletters with confidence below threshold
   * @param options Options for request generation
   */
  async generateVerificationRequests(options: {
    confidenceThreshold: number,
    limit: number
  }): Promise<VerificationRequest[]> {
    try {
      this.logger.info(
        `Generating verification requests for newsletters with confidence below ${options.confidenceThreshold}`
      );
      
      const requests = await this.verificationGenerator.generateVerificationRequests(options);
      
      this.logger.info(`Generated ${requests.length} verification requests`);
      return requests;
    } catch (error) {
      this.logger.error(`Error generating verification requests: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to generate verification requests: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get feedback statistics for a user
   * @param userId The ID of the user
   */
  async getFeedbackStats(userId: string): Promise<{
    totalSubmitted: number;
    confirmedNewsletters: number;
    rejectedNewsletters: number;
    pendingVerifications: number;
  }> {
    try {
      this.logger.info(`Getting feedback stats for user ${userId}`);
      
      // Get feedback analytics for the user
      const analytics = await this.feedbackAnalyzer.analyzeFeedback(userId, 'all');
      
      // Get pending verification requests for the user
      const pendingRequests = await this.feedbackCollector.getPendingVerifications(userId);
      
      // Compile the statistics
      const stats = {
        totalSubmitted: analytics.totalFeedback,
        confirmedNewsletters: analytics.confirmCount,
        rejectedNewsletters: analytics.rejectCount,
        pendingVerifications: pendingRequests.length
      };
      
      this.logger.info(`Successfully retrieved feedback stats for user ${userId}`);
      return stats;
    } catch (error) {
      this.logger.error(`Error getting feedback stats: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to get feedback stats: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Process expired verification requests
   * This method would typically be called by a scheduled job
   */
  async processExpiredRequests(): Promise<number> {
    try {
      this.logger.info('Processing expired verification requests');
      
      const processedCount = await this.verificationGenerator.processExpiredRequests();
      
      this.logger.info(`Successfully processed ${processedCount} expired verification requests`);
      return processedCount;
    } catch (error) {
      this.logger.error(`Error processing expired requests: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to process expired requests: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Train personalized detection models for users
   * This method would typically be called by a scheduled job
   */
  async trainPersonalizedModels(): Promise<number> {
    try {
      this.logger.info('Training personalized detection models');
      
      // In a real implementation, we would get a list of users with sufficient feedback
      const userIds = ['user-1', 'user-2']; // Mock user IDs for demonstration
      
      let successCount = 0;
      
      for (const userId of userIds) {
        try {
          const success = await this.detectionImprover.trainPersonalizedModel(userId);
          if (success) {
            successCount++;
          }
        } catch (error) {
          this.logger.error(`Error training model for user ${userId}: ${error instanceof Error ? error.message : String(error)}`);
          // Continue with other users
        }
      }
      
      this.logger.info(`Successfully trained ${successCount} personalized detection models`);
      return successCount;
    } catch (error) {
      this.logger.error(`Error training personalized models: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to train personalized models: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get email details (in a real implementation, this would fetch from the email repository)
   * @param emailId The ID of the email
   */
  private async getEmailDetails(emailId: string): Promise<{ messageId: string; sender: string; subject: string }> {
    // Check if we have cached details
    if (this.emailDetailsCache.has(emailId)) {
      return this.emailDetailsCache.get(emailId)!;
    }
    
    // In a real implementation, this would fetch from a database or API
    // For now, we'll create mock data
    const details = {
      messageId: `<${uuidv4()}@example.com>`,
      sender: `sender-${Math.floor(Math.random() * 10)}@example.com`,
      subject: `Test Email ${emailId}`
    };
    
    // Cache the details for future use
    this.emailDetailsCache.set(emailId, details);
    
    return details;
  }
}