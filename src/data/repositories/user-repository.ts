/**
 * User Repository Implementation
 * Implements the UserRepository interface
 */

import { 
  DatabaseConnection, 
  UserEntity, 
  UserRepository, 
  Transaction, 
  Repository 
} from '../interfaces.js';
import { BaseRepository } from '../repository-factory.js';
import { CacheManager } from '../interfaces.js';
import { Logger } from '../../utils/logger.js';

/**
 * Implementation of the UserRepository interface
 */
export class UserRepositoryImpl extends BaseRepository<UserEntity> implements UserRepository {
  private logger: Logger;
  
  constructor(connection: DatabaseConnection, cache?: CacheManager) {
    super(connection, 'users', cache);
    this.logger = new Logger('UserRepository');
  }
  
  /**
   * Find a user by email
   * @param email The user's email address
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    try {
      // Get the Knex query builder
      const knex = this.connection.getConnection();
      
      // Query the database
      const result = await knex('users')
        .where({ email })
        .first();
      
      if (!result) {
        return null;
      }
      
      // Transform property names from snake_case to camelCase
      return this.mapToCamelCase(result) as UserEntity;
    } catch (error) {
      this.logger.error(`Error finding user by email: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Find a user with their preferences
   * @param userId The user ID
   */
  async findWithPreferences(userId: string): Promise<UserEntity & { preferences: Record<string, any> } | null> {
    try {
      // Find the user
      const user = await this.findById(userId);
      
      if (!user) {
        return null;
      }
      
      // Get the Knex query builder
      const knex = this.connection.getConnection();
      
      // Query user preferences
      const preferences = await knex('user_preferences')
        .where({ user_id: userId })
        .select('preference_key', 'preference_value');
      
      // Convert preferences to a Record
      const preferencesRecord: Record<string, any> = {};
      
      for (const pref of preferences) {
        // Try to parse the value as JSON if it looks like JSON
        let value = pref.preference_value;
        
        if (value && 
            ((value.startsWith('{') && value.endsWith('}')) || 
             (value.startsWith('[') && value.endsWith(']')))) {
          try {
            value = JSON.parse(value);
          } catch (e) {
            // If parsing fails, keep the original string value
          }
        }
        
        preferencesRecord[this.snakeToCamelCase(pref.preference_key)] = value;
      }
      
      // Parse the preferencesJson if it exists
      if (user.preferencesJson) {
        try {
          const parsedPreferences = JSON.parse(user.preferencesJson);
          Object.assign(preferencesRecord, parsedPreferences);
        } catch (e) {
          this.logger.warn(`Failed to parse preferencesJson for user ${userId}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
      
      // Return user with preferences
      return {
        ...user,
        preferences: preferencesRecord
      };
    } catch (error) {
      this.logger.error(`Error finding user with preferences: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Create a repository instance that uses a transaction
   * @param transaction The transaction
   */
  protected createTransactionRepository(transaction: Transaction): Repository<UserEntity> {
    // Cast the transaction to any to access getKnexTransaction method
    const knexTransaction = (transaction as any).getKnexTransaction();
    
    // Create a new repository with the transaction
    const repo = new UserRepositoryImpl(this.connection, this.cache);
    
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