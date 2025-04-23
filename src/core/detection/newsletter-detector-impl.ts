/**
 * NewsletterDetectorImpl
 * Main implementation of the newsletter detection system
 */

import { Email } from '../../interfaces/gmail-mcp.js';
import { 
  DetectionMethodType, 
  DetectionResult, 
  DetectionScore, 
  NewsletterDetector,
  UserFeedback 
} from './interfaces.js';
import { HeaderAnalyzer } from './analyzers/header-analyzer.js';
import { ContentStructureAnalyzer } from './analyzers/content-structure-analyzer.js';
import { SenderReputationTracker } from './analyzers/sender-reputation-tracker.js';
import { DetectionConfidenceCalculator } from './utils/detection-confidence-calculator.js';
import { UserFeedbackIntegrator } from './utils/user-feedback-integrator.js';
import { Logger } from '../../utils/logger.js';

export class NewsletterDetectorImpl implements NewsletterDetector {
  private logger: Logger;
  private headerAnalyzer: HeaderAnalyzer;
  private contentAnalyzer: ContentStructureAnalyzer;
  private reputationTracker: SenderReputationTracker;
  private confidenceCalculator: DetectionConfidenceCalculator;
  private userFeedbackIntegrator: UserFeedbackIntegrator;
  
  constructor() {
    this.logger = new Logger('NewsletterDetector');
    this.headerAnalyzer = new HeaderAnalyzer();
    this.contentAnalyzer = new ContentStructureAnalyzer();
    this.reputationTracker = new SenderReputationTracker();
    this.confidenceCalculator = new DetectionConfidenceCalculator();
    this.userFeedbackIntegrator = new UserFeedbackIntegrator();
  }

  /**
   * Detect if an email is a newsletter
   * @param email The email to analyze
   * @param userFeedback Optional user feedback to incorporate
   * @returns Detection result with scores and verification status
   */
  async detectNewsletter(email: Email, userFeedback?: UserFeedback): Promise<DetectionResult> {
    try {
      this.logger.info(`Detecting newsletter for email ${email.id}`);
      
      // Gather detection scores from all methods
      const scores: DetectionScore[] = [];
      
      // Run header analysis
      const headerScore = await this.headerAnalyzer.analyze(email);
      scores.push(headerScore);
      
      // Run content structure analysis
      const contentScore = await this.contentAnalyzer.analyze(email);
      scores.push(contentScore);
      
      // Run sender reputation analysis
      const reputationScore = await this.reputationTracker.analyze(email);
      scores.push(reputationScore);
      
      // Add user feedback if available
      if (userFeedback) {
        const feedbackScore = await this.userFeedbackIntegrator.applyFeedback(userFeedback, email);
        scores.push(feedbackScore);
      } else {
        // Use default feedback analysis
        const defaultFeedbackScore = await this.userFeedbackIntegrator.analyze(email);
        scores.push(defaultFeedbackScore);
      }
      
      // Calculate combined confidence score
      const combinedScore = this.confidenceCalculator.calculateConfidence(scores);
      
      // Determine if verification is needed
      const needsVerification = this.needsVerification({
        isNewsletter: combinedScore >= 0.5,
        combinedScore,
        needsVerification: false, // This will be set correctly below
        scores,
        email
      });
      
      // High confidence feedback can override verification
      const hasFeedback = scores.some(s => 
        s.method === DetectionMethodType.USER_FEEDBACK && s.confidence > 0.9
      );
      
      const result: DetectionResult = {
        isNewsletter: combinedScore >= 0.5,
        combinedScore,
        needsVerification: needsVerification && !hasFeedback,
        scores,
        email
      };
      
      this.logger.info(`Detection result for email ${email.id}: isNewsletter=${result.isNewsletter}, score=${result.combinedScore.toFixed(2)}, needsVerification=${result.needsVerification}`);
      
      return result;
    } catch (error) {
      this.logger.error(`Error detecting newsletter: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Calculate a confidence score for an email
   * @param email The email to analyze
   * @param methods Specific detection methods to use (uses all by default)
   * @returns The calculated confidence score
   */
  async getConfidenceScore(email: Email, methods?: DetectionMethodType[]): Promise<number> {
    try {
      // If methods aren't specified, use all methods
      const methodsToUse = methods || [
        DetectionMethodType.HEADER_ANALYSIS,
        DetectionMethodType.CONTENT_STRUCTURE,
        DetectionMethodType.SENDER_REPUTATION,
        DetectionMethodType.USER_FEEDBACK
      ];
      
      // Gather scores from selected methods
      const scores: DetectionScore[] = [];
      
      for (const method of methodsToUse) {
        let score: DetectionScore;
        
        switch (method) {
          case DetectionMethodType.HEADER_ANALYSIS:
            score = await this.headerAnalyzer.analyze(email);
            break;
          case DetectionMethodType.CONTENT_STRUCTURE:
            score = await this.contentAnalyzer.analyze(email);
            break;
          case DetectionMethodType.SENDER_REPUTATION:
            score = await this.reputationTracker.analyze(email);
            break;
          case DetectionMethodType.USER_FEEDBACK:
            score = await this.userFeedbackIntegrator.analyze(email);
            break;
          default:
            continue; // Skip unknown methods
        }
        
        scores.push(score);
      }
      
      // Calculate combined score
      return this.confidenceCalculator.calculateConfidence(scores);
    } catch (error) {
      this.logger.error(`Error calculating confidence score: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Determine if a detection result needs human verification
   * @param detectionResult The detection result to evaluate
   * @returns Whether verification is needed
   */
  needsVerification(detectionResult: DetectionResult): boolean {
    return this.confidenceCalculator.needsVerification(detectionResult.combinedScore);
  }
  
  /**
   * Record user feedback for an email
   * @param emailId The email ID feedback is for
   * @param isNewsletter Whether the user confirmed it as a newsletter
   * @param userId The user ID providing feedback
   */
  async recordFeedback(emailId: string, isNewsletter: boolean, userId: string = 'default_user'): Promise<void> {
    try {
      await this.userFeedbackIntegrator.trackFeedback({
        emailId,
        isNewsletter,
        userId,
        source: 'user',
        timestamp: new Date()
      });
      
      // Update sender reputation
      const email = await this.getEmailById(emailId);
      if (email && email.payload?.headers) {
        const fromHeader = email.payload.headers.find((h: { name?: string; value?: string }) => 
          h.name?.toLowerCase() === 'from'
        );
        
        if (fromHeader?.value) {
          const sender = this.extractEmailAddress(fromHeader.value);
          if (sender) {
            await this.reputationTracker.updateSenderReputation(sender, isNewsletter);
          }
        }
      }
      
      this.logger.info(`Recorded user feedback for email ${emailId}, isNewsletter=${isNewsletter}`);
    } catch (error) {
      this.logger.error(`Error recording feedback: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
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
}