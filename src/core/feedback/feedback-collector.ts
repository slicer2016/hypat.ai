/**
 * Feedback Collector Implementation
 * Collects and processes user feedback on newsletter detection
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  FeedbackCollector, 
  FeedbackItem, 
  FeedbackPriority, 
  FeedbackType, 
  FeedbackRepository, 
  VerificationRequest,
  VerificationStatus,
  UserFeedback
} from './interfaces.js';
import { Logger } from '../../utils/logger.js';

/**
 * Implementation of the FeedbackCollector interface
 */
// This class doesn't exactly match the interface due to TypeScript limitations with UserFeedback vs FeedbackItem
// We work around it with type assertions
export class FeedbackCollectorImpl implements FeedbackCollector {
  private logger: Logger;
  private repository: FeedbackRepository;
  
  constructor(repository: FeedbackRepository) {
    this.logger = new Logger('FeedbackCollector');
    this.repository = repository;
  }

  /**
   * Collect feedback from a user on a specific email
   * @param userId The ID of the user
   * @param emailId The ID of the email
   * @param feedbackType The type of feedback
   * @param comment Optional comment from the user
   */
  async collectFeedback(
    userId: string, 
    emailId: string, 
    feedbackType: FeedbackType, 
    comment?: string
  ): Promise<UserFeedback> {
    try {
      this.logger.info(`Collecting ${feedbackType} feedback from user ${userId} for email ${emailId}`);
      
      // Get email details (in a real implementation, this would fetch from the email repository)
      const emailDetails = await this.getEmailDetails(emailId);
      
      // Determine the priority of this feedback
      const priority = this.determineFeedbackPriority(feedbackType, emailDetails.detectionConfidence);
      
      // Create the feedback record
      const feedback = {
        id: uuidv4(),
        userId,
        emailId,
        messageId: emailDetails.messageId,
        sender: emailDetails.sender,
        senderDomain: this.extractDomain(emailDetails.sender),
        subject: emailDetails.subject,
        type: feedbackType,
        priority,
        detectionResult: emailDetails.wasDetectedAsNewsletter,
        comment,
        timestamp: new Date(),
        processed: false,
        confidence: emailDetails.detectionConfidence,
        features: emailDetails.detectionFeatures
      };
      
      // Store the feedback
      const savedFeedback = await this.repository.saveFeedback(feedback);
      
      // Check for pending verification requests for this email
      const pendingRequests = await this.repository.getPendingVerificationRequests(userId);
      const matchingRequest = pendingRequests.find(req => req.emailId === emailId);
      
      if (matchingRequest) {
        // Update the verification request based on the feedback
        await this.repository.updateVerificationRequestStatus(
          matchingRequest.id, 
          VerificationStatus.CONFIRMED, 
          feedbackType
        );
        
        this.logger.info(`Updated verification request ${matchingRequest.id} based on feedback`);
      }
      
      this.logger.info(`Successfully collected feedback (ID: ${feedback.id}) from user ${userId}`);
      return savedFeedback;
    } catch (error) {
      this.logger.error(`Error collecting feedback: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to collect feedback: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Process verification response
   * @param verificationToken The verification token
   * @param response The user's response
   */
  async processVerificationResponse(
    verificationToken: string, 
    response: FeedbackType,
    comment?: string
  ): Promise<VerificationRequest> {
    try {
      this.logger.info(`Processing verification response for token ${verificationToken}`);
      
      // Get the verification request
      const request = await this.repository.getVerificationRequestByToken(verificationToken);
      if (!request) {
        throw new Error(`Verification request not found for token: ${verificationToken}`);
      }
      
      // Check if the request has expired
      if (request.status === VerificationStatus.EXPIRED) {
        this.logger.warn(`Verification request ${request.id} has expired`);
        throw new Error('Verification request has expired');
      }
      
      // Check if the request has already been processed
      if (request.status !== VerificationStatus.PENDING) {
        this.logger.warn(`Verification request ${request.id} has already been processed`);
        return request;
      }
      
      // Update the request with the user's response
      const updatedRequest = await this.repository.updateVerificationRequestStatus(
        request.id, 
        VerificationStatus.CONFIRMED, 
        response
      );
      
      // Create a feedback record based on the verification response
      await this.collectFeedback(
        request.userId, 
        request.emailId, 
        response, 
        comment || 'Verification response'
      );
      
      this.logger.info(`Successfully processed verification response for request ${request.id}`);
      return updatedRequest;
    } catch (error) {
      this.logger.error(`Error processing verification response: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to process verification response: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get pending verification requests for a user
   * @param userId The ID of the user
   */
  async getPendingVerifications(userId: string): Promise<VerificationRequest[]> {
    try {
      this.logger.info(`Getting pending verification requests for user ${userId}`);
      
      const pendingRequests = await this.repository.getPendingVerificationRequests(userId);
      
      this.logger.info(`Found ${pendingRequests.length} pending verification requests for user ${userId}`);
      return pendingRequests;
    } catch (error) {
      this.logger.error(`Error getting pending verifications: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to get pending verifications: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Cancel a verification request
   * @param requestId The ID of the verification request
   */
  async cancelVerification(requestId: string): Promise<boolean> {
    try {
      this.logger.info(`Canceling verification request ${requestId}`);
      
      // Update the request status to canceled
      const updatedRequest = await this.repository.updateVerificationRequestStatus(
        requestId, 
        VerificationStatus.CANCELED
      );
      
      this.logger.info(`Successfully canceled verification request ${requestId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error canceling verification: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Determine the priority of feedback based on type and detection confidence
   * @param type The feedback type
   * @param confidence The detection confidence
   */
  private determineFeedbackPriority(type: FeedbackType, confidence: number): FeedbackPriority {
    // Feedback that contradicts high-confidence detection should be high priority
    if ((type === FeedbackType.REJECT && confidence > 0.8) || 
        (type === FeedbackType.CONFIRM && confidence < 0.2)) {
      return FeedbackPriority.HIGH;
    }
    
    // Feedback on borderline cases is also important
    if ((type === FeedbackType.CONFIRM || type === FeedbackType.REJECT) && 
        confidence >= 0.4 && confidence <= 0.6) {
      return FeedbackPriority.MEDIUM;
    }
    
    // Verification feedback is medium priority
    if (type === FeedbackType.VERIFY) {
      return FeedbackPriority.MEDIUM;
    }
    
    // Uncertain feedback is low priority
    if (type === FeedbackType.UNCERTAIN) {
      return FeedbackPriority.LOW;
    }
    
    // Ignore feedback is low priority
    if (type === FeedbackType.IGNORE) {
      return FeedbackPriority.LOW;
    }
    
    // Default to medium priority
    return FeedbackPriority.MEDIUM;
  }

  /**
   * Extract domain from an email address
   * @param email The email address
   */
  private extractDomain(email: string): string {
    const match = email.match(/@([^@]+)$/);
    return match ? match[1].toLowerCase() : '';
  }

  /**
   * Get email details (in a real implementation, this would fetch from the email repository)
   * @param emailId The ID of the email
   */
  private async getEmailDetails(emailId: string): Promise<{
    messageId: string;
    sender: string;
    subject: string;
    wasDetectedAsNewsletter: boolean;
    detectionConfidence: number;
    detectionFeatures: Record<string, number>;
  }> {
    // This is a mock implementation that would normally fetch from a database
    // For testing purposes, we'll generate some random data
    const sender = `sender-${Math.floor(Math.random() * 10)}@example.com`;
    const confidence = Math.random();
    
    return {
      messageId: `<${uuidv4()}@example.com>`,
      sender,
      subject: `Test Email ${emailId}`,
      wasDetectedAsNewsletter: confidence > 0.5,
      detectionConfidence: confidence,
      detectionFeatures: {
        senderReputation: Math.random(),
        formatScore: Math.random(),
        contentScore: Math.random(),
        headerScore: Math.random(),
        linkCount: Math.floor(Math.random() * 20)
      }
    };
  }
}