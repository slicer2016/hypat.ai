/**
 * Feedback Repository Implementation
 * Implements the FeedbackRepository interface
 */

import { 
  DatabaseConnection, 
  FeedbackEntity, 
  FeedbackRepository, 
  Transaction, 
  Repository 
} from '../interfaces.js';
import { BaseRepository } from '../repository-factory.js';
import { CacheManager } from '../interfaces.js';
import { Logger } from '../../utils/logger.js';

/**
 * Implementation of the FeedbackRepository interface
 */
export class FeedbackRepositoryImpl extends BaseRepository<FeedbackEntity> implements FeedbackRepository {
  private logger: Logger;
  
  constructor(connection: DatabaseConnection, cache?: CacheManager) {
    super(connection, 'feedback', cache);
    this.logger = new Logger('FeedbackRepository');
  }
  
  /**
   * Find feedback by user and newsletter
   * @param userId The user ID
   * @param newsletterId The newsletter ID
   */
  async findByUserAndNewsletter(userId: string, newsletterId: string): Promise<FeedbackEntity[]> {
    try {
      // Get the Knex query builder
      const knex = this.connection.getConnection();
      
      // Query the database
      const results = await knex('feedback')
        .where({
          user_id: userId,
          newsletter_id: newsletterId
        })
        .orderBy('created_at', 'desc');
      
      // Transform property names from snake_case to camelCase
      return results.map(result => this.mapToCamelCase(result) as FeedbackEntity);
    } catch (error) {
      this.logger.error(`Error finding feedback by user and newsletter: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get feedback statistics
   */
  async getStatistics(): Promise<Record<string, number>> {
    try {
      // Get the Knex query builder
      const knex = this.connection.getConnection();
      
      // Query feedback type counts
      const feedbackTypeCounts = await knex('feedback')
        .select('feedback_type')
        .count('id as count')
        .groupBy('feedback_type');
      
      // Transform into a record
      const statistics: Record<string, number> = {};
      
      for (const row of feedbackTypeCounts) {
        statistics[this.snakeToCamelCase(row.feedback_type)] = parseInt(row.count as string, 10);
      }
      
      // Get total count
      const totalCount = await knex('feedback').count('id as count').first();
      statistics.total = parseInt(totalCount?.count as string, 10) || 0;
      
      // Get unique users count
      const uniqueUsers = await knex('feedback').countDistinct('user_id as count').first();
      statistics.uniqueUsers = parseInt(uniqueUsers?.count as string, 10) || 0;
      
      // Get unique newsletters count
      const uniqueNewsletters = await knex('feedback').countDistinct('newsletter_id as count').first();
      statistics.uniqueNewsletters = parseInt(uniqueNewsletters?.count as string, 10) || 0;
      
      return statistics;
    } catch (error) {
      this.logger.error(`Error getting feedback statistics: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Create a repository instance that uses a transaction
   * @param transaction The transaction
   */
  protected createTransactionRepository(transaction: Transaction): Repository<FeedbackEntity> {
    // Cast the transaction to any to access getKnexTransaction method
    const knexTransaction = (transaction as any).getKnexTransaction();
    
    // Create a new repository with the transaction
    const repo = new FeedbackRepositoryImpl(this.connection, this.cache);
    
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