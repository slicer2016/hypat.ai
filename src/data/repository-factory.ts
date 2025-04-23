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
  QueryOptions, 
  Transaction, 
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
 * Base repository implementation for CRUD operations
 */
export class BaseRepository<T extends Entity> implements Repository<T> {
  protected connection: DatabaseConnection;
  protected tableName: string;
  protected logger: Logger;
  protected cache?: CacheManager;
  
  constructor(connection: DatabaseConnection, tableName: string, cache?: CacheManager) {
    this.connection = connection;
    this.tableName = tableName;
    this.logger = new Logger(`BaseRepository:${tableName}`);
    this.cache = cache;
  }
  
  /**
   * Find an entity by ID
   * @param id The entity ID
   */
  async findById(id: string): Promise<T | null> {
    try {
      // Check cache first if available
      if (this.cache) {
        const cacheKey = `${this.tableName}:${id}`;
        const entityCache = this.cache.getCache(this.tableName);
        const cachedEntity = await entityCache.get<T>(cacheKey);
        
        if (cachedEntity) {
          this.logger.debug(`Cache hit for ${this.tableName}:${id}`);
          return cachedEntity;
        }
      }
      
      // Get the Knex query builder
      const knex = this.connection.getConnection();
      
      // Query the database
      const result = await knex(this.tableName)
        .where({ id })
        .first();
      
      if (!result) {
        return null;
      }
      
      // Transform property names from snake_case to camelCase
      const entity = this.mapToCamelCase(result) as T;
      
      // Cache the result if caching is enabled
      if (this.cache) {
        const cacheKey = `${this.tableName}:${id}`;
        const entityCache = this.cache.getCache(this.tableName);
        await entityCache.set(cacheKey, entity);
      }
      
      return entity;
    } catch (error) {
      this.logger.error(`Error in findById: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Find entities based on query options
   * @param options Query options for filtering, sorting, and pagination
   */
  async find(options?: QueryOptions<T>): Promise<T[]> {
    try {
      // Get the Knex query builder
      const knex = this.connection.getConnection();
      
      // Start building the query
      let query = knex(this.tableName);
      
      // Apply filters
      if (options?.where) {
        // Convert camelCase to snake_case for the database
        const snakeCaseWhere = this.mapToSnakeCase(options.where);
        query = query.where(snakeCaseWhere);
      }
      
      // Apply sorting
      if (options?.orderBy) {
        if (Array.isArray(options.orderBy)) {
          for (const orderItem of options.orderBy) {
            if (typeof orderItem === 'string') {
              // Convert camelCase to snake_case
              const snakeCaseField = this.camelToSnakeCase(orderItem as string);
              query = query.orderBy(snakeCaseField);
            } else {
              // Complex ordering with field and direction
              const field = this.camelToSnakeCase(orderItem.field as string);
              query = query.orderBy(field, orderItem.direction);
            }
          }
        } else {
          // Single string field
          const field = this.camelToSnakeCase(options.orderBy as string);
          query = query.orderBy(field);
        }
      } else {
        // Default sorting by ID
        query = query.orderBy('id');
      }
      
      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
        
        if (options.offset) {
          query = query.offset(options.offset);
        } else if (options.page) {
          const offset = (options.page - 1) * options.limit;
          query = query.offset(offset);
        }
      }
      
      // Select specific fields if requested
      if (options?.select && options.select.length > 0) {
        // Convert camelCase fields to snake_case
        const fields = options.select.map(field => this.camelToSnakeCase(field as string));
        query = query.select(...fields);
      }
      
      // Execute the query
      const results = await query;
      
      // Transform results from snake_case to camelCase
      return results.map(result => this.mapToCamelCase(result) as T);
    } catch (error) {
      this.logger.error(`Error in find: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Find a single entity based on query options
   * @param options Query options for filtering
   */
  async findOne(options: QueryOptions<T>): Promise<T | null> {
    try {
      // Get the Knex query builder
      const knex = this.connection.getConnection();
      
      // Start building the query
      let query = knex(this.tableName);
      
      // Apply filters
      if (options.where) {
        // Convert camelCase to snake_case for the database
        const snakeCaseWhere = this.mapToSnakeCase(options.where);
        query = query.where(snakeCaseWhere);
      }
      
      // Select specific fields if requested
      if (options.select && options.select.length > 0) {
        // Convert camelCase fields to snake_case
        const fields = options.select.map(field => this.camelToSnakeCase(field as string));
        query = query.select(...fields);
      }
      
      // Get the first matching record
      const result = await query.first();
      
      if (!result) {
        return null;
      }
      
      // Transform properties from snake_case to camelCase
      return this.mapToCamelCase(result) as T;
    } catch (error) {
      this.logger.error(`Error in findOne: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Count entities based on query options
   * @param options Query options for filtering
   */
  async count(options?: QueryOptions<T>): Promise<number> {
    try {
      // Get the Knex query builder
      const knex = this.connection.getConnection();
      
      // Start building the query
      let query = knex(this.tableName);
      
      // Apply filters
      if (options?.where) {
        // Convert camelCase to snake_case for the database
        const snakeCaseWhere = this.mapToSnakeCase(options.where);
        query = query.where(snakeCaseWhere);
      }
      
      // Execute the count query
      const result = await query.count('id as count').first();
      
      return parseInt(result.count as string, 10);
    } catch (error) {
      this.logger.error(`Error in count: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Create a new entity
   * @param entity The entity to create
   */
  async create(entity: Partial<T>): Promise<T> {
    try {
      // Get the Knex query builder
      const knex = this.connection.getConnection();
      
      // Prepare the entity for insertion
      const now = new Date();
      const entityToCreate = {
        ...entity,
        id: entity.id || uuidv4(),
        createdAt: entity.createdAt || now,
        updatedAt: entity.updatedAt || now
      };
      
      // Convert camelCase to snake_case for the database
      const snakeCaseEntity = this.mapToSnakeCase(entityToCreate);
      
      // Insert the entity
      await knex(this.tableName).insert(snakeCaseEntity);
      
      // Retrieve the created entity
      const createdEntity = await this.findById(entityToCreate.id as string);
      
      if (!createdEntity) {
        throw new Error(`Failed to retrieve created entity with ID: ${entityToCreate.id}`);
      }
      
      // Cache the created entity if caching is enabled
      if (this.cache) {
        const cacheKey = `${this.tableName}:${createdEntity.id}`;
        const entityCache = this.cache.getCache(this.tableName);
        await entityCache.set(cacheKey, createdEntity);
      }
      
      return createdEntity;
    } catch (error) {
      this.logger.error(`Error in create: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Create multiple entities
   * @param entities The entities to create
   */
  async createMany(entities: Partial<T>[]): Promise<T[]> {
    try {
      // Get the Knex query builder
      const knex = this.connection.getConnection();
      
      // Start a transaction
      const transaction = await this.connection.beginTransaction();
      
      try {
        // Prepare the entities for insertion
        const now = new Date();
        const entitiesToCreate = entities.map(entity => ({
          ...entity,
          id: entity.id || uuidv4(),
          createdAt: entity.createdAt || now,
          updatedAt: entity.updatedAt || now
        }));
        
        // Convert camelCase to snake_case for all entities
        const snakeCaseEntities = entitiesToCreate.map(entity => this.mapToSnakeCase(entity));
        
        // Insert all entities in a single transaction
        const knexTransaction = (transaction as any).getKnexTransaction();
        await knexTransaction(this.tableName).insert(snakeCaseEntities);
        
        // Commit the transaction
        await transaction.commit();
        
        // Retrieve all created entities
        const createdEntityIds = entitiesToCreate.map(entity => entity.id as string);
        const createdEntities: T[] = [];
        
        for (const id of createdEntityIds) {
          const entity = await this.findById(id);
          if (entity) {
            createdEntities.push(entity);
            
            // Cache the entity if caching is enabled
            if (this.cache) {
              const cacheKey = `${this.tableName}:${id}`;
              const entityCache = this.cache.getCache(this.tableName);
              await entityCache.set(cacheKey, entity);
            }
          }
        }
        
        return createdEntities;
      } catch (error) {
        // Rollback the transaction on error
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      this.logger.error(`Error in createMany: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Update an entity
   * @param id The entity ID
   * @param entity The entity data to update
   */
  async update(id: string, entity: Partial<T>): Promise<T> {
    try {
      // Get the Knex query builder
      const knex = this.connection.getConnection();
      
      // Prepare the entity for update
      const entityToUpdate = {
        ...entity,
        updatedAt: new Date()
      };
      
      // Convert camelCase to snake_case for the database
      const snakeCaseEntity = this.mapToSnakeCase(entityToUpdate);
      
      // Update the entity
      await knex(this.tableName)
        .where({ id })
        .update(snakeCaseEntity);
      
      // Invalidate cache if enabled
      if (this.cache) {
        const cacheKey = `${this.tableName}:${id}`;
        const entityCache = this.cache.getCache(this.tableName);
        await entityCache.delete(cacheKey);
      }
      
      // Retrieve the updated entity
      const updatedEntity = await this.findById(id);
      
      if (!updatedEntity) {
        throw new Error(`Entity not found with ID: ${id}`);
      }
      
      return updatedEntity;
    } catch (error) {
      this.logger.error(`Error in update: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Update multiple entities
   * @param options Query options for filtering
   * @param entity The entity data to update
   */
  async updateMany(options: QueryOptions<T>, entity: Partial<T>): Promise<number> {
    try {
      // Get the Knex query builder
      const knex = this.connection.getConnection();
      
      // Prepare the entity for update
      const entityToUpdate = {
        ...entity,
        updatedAt: new Date()
      };
      
      // Convert camelCase to snake_case for the database
      const snakeCaseEntity = this.mapToSnakeCase(entityToUpdate);
      
      // Start building the query
      let query = knex(this.tableName);
      
      // Apply filters
      if (options.where) {
        // Convert camelCase to snake_case for the database
        const snakeCaseWhere = this.mapToSnakeCase(options.where);
        query = query.where(snakeCaseWhere);
      }
      
      // Get the IDs of entities that will be updated (for cache invalidation)
      let idsToInvalidate: string[] = [];
      if (this.cache) {
        const idsQuery = knex(this.tableName).select('id');
        
        if (options.where) {
          const snakeCaseWhere = this.mapToSnakeCase(options.where);
          idsQuery.where(snakeCaseWhere);
        }
        
        const idsResult = await idsQuery;
        idsToInvalidate = idsResult.map(row => row.id);
      }
      
      // Update the entities
      const result = await query.update(snakeCaseEntity);
      
      // Invalidate cache for updated entities
      if (this.cache && idsToInvalidate.length > 0) {
        const entityCache = this.cache.getCache(this.tableName);
        
        for (const id of idsToInvalidate) {
          const cacheKey = `${this.tableName}:${id}`;
          await entityCache.delete(cacheKey);
        }
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Error in updateMany: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Delete an entity
   * @param id The entity ID
   */
  async delete(id: string): Promise<boolean> {
    try {
      // Get the Knex query builder
      const knex = this.connection.getConnection();
      
      // Delete the entity
      const result = await knex(this.tableName)
        .where({ id })
        .delete();
      
      // Invalidate cache if enabled
      if (this.cache) {
        const cacheKey = `${this.tableName}:${id}`;
        const entityCache = this.cache.getCache(this.tableName);
        await entityCache.delete(cacheKey);
      }
      
      return result > 0;
    } catch (error) {
      this.logger.error(`Error in delete: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Delete multiple entities
   * @param options Query options for filtering
   */
  async deleteMany(options: QueryOptions<T>): Promise<number> {
    try {
      // Get the Knex query builder
      const knex = this.connection.getConnection();
      
      // Start building the query
      let query = knex(this.tableName);
      
      // Apply filters
      if (options.where) {
        // Convert camelCase to snake_case for the database
        const snakeCaseWhere = this.mapToSnakeCase(options.where);
        query = query.where(snakeCaseWhere);
      }
      
      // Get the IDs of entities that will be deleted (for cache invalidation)
      let idsToInvalidate: string[] = [];
      if (this.cache) {
        const idsQuery = knex(this.tableName).select('id');
        
        if (options.where) {
          const snakeCaseWhere = this.mapToSnakeCase(options.where);
          idsQuery.where(snakeCaseWhere);
        }
        
        const idsResult = await idsQuery;
        idsToInvalidate = idsResult.map(row => row.id);
      }
      
      // Delete the entities
      const result = await query.delete();
      
      // Invalidate cache for deleted entities
      if (this.cache && idsToInvalidate.length > 0) {
        const entityCache = this.cache.getCache(this.tableName);
        
        for (const id of idsToInvalidate) {
          const cacheKey = `${this.tableName}:${id}`;
          await entityCache.delete(cacheKey);
        }
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Error in deleteMany: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Execute a function within a transaction
   * @param fn The function to execute
   */
  async transaction<R>(fn: (repo: Repository<T>) => Promise<R>): Promise<R> {
    // Start a transaction
    const transaction = await this.connection.beginTransaction();
    
    try {
      // Create a new repository instance with the transaction
      const transactionRepo = this.createTransactionRepository(transaction);
      
      // Execute the function
      const result = await fn(transactionRepo);
      
      // Commit the transaction
      await transaction.commit();
      
      return result;
    } catch (error) {
      // Rollback the transaction on error
      await transaction.rollback();
      
      this.logger.error(`Error in transaction: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Create a repository instance that uses a transaction
   * @param transaction The transaction
   */
  protected createTransactionRepository(transaction: Transaction): Repository<T> {
    // This is a placeholder that should be overridden by derived classes
    return this;
  }
  
  /**
   * Get the database connection
   */
  getConnection(): DatabaseConnection {
    return this.connection;
  }
  
  /**
   * Convert a string from camelCase to snake_case
   * @param str The string to convert
   */
  protected camelToSnakeCase(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase();
  }
  
  /**
   * Convert a string from snake_case to camelCase
   * @param str The string to convert
   */
  protected snakeToCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }
  
  /**
   * Map an object's properties from camelCase to snake_case
   * @param obj The object to map
   */
  protected mapToSnakeCase(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = this.camelToSnakeCase(key);
      result[snakeKey] = value;
    }
    
    return result;
  }
  
  /**
   * Map an object's properties from snake_case to camelCase
   * @param obj The object to map
   */
  protected mapToCamelCase(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = this.snakeToCamelCase(key);
      result[camelKey] = value;
    }
    
    return result;
  }
}

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