/**
 * Categorizer Implementation
 * Implements the main Categorizer interface from the TDD
 */

import { 
  Category, 
  Categorizer, 
  CategoryManager, 
  CategoryMatcher, 
  ManualCategorizationHandler, 
  ThemeDetector
} from './interfaces.js';
import { Logger } from '../../utils/logger.js';
import { ExtractedContent } from '../../interfaces/content-processing.js';

/**
 * Implementation of Categorizer interface
 */
export class CategorizerImpl implements Categorizer {
  private logger: Logger;
  private categoryManager: CategoryManager;
  private categoryMatcher: CategoryMatcher;
  private themeDetector: ThemeDetector;
  private manualHandler: ManualCategorizationHandler;
  private confidenceThreshold: number;

  constructor(
    categoryManager: CategoryManager,
    categoryMatcher: CategoryMatcher,
    themeDetector: ThemeDetector,
    manualHandler: ManualCategorizationHandler,
    confidenceThreshold = 0.4
  ) {
    this.logger = new Logger('Categorizer');
    this.categoryManager = categoryManager;
    this.categoryMatcher = categoryMatcher;
    this.themeDetector = themeDetector;
    this.manualHandler = manualHandler;
    this.confidenceThreshold = confidenceThreshold;
  }

  /**
   * Categorize newsletter content
   * @param content The extracted content to categorize
   */
  async categorizeNewsletter(content: ExtractedContent): Promise<Category[]> {
    try {
      this.logger.info(`Categorizing newsletter: ${content.newsletterId}`);
      
      // 1. Match newsletter to categories
      const assignments = await this.categoryMatcher.matchCategories(content);
      
      this.logger.debug(`Found ${assignments.length} matching categories for newsletter: ${content.newsletterId}`);
      
      // 2. Filter by confidence threshold
      const highConfidenceAssignments = assignments.filter(
        a => a.confidence >= this.confidenceThreshold
      );
      
      // 3. Get associated categories
      const categories: Category[] = [];
      
      for (const assignment of highConfidenceAssignments) {
        const category = await this.categoryManager.getCategory(assignment.categoryId);
        if (category) {
          categories.push(category);
        }
      }
      
      // 4. Detect themes (for future use)
      await this.themeDetector.detectThemes(content);
      
      this.logger.info(`Categorized newsletter ${content.newsletterId} into ${categories.length} categories`);
      return categories;
    } catch (error) {
      this.logger.error(`Error categorizing newsletter: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Get categories for a user
   * @param userId The ID of the user
   */
  async getCategories(userId: string): Promise<Category[]> {
    try {
      this.logger.debug(`Getting categories for user: ${userId}`);
      
      // Get all categories
      const allCategories = await this.categoryManager.getCategories();
      
      // Get user preferences
      const preferences = await this.manualHandler.getUserCategoryPreferences(userId);
      
      // Sort categories by user preference (descending)
      return allCategories.sort((a, b) => {
        const prefA = preferences[a.id] || 0;
        const prefB = preferences[b.id] || 0;
        return prefB - prefA;
      });
    } catch (error) {
      this.logger.error(`Error getting categories for user: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Add a new category
   * @param category The category to add
   */
  async addCategory(category: Partial<Category>): Promise<void> {
    try {
      this.logger.debug(`Adding new category: ${category.name}`);
      
      await this.categoryManager.addCategory(category);
    } catch (error) {
      this.logger.error(`Error adding category: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to add category: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Link a newsletter to a category
   * @param newsletterId The ID of the newsletter
   * @param categoryId The ID of the category
   * @param confidence The confidence score for the assignment
   */
  async linkNewsletterToCategory(newsletterId: string, categoryId: string, confidence: number): Promise<void> {
    try {
      this.logger.debug(`Linking newsletter ${newsletterId} to category ${categoryId} with confidence ${confidence}`);
      
      // Check if category exists
      const category = await this.categoryManager.getCategory(categoryId);
      if (!category) {
        throw new Error(`Category not found: ${categoryId}`);
      }
      
      // Add category assignment to matcher
      await (this.categoryMatcher as any).addCategoryAssignment(newsletterId, categoryId, false, confidence);
    } catch (error) {
      this.logger.error(`Error linking newsletter to category: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to link newsletter to category: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}