/**
 * Newsletter Repository Implementation
 * Implements the NewsletterRepository interface
 */

import { 
  DatabaseConnection, 
  NewsletterEntity, 
  NewsletterRepository, 
  Transaction, 
  Repository, 
  CategoryEntity 
} from '../interfaces.js';
import { BaseRepository } from './base-repository.js';
import { CacheManager } from '../interfaces.js';
import { Logger } from '../../utils/logger.js';

/**
 * Implementation of the NewsletterRepository interface
 */
export class NewsletterRepositoryImpl extends BaseRepository<NewsletterEntity> implements NewsletterRepository {
  private logger: Logger;
  
  constructor(connection: DatabaseConnection, cache?: CacheManager) {
    super(connection, 'newsletters', cache);
    this.logger = new Logger('NewsletterRepository');
  }
  
  /**
   * Find newsletters by sender
   * @param sender The sender's email address
   */
  async findBySender(sender: string): Promise<NewsletterEntity[]> {
    try {
      // Get the Knex query builder
      const knex = this.connection.getConnection();
      
      // Query the database
      const results = await knex('newsletters')
        .where({ sender })
        .orderBy('received_date', 'desc');
      
      // Transform property names from snake_case to camelCase
      return results.map(result => this.mapToCamelCase(result) as NewsletterEntity);
    } catch (error) {
      this.logger.error(`Error finding newsletters by sender: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Find newsletters within a date range
   * @param startDate The start date
   * @param endDate The end date
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<NewsletterEntity[]> {
    try {
      // Get the Knex query builder
      const knex = this.connection.getConnection();
      
      // Query the database
      const results = await knex('newsletters')
        .whereBetween('received_date', [startDate, endDate])
        .orderBy('received_date', 'desc');
      
      // Transform property names from snake_case to camelCase
      return results.map(result => this.mapToCamelCase(result) as NewsletterEntity);
    } catch (error) {
      this.logger.error(`Error finding newsletters by date range: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Find a newsletter with its categories
   * @param newsletterId The newsletter ID
   */
  async findWithCategories(newsletterId: string): Promise<NewsletterEntity & { categories: CategoryEntity[] } | null> {
    try {
      // Find the newsletter
      const newsletter = await this.findById(newsletterId);
      
      if (!newsletter) {
        return null;
      }
      
      // Get the Knex query builder
      const knex = this.connection.getConnection();
      
      // Query categories for this newsletter through category_assignments
      const categories = await knex('categories')
        .join('category_assignments', 'categories.id', 'category_assignments.category_id')
        .where('category_assignments.newsletter_id', newsletterId)
        .orderBy('category_assignments.confidence', 'desc')
        .select('categories.*', 'category_assignments.confidence', 'category_assignments.is_manual');
      
      // Transform property names from snake_case to camelCase
      const transformedCategories = categories.map(category => {
        const transformedCategory = this.mapToCamelCase(category) as CategoryEntity & { confidence: number, isManual: boolean };
        return transformedCategory;
      });
      
      // Return newsletter with categories
      return {
        ...newsletter,
        categories: transformedCategories
      };
    } catch (error) {
      this.logger.error(`Error finding newsletter with categories: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Create a repository instance that uses a transaction
   * @param transaction The transaction
   */
  protected createTransactionRepository(transaction: Transaction): Repository<NewsletterEntity> {
    // Cast the transaction to any to access getKnexTransaction method
    const knexTransaction = (transaction as any).getKnexTransaction();
    
    // Create a new repository with the transaction
    const repo = new NewsletterRepositoryImpl(this.connection, this.cache);
    
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