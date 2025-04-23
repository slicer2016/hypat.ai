/**
 * Digest Service Tests
 */

import { 
  Digest, 
  DigestFormat, 
  DigestFrequency,
  DigestGenerator,
  EmailDeliveryScheduler,
  EmailSender,
  EmailTemplateRenderer,
  UserPreferenceManager
} from '../../../core/digest/interfaces.js';
import { DigestServiceImpl } from '../../../core/digest/digest-service.js';

// Create mock implementations of dependencies
const mockDigestGenerator: jest.Mocked<DigestGenerator> = {
  generateDailyDigest: jest.fn(),
  generateWeeklyDigest: jest.fn(),
  generateCustomDigest: jest.fn()
};

const mockTemplateRenderer: jest.Mocked<EmailTemplateRenderer> = {
  renderDigest: jest.fn(),
  renderTemplate: jest.fn(),
  getTemplates: jest.fn(),
  getTemplate: jest.fn()
};

const mockEmailSender: jest.Mocked<EmailSender> = {
  sendEmail: jest.fn(),
  sendDigest: jest.fn()
};

const mockDeliveryScheduler: jest.Mocked<EmailDeliveryScheduler> = {
  scheduleDigestDelivery: jest.fn(),
  scheduleOneTimeDelivery: jest.fn(),
  cancelScheduledDelivery: jest.fn(),
  getSchedulesForUser: jest.fn(),
  start: jest.fn(),
  stop: jest.fn()
};

const mockUserPreferenceManager: jest.Mocked<UserPreferenceManager> = {
  getDigestPreferences: jest.fn(),
  updateDigestPreferences: jest.fn(),
  addCategory: jest.fn(),
  removeCategory: jest.fn(),
  excludeNewsletter: jest.fn(),
  includeNewsletter: jest.fn()
};

describe('DigestService', () => {
  let digestService: DigestServiceImpl;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    digestService = new DigestServiceImpl(
      mockDigestGenerator,
      mockTemplateRenderer,
      mockEmailSender,
      mockDeliveryScheduler,
      mockUserPreferenceManager
    );
    
    // Set up default mock return values
    mockDigestGenerator.generateDailyDigest.mockResolvedValue({
      id: 'test-digest-1',
      userId: 'user-1',
      title: 'Test Daily Digest',
      description: 'Daily digest for testing',
      frequency: DigestFrequency.DAILY,
      format: DigestFormat.STANDARD,
      sections: [],
      startDate: new Date(),
      endDate: new Date(),
      generatedAt: new Date()
    });
    
    mockDigestGenerator.generateWeeklyDigest.mockResolvedValue({
      id: 'test-digest-2',
      userId: 'user-1',
      title: 'Test Weekly Digest',
      description: 'Weekly digest for testing',
      frequency: DigestFrequency.WEEKLY,
      format: DigestFormat.STANDARD,
      sections: [],
      startDate: new Date(),
      endDate: new Date(),
      generatedAt: new Date()
    });
    
    mockTemplateRenderer.renderDigest.mockResolvedValue('<html><body>Rendered HTML</body></html>');
    
    mockEmailSender.sendEmail.mockResolvedValue({
      success: true,
      messageId: 'test-message-1'
    });
    
    mockUserPreferenceManager.getDigestPreferences.mockResolvedValue({
      userId: 'user-1',
      email: 'test@example.com',
      frequency: DigestFrequency.DAILY,
      format: DigestFormat.STANDARD,
      timezone: 'America/New_York',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });
  
  test('generateDailyDigest calls the digest generator', async () => {
    await digestService.generateDailyDigest('user-1');
    
    expect(mockDigestGenerator.generateDailyDigest).toHaveBeenCalledWith('user-1');
  });
  
  test('generateWeeklyDigest calls the digest generator', async () => {
    await digestService.generateWeeklyDigest('user-1');
    
    expect(mockDigestGenerator.generateWeeklyDigest).toHaveBeenCalledWith('user-1');
  });
  
  test('scheduleDigests starts the scheduler and schedules for all users', async () => {
    // Mock implementation for scheduleDigestsForAllUsers
    (digestService as any).scheduleDigestsForAllUsers = jest.fn().mockResolvedValue(undefined);
    
    digestService.scheduleDigests();
    
    expect(mockDeliveryScheduler.start).toHaveBeenCalled();
    
    // Wait for promises to resolve
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect((digestService as any).scheduleDigestsForAllUsers).toHaveBeenCalled();
  });
  
  test('generateAndSendDigest generates a digest and sends it', async () => {
    // Add mock section to make sure digest is sent
    const mockDigest: Digest = {
      id: 'test-digest-1',
      userId: 'user-1',
      title: 'Test Daily Digest',
      description: 'Daily digest for testing',
      frequency: DigestFrequency.DAILY,
      format: DigestFormat.STANDARD,
      sections: [
        {
          id: 'section-1',
          title: 'Test Section',
          type: 'category',
          items: [
            {
              id: 'item-1',
              newsletterId: 'newsletter-1',
              newsletterName: 'Test Newsletter',
              title: 'Test Item',
              summary: 'Test Summary',
              content: 'Test Content',
              topics: [],
              importance: 0.5,
              publishedAt: new Date(),
              createdAt: new Date()
            }
          ]
        }
      ],
      startDate: new Date(),
      endDate: new Date(),
      generatedAt: new Date()
    };
    
    mockDigestGenerator.generateDailyDigest.mockResolvedValue(mockDigest);
    
    await (digestService as any).generateAndSendDigest('user-1', false);
    
    expect(mockDigestGenerator.generateDailyDigest).toHaveBeenCalledWith('user-1');
    expect(mockTemplateRenderer.renderDigest).toHaveBeenCalledWith(mockDigest, 'daily-standard');
    expect(mockEmailSender.sendDigest).toHaveBeenCalled();
  });
  
  test('generateAndSendDigest skips sending if digest has no content', async () => {
    // Use the default mock with empty sections array
    
    await (digestService as any).generateAndSendDigest('user-1', false);
    
    expect(mockDigestGenerator.generateDailyDigest).toHaveBeenCalledWith('user-1');
    expect(mockTemplateRenderer.renderDigest).not.toHaveBeenCalled();
    expect(mockEmailSender.sendDigest).not.toHaveBeenCalled();
  });
  
  test('generateAndSendDigest throws error if user preferences not found', async () => {
    mockUserPreferenceManager.getDigestPreferences.mockResolvedValue(null);
    
    await expect((digestService as any).generateAndSendDigest('user-1', false))
      .rejects.toThrow('No preferences found for user: user-1');
  });
});