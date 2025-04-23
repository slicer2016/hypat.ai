/**
 * Newsletter Detection Interfaces
 * Defines the core interfaces for newsletter detection in Hypat.ai
 */

import { Email } from '../../interfaces/gmail-mcp.js';

/**
 * Enumeration of different newsletter detection methods
 */
export enum DetectionMethodType {
  HEADER_ANALYSIS = 'header_analysis',
  CONTENT_STRUCTURE = 'content_structure',
  SENDER_REPUTATION = 'sender_reputation',
  USER_FEEDBACK = 'user_feedback'
}

/**
 * Interface for a newsletter detection method
 */
export interface DetectionMethod {
  type: DetectionMethodType;
  analyze(email: Email): Promise<DetectionScore>;
  getWeight(): number;
}

/**
 * Interface for a detection score result from a specific method
 */
export interface DetectionScore {
  method: DetectionMethodType;
  score: number; // Between 0.0 (definitely not a newsletter) and 1.0 (definitely a newsletter)
  confidence: number; // How confident the method is in its score (0.0 to 1.0)
  reason: string; // Human-readable explanation of the score
  metadata?: Record<string, any>; // Additional method-specific information
}

/**
 * Interface for a combined detection result
 */
export interface DetectionResult {
  isNewsletter: boolean;
  combinedScore: number; // The final weighted score
  needsVerification: boolean; // Whether user verification is recommended
  scores: DetectionScore[]; // Individual scores from each method
  email: Email; // Reference to the original email
}

/**
 * Interface for tracking user feedback on newsletter detection
 */
export interface UserFeedback {
  confirmedNewsletters: Set<string>; // Sender emails confirmed as newsletters
  rejectedNewsletters: Set<string>; // Sender emails rejected as newsletters
  trustedDomains: Set<string>; // Domains the user trusts as newsletter sources
  blockedDomains: Set<string>; // Domains the user has blocked as newsletter sources
}

/**
 * Interface for feedback input received from user
 */
export interface FeedbackInput {
  emailId: string;
  isNewsletter: boolean;
  userId: string;
  source: 'user' | 'system';
  timestamp?: Date;
}

/**
 * Interface for the main newsletter detector
 */
export interface NewsletterDetector {
  /**
   * Detect if an email is a newsletter
   * @param email The email to analyze
   * @param userFeedback Optional user feedback to incorporate in detection
   * @returns Detection result with scores and verification status
   */
  detectNewsletter(email: Email, userFeedback?: UserFeedback): Promise<DetectionResult>;
  
  /**
   * Calculate a confidence score for an email
   * @param email The email to analyze
   * @param methods Specific detection methods to use (uses all by default)
   * @returns The calculated confidence score
   */
  getConfidenceScore(email: Email, methods?: DetectionMethodType[]): Promise<number>;
  
  /**
   * Determine if a detection result needs human verification
   * @param detectionResult The detection result to evaluate
   * @returns Whether verification is needed
   */
  needsVerification(detectionResult: DetectionResult): boolean;
}

/**
 * Interface for header analyzer component
 */
export interface HeaderAnalyzer extends DetectionMethod {
  checkListUnsubscribe(headers: Record<string, string>): number;
  checkNewsletterHeaders(headers: Record<string, string>): number;
  analyzeSenderPattern(sender: string): number;
}

/**
 * Interface for content structure analyzer component
 */
export interface ContentStructureAnalyzer extends DetectionMethod {
  identifyNewsletterLayout(content: string): number;
  detectStructuralElements(content: string): number;
  recognizeTemplatedSections(content: string): number;
}

/**
 * Interface for sender reputation tracker component
 */
export interface SenderReputationTracker extends DetectionMethod {
  isSenderNewsletterProvider(sender: string): Promise<boolean>;
  getSenderConfidenceScore(sender: string): Promise<number>;
  updateSenderReputation(sender: string, isNewsletter: boolean): Promise<void>;
  isDomainNewsletterProvider(domain: string): Promise<boolean>;
}

/**
 * Interface for detection confidence calculator component
 */
export interface DetectionConfidenceCalculator {
  calculateConfidence(scores: DetectionScore[]): number;
  needsVerification(score: number): boolean;
  getMethodWeight(method: DetectionMethodType): number;
}

/**
 * Interface for user feedback integrator component
 */
export interface UserFeedbackIntegrator extends DetectionMethod {
  applyFeedback(feedback: UserFeedback, email: Email): Promise<DetectionScore>;
  trackFeedback(feedbackInput: FeedbackInput): Promise<void>;
  getUserFeedback(userId: string): Promise<UserFeedback>;
}