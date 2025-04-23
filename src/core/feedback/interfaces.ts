/**
 * User Feedback Module Interfaces
 * Defines interfaces for collecting and processing user feedback on newsletter detection
 */

/**
 * Feedback types for newsletter detection
 */
export enum FeedbackType {
  CONFIRM = 'confirm',       // User confirms this is a newsletter
  REJECT = 'reject',         // User rejects this as a newsletter
  UNCERTAIN = 'uncertain',   // User is uncertain about the classification
  VERIFY = 'verify',         // System needs verification from user
  IGNORE = 'ignore'          // User wants to ignore this message type
}

/**
 * Priority levels for feedback processing
 */
export enum FeedbackPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Status of verification requests
 */
export enum VerificationStatus {
  PENDING = 'pending',       // Awaiting user verification
  CONFIRMED = 'confirmed',   // User confirmed the request
  REJECTED = 'rejected',     // User rejected the request
  EXPIRED = 'expired',       // Verification request timed out
  CANCELED = 'canceled'      // Verification request was canceled
}

/**
 * User feedback on newsletter detection
 */
export interface UserFeedback {
  id: string;
  userId: string;
  emailId: string;
  messageId?: string;        // Original email Message-ID header
  sender: string;            // Email sender address
  senderDomain: string;      // Email sender domain
  subject?: string;          // Email subject
  type: FeedbackType;        // Type of feedback
  priority: FeedbackPriority;// Priority of the feedback
  detectionResult: boolean;  // Original detection result (true = newsletter, false = not newsletter)
  comment?: string;          // Optional user comment
  timestamp: Date;           // When the feedback was submitted
  processed: boolean;        // Whether the feedback has been processed
  processedAt?: Date;        // When the feedback was processed
}

/**
 * Represents a feedback item with analysis data
 */
export interface FeedbackItem {
  id: string;
  userId: string;
  emailId: string;
  messageId?: string;        // Original email Message-ID header
  sender: string;            // Email sender address
  senderDomain: string;      // Email sender domain
  subject?: string;          // Email subject
  type: FeedbackType;        // Type of feedback
  priority: FeedbackPriority;// Priority of the feedback
  detectionResult: boolean;  // Original detection result (true = newsletter, false = not newsletter)
  comment?: string;          // Optional user comment
  timestamp: Date;           // When the feedback was submitted
  processed: boolean;        // Whether the feedback has been processed
  processedAt?: Date;        // When the feedback was processed
  confidence: number;        // Confidence score of the original detection
  features?: Record<string, number>;  // Feature values used in detection
  impact?: number;           // Estimated impact of this feedback on the detection system
  relatedFeedback?: string[];// IDs of related feedback items
}

/**
 * Represents a verification request sent to the user
 */
export interface VerificationRequest {
  id: string;
  userId: string;
  emailId: string;
  messageId?: string;        // Original email Message-ID header
  sender: string;            // Email sender address
  senderDomain: string;      // Email sender domain
  subject?: string;          // Email subject
  confidence: number;        // Confidence score of the detection
  status: VerificationStatus;// Status of the verification request
  generatedAt: Date;         // When the request was generated
  expiresAt: Date;           // When the request expires
  respondedAt?: Date;        // When the user responded
  userResponse?: FeedbackType;// User's response to the verification request
  requestSentCount: number;  // Number of times the request was sent
  token: string;             // Unique token for verification links
}

/**
 * Feedback metrics and insights
 */
export interface FeedbackAnalytics {
  userId: string;
  period: 'day' | 'week' | 'month' | 'all';
  totalFeedback: number;
  confirmCount: number;
  rejectCount: number;
  uncertainCount: number;
  verifyCount: number;
  ignoreCount: number;
  accuracy: number;          // Overall detection accuracy
  falsePositives: number;    // False positives (detected as newsletter but wasn't)
  falseNegatives: number;    // False negatives (not detected but was a newsletter)
  domainBreakdown: Record<string, {
    count: number;
    confirms: number;
    rejects: number;
  }>;
  topMisclassifiedDomains: string[];
  generatedAt: Date;
}

/**
 * Feedback collector interface
 */
export interface FeedbackCollector {
  /**
   * Collect feedback from a user on a specific email
   * @param userId The ID of the user
   * @param emailId The ID of the email
   * @param feedbackType The type of feedback
   * @param comment Optional comment from the user
   */
  collectFeedback(
    userId: string, 
    emailId: string, 
    feedbackType: FeedbackType, 
    comment?: string
  ): Promise<UserFeedback>;
  
  /**
   * Process verification response
   * @param verificationToken The verification token
   * @param response The user's response
   */
  processVerificationResponse(
    verificationToken: string, 
    response: FeedbackType,
    comment?: string
  ): Promise<VerificationRequest>;
  
  /**
   * Get pending verification requests for a user
   * @param userId The ID of the user
   */
  getPendingVerifications(userId: string): Promise<VerificationRequest[]>;
  
  /**
   * Cancel a verification request
   * @param requestId The ID of the verification request
   */
  cancelVerification(requestId: string): Promise<boolean>;
}

/**
 * Verification request generator interface
 */
export interface VerificationRequestGenerator {
  /**
   * Generate a verification request for an uncertain detection
   * @param userId The ID of the user
   * @param emailId The ID of the email
   * @param confidence The confidence score of the detection
   */
  generateVerificationRequest(
    userId: string, 
    emailId: string, 
    confidence: number
  ): Promise<VerificationRequest>;
  
  /**
   * Format a verification request for email delivery
   * @param verificationRequest The verification request
   */
  formatVerificationEmail(verificationRequest: VerificationRequest): Promise<{
    subject: string;
    body: string;
    html: string;
  }>;
  
  /**
   * Process expired verification requests
   */
  processExpiredRequests(): Promise<number>;
  
  /**
   * Resend a verification request
   * @param requestId The ID of the verification request
   */
  resendVerificationRequest(requestId: string): Promise<VerificationRequest>;
}

/**
 * Feedback analyzer interface
 */
export interface FeedbackAnalyzer {
  /**
   * Analyze feedback for a user
   * @param userId The ID of the user
   * @param period The time period to analyze
   */
  analyzeFeedback(
    userId: string, 
    period: 'day' | 'week' | 'month' | 'all'
  ): Promise<FeedbackAnalytics>;
  
  /**
   * Identify patterns in feedback
   * @param userId The ID of the user
   */
  identifyPatterns(userId: string): Promise<{
    frequentFeedbackSenders: string[];
    frequentFeedbackDomains: string[];
    inconsistentFeedback: FeedbackItem[];
  }>;
  
  /**
   * Calculate accuracy metrics
   * @param userId The ID of the user
   */
  calculateAccuracyMetrics(userId: string): Promise<{
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  }>;
  
  /**
   * Generate improvement suggestions
   * @param userId The ID of the user
   */
  generateSuggestions(userId: string): Promise<string[]>;
}

/**
 * Detection improver interface
 */
export interface DetectionImprover {
  /**
   * Apply feedback to improve detection
   * @param feedback The feedback to apply
   */
  applyFeedback(feedback: FeedbackItem): Promise<void>;
  
  /**
   * Update sender reputation based on feedback
   * @param sender The sender address
   * @param feedbackType The type of feedback
   */
  updateSenderReputation(
    sender: string, 
    feedbackType: FeedbackType
  ): Promise<number>;
  
  /**
   * Update domain reputation based on feedback
   * @param domain The domain
   * @param feedbackType The type of feedback
   */
  updateDomainReputation(
    domain: string, 
    feedbackType: FeedbackType
  ): Promise<number>;
  
  /**
   * Train a personalized detection model for a user
   * @param userId The ID of the user
   */
  trainPersonalizedModel(userId: string): Promise<boolean>;
  
  /**
   * Apply user preferences to detection
   * @param userId The ID of the user
   * @param preferences User preferences for detection
   */
  applyUserPreferences(
    userId: string, 
    preferences: Record<string, any>
  ): Promise<void>;
}

/**
 * Feedback repository interface
 */
export interface FeedbackRepository {
  /**
   * Save feedback to the repository
   * @param feedback The feedback to save
   */
  saveFeedback(feedback: UserFeedback): Promise<UserFeedback>;
  
  /**
   * Get feedback by ID
   * @param feedbackId The ID of the feedback
   */
  getFeedback(feedbackId: string): Promise<FeedbackItem | null>;
  
  /**
   * Get all feedback for a user
   * @param userId The ID of the user
   * @param limit The maximum number of records to return
   * @param offset The offset to start from
   */
  getFeedbackForUser(
    userId: string, 
    limit?: number, 
    offset?: number
  ): Promise<FeedbackItem[]>;
  
  /**
   * Get feedback for a specific email
   * @param emailId The ID of the email
   */
  getFeedbackForEmail(emailId: string): Promise<FeedbackItem[]>;
  
  /**
   * Get unprocessed feedback
   * @param limit The maximum number of records to return
   */
  getUnprocessedFeedback(limit?: number): Promise<FeedbackItem[]>;
  
  /**
   * Mark feedback as processed
   * @param feedbackId The ID of the feedback
   */
  markAsProcessed(feedbackId: string): Promise<boolean>;
  
  /**
   * Save a verification request
   * @param request The verification request to save
   */
  saveVerificationRequest(
    request: VerificationRequest
  ): Promise<VerificationRequest>;
  
  /**
   * Get a verification request by ID
   * @param requestId The ID of the verification request
   */
  getVerificationRequest(requestId: string): Promise<VerificationRequest | null>;
  
  /**
   * Get a verification request by token
   * @param token The verification token
   */
  getVerificationRequestByToken(token: string): Promise<VerificationRequest | null>;
  
  /**
   * Get pending verification requests for a user
   * @param userId The ID of the user
   */
  getPendingVerificationRequests(userId: string): Promise<VerificationRequest[]>;
  
  /**
   * Update verification request status
   * @param requestId The ID of the verification request
   * @param status The new status
   * @param response Optional user response
   */
  updateVerificationRequestStatus(
    requestId: string, 
    status: VerificationStatus, 
    response?: FeedbackType
  ): Promise<VerificationRequest>;
  
  /**
   * Get expired verification requests
   */
  getExpiredVerificationRequests(): Promise<VerificationRequest[]>;
}

/**
 * FeedbackService interface as defined in the TDD
 */
export interface FeedbackService {
  /**
   * Submit feedback for an email
   * @param userId The ID of the user
   * @param emailId The ID of the email
   * @param isNewsletter Whether the user considers this a newsletter
   */
  submitFeedback(
    userId: string, 
    emailId: string, 
    isNewsletter: boolean
  ): Promise<void>;
  
  /**
   * Process a verification token
   * @param token The verification token
   * @param isNewsletter Whether the user considers this a newsletter
   */
  processVerification(
    token: string, 
    isNewsletter: boolean
  ): Promise<void>;
  
  /**
   * Generate a verification request for an email
   * @param userId The ID of the user
   * @param emailId The ID of the email
   */
  requestVerification(
    userId: string, 
    emailId: string
  ): Promise<void>;
  
  /**
   * Get feedback statistics for a user
   * @param userId The ID of the user
   */
  getFeedbackStats(userId: string): Promise<{
    totalSubmitted: number;
    confirmedNewsletters: number;
    rejectedNewsletters: number;
    pendingVerifications: number;
  }>;
}