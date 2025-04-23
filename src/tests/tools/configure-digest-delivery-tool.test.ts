/**
 * Tests for ConfigureDigestDeliveryTool
 */

import { ConfigureDigestDeliveryTool } from '../../tools/configure-digest-delivery-tool.js';
import { getRepositoryFactory } from '../../data/index.js';
import { createDigestService } from '../../core/digest/index.js';

// Mock dependencies
jest.mock('../../data/index.js');
jest.mock('../../core/digest/index.js');

describe('ConfigureDigestDeliveryTool', () => {
  // Mock data
  const mockUser = {
    id: 'user123',
    email: 'user@example.com',
    name: 'Test User',
    createdAt: new Date()
  };
  
  // Setup mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock repository factory and repositories
    const mockUserRepository = {
      findById: jest.fn().mockResolvedValue(mockUser)
    };
    
    const mockUserPreferenceRepository = {
      setPreference: jest.fn().mockResolvedValue(undefined),
      getAllForUser: jest.fn().mockResolvedValue({})
    };
    
    (getRepositoryFactory as jest.Mock).mockReturnValue({
      getSpecializedRepository: jest.fn().mockImplementation((repoName) => {
        if (repoName === 'UserRepository') return mockUserRepository;
        if (repoName === 'UserPreferenceRepository') return mockUserPreferenceRepository;
        return null;
      })
    });
    
    // Mock digest service
    const mockUpdateSchedule = jest.fn().mockResolvedValue(undefined);
    const mockGetNextDeliveryTime = jest.fn().mockResolvedValue(new Date());
    
    (createDigestService as jest.Mock).mockReturnValue({
      updateSchedule: mockUpdateSchedule,
      getNextDeliveryTime: mockGetNextDeliveryTime
    });
  });
  
  it('should have the correct name and description', () => {
    expect(ConfigureDigestDeliveryTool.name).toBe('configure_digest_delivery');
    expect(ConfigureDigestDeliveryTool.description).toContain('Sets up email digest delivery preferences');
  });
  
  it('should configure basic digest delivery settings', async () => {
    const args = {
      userId: 'user123',
      frequency: 'daily',
      deliveryTime: '08:30',
      timeZone: 'America/New_York',
      enabled: true
    };
    
    const result = await ConfigureDigestDeliveryTool.handler(args);
    
    // Check repository calls
    const repositoryFactory = getRepositoryFactory();
    const userRepository = repositoryFactory.getSpecializedRepository('UserRepository');
    const userPreferenceRepository = repositoryFactory.getSpecializedRepository('UserPreferenceRepository');
    
    expect(userRepository.findById).toHaveBeenCalledWith('user123');
    expect(userPreferenceRepository.setPreference).toHaveBeenCalledWith(
      'user123',
      'digestConfig',
      expect.any(String)
    );
    
    // Check digest service was called
    const digestService = createDigestService();
    expect(digestService.updateSchedule).toHaveBeenCalledWith(
      'user123',
      expect.objectContaining({
        frequency: 'daily',
        deliveryTime: { hours: 8, minutes: 30 },
        timeZone: 'America/New_York',
        enabled: true
      })
    );
    
    // Check result structure
    expect(result).toHaveProperty('content');
    expect(result.content).toHaveLength(2);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('configured successfully');
    expect(result.content[1].type).toBe('json');
    expect(result.content[1].json).toHaveProperty('configuration');
    expect(result.content[1].json).toHaveProperty('nextDelivery');
  });
  
  it('should handle custom schedule for weekly digest', async () => {
    const args = {
      userId: 'user123',
      frequency: 'custom',
      deliveryTime: '18:00',
      customSchedule: [1, 3, 5], // Monday, Wednesday, Friday
      timeZone: 'UTC'
    };
    
    await ConfigureDigestDeliveryTool.handler(args);
    
    // Check userPreferenceRepository was called with correct config
    const repositoryFactory = getRepositoryFactory();
    const userPreferenceRepository = repositoryFactory.getSpecializedRepository('UserPreferenceRepository');
    
    expect(userPreferenceRepository.setPreference).toHaveBeenCalledWith(
      'user123',
      'digestConfig',
      expect.stringContaining('customSchedule')
    );
    
    // Verify the custom schedule was included in the digestConfig
    const digestConfigArg = userPreferenceRepository.setPreference.mock.calls[0][2];
    const parsedConfig = JSON.parse(digestConfigArg);
    expect(parsedConfig.customSchedule).toEqual([1, 3, 5]);
  });
  
  it('should reject invalid delivery time format', async () => {
    const args = {
      userId: 'user123',
      frequency: 'daily',
      deliveryTime: '25:70', // Invalid time
      timeZone: 'UTC'
    };
    
    const result = await ConfigureDigestDeliveryTool.handler(args);
    
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Error');
    expect(result.content[0].text).toContain('Invalid delivery time');
  });
  
  it('should require custom schedule when frequency is custom', async () => {
    const args = {
      userId: 'user123',
      frequency: 'custom',
      deliveryTime: '12:00',
      timeZone: 'UTC'
      // Missing customSchedule
    };
    
    const result = await ConfigureDigestDeliveryTool.handler(args);
    
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Error');
    expect(result.content[0].text).toContain('Custom schedule is required');
  });
  
  it('should handle format preferences', async () => {
    const args = {
      userId: 'user123',
      frequency: 'weekly',
      deliveryTime: '09:00',
      timeZone: 'Europe/London',
      formatPreferences: {
        type: 'html',
        template: 'modern',
        includeImages: true,
        includeFullContent: false
      }
    };
    
    await ConfigureDigestDeliveryTool.handler(args);
    
    // Check digestService.updateSchedule was called with formatPreferences
    const digestService = createDigestService();
    
    expect(digestService.updateSchedule).toHaveBeenCalledWith(
      'user123',
      expect.objectContaining({
        format: expect.objectContaining({
          type: 'html',
          template: 'modern',
          includeImages: true,
          includeFullContent: false
        })
      })
    );
  });
  
  it('should handle errors when user not found', async () => {
    // Mock user not found
    const repositoryFactory = getRepositoryFactory();
    const userRepository = repositoryFactory.getSpecializedRepository('UserRepository');
    (userRepository.findById as jest.Mock).mockResolvedValue(null);
    
    const args = {
      userId: 'nonexistent',
      frequency: 'daily',
      deliveryTime: '10:00',
      timeZone: 'UTC'
    };
    
    const result = await ConfigureDigestDeliveryTool.handler(args);
    
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Error');
    expect(result.content[0].text).toContain('User with ID nonexistent not found');
  });
});