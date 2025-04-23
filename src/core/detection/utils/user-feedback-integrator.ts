/**
 * UserFeedbackIntegrator
 * Integrates user feedback to improve newsletter detection
 */

import { Email } from '../../../interfaces/gmail-mcp.js';
import { 
  DetectionMethodType, 
  DetectionScore, 
  UserFeedback, 
  FeedbackInput,
  UserFeedbackIntegrator as IUserFeedbackIntegrator 
} from '../interfaces.js';
import { Logger } from '../../../utils/logger.js';

// Simple in-memory storage for user feedback
// In a real implementation, this would be stored in a database
interface UserFeedbackStore {
  [userId: string]: UserFeedback;
}

interface FeedbackHistory {
  [emailId: string]: FeedbackInput;
}

export class UserFeedbackIntegrator implements IUserFeedbackIntegrator {
  readonly type = DetectionMethodType.USER_FEEDBACK;
  private readonly weight = 0.1; // 10% weight in the overall detection
  private logger: Logger;
  
  // In-memory storage for user feedback
  private userFeedbackStore: UserFeedbackStore = {};
  private feedbackHistory: FeedbackHistory = {};

  constructor() {
    this.logger = new Logger('UserFeedbackIntegrator');
  }

  /**
   * Apply user feedback to detection process
   * @param feedback User feedback to incorporate
   * @param email The email to analyze
   * @returns A detection score influenced by user feedback
   */
  async applyFeedback(feedback: UserFeedback, email: Email): Promise<DetectionScore> {
    try {
      if (!email.payload?.headers) {
        return {
          method: this.type,
          score: 0.5, // Neutral score
          confidence: 0.1, // Low confidence
          reason: 'No email headers found'
        };
      }
      
      // Extract sender from headers
      const fromHeader = email.payload.headers.find((h: { name?: string; value?: string }) => 
        h.name?.toLowerCase() === 'from'
      );
      
      if (!fromHeader?.value) {
        return {
          method: this.type,
          score: 0.5, // Neutral score
          confidence: 0.1, // Low confidence
          reason: 'No sender information found'
        };
      }
      
      // Parse the sender email address
      const sender = this.extractEmailAddress(fromHeader.value);
      if (!sender) {
        return {
          method: this.type,
          score: 0.5,
          confidence: 0.1,
          reason: 'Could not parse sender email'
        };
      }
      
      // Extract domain
      const domain = this.extractDomain(sender);
      
      // Check if sender is in confirmed or rejected newsletters
      if (feedback.confirmedNewsletters.has(sender)) {
        return {
          method: this.type,
          score: 1.0, // Definitely a newsletter
          confidence: 1.0, // High confidence from direct user feedback
          reason: 'Sender explicitly confirmed as newsletter by user',
          metadata: { feedbackType: 'confirmed_sender' }
        };
      }
      
      if (feedback.rejectedNewsletters.has(sender)) {
        return {
          method: this.type,
          score: 0.0, // Definitely not a newsletter
          confidence: 1.0, // High confidence from direct user feedback
          reason: 'Sender explicitly rejected as newsletter by user',
          metadata: { feedbackType: 'rejected_sender' }
        };
      }
      
      // Check domain-level feedback
      if (feedback.trustedDomains.has(domain)) {
        return {
          method: this.type,
          score: 0.9, // Very likely a newsletter
          confidence: 0.9, // Good confidence
          reason: 'Sender domain trusted for newsletters by user',
          metadata: { feedbackType: 'trusted_domain' }
        };
      }
      
      if (feedback.blockedDomains.has(domain)) {
        return {
          method: this.type,
          score: 0.1, // Very unlikely to be a newsletter
          confidence: 0.9, // Good confidence
          reason: 'Sender domain blocked for newsletters by user',
          metadata: { feedbackType: 'blocked_domain' }
        };
      }
      
      // No specific feedback for this sender
      return {
        method: this.type,
        score: 0.5, // Neutral score
        confidence: 0.1, // Low confidence
        reason: 'No specific user feedback for this sender',
        metadata: { feedbackType: 'no_feedback' }
      };
    } catch (error) {
      this.logger.error(`Error applying user feedback: ${error instanceof Error ? error.message : String(error)}`);
      return {
        method: this.type,
        score: 0.5, // Neutral score
        confidence: 0.1, // Low confidence
        reason: `Error applying user feedback: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Track user feedback for future reference
   * @param feedbackInput Feedback provided by the user
   */
  async trackFeedback(feedbackInput: FeedbackInput): Promise<void> {
    try {
      const { emailId, isNewsletter, userId, source } = feedbackInput;
      
      // Store the feedback history
      this.feedbackHistory[emailId] = {
        ...feedbackInput,
        timestamp: feedbackInput.timestamp || new Date()
      };
      
      // Get email details to extract sender
      const email = await this.getEmailById(emailId);
      if (!email || !email.payload?.headers) {
        this.logger.warn(`Cannot process feedback: Email ${emailId} not found or missing headers`);
        return;
      }
      
      // Extract sender from headers
      const fromHeader = email.payload.headers.find((h: { name?: string; value?: string }) => 
        h.name?.toLowerCase() === 'from'
      );
      
      if (!fromHeader?.value) {
        this.logger.warn(`Cannot process feedback: Email ${emailId} has no sender information`);
        return;
      }
      
      // Parse the sender email address
      const sender = this.extractEmailAddress(fromHeader.value);
      if (!sender) {
        this.logger.warn(`Cannot process feedback: Could not parse sender email for ${emailId}`);
        return;
      }
      
      // Extract domain
      const domain = this.extractDomain(sender);
      
      // Initialize user feedback if not exists
      if (!this.userFeedbackStore[userId]) {
        this.userFeedbackStore[userId] = {
          confirmedNewsletters: new Set(),
          rejectedNewsletters: new Set(),
          trustedDomains: new Set(),
          blockedDomains: new Set()
        };
      }
      
      const userFeedback = this.userFeedbackStore[userId];
      
      // Update the appropriate sets based on the feedback
      if (isNewsletter) {
        userFeedback.confirmedNewsletters.add(sender);
        userFeedback.rejectedNewsletters.delete(sender); // Remove from rejected if it was there
        
        // If multiple confirms from same domain, add to trusted domains
        const confirmedFromDomain = Array.from(userFeedback.confirmedNewsletters)
          .filter(s => this.extractDomain(s) === domain);
        
        if (confirmedFromDomain.length >= 3) {
          userFeedback.trustedDomains.add(domain);
        }
      } else {
        userFeedback.rejectedNewsletters.add(sender);
        userFeedback.confirmedNewsletters.delete(sender); // Remove from confirmed if it was there
        
        // If multiple rejects from same domain, add to blocked domains
        const rejectedFromDomain = Array.from(userFeedback.rejectedNewsletters)
          .filter(s => this.extractDomain(s) === domain);
        
        if (rejectedFromDomain.length >= 3) {
          userFeedback.blockedDomains.add(domain);
        }
      }
      
      this.logger.info(`User feedback tracked for email ${emailId}, sender ${sender}, isNewsletter=${isNewsletter}`);
    } catch (error) {
      this.logger.error(`Error tracking user feedback: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get user feedback for a specific user
   * @param userId The user ID to get feedback for
   * @returns The user's feedback data
   */
  async getUserFeedback(userId: string): Promise<UserFeedback> {
    if (!this.userFeedbackStore[userId]) {
      // Return empty feedback if none exists
      return {
        confirmedNewsletters: new Set(),
        rejectedNewsletters: new Set(),
        trustedDomains: new Set(),
        blockedDomains: new Set()
      };
    }
    
    return this.userFeedbackStore[userId];
  }

  /**
   * Analyze an email using user feedback
   * @param email The email to analyze
   * @returns A detection score based on user feedback
   */
  async analyze(email: Email): Promise<DetectionScore> {
    // In a real implementation, we would determine the user from the context
    // For this implementation, we use a default user ID
    const userId = 'default_user';
    
    // Get user feedback
    const userFeedback = await this.getUserFeedback(userId);
    
    // Apply the feedback to this email
    return this.applyFeedback(userFeedback, email);
  }

  /**
   * Get the weight of this detection method
   * @returns The weight value (0.0 to 1.0)
   */
  getWeight(): number {
    return this.weight;
  }
  
  /**
   * Extract email address from a From header value
   * @param from The From header value
   * @returns The extracted email address
   */
  private extractEmailAddress(from: string): string {
    // Try to extract email address from "Name <email@domain.com>" format
    const emailMatch = from.match(/<([^>]+)>/) || [null, from];
    return (emailMatch[1] || '').toLowerCase();
  }
  
  /**
   * Extract domain from an email address
   * @param email The email address
   * @returns The domain portion
   */
  private extractDomain(email: string): string {
    const parts = email.split('@');
    return parts.length > 1 ? parts[1].toLowerCase() : '';
  }
  
  /**
   * Get an email by ID
   * This is a stub implementation - in a real system, this would retrieve the email from the Gmail API
   * @param emailId The email ID to retrieve
   * @returns The email object
   */
  private async getEmailById(emailId: string): Promise<Email | null> {
    // In a real implementation, this would call the Gmail API
    // For now, we return a simplified mock
    return {
      id: emailId,
      payload: {
        headers: [
          { name: 'From', value: 'newsletter@example.com' }
        ]
      }
    };
  }
}