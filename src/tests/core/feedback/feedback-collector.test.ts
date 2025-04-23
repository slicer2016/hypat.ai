/**
 * Feedback Collector Tests
 */

import { 
  FeedbackCollectorImpl 
} from '../../../core/feedback/feedback-collector.js';
import { 
  FeedbackItem, 
  FeedbackPriority, 
  FeedbackRepository, 
  FeedbackType, 
  UserFeedback, 
  VerificationRequest, 
  VerificationStatus 
} from '../../../core/feedback/interfaces.js';
import { v4 as uuidv4 } from 'uuid';

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

// Mock email details for the getEmailDetails method
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid')
}));

describe('FeedbackCollector', () => {
  let feedbackCollector: FeedbackCollectorImpl;
  
  beforeEach(() => {
    jest.clearAllMocks();
    feedbackCollector = new FeedbackCollectorImpl(mockRepository);
    
    // Setup default mock return values
    mockRepository.saveFeedback.mockImplementation(async (feedback) => {
      return feedback as FeedbackItem;
    });
    
    mockRepository.getVerificationRequestByToken.mockResolvedValue({
      id: 'request-1',
      userId: 'user-1',
      emailId: 'email-1',
      sender: 'test@example.com',
      senderDomain: 'example.com',
      confidence: 0.5,
      status: VerificationStatus.PENDING,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000), // 1 day from now
      requestSentCount: 1,
      token: 'test-token'
    });
    
    mockRepository.updateVerificationRequestStatus.mockImplementation(async (id, status, response) => {
      return {
        id,
        userId: 'user-1',
        emailId: 'email-1',
        sender: 'test@example.com',
        senderDomain: 'example.com',
        confidence: 0.5,
        status,
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        requestSentCount: 1,
        token: 'test-token',
        respondedAt: new Date(),
        userResponse: response
      };
    });
    
    mockRepository.getPendingVerificationRequests.mockResolvedValue([
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
  });
  
  describe('collectFeedback', () => {
    it('should collect feedback and save it to the repository', async () => {
      const result = await feedbackCollector.collectFeedback(
        'user-1',
        'email-1',
        FeedbackType.CONFIRM,
        'Great newsletter'
      );
      
      expect(mockRepository.saveFeedback).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.userId).toBe('user-1');
      expect(result.emailId).toBe('email-1');
      expect(result.type).toBe(FeedbackType.CONFIRM);
      expect(result.comment).toBe('Great newsletter');
    });
    
    it('should update associated verification request if one exists', async () => {
      await feedbackCollector.collectFeedback(
        'user-1',
        'email-1',
        FeedbackType.CONFIRM
      );
      
      expect(mockRepository.getPendingVerificationRequests).toHaveBeenCalledWith('user-1');
      expect(mockRepository.updateVerificationRequestStatus).toHaveBeenCalledWith(
        'request-1',
        VerificationStatus.CONFIRMED,
        FeedbackType.CONFIRM
      );
    });
  });
  
  describe('processVerificationResponse', () => {
    it('should process a verification response', async () => {
      const result = await feedbackCollector.processVerificationResponse(
        'test-token',
        FeedbackType.CONFIRM,
        'Test comment'
      );
      
      expect(mockRepository.getVerificationRequestByToken).toHaveBeenCalledWith('test-token');
      expect(mockRepository.updateVerificationRequestStatus).toHaveBeenCalledWith(
        'request-1',
        VerificationStatus.CONFIRMED,
        FeedbackType.CONFIRM
      );
      expect(result).toBeDefined();
      expect(result.status).toBe(VerificationStatus.CONFIRMED);
      expect(result.userResponse).toBe(FeedbackType.CONFIRM);
    });
    
    it('should throw an error if the verification request is not found', async () => {
      mockRepository.getVerificationRequestByToken.mockResolvedValue(null);
      
      await expect(feedbackCollector.processVerificationResponse(
        'invalid-token',
        FeedbackType.CONFIRM,
        'Test comment'
      )).rejects.toThrow('Verification request not found');
    });
    
    it('should throw an error if the verification request has expired', async () => {
      mockRepository.getVerificationRequestByToken.mockResolvedValue({
        id: 'request-1',
        userId: 'user-1',
        emailId: 'email-1',
        sender: 'test@example.com',
        senderDomain: 'example.com',
        confidence: 0.5,
        status: VerificationStatus.EXPIRED,
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() - 86400000), // 1 day ago
        requestSentCount: 1,
        token: 'test-token'
      });
      
      await expect(feedbackCollector.processVerificationResponse(
        'test-token',
        FeedbackType.CONFIRM,
        'Test comment'
      )).rejects.toThrow('Verification request has expired');
    });
  });
  
  describe('getPendingVerifications', () => {
    it('should get pending verification requests for a user', async () => {
      const result = await feedbackCollector.getPendingVerifications('user-1');
      
      expect(mockRepository.getPendingVerificationRequests).toHaveBeenCalledWith('user-1');
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-1');
      expect(result[0].status).toBe(VerificationStatus.PENDING);
    });
  });
  
  describe('cancelVerification', () => {
    it('should cancel a verification request', async () => {
      const result = await feedbackCollector.cancelVerification('request-1');
      
      expect(mockRepository.updateVerificationRequestStatus).toHaveBeenCalledWith(
        'request-1',
        VerificationStatus.CANCELED
      );
      expect(result).toBe(true);
    });
    
    it('should return false if an error occurs', async () => {
      mockRepository.updateVerificationRequestStatus.mockRejectedValue(new Error('Test error'));
      
      const result = await feedbackCollector.cancelVerification('request-1');
      
      expect(result).toBe(false);
    });
  });
});