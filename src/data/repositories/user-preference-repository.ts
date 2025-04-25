/**
 * User Preference Repository Implementation
 * Implements the UserPreferenceRepository interface
 */

import { 
  DatabaseConnection, 
  UserPreferenceEntity, 
  UserPreferenceRepository, 
  Transaction, 
  Repository 
} from '../interfaces.js';
import { BaseRepository } from './base-repository.js';
import { CacheManager } from '../interfaces.js';
import { Logger } from '../../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Implementation of the UserPreferenceRepository interface
 */
export class UserPreferenceRepositoryImpl extends BaseRepository<UserPreferenceEntity> implements UserPreferenceRepository {
  private logger: Logger;
  
  constructor(connection: DatabaseConnection, cache?: CacheManager) {
    super(connection, 'user_preferences', cache);
    this.logger = new Logger('UserPreferenceRepository');
  }
  
  /**
   * Get all preferences for a user
   * @param userId The user ID
   */
  async getAllForUser(userId: string): Promise<Record<string, string>> {
    try {
      // Get the Knex query builder
      const knex = this.connection.getConnection();
      
      // Query the database
      const preferences = await knex('user_preferences')
        .where({ user_id: userId })
        .select('preference_key', 'preference_value');
      
      // Transform into a record
      const preferencesRecord: Record<string, string> = {};
      
      for (const pref of preferences) {
        preferencesRecord[this.snakeToCamelCase(pref.preference_key)] = pref.preference_value;
      }
      
      return preferencesRecord;
    } catch (error) {
      this.logger.error(`Error getting user preferences: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Set a preference for a user
   * @param userId The user ID
   * @param key The preference key
   * @param value The preference value
   */
  async setPreference(userId: string, key: string, value: string): Promise<void> {
    try {
      // Get the Knex query builder
      const knex = this.connection.getConnection();
      
      // Convert key from camelCase to snake_case for the database
      const snakeKey = this.camelToSnakeCase(key);
      
      // Check if the preference already exists
      const existingPreference = await knex('user_preferences')
        .where({
          user_id: userId,
          preference_key: snakeKey
        })
        .first();
      
      if (existingPreference) {
        // Update existing preference
        await knex('user_preferences')
          .where({
            user_id: userId,
            preference_key: snakeKey
          })
          .update({
            preference_value: value,
            updated_at: new Date()
          });
      } else {
        // Create new preference
        await knex('user_preferences').insert({
          id: uuidv4(),
          user_id: userId,
          preference_key: snakeKey,
          preference_value: value,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
      
      // Invalidate cache if enabled
      if (this.cache) {
        const cacheKey = `userPreferences:${userId}`;
        const entityCache = this.cache.getCache('userPreferences');
        await entityCache.delete(cacheKey);
      }
    } catch (error) {
      this.logger.error(`Error setting user preference: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Create a repository instance that uses a transaction
   * @param transaction The transaction
   */
  protected createTransactionRepository(transaction: Transaction): Repository<UserPreferenceEntity> {
    // Cast the transaction to any to access getKnexTransaction method
    const knexTransaction = (transaction as any).getKnexTransaction();
    
    // Create a new repository with the transaction
    const repo = new UserPreferenceRepositoryImpl(this.connection, this.cache);
    
    // Override the getConnection method to use the transaction
    const originalGetConnection = repo.getConnection;
    repo.getConnection = () => {
      const conn = originalGetConnection.call(repo);
      // Return the transaction instead of the connection
      return {
        ...conn,
        getConnection: () => knexTransaction
      };
    };
    
    return repo;
  }
}