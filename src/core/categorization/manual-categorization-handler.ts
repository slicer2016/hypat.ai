/**
 * Manual Categorization Handler Implementation
 * Processes manual categorization of newsletters
 */

import { 
  CategoryAssignment, 
  CategoryManager, 
  CategoryMatcher, 
  ManualCategorizationHandler 
} from './interfaces.js';
import { Logger } from '../../utils/logger.js';

/**
 * Implementation of ManualCategorizationHandler
 */
export class ManualCategorizationHandlerImpl implements ManualCategorizationHandler {
  private logger: Logger;
  private categoryManager: CategoryManager;
  private categoryMatcher: CategoryMatcher;
  private userPreferences: Map<string, Map<string, number>>;
  private learningRate: number;

  constructor(
    categoryManager: CategoryManager, 
    categoryMatcher: CategoryMatcher, 
    learningRate = 0.1
  ) {
    this.logger = new Logger('ManualCategorizationHandler');
    this.categoryManager = categoryManager;
    this.categoryMatcher = categoryMatcher;
    this.userPreferences = new Map<string, Map<string, number>>();
    this.learningRate = learningRate;
  }

  /**
   * Assign a category to a newsletter manually
   * @param newsletterId The ID of the newsletter
   * @param categoryId The ID of the category
   * @param userId The ID of the user making the assignment
   */
  async assignCategory(newsletterId: string, categoryId: string, userId: string): Promise<CategoryAssignment> {
    try {
      this.logger.debug(`User ${userId} assigning category ${categoryId} to newsletter ${newsletterId}`);
      
      // Verify category exists
      const category = await this.categoryManager.getCategory(categoryId);
      if (!category) {
        throw new Error(`Category not found: ${categoryId}`);
      }
      
      // Create new assignment with manual flag
      const now = new Date();
      const assignment: CategoryAssignment = {
        newsletterId,
        categoryId,
        confidence: 1.0, // Maximum confidence for manual assignments
        isManual: true,
        assignedAt: now
      };
      
      // Update user preferences
      this.updateUserPreference(userId, categoryId, 1.0);
      
      // Learn from this assignment
      await this.learnFromAssignment(assignment);
      
      // Add to category matcher
      await (this.categoryMatcher as any).addCategoryAssignment(newsletterId, categoryId, true);
      
      return assignment;
    } catch (error) {
      this.logger.error(`Error assigning category: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to assign category: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Remove a category assignment
   * @param newsletterId The ID of the newsletter
   * @param categoryId The ID of the category
   * @param userId The ID of the user removing the assignment
   */
  async removeAssignment(newsletterId: string, categoryId: string, userId: string): Promise<boolean> {
    try {
      this.logger.debug(`User ${userId} removing category ${categoryId} from newsletter ${newsletterId}`);
      
      // Update user preferences (decrease preference)
      this.updateUserPreference(userId, categoryId, -0.5);
      
      // Remove from category matcher
      return await (this.categoryMatcher as any).removeCategoryAssignment(newsletterId, categoryId);
    } catch (error) {
      this.logger.error(`Error removing category assignment: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Get user's category preferences
   * @param userId The ID of the user
   */
  async getUserCategoryPreferences(userId: string): Promise<Record<string, number>> {
    try {
      this.logger.debug(`Getting category preferences for user: ${userId}`);
      
      const preferences = this.userPreferences.get(userId);
      if (!preferences) {
        return {};
      }
      
      // Convert to record
      const result: Record<string, number> = {};
      for (const [categoryId, score] of preferences.entries()) {
        result[categoryId] = score;
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Error getting user category preferences: ${error instanceof Error ? error.message : String(error)}`);
      return {};
    }
  }

  /**
   * Learn from manual categorization
   * @param assignment The category assignment to learn from
   */
  async learnFromAssignment(assignment: CategoryAssignment): Promise<void> {
    try {
      if (!assignment.isManual) {
        return; // Only learn from manual assignments
      }
      
      this.logger.debug(`Learning from manual assignment: ${assignment.newsletterId} -> ${assignment.categoryId}`);
      
      // Get newsletter content from category matcher
      const allAssignments = await this.categoryMatcher.getCategoriesForNewsletter(assignment.newsletterId);
      
      // If this is the only assignment for this newsletter, we don't have content to learn from
      if (allAssignments.length <= 1) {
        return;
      }
      
      // Find conflicting assignments (high confidence for other categories)
      const conflictingAssignments = allAssignments.filter(a => 
        a.categoryId !== assignment.categoryId && 
        a.confidence > 0.6 && 
        !a.isManual
      );
      
      if (conflictingAssignments.length === 0) {
        return; // No conflicting assignments to learn from
      }
      
      // Treat conflicting assignments as negative examples
      for (const conflictingAssignment of conflictingAssignments) {
        this.logger.debug(`Negative example: ${conflictingAssignment.newsletterId} -> ${conflictingAssignment.categoryId}`);
        
        // Adjust confidence down for conflicting assignment
        await (this.categoryMatcher as any).addCategoryAssignment(
          conflictingAssignment.newsletterId,
          conflictingAssignment.categoryId,
          false,
          Math.max(0.1, conflictingAssignment.confidence - this.learningRate)
        );
      }
    } catch (error) {
      this.logger.error(`Error learning from assignment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update user preference for a category
   * @param userId The ID of the user
   * @param categoryId The ID of the category
   * @param delta The change in preference
   */
  private updateUserPreference(userId: string, categoryId: string, delta: number): void {
    let userPrefs = this.userPreferences.get(userId);
    if (!userPrefs) {
      userPrefs = new Map<string, number>();
      this.userPreferences.set(userId, userPrefs);
    }
    
    const currentPref = userPrefs.get(categoryId) || 0;
    userPrefs.set(categoryId, Math.max(0, Math.min(1, currentPref + delta)));
  }
}