/**
 * Repository Factory Implementation
 * Creates and manages repository instances for different entity types
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  DatabaseConnection, 
  Entity, 
  Repository, 
  RepositoryFactory, 
  UserRepository, 
  NewsletterRepository, 
  CategoryRepository, 
  FeedbackRepository, 
  DigestRepository,
  UserPreferenceRepository,
  CategoryAssignmentEntity,
  UserEntity,
  NewsletterEntity,
  CategoryEntity,
  FeedbackEntity,
  DigestEntity,
  DigestItemEntity,
  UserPreferenceEntity
} from './interfaces.js';
import { BaseRepository } from './repositories/base-repository.js';
import { 
  UserRepositoryImpl 
} from './repositories/user-repository.js';
import { 
  NewsletterRepositoryImpl 
} from './repositories/newsletter-repository.js';
import { 
  CategoryRepositoryImpl 
} from './repositories/category-repository.js';
import {
  CategoryAssignmentRepositoryImpl
} from './repositories/category-assignment-repository.js';
import { 
  FeedbackRepositoryImpl 
} from './repositories/feedback-repository.js';
import { 
  DigestRepositoryImpl 
} from './repositories/digest-repository.js';
import { 
  UserPreferenceRepositoryImpl 
} from './repositories/user-preference-repository.js';
import { Logger } from '../utils/logger.js';
import { CacheManager } from './interfaces.js';

// Map of entity types to table names
const entityToTableMap: Record<string, string> = {
  UserEntity: 'users',
  NewsletterEntity: 'newsletters',
  CategoryEntity: 'categories',
  CategoryAssignmentEntity: 'category_assignments',
  FeedbackEntity: 'feedback',
  DigestEntity: 'digests',
  DigestItemEntity: 'digest_items',
  UserPreferenceEntity: 'user_preferences'
};


/**
 * Implementation of the RepositoryFactory interface
 */
export class RepositoryFactoryImpl implements RepositoryFactory {
  private connection: DatabaseConnection;
  private repositoryCache: Map<string, Repository<any>> = new Map();
  private logger: Logger;
  private cacheManager?: CacheManager;
  
  constructor(connection: DatabaseConnection, cacheManager?: CacheManager) {
    this.connection = connection;
    this.cacheManager = cacheManager;
    this.logger = new Logger('RepositoryFactory');
  }
  
  /**
   * Get a repository for the specified entity type
   * @param entityType The entity type
   */
  getRepository<T extends Entity>(entityType: new () => T): Repository<T> {
    try {
      const entityTypeName = entityType.name;
      
      // Check if repository is already cached
      if (this.repositoryCache.has(entityTypeName)) {
        return this.repositoryCache.get(entityTypeName) as Repository<T>;
      }
      
      // Get the table name for the entity
      const tableName = entityToTableMap[entityTypeName];
      if (!tableName) {
        throw new Error(`No table mapping found for entity type: ${entityTypeName}`);
      }
      
      // Create the appropriate repository based on entity type
      let repository: Repository<T>;
      
      switch (entityTypeName) {
        case 'UserEntity':
          repository = new UserRepositoryImpl(this.connection, this.cacheManager) as unknown as Repository<T>;
          break;
        
        case 'NewsletterEntity':
          repository = new NewsletterRepositoryImpl(this.connection, this.cacheManager) as unknown as Repository<T>;
          break;
        
        case 'CategoryEntity':
          repository = new CategoryRepositoryImpl(this.connection, this.cacheManager) as unknown as Repository<T>;
          break;
        
        case 'FeedbackEntity':
          repository = new FeedbackRepositoryImpl(this.connection, this.cacheManager) as unknown as Repository<T>;
          break;
        
        case 'DigestEntity':
          repository = new DigestRepositoryImpl(this.connection, this.cacheManager) as unknown as Repository<T>;
          break;
        
        case 'UserPreferenceEntity':
          repository = new UserPreferenceRepositoryImpl(this.connection, this.cacheManager) as unknown as Repository<T>;
          break;
        
        default:
          // Create a generic repository for other entity types
          repository = new BaseRepository<T>(this.connection, tableName, this.cacheManager);
      }
      
      // Cache the repository
      this.repositoryCache.set(entityTypeName, repository);
      
      return repository;
    } catch (error) {
      this.logger.error(`Error in getRepository: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get a specialized repository by name
   * @param repositoryName The repository name
   */
  getSpecializedRepository<R>(repositoryName: string): R {
    try {
      // Check if repository is already cached
      if (this.repositoryCache.has(repositoryName)) {
        return this.repositoryCache.get(repositoryName) as R;
      }
      
      // Create the appropriate repository based on name
      let repository: any;
      
      switch (repositoryName) {
        case 'UserRepository':
          repository = new UserRepositoryImpl(this.connection, this.cacheManager);
          break;
        
        case 'NewsletterRepository':
          repository = new NewsletterRepositoryImpl(this.connection, this.cacheManager);
          break;
        
        case 'CategoryRepository':
          repository = new CategoryRepositoryImpl(this.connection, this.cacheManager);
          break;
        
        case 'FeedbackRepository':
          repository = new FeedbackRepositoryImpl(this.connection, this.cacheManager);
          break;
        
        case 'DigestRepository':
          repository = new DigestRepositoryImpl(this.connection, this.cacheManager);
          break;
        
        case 'UserPreferenceRepository':
          repository = new UserPreferenceRepositoryImpl(this.connection, this.cacheManager);
          break;
          
        case 'CategoryAssignmentRepository':
          repository = new CategoryAssignmentRepositoryImpl(this.connection, this.cacheManager);
          break;
        
        default:
          throw new Error(`Unknown repository name: ${repositoryName}`);
      }
      
      // Cache the repository
      this.repositoryCache.set(repositoryName, repository);
      
      return repository as R;
    } catch (error) {
      this.logger.error(`Error in getSpecializedRepository: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Clear the repository cache
   */
  clearCache(): void {
    this.repositoryCache.clear();
  }
  
  /**
   * Get the database connection
   */
  getConnection(): DatabaseConnection {
    return this.connection;
  }
}