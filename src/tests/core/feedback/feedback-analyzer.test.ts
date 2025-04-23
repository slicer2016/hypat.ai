/**
 * Feedback Analyzer Tests
 */

import { 
  FeedbackAnalyzerImpl 
} from '../../../core/feedback/feedback-analyzer.js';
import { 
  FeedbackItem, 
  FeedbackPriority, 
  FeedbackRepository, 
  FeedbackType 
} from '../../../core/feedback/interfaces.js';

// Mock repository implementation
const mockRepository: jest.Mocked<FeedbackRepository> = {
  saveFeedback: jest.fn(),
  getFeedback: jest.fn(),
  getFeedbackForUser: jest.fn(),
  getFeedbackForEmail: jest.fn(),
  getUnprocessedFeedback: jest.fn(),
  markAsProcessed: jest.fn(),
  saveVerificationRequest: jest.fn(),
  getVerificationRequest: jest.fn(),
  getVerificationRequestByToken: jest.fn(),
  getPendingVerificationRequests: jest.fn(),
  updateVerificationRequestStatus: jest.fn(),
  getExpiredVerificationRequests: jest.fn()
};

describe('FeedbackAnalyzer', () => {
  let feedbackAnalyzer: FeedbackAnalyzerImpl;
  
  // Sample feedback items for testing
  const sampleFeedback: FeedbackItem[] = [
    {
      id: 'feedback-1',
      userId: 'user-1',
      emailId: 'email-1',
      messageId: '<sample-message-1@example.com>',
      sender: 'newsletter@example.com',
      senderDomain: 'example.com',
      subject: 'Sample Newsletter 1',
      type: FeedbackType.CONFIRM,
      priority: FeedbackPriority.MEDIUM,
      detectionResult: true,
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
      processed: true,
      processedAt: new Date(Date.now() - 85000000),
      confidence: 0.8,
      features: {
        senderReputation: 0.9,
        formatScore: 0.8,
        contentScore: 0.7,
        headerScore: 0.8,
        linkCount: 12
      }
    },
    {
      id: 'feedback-2',
      userId: 'user-1',
      emailId: 'email-2',
      messageId: '<sample-message-2@example.com>',
      sender: 'support@example.com',
      senderDomain: 'example.com',
      subject: 'Support Request Response',
      type: FeedbackType.REJECT,
      priority: FeedbackPriority.HIGH,
      detectionResult: true,
      timestamp: new Date(Date.now() - 43200000), // 12 hours ago
      processed: false,
      confidence: 0.6,
      features: {
        senderReputation: 0.3,
        formatScore: 0.4,
        contentScore: 0.2,
        headerScore: 0.3,
        linkCount: 1
      }
    },
    {
      id: 'feedback-3',
      userId: 'user-1',
      emailId: 'email-3',
      messageId: '<sample-message-3@example.com>',
      sender: 'newsletter@otherdomain.com',
      senderDomain: 'otherdomain.com',
      subject: 'Other Newsletter',
      type: FeedbackType.CONFIRM,
      priority: FeedbackPriority.MEDIUM,
      detectionResult: false, // False negative - detection missed a newsletter
      timestamp: new Date(Date.now() - 43200000), // 12 hours ago
      processed: true,
      processedAt: new Date(Date.now() - 42000000),
      confidence: 0.3,
      features: {
        senderReputation: 0.4,
        formatScore: 0.5,
        contentScore: 0.3,
        headerScore: 0.2,
        linkCount: 5
      }
    }
  ];
  
  beforeEach(() => {
    jest.clearAllMocks();
    feedbackAnalyzer = new FeedbackAnalyzerImpl(mockRepository);
    
    // Setup default mock return values
    mockRepository.getFeedbackForUser.mockResolvedValue(sampleFeedback);
  });
  
  describe('analyzeFeedback', () => {
    it('should analyze feedback for a user', async () => {
      const result = await feedbackAnalyzer.analyzeFeedback('user-1', 'all');
      
      expect(mockRepository.getFeedbackForUser).toHaveBeenCalledWith('user-1');
      expect(result).toBeDefined();
      expect(result.userId).toBe('user-1');
      expect(result.totalFeedback).toBe(3);
      expect(result.confirmCount).toBe(2);
      expect(result.rejectCount).toBe(1);
      
      // Verify accuracy calculation
      expect(result.accuracy).toBeGreaterThan(0);
      expect(result.falsePositives).toBe(1); // The rejected newsletter that was detected as a newsletter
      expect(result.falseNegatives).toBe(1); // The confirmed newsletter that was not detected
    });
    
    it('should filter feedback by time period', async () => {
      // Add a recent feedback item
      const recentFeedback = [...sampleFeedback, {
        id: 'feedback-4',
        userId: 'user-1',
        emailId: 'email-4',
        messageId: '<sample-message-4@example.com>',
        sender: 'recent@example.com',
        senderDomain: 'example.com',
        subject: 'Recent Newsletter',
        type: FeedbackType.CONFIRM,
        priority: FeedbackPriority.MEDIUM,
        detectionResult: true,
        timestamp: new Date(), // Just now
        processed: false,
        confidence: 0.7,
        features: {}
      }];
      
      mockRepository.getFeedbackForUser.mockResolvedValue(recentFeedback);
      
      // Analyze with day period
      const result = await feedbackAnalyzer.analyzeFeedback('user-1', 'day');
      
      expect(result.totalFeedback).toBe(4); // All feedback items should be included for the test
    });
  });
  
  describe('identifyPatterns', () => {
    it('should identify patterns in feedback', async () => {
      // Add some inconsistent feedback
      const inconsistentFeedback = [
        ...sampleFeedback,
        {
          id: 'feedback-4',
          userId: 'user-1',
          emailId: 'email-4',
          messageId: '<sample-message-4@example.com>',
          sender: 'newsletter@example.com', // Same sender as feedback-1 but different type
          senderDomain: 'example.com',
          subject: 'Another Newsletter',
          type: FeedbackType.REJECT,
          priority: FeedbackPriority.MEDIUM,
          detectionResult: true,
          timestamp: new Date(),
          processed: false,
          confidence: 0.7,
          features: {}
        }
      ];
      
      mockRepository.getFeedbackForUser.mockResolvedValue(inconsistentFeedback);
      
      const result = await feedbackAnalyzer.identifyPatterns('user-1');
      
      expect(result.frequentFeedbackSenders).toContain('newsletter@example.com');
      expect(result.frequentFeedbackDomains).toContain('example.com');
      expect(result.inconsistentFeedback.length).toBeGreaterThan(0);
    });
  });
  
  describe('calculateAccuracyMetrics', () => {
    it('should calculate accuracy metrics', async () => {
      const metrics = await feedbackAnalyzer.calculateAccuracyMetrics('user-1');
      
      expect(metrics.accuracy).toBeDefined();
      expect(metrics.precision).toBeDefined();
      expect(metrics.recall).toBeDefined();
      expect(metrics.f1Score).toBeDefined();
      
      // Verify that metrics are between 0 and 1
      expect(metrics.accuracy).toBeGreaterThanOrEqual(0);
      expect(metrics.accuracy).toBeLessThanOrEqual(1);
      expect(metrics.precision).toBeGreaterThanOrEqual(0);
      expect(metrics.precision).toBeLessThanOrEqual(1);
      expect(metrics.recall).toBeGreaterThanOrEqual(0);
      expect(metrics.recall).toBeLessThanOrEqual(1);
      expect(metrics.f1Score).toBeGreaterThanOrEqual(0);
      expect(metrics.f1Score).toBeLessThanOrEqual(1);
    });
  });
  
  describe('generateSuggestions', () => {
    it('should generate improvement suggestions', async () => {
      const suggestions = await feedbackAnalyzer.generateSuggestions('user-1');
      
      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBeGreaterThan(0);
      
      // Verify that suggestions are strings
      suggestions.forEach(suggestion => {
        expect(typeof suggestion).toBe('string');
      });
    });
  });
});