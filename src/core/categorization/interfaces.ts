/**
 * Categorization Module Interfaces
 * Defines interfaces for categorizing newsletter content and managing categories
 */

import { ExtractedContent, Topic } from '../../interfaces/content-processing.js';

/**
 * Represents a category for organizing newsletters
 */
export interface Category {
  id: string;
  name: string;
  description?: string;
  parent?: string; // Parent category ID
  children?: string[]; // Child category IDs
  metadata?: Record<string, string>;
  icon?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a categorization result for a newsletter
 */
export interface CategoryAssignment {
  newsletterId: string;
  categoryId: string;
  confidence: number;
  isManual: boolean;
  assignedAt: Date;
}

/**
 * Represents a theme identified across multiple newsletters
 */
export interface Theme {
  id: string;
  name: string;
  description?: string;
  keywords: string[];
  relatedCategories: string[]; // Category IDs
  relatedNewsletters: string[]; // Newsletter IDs
  sentiment?: number; // From -1 (negative) to 1 (positive)
  trending?: boolean;
  strength: number; // Importance score
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a relationship between categories
 */
export interface CategoryRelationship {
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  strength: number; // 0-1 strength of relationship
  metadata?: Record<string, string>;
}

/**
 * Types of relationships between categories
 */
export enum RelationshipType {
  PARENT_CHILD = 'parent-child',
  RELATED = 'related',
  SIMILAR = 'similar',
  CONTRASTING = 'contrasting'
}

/**
 * Interface for the graph of relationships between categories
 */
export interface RelationshipGraph {
  /**
   * Add a relationship between categories
   * @param relationship The relationship to add
   */
  addRelationship(relationship: CategoryRelationship): Promise<void>;
  
  /**
   * Get relationships for a category
   * @param categoryId The ID of the category
   * @param type Optional filter by relationship type
   */
  getRelationshipsForCategory(categoryId: string, type?: RelationshipType): Promise<CategoryRelationship[]>;
  
  /**
   * Find the shortest path between categories
   * @param sourceId The source category ID
   * @param targetId The target category ID
   */
  findPath(sourceId: string, targetId: string): Promise<CategoryRelationship[]>;
  
  /**
   * Get visualization data for the graph
   */
  getGraphData(): Promise<{
    nodes: Array<{ id: string; label: string; data: Category }>;
    edges: Array<{ source: string; target: string; label: string; data: CategoryRelationship }>;
  }>;
  
  /**
   * Calculate similarity between two categories
   * @param categoryId1 First category ID
   * @param categoryId2 Second category ID
   */
  calculateSimilarity(categoryId1: string, categoryId2: string): Promise<number>;
}

/**
 * Interface for the category manager
 */
export interface CategoryManager {
  /**
   * Add a new category
   * @param category The category to add
   */
  addCategory(category: Partial<Category>): Promise<Category>;
  
  /**
   * Update an existing category
   * @param categoryId The ID of the category to update
   * @param changes The changes to apply
   */
  updateCategory(categoryId: string, changes: Partial<Category>): Promise<Category>;
  
  /**
   * Delete a category
   * @param categoryId The ID of the category to delete
   */
  deleteCategory(categoryId: string): Promise<boolean>;
  
  /**
   * Get a category by ID
   * @param categoryId The ID of the category
   */
  getCategory(categoryId: string): Promise<Category | null>;
  
  /**
   * Get all categories
   * @param filter Optional filter criteria
   */
  getCategories(filter?: Partial<Category>): Promise<Category[]>;
  
  /**
   * Get child categories
   * @param parentId The ID of the parent category
   */
  getChildCategories(parentId: string): Promise<Category[]>;
  
  /**
   * Move a category to a new parent
   * @param categoryId The ID of the category to move
   * @param newParentId The ID of the new parent category (undefined for root)
   */
  moveCategory(categoryId: string, newParentId?: string): Promise<Category>;
}

/**
 * Interface for the theme detector
 */
export interface ThemeDetector {
  /**
   * Detect themes in newsletter content
   * @param content The extracted content to analyze
   */
  detectThemes(content: ExtractedContent): Promise<Theme[]>;
  
  /**
   * Update existing themes with new content
   * @param content The new content
   * @param existingThemes Existing themes to update
   */
  updateThemes(content: ExtractedContent, existingThemes: Theme[]): Promise<Theme[]>;
  
  /**
   * Merge similar themes
   * @param themes The themes to merge
   */
  mergeThemes(themes: Theme[]): Promise<Theme[]>;
  
  /**
   * Get themes by keywords
   * @param keywords The keywords to search for
   */
  getThemesByKeywords(keywords: string[]): Promise<Theme[]>;
  
  /**
   * Get related themes
   * @param themeId The ID of the theme to find related themes for
   */
  getRelatedThemes(themeId: string): Promise<Theme[]>;
}

/**
 * Interface for the category matcher
 */
export interface CategoryMatcher {
  /**
   * Match newsletter content to categories
   * @param content The extracted content to categorize
   */
  matchCategories(content: ExtractedContent): Promise<CategoryAssignment[]>;
  
  /**
   * Calculate relevance scores for categories
   * @param content The extracted content
   * @param categoryIds The category IDs to calculate relevance for
   */
  calculateRelevanceScores(content: ExtractedContent, categoryIds: string[]): Promise<Record<string, number>>;
  
  /**
   * Get categories for a newsletter
   * @param newsletterId The ID of the newsletter
   */
  getCategoriesForNewsletter(newsletterId: string): Promise<CategoryAssignment[]>;
  
  /**
   * Get newsletters for a category
   * @param categoryId The ID of the category
   * @param minConfidence Minimum confidence threshold
   */
  getNewslettersForCategory(categoryId: string, minConfidence?: number): Promise<CategoryAssignment[]>;
}

/**
 * Interface for manual categorization handler
 */
export interface ManualCategorizationHandler {
  /**
   * Assign a category to a newsletter manually
   * @param newsletterId The ID of the newsletter
   * @param categoryId The ID of the category
   * @param userId The ID of the user making the assignment
   */
  assignCategory(newsletterId: string, categoryId: string, userId: string): Promise<CategoryAssignment>;
  
  /**
   * Remove a category assignment
   * @param newsletterId The ID of the newsletter
   * @param categoryId The ID of the category
   * @param userId The ID of the user removing the assignment
   */
  removeAssignment(newsletterId: string, categoryId: string, userId: string): Promise<boolean>;
  
  /**
   * Get user's category preferences
   * @param userId The ID of the user
   */
  getUserCategoryPreferences(userId: string): Promise<Record<string, number>>;
  
  /**
   * Learn from manual categorization
   * @param assignment The category assignment to learn from
   */
  learnFromAssignment(assignment: CategoryAssignment): Promise<void>;
}

/**
 * Main categorizer interface as defined in the TDD
 */
export interface Categorizer {
  /**
   * Categorize newsletter content
   * @param content The extracted content to categorize
   */
  categorizeNewsletter(content: ExtractedContent): Promise<Category[]>;
  
  /**
   * Get categories for a user
   * @param userId The ID of the user
   */
  getCategories(userId: string): Promise<Category[]>;
  
  /**
   * Add a new category
   * @param category The category to add
   */
  addCategory(category: Partial<Category>): Promise<void>;
  
  /**
   * Link a newsletter to a category
   * @param newsletterId The ID of the newsletter
   * @param categoryId The ID of the category
   * @param confidence The confidence score for the assignment
   */
  linkNewsletterToCategory(newsletterId: string, categoryId: string, confidence: number): Promise<void>;
}