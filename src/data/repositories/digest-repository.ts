/**
 * Digest Repository Implementation
 * Implements the DigestRepository interface
 */

import { 
  DatabaseConnection, 
  DigestEntity, 
  DigestRepository, 
  Transaction, 
  Repository, 
  DigestItemEntity, 
  NewsletterEntity 
} from '../interfaces.js';
import { BaseRepository } from './base-repository.js';
import { CacheManager } from '../interfaces.js';
import { Logger } from '../../utils/logger.js';

/**
 * Implementation of the DigestRepository interface
 */
export class DigestRepositoryImpl extends BaseRepository<DigestEntity> implements DigestRepository {
  private logger: Logger;
  
  constructor(connection: DatabaseConnection, cache?: CacheManager) {
    super(connection, 'digests', cache);
    this.logger = new Logger('DigestRepository');
  }
  
  /**
   * Find digest with its items and associated newsletters
   * @param digestId The digest ID
   */
  async findWithItems(digestId: string): Promise<DigestEntity & { items: Array<DigestItemEntity & { newsletter: NewsletterEntity }> } | null> {
    try {
      // Find the digest
      const digest = await this.findById(digestId);
      
      if (!digest) {
        return null;
      }
      
      // Get the Knex query builder
      const knex = this.connection.getConnection();
      
      // Get digest items with newsletters
      const items = await knex('digest_items')
        .join('newsletters', 'digest_items.newsletter_id', 'newsletters.id')
        .where('digest_items.digest_id', digestId)
        .orderBy('digest_items.position')
        .select('digest_items.*', 'newsletters.*');
      
      // Transform property names from snake_case to camelCase and structure the items
      const transformedItems = items.map(item => {
        // Extract and transform digest item fields
        const digestItem = {
          id: item.id,
          digestId: item.digest_id,
          newsletterId: item.newsletter_id,
          position: item.position,
          createdAt: item.created_at,
          updatedAt: item.updated_at
        } as DigestItemEntity;
        
        // Extract and transform newsletter fields
        const newsletter = this.mapToCamelCase({
          id: item.id,
          email_id: item.email_id,
          subject: item.subject,
          sender: item.sender,
          received_date: item.received_date,
          content_html: item.content_html,
          content_text: item.content_text,
          processed_content_json: item.processed_content_json,
          metadata_json: item.metadata_json,
          detection_confidence: item.detection_confidence,
          is_verified: item.is_verified,
          created_at: item.created_at,
          updated_at: item.updated_at
        }) as NewsletterEntity;
        
        // Combine digest item with newsletter
        return {
          ...digestItem,
          newsletter
        };
      });
      
      // Return digest with items
      return {
        ...digest,
        items: transformedItems
      };
    } catch (error) {
      this.logger.error(`Error finding digest with items: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Find digests by user and date range
   * @param userId The user ID
   * @param startDate The start date
   * @param endDate The end date
   */
  async findByUserAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<DigestEntity[]> {
    try {
      // Get the Knex query builder
      const knex = this.connection.getConnection();
      
      // Query the database
      const results = await knex('digests')
        .where({ user_id: userId })
        .whereBetween('generation_date', [startDate, endDate])
        .orderBy('generation_date', 'desc');
      
      // Transform property names from snake_case to camelCase
      return results.map(result => this.mapToCamelCase(result) as DigestEntity);
    } catch (error) {
      this.logger.error(`Error finding digests by user and date range: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Create a repository instance that uses a transaction
   * @param transaction The transaction
   */
  protected createTransactionRepository(transaction: Transaction): Repository<DigestEntity> {
    // Cast the transaction to any to access getKnexTransaction method
    const knexTransaction = (transaction as any).getKnexTransaction();
    
    // Create a new repository with the transaction
    const repo = new DigestRepositoryImpl(this.connection, this.cache);
    
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