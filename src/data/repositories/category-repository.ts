/**
 * Category Repository Implementation
 * Implements the CategoryRepository interface
 */

import { 
  DatabaseConnection, 
  CategoryEntity, 
  CategoryRepository, 
  Transaction, 
  Repository 
} from '../interfaces.js';
import { BaseRepository } from './base-repository.js';
import { CacheManager } from '../interfaces.js';
import { Logger } from '../../utils/logger.js';

/**
 * Implementation of the CategoryRepository interface
 */
export class CategoryRepositoryImpl extends BaseRepository<CategoryEntity> implements CategoryRepository {
  private logger: Logger;
  
  constructor(connection: DatabaseConnection, cache?: CacheManager) {
    super(connection, 'categories', cache);
    this.logger = new Logger('CategoryRepository');
  }
  
  /**
   * Find a category with its parent
   * @param categoryId The category ID
   */
  async findWithParent(categoryId: string): Promise<CategoryEntity & { parent?: CategoryEntity } | null> {
    try {
      // Find the category
      const category = await this.findById(categoryId);
      
      if (!category) {
        return null;
      }
      
      // If the category doesn't have a parent ID, return it without a parent
      if (!category.parentId) {
        return { ...category, parent: undefined };
      }
      
      // Find the parent category
      const parent = await this.findById(category.parentId);
      
      // Return category with its parent
      return {
        ...category,
        parent: parent || undefined
      };
    } catch (error) {
      this.logger.error(`Error finding category with parent: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Find a category with its children
   * @param categoryId The category ID
   */
  async findWithChildren(categoryId: string): Promise<CategoryEntity & { children: CategoryEntity[] } | null> {
    try {
      // Find the category
      const category = await this.findById(categoryId);
      
      if (!category) {
        return null;
      }
      
      // Get the Knex query builder
      const knex = this.connection.getConnection();
      
      // Find all child categories
      const childCategories = await knex('categories')
        .where({ parent_id: categoryId })
        .orderBy('name');
      
      // Transform property names from snake_case to camelCase
      const children = childCategories.map(child => this.mapToCamelCase(child) as CategoryEntity);
      
      // Return category with its children
      return {
        ...category,
        children
      };
    } catch (error) {
      this.logger.error(`Error finding category with children: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Create a repository instance that uses a transaction
   * @param transaction The transaction
   */
  protected createTransactionRepository(transaction: Transaction): Repository<CategoryEntity> {
    // Cast the transaction to any to access getKnexTransaction method
    const knexTransaction = (transaction as any).getKnexTransaction();
    
    // Create a new repository with the transaction
    const repo = new CategoryRepositoryImpl(this.connection, this.cache);
    
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