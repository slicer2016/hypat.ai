/**
 * Category Assignment Repository
 * Manages assignments of newsletters to categories
 */

import { BaseRepository } from './base-repository.js';
import { DatabaseConnection, CacheManager } from '../interfaces.js';
import { Logger } from '../../utils/logger.js';

import { CategoryAssignmentEntity, CategoryAssignmentRepository } from '../interfaces.js';

/**
 * Implementation of CategoryAssignmentRepository
 */
export class CategoryAssignmentRepositoryImpl extends BaseRepository<CategoryAssignmentEntity> implements CategoryAssignmentRepository {
  constructor(connection: DatabaseConnection, cache?: CacheManager) {
    super(connection, 'category_assignments', cache);
    this.logger = new Logger('CategoryAssignmentRepository');
  }

  /**
   * Find a category assignment by newsletter and category IDs
   * @param newsletterId The newsletter ID
   * @param categoryId The category ID
   */
  async findByNewsletterAndCategory(newsletterId: string, categoryId: string): Promise<CategoryAssignment | null> {
    return this.findOne({
      where: {
        newsletterId,
        categoryId
      }
    });
  }

  /**
   * Find all category assignments for a newsletter
   * @param newsletterId The newsletter ID
   */
  async findByNewsletter(newsletterId: string): Promise<CategoryAssignment[]> {
    return this.find({
      where: {
        newsletterId
      }
    });
  }

  /**
   * Find all category assignments for a category
   * @param categoryId The category ID
   */
  async findByCategory(categoryId: string): Promise<CategoryAssignment[]> {
    return this.find({
      where: {
        categoryId
      }
    });
  }

  /**
   * Delete all category assignments for a newsletter
   * @param newsletterId The newsletter ID
   */
  async deleteForNewsletter(newsletterId: string): Promise<number> {
    return this.deleteMany({
      where: {
        newsletterId
      }
    });
  }

  /**
   * Create a transaction repository
   * @param transaction The transaction
   */
  protected createTransactionRepository(transaction: any): CategoryAssignmentRepository {
    const repo = new CategoryAssignmentRepositoryImpl(transaction);
    return repo;
  }
}