/**
 * Tests for GetNewslettersTool
 */

import { GetNewslettersTool } from '../../tools/get-newsletters-tool.js';
import { GmailMcpClient } from '../../modules/mcp-server/gmail-mcp-client.js';
import { createNewsletterDetector } from '../../core/detection/index.js';
import { createContentProcessor } from '../../core/content-processing/index.js';
import { createCategorizer } from '../../core/categorization/index.js';

// Mock dependencies
jest.mock('../../modules/mcp-server/gmail-mcp-client.js');
jest.mock('../../core/detection/index.js');
jest.mock('../../core/content-processing/index.js');
jest.mock('../../core/categorization/index.js');

describe('GetNewslettersTool', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Gmail client
    const mockConnect = jest.fn().mockResolvedValue(undefined);
    const mockDisconnect = jest.fn().mockResolvedValue(undefined);
    const mockSearchEmails = jest.fn().mockResolvedValue([
      { id: 'email1', payload: { headers: [] } },
      { id: 'email2', payload: { headers: [] } }
    ]);
    const mockGetEmail = jest.fn().mockImplementation(id => 
      Promise.resolve({ id, payload: { headers: [] } })
    );
    
    (GmailMcpClient as jest.Mock).mockImplementation(() => ({
      connect: mockConnect,
      disconnect: mockDisconnect,
      searchEmails: mockSearchEmails,
      getEmail: mockGetEmail
    }));
    
    // Mock newsletter detector
    const mockDetectNewsletter = jest.fn().mockImplementation(() => 
      Promise.resolve({ 
        isNewsletter: true, 
        combinedScore: 0.9, 
        needsVerification: false,
        scores: []
      })
    );
    
    (createNewsletterDetector as jest.Mock).mockReturnValue({
      detectNewsletter: mockDetectNewsletter
    });
    
    // Mock content processor
    const mockProcessEmailContent = jest.fn().mockImplementation(() => 
      Promise.resolve({
        newsletterId: 'newsletter1',
        subject: 'Test Newsletter',
        sender: 'test@example.com',
        receivedDate: new Date().toISOString(),
        content: 'Newsletter content',
        summary: 'Newsletter summary',
        topics: ['topic1', 'topic2'],
        links: [{ url: 'https://example.com', title: 'Example' }]
      })
    );
    
    (createContentProcessor as jest.Mock).mockReturnValue({
      processEmailContent: mockProcessEmailContent
    });
    
    // Mock categorizer
    const mockCategorizeNewsletter = jest.fn().mockResolvedValue([
      {
        id: 'cat1',
        name: 'Technology',
        description: 'Tech news and updates',
        confidence: 0.9
      }
    ]);
    
    (createCategorizer as jest.Mock).mockReturnValue({
      categorizeNewsletter: mockCategorizeNewsletter
    });
  });
  
  it('should have the correct name and description', () => {
    expect(GetNewslettersTool.name).toBe('get_newsletters');
    expect(GetNewslettersTool.description).toContain('Retrieves newsletters');
  });
  
  it('should retrieve newsletters with default parameters', async () => {
    const result = await GetNewslettersTool.handler({});
    
    // Verify Gmail client was connected and disconnected
    expect(GmailMcpClient).toHaveBeenCalled();
    const mockGmailInstance = (GmailMcpClient as jest.Mock).mock.instances[0];
    expect(mockGmailInstance.connect).toHaveBeenCalled();
    expect(mockGmailInstance.disconnect).toHaveBeenCalled();
    
    // Verify emails were searched
    expect(mockGmailInstance.searchEmails).toHaveBeenCalledWith(
      expect.stringContaining('is:inbox'),
      expect.objectContaining({ maxResults: expect.any(Number) })
    );
    
    // Check result structure
    expect(result).toHaveProperty('content');
    expect(result.content).toHaveLength(2);
    expect(result.content[0].type).toBe('text');
    expect(result.content[1].type).toBe('json');
    expect(result.content[1].json).toHaveProperty('newsletters');
    expect(result.content[1].json.newsletters.length).toBeGreaterThan(0);
  });
  
  it('should apply time range filters correctly', async () => {
    const timeRange = {
      startDate: '2023-01-01',
      endDate: '2023-12-31'
    };
    
    await GetNewslettersTool.handler({ timeRange });
    
    const mockGmailInstance = (GmailMcpClient as jest.Mock).mock.instances[0];
    expect(mockGmailInstance.searchEmails).toHaveBeenCalledWith(
      expect.stringContaining('after:2023/01/01 before:2023/12/31'),
      expect.anything()
    );
  });
  
  it('should apply source filters correctly', async () => {
    const sources = ['newsletter@example.com', 'updates@company.com'];
    
    await GetNewslettersTool.handler({ sources });
    
    const mockGmailInstance = (GmailMcpClient as jest.Mock).mock.instances[0];
    expect(mockGmailInstance.searchEmails).toHaveBeenCalledWith(
      expect.stringContaining('from:newsletter@example.com OR from:updates@company.com'),
      expect.anything()
    );
  });
  
  it('should respect the limit parameter', async () => {
    const limit = 5;
    
    await GetNewslettersTool.handler({ limit });
    
    const mockGmailInstance = (GmailMcpClient as jest.Mock).mock.instances[0];
    expect(mockGmailInstance.searchEmails).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ maxResults: 5 })
    );
  });
  
  it('should include content when requested', async () => {
    const result = await GetNewslettersTool.handler({ includeContent: true });
    
    const newsletters = result.content[1].json.newsletters;
    expect(newsletters[0]).toHaveProperty('content');
    expect(newsletters[0]).toHaveProperty('links');
  });
  
  it('should handle errors gracefully', async () => {
    // Make Gmail client throw an error
    (GmailMcpClient as jest.Mock).mockImplementation(() => ({
      connect: jest.fn().mockRejectedValue(new Error('Connection failed')),
      disconnect: jest.fn().mockResolvedValue(undefined),
      searchEmails: jest.fn(),
      getEmail: jest.fn()
    }));
    
    const result = await GetNewslettersTool.handler({});
    
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Error');
  });
});