/**
 * User Preference Manager Implementation
 * Manages user preferences for email digests
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  DigestFormat, 
  DigestFrequency, 
  DigestPreferences, 
  UserPreferenceManager 
} from './interfaces.js';
import { Logger } from '../../utils/logger.js';

/**
 * Implementation of the UserPreferenceManager interface
 */
export class UserPreferenceManagerImpl implements UserPreferenceManager {
  private logger: Logger;
  
  // In-memory storage for user preferences (would be replaced by database in production)
  private userPreferences: Map<string, DigestPreferences>;
  
  constructor() {
    this.logger = new Logger('UserPreferenceManager');
    this.userPreferences = new Map<string, DigestPreferences>();
    
    // Add some default preferences for testing
    this.addDefaultPreferences();
  }

  /**
   * Get digest preferences for a user
   * @param userId The ID of the user
   */
  async getDigestPreferences(userId: string): Promise<DigestPreferences | null> {
    try {
      this.logger.info(`Getting digest preferences for user: ${userId}`);
      
      // Get user preferences from storage
      const preferences = this.userPreferences.get(userId);
      
      if (!preferences) {
        this.logger.info(`No preferences found for user: ${userId}`);
        return null;
      }
      
      this.logger.info(`Retrieved preferences for user: ${userId}`);
      return preferences;
    } catch (error) {
      this.logger.error(`Error getting digest preferences: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to get digest preferences: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update digest preferences for a user
   * @param userId The ID of the user
   * @param preferences The digest preferences to update
   */
  async updateDigestPreferences(
    userId: string, 
    preferences: Partial<DigestPreferences>
  ): Promise<DigestPreferences> {
    try {
      this.logger.info(`Updating digest preferences for user: ${userId}`);
      
      // Get existing preferences or create new ones
      let existingPreferences = this.userPreferences.get(userId);
      
      if (!existingPreferences) {
        // Create default preferences
        existingPreferences = this.createDefaultPreferences(userId);
      }
      
      // Update preferences
      const updatedPreferences: DigestPreferences = {
        ...existingPreferences,
        ...preferences,
        updatedAt: new Date()
      };
      
      // Store updated preferences
      this.userPreferences.set(userId, updatedPreferences);
      
      this.logger.info(`Updated preferences for user: ${userId}`);
      return updatedPreferences;
    } catch (error) {
      this.logger.error(`Error updating digest preferences: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to update digest preferences: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Add a category to a user's digest preferences
   * @param userId The ID of the user
   * @param categoryId The ID of the category to add
   */
  async addCategory(userId: string, categoryId: string): Promise<DigestPreferences> {
    try {
      this.logger.info(`Adding category ${categoryId} to user: ${userId}`);
      
      // Get existing preferences
      let preferences = await this.getDigestPreferences(userId);
      
      if (!preferences) {
        // Create default preferences
        preferences = this.createDefaultPreferences(userId);
      }
      
      // Initialize categories array if needed
      if (!preferences.categories) {
        preferences.categories = [];
      }
      
      // Add category if not already present
      if (!preferences.categories.includes(categoryId)) {
        preferences.categories.push(categoryId);
        preferences.updatedAt = new Date();
        
        // Store updated preferences
        this.userPreferences.set(userId, preferences);
      }
      
      this.logger.info(`Added category ${categoryId} to user: ${userId}`);
      return preferences;
    } catch (error) {
      this.logger.error(`Error adding category: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to add category: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Remove a category from a user's digest preferences
   * @param userId The ID of the user
   * @param categoryId The ID of the category to remove
   */
  async removeCategory(userId: string, categoryId: string): Promise<DigestPreferences> {
    try {
      this.logger.info(`Removing category ${categoryId} from user: ${userId}`);
      
      // Get existing preferences
      let preferences = await this.getDigestPreferences(userId);
      
      if (!preferences) {
        // Create default preferences
        preferences = this.createDefaultPreferences(userId);
      }
      
      // Remove category if present
      if (preferences.categories) {
        preferences.categories = preferences.categories.filter(id => id !== categoryId);
        preferences.updatedAt = new Date();
        
        // Store updated preferences
        this.userPreferences.set(userId, preferences);
      }
      
      this.logger.info(`Removed category ${categoryId} from user: ${userId}`);
      return preferences;
    } catch (error) {
      this.logger.error(`Error removing category: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to remove category: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Exclude a newsletter from a user's digests
   * @param userId The ID of the user
   * @param newsletterId The ID of the newsletter to exclude
   */
  async excludeNewsletter(userId: string, newsletterId: string): Promise<DigestPreferences> {
    try {
      this.logger.info(`Excluding newsletter ${newsletterId} for user: ${userId}`);
      
      // Get existing preferences
      let preferences = await this.getDigestPreferences(userId);
      
      if (!preferences) {
        // Create default preferences
        preferences = this.createDefaultPreferences(userId);
      }
      
      // Initialize excludedNewsletters array if needed
      if (!preferences.excludedNewsletters) {
        preferences.excludedNewsletters = [];
      }
      
      // Add newsletter to excluded list if not already present
      if (!preferences.excludedNewsletters.includes(newsletterId)) {
        preferences.excludedNewsletters.push(newsletterId);
        preferences.updatedAt = new Date();
        
        // Store updated preferences
        this.userPreferences.set(userId, preferences);
      }
      
      this.logger.info(`Excluded newsletter ${newsletterId} for user: ${userId}`);
      return preferences;
    } catch (error) {
      this.logger.error(`Error excluding newsletter: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to exclude newsletter: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Include a previously excluded newsletter in a user's digests
   * @param userId The ID of the user
   * @param newsletterId The ID of the newsletter to include
   */
  async includeNewsletter(userId: string, newsletterId: string): Promise<DigestPreferences> {
    try {
      this.logger.info(`Including newsletter ${newsletterId} for user: ${userId}`);
      
      // Get existing preferences
      let preferences = await this.getDigestPreferences(userId);
      
      if (!preferences) {
        // Create default preferences
        preferences = this.createDefaultPreferences(userId);
      }
      
      // Remove newsletter from excluded list if present
      if (preferences.excludedNewsletters) {
        preferences.excludedNewsletters = preferences.excludedNewsletters.filter(id => id !== newsletterId);
        preferences.updatedAt = new Date();
        
        // Store updated preferences
        this.userPreferences.set(userId, preferences);
      }
      
      this.logger.info(`Included newsletter ${newsletterId} for user: ${userId}`);
      return preferences;
    } catch (error) {
      this.logger.error(`Error including newsletter: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to include newsletter: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create default preferences for a user
   * @param userId The ID of the user
   */
  private createDefaultPreferences(userId: string): DigestPreferences {
    const now = new Date();
    
    return {
      userId,
      email: `user-${userId}@example.com`, // This would be fetched from user profile in production
      frequency: DigestFrequency.DAILY,
      format: DigestFormat.STANDARD,
      timeOfDay: '08:00',
      timezone: 'America/New_York',
      categories: [],
      excludedNewsletters: [],
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Add default preferences for testing
   */
  private addDefaultPreferences(): void {
    // Add a default user for testing
    const userId = 'user-1';
    
    const preferences: DigestPreferences = {
      userId,
      email: 'user1@example.com',
      frequency: DigestFrequency.DAILY,
      format: DigestFormat.STANDARD,
      timeOfDay: '08:00',
      dayOfWeek: 1, // Monday
      timezone: 'America/New_York',
      categories: ['technology', 'business'],
      excludedNewsletters: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.userPreferences.set(userId, preferences);
    
    // Add a weekly user for testing
    const weeklyUserId = 'user-2';
    
    const weeklyPreferences: DigestPreferences = {
      userId: weeklyUserId,
      email: 'user2@example.com',
      frequency: DigestFrequency.WEEKLY,
      format: DigestFormat.DETAILED,
      timeOfDay: '10:00',
      dayOfWeek: 5, // Friday
      timezone: 'Europe/London',
      categories: ['science', 'health'],
      excludedNewsletters: ['newsletter-3'],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.userPreferences.set(weeklyUserId, weeklyPreferences);
  }
}