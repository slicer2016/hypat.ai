/**
 * Feedback Service Tests
 */

import { 
  FeedbackServiceImpl 
} from '../../../core/feedback/feedback-service.js';
import { 
  DetectionImprover, 
  FeedbackAnalyzer, 
  FeedbackCollector, 
  FeedbackItem, 
  FeedbackPriority, 
  FeedbackType, 
  VerificationRequest, 
  VerificationRequestGenerator, 
  VerificationStatus 
} from '../../../core/feedback/interfaces.js';

// Mock dependencies
const mockFeedbackCollector: jest.Mocked<FeedbackCollector> = {
  collectFeedback: jest.fn(),
  processVerificationResponse: jest.fn(),
  getPendingVerifications: jest.fn(),
  cancelVerification: jest.fn()
};

const mockVerificationGenerator: jest.Mocked<VerificationRequestGenerator> = {
  generateVerificationRequest: jest.fn(),
  formatVerificationEmail: jest.fn(),
  processExpiredRequests: jest.fn(),
  resendVerificationRequest: jest.fn()
};

const mockFeedbackAnalyzer: jest.Mocked<FeedbackAnalyzer> = {
  analyzeFeedback: jest.fn(),
  identifyPatterns: jest.fn(),
  calculateAccuracyMetrics: jest.fn(),
  generateSuggestions: jest.fn()
};

const mockDetectionImprover: jest.Mocked<DetectionImprover> = {
  applyFeedback: jest.fn(),
  updateSenderReputation: jest.fn(),
  updateDomainReputation: jest.fn(),
  trainPersonalizedModel: jest.fn(),
  applyUserPreferences: jest.fn()
};

describe('FeedbackService', () => {
  let feedbackService: FeedbackServiceImpl;
  
  beforeEach(() => {
    jest.clearAllMocks();
    feedbackService = new FeedbackServiceImpl(
      mockFeedbackCollector,
      mockVerificationGenerator,
      mockFeedbackAnalyzer,
      mockDetectionImprover
    );
    
    // Setup default mock return values
    mockFeedbackCollector.collectFeedback.mockResolvedValue({
      id: 'feedback-1',
      userId: 'user-1',
      emailId: 'email-1',
      sender: 'test@example.com',
      senderDomain: 'example.com',
      type: FeedbackType.CONFIRM,
      priority: FeedbackPriority.MEDIUM,
      detectionResult: true,
      timestamp: new Date(),
      processed: false
    } as any);
    
    mockVerificationGenerator.generateVerificationRequest.mockResolvedValue({
      id: 'request-1',
      userId: 'user-1',
      emailId: 'email-1',
      sender: 'test@example.com',
      senderDomain: 'example.com',
      confidence: 0.5,
      status: VerificationStatus.PENDING,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000),
      requestSentCount: 1,
      token: 'test-token'
    });
    
    mockVerificationGenerator.formatVerificationEmail.mockResolvedValue({
      subject: 'Verify this newsletter',
      body: 'Please verify this newsletter',
      html: '<html><body>Please verify this newsletter</body></html>'
    });
    
    mockFeedbackAnalyzer.analyzeFeedback.mockResolvedValue({
      userId: 'user-1',
      period: 'all',
      totalFeedback: 10,
      confirmCount: 7,
      rejectCount: 3,
      uncertainCount: 0,
      verifyCount: 0,
      ignoreCount: 0,
      accuracy: 0.85,
      falsePositives: 1,
      falseNegatives: 1,
      domainBreakdown: {},
      topMisclassifiedDomains: [],
      generatedAt: new Date()
    });
    
    mockFeedbackCollector.getPendingVerifications.mockResolvedValue([
      {
        id: 'request-1',
        userId: 'user-1',
        emailId: 'email-1',
        sender: 'test@example.com',
        senderDomain: 'example.com',
        confidence: 0.5,
        status: VerificationStatus.PENDING,
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        requestSentCount: 1,
        token: 'test-token'
      }
    ]);
    
    mockVerificationGenerator.processExpiredRequests.mockResolvedValue(2);
    
    mockDetectionImprover.trainPersonalizedModel.mockResolvedValue(true);
  });
  
  describe('submitFeedback', () => {
    it('should submit feedback and apply it to improve detection', async () => {
      await feedbackService.submitFeedback('user-1', 'email-1', true);
      
      expect(mockFeedbackCollector.collectFeedback).toHaveBeenCalledWith(
        'user-1',
        'email-1',
        FeedbackType.CONFIRM
      );
      
      expect(mockDetectionImprover.applyFeedback).toHaveBeenCalled();
    });
    
    it('should use the correct feedback type based on isNewsletter flag', async () => {
      await feedbackService.submitFeedback('user-1', 'email-1', false);
      
      expect(mockFeedbackCollector.collectFeedback).toHaveBeenCalledWith(
        'user-1',
        'email-1',
        FeedbackType.REJECT
      );
    });
  });
  
  describe('processVerification', () => {
    it('should process a verification token', async () => {
      await feedbackService.processVerification('test-token', true);
      
      expect(mockFeedbackCollector.processVerificationResponse).toHaveBeenCalledWith(
        'test-token',
        FeedbackType.CONFIRM,
        'Verification response'
      );
    });
    
    it('should use the correct feedback type based on isNewsletter flag', async () => {
      await feedbackService.processVerification('test-token', false);
      
      expect(mockFeedbackCollector.processVerificationResponse).toHaveBeenCalledWith(
        'test-token',
        FeedbackType.REJECT,
        'Verification response'
      );
    });
  });
  
  describe('requestVerification', () => {
    it('should generate a verification request', async () => {
      await feedbackService.requestVerification('user-1', 'email-1');
      
      expect(mockVerificationGenerator.generateVerificationRequest).toHaveBeenCalledWith(
        'user-1',
        'email-1',
        expect.any(Number)
      );
      
      expect(mockVerificationGenerator.formatVerificationEmail).toHaveBeenCalled();
    });
  });
  
  describe('getFeedbackStats', () => {
    it('should get feedback statistics for a user', async () => {
      const stats = await feedbackService.getFeedbackStats('user-1');
      
      expect(mockFeedbackAnalyzer.analyzeFeedback).toHaveBeenCalledWith('user-1');
      expect(mockFeedbackCollector.getPendingVerifications).toHaveBeenCalledWith('user-1');
      
      expect(stats).toEqual({
        totalSubmitted: 10,
        confirmedNewsletters: 7,
        rejectedNewsletters: 3,
        pendingVerifications: 1
      });
    });
  });
  
  describe('processExpiredRequests', () => {
    it('should process expired verification requests', async () => {
      const count = await feedbackService.processExpiredRequests();
      
      expect(mockVerificationGenerator.processExpiredRequests).toHaveBeenCalled();
      expect(count).toBe(2);
    });
  });
  
  describe('trainPersonalizedModels', () => {
    it('should train personalized detection models', async () => {
      const count = await feedbackService.trainPersonalizedModels();
      
      expect(mockDetectionImprover.trainPersonalizedModel).toHaveBeenCalled();
      expect(count).toBe(2); // 2 mock users
    });
    
    it('should handle errors during training and continue with other users', async () => {
      mockDetectionImprover.trainPersonalizedModel
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('Training failed'));
      
      const count = await feedbackService.trainPersonalizedModels();
      
      expect(count).toBe(1); // Only 1 successful training
    });
  });
});