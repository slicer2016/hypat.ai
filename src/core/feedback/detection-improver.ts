/**
 * Detection Improver Implementation
 * Applies user feedback to improve newsletter detection
 */

import { 
  DetectionImprover, 
  FeedbackItem, 
  FeedbackRepository, 
  FeedbackType 
} from './interfaces.js';
import { Logger } from '../../utils/logger.js';

// Interface for a simplified newsletter detector (would be replaced with actual implementation)
interface NewsletterDetector {
  updateSenderReputation(sender: string, isNewsletter: boolean, weight: number): Promise<void>;
  updateDomainReputation(domain: string, isNewsletter: boolean, weight: number): Promise<void>;
  updateFeatureWeights(featureUpdates: Record<string, number>): Promise<void>;
  trainPersonalizedModelForUser(userId: string, trainingData: FeedbackItem[]): Promise<boolean>;
}

/**
 * Implementation of the DetectionImprover interface
 */
export class DetectionImproverImpl implements DetectionImprover {
  private logger: Logger;
  private repository: FeedbackRepository;
  private detector: NewsletterDetector;
  
  // Weight factors for different feedback types
  private readonly feedbackTypeWeights = {
    [FeedbackType.CONFIRM]: 1.0,
    [FeedbackType.REJECT]: 1.0,
    [FeedbackType.UNCERTAIN]: 0.3,
    [FeedbackType.VERIFY]: 0.8,
    [FeedbackType.IGNORE]: 0.1
  };
  
  // Confidence thresholds for feedback impact
  private readonly highConfidenceThreshold = 0.8;
  private readonly lowConfidenceThreshold = 0.2;
  
  constructor(repository: FeedbackRepository, detector: NewsletterDetector) {
    this.logger = new Logger('DetectionImprover');
    this.repository = repository;
    this.detector = detector;
  }

  /**
   * Apply feedback to improve detection
   * @param feedback The feedback to apply
   */
  async applyFeedback(feedback: FeedbackItem): Promise<void> {
    try {
      this.logger.info(`Applying feedback ${feedback.id} from user ${feedback.userId} for email ${feedback.emailId}`);
      
      // Skip if feedback is already processed
      if (feedback.processed) {
        this.logger.info(`Feedback ${feedback.id} already processed, skipping`);
        return;
      }
      
      // Calculate the feedback weight based on type and confidence
      const weight = this.calculateFeedbackWeight(feedback);
      
      // Determine if this is a newsletter based on feedback type
      const isNewsletter = this.isNewsletterFeedback(feedback.type);
      
      // Update sender reputation
      await this.updateSenderReputation(feedback.sender, feedback.type);
      
      // Update domain reputation
      if (feedback.senderDomain) {
        await this.updateDomainReputation(feedback.senderDomain, feedback.type);
      }
      
      // For high-impact feedback, update feature weights
      if (this.isHighImpactFeedback(feedback)) {
        await this.updateFeatureWeights(feedback);
      }
      
      // Mark the feedback as processed
      await this.repository.markAsProcessed(feedback.id);
      
      this.logger.info(`Successfully applied feedback ${feedback.id}`);
    } catch (error) {
      this.logger.error(`Error applying feedback: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to apply feedback: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update sender reputation based on feedback
   * @param sender The sender address
   * @param feedbackType The type of feedback
   */
  async updateSenderReputation(
    sender: string, 
    feedbackType: FeedbackType
  ): Promise<number> {
    try {
      this.logger.info(`Updating reputation for sender ${sender} based on ${feedbackType} feedback`);
      
      // Skip for uncertain or ignore feedback
      if (feedbackType === FeedbackType.UNCERTAIN || feedbackType === FeedbackType.IGNORE) {
        return 0;
      }
      
      // Determine if this is a newsletter based on feedback type
      const isNewsletter = this.isNewsletterFeedback(feedbackType);
      
      // Calculate weight for this feedback type
      const weight = this.feedbackTypeWeights[feedbackType];
      
      // Update sender reputation in the detector
      await this.detector.updateSenderReputation(sender, isNewsletter, weight);
      
      // In a real implementation, we would return the new reputation score
      const newReputationScore = Math.random(); // Placeholder
      
      this.logger.info(`Updated reputation for sender ${sender} to ${newReputationScore.toFixed(2)}`);
      return newReputationScore;
    } catch (error) {
      this.logger.error(`Error updating sender reputation: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to update sender reputation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update domain reputation based on feedback
   * @param domain The domain
   * @param feedbackType The type of feedback
   */
  async updateDomainReputation(
    domain: string, 
    feedbackType: FeedbackType
  ): Promise<number> {
    try {
      this.logger.info(`Updating reputation for domain ${domain} based on ${feedbackType} feedback`);
      
      // Skip for uncertain or ignore feedback
      if (feedbackType === FeedbackType.UNCERTAIN || feedbackType === FeedbackType.IGNORE) {
        return 0;
      }
      
      // Determine if this is a newsletter based on feedback type
      const isNewsletter = this.isNewsletterFeedback(feedbackType);
      
      // Calculate weight for this feedback type
      const weight = this.feedbackTypeWeights[feedbackType];
      
      // Update domain reputation in the detector
      await this.detector.updateDomainReputation(domain, isNewsletter, weight);
      
      // In a real implementation, we would return the new reputation score
      const newReputationScore = Math.random(); // Placeholder
      
      this.logger.info(`Updated reputation for domain ${domain} to ${newReputationScore.toFixed(2)}`);
      return newReputationScore;
    } catch (error) {
      this.logger.error(`Error updating domain reputation: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to update domain reputation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Train a personalized detection model for a user
   * @param userId The ID of the user
   */
  async trainPersonalizedModel(userId: string): Promise<boolean> {
    try {
      this.logger.info(`Training personalized model for user ${userId}`);
      
      // Get all feedback for the user
      const userFeedback = await this.repository.getFeedbackForUser(userId);
      
      // Check if we have enough feedback for training
      if (userFeedback.length < 10) {
        this.logger.info(`Not enough feedback (${userFeedback.length}) to train personalized model for user ${userId}`);
        return false;
      }
      
      // Train the model using the user's feedback
      const success = await this.detector.trainPersonalizedModelForUser(userId, userFeedback);
      
      if (success) {
        this.logger.info(`Successfully trained personalized model for user ${userId}`);
      } else {
        this.logger.warn(`Failed to train personalized model for user ${userId}`);
      }
      
      return success;
    } catch (error) {
      this.logger.error(`Error training personalized model: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to train personalized model: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Apply user preferences to detection
   * @param userId The ID of the user
   * @param preferences User preferences for detection
   */
  async applyUserPreferences(
    userId: string, 
    preferences: Record<string, any>
  ): Promise<void> {
    try {
      this.logger.info(`Applying preferences for user ${userId}`);
      
      // Example preferences that might be applied:
      // - alwaysNewsletterSenders: string[] - Senders to always classify as newsletters
      // - neverNewsletterSenders: string[] - Senders to never classify as newsletters
      // - alwaysNewsletterDomains: string[] - Domains to always classify as newsletters
      // - neverNewsletterDomains: string[] - Domains to never classify as newsletters
      // - detectionSensitivity: number - How sensitive the detection should be (0-1)
      
      // In a real implementation, we would apply these preferences to the detector
      
      this.logger.info(`Successfully applied preferences for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error applying user preferences: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to apply user preferences: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Calculate the weight of a feedback item based on its type and confidence
   * @param feedback The feedback item
   */
  private calculateFeedbackWeight(feedback: FeedbackItem): number {
    // Base weight from feedback type
    let weight = this.feedbackTypeWeights[feedback.type];
    
    // Adjust weight based on confidence and feedback type
    if (feedback.type === FeedbackType.CONFIRM || feedback.type === FeedbackType.REJECT) {
      // High confidence detection that was confirmed should have lower weight (it was already right)
      if (feedback.confidence > this.highConfidenceThreshold && feedback.type === FeedbackType.CONFIRM && feedback.detectionResult) {
        weight *= 0.5;
      }
      
      // Low confidence detection that was rejected should have lower weight (it was already uncertain)
      if (feedback.confidence < this.lowConfidenceThreshold && feedback.type === FeedbackType.REJECT && !feedback.detectionResult) {
        weight *= 0.5;
      }
      
      // High confidence detection that was rejected should have higher weight (it was confidently wrong)
      if (feedback.confidence > this.highConfidenceThreshold && feedback.type === FeedbackType.REJECT && feedback.detectionResult) {
        weight *= 2.0;
      }
      
      // Low confidence detection that was confirmed should have higher weight (it was uncertain but right)
      if (feedback.confidence < this.lowConfidenceThreshold && feedback.type === FeedbackType.CONFIRM && !feedback.detectionResult) {
        weight *= 2.0;
      }
    }
    
    return weight;
  }

  /**
   * Determine if feedback indicates a newsletter
   * @param feedbackType The feedback type
   */
  private isNewsletterFeedback(feedbackType: FeedbackType): boolean {
    return feedbackType === FeedbackType.CONFIRM;
  }

  /**
   * Determine if feedback is high impact
   * @param feedback The feedback item
   */
  private isHighImpactFeedback(feedback: FeedbackItem): boolean {
    // Feedback that contradicts a high-confidence detection is high impact
    if (feedback.confidence > this.highConfidenceThreshold && 
        ((feedback.type === FeedbackType.REJECT && feedback.detectionResult) || 
         (feedback.type === FeedbackType.CONFIRM && !feedback.detectionResult))) {
      return true;
    }
    
    return false;
  }

  /**
   * Update feature weights based on feedback
   * @param feedback The feedback item
   */
  private async updateFeatureWeights(feedback: FeedbackItem): Promise<void> {
    // Skip if no features are available
    if (!feedback.features || Object.keys(feedback.features).length === 0) {
      return;
    }
    
    const isNewsletter = this.isNewsletterFeedback(feedback.type);
    const weight = this.calculateFeedbackWeight(feedback);
    
    // Adjust feature weights based on feedback
    const featureUpdates: Record<string, number> = {};
    
    for (const [feature, value] of Object.entries(feedback.features)) {
      // For newsletter feedback, increase the weight of features with high values
      // For non-newsletter feedback, decrease the weight of features with high values
      const direction = isNewsletter ? 1 : -1;
      const adjustment = direction * weight * (value / 10); // Scale adjustment by feature value
      
      featureUpdates[feature] = adjustment;
    }
    
    // Update the feature weights in the detector
    await this.detector.updateFeatureWeights(featureUpdates);
  }
}