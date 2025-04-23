/**
 * Category Matcher Implementation
 * Matches newsletter content to categories
 */

import { v4 as uuidv4 } from 'uuid';
import { Category, CategoryAssignment, CategoryMatcher, CategoryManager } from './interfaces.js';
import { ExtractedContent } from '../../interfaces/content-processing.js';
import { Logger } from '../../utils/logger.js';

/**
 * Implementation of CategoryMatcher
 */
export class CategoryMatcherImpl implements CategoryMatcher {
  private logger: Logger;
  private categoryManager: CategoryManager;
  private assignmentStore: Map<string, CategoryAssignment[]>;
  private categoryVectors: Map<string, Map<string, number>>;
  private confidenceThreshold: number;

  constructor(categoryManager: CategoryManager, confidenceThreshold = 0.4) {
    this.logger = new Logger('CategoryMatcher');
    this.categoryManager = categoryManager;
    this.assignmentStore = new Map<string, CategoryAssignment[]>();
    this.categoryVectors = new Map<string, Map<string, number>>();
    this.confidenceThreshold = confidenceThreshold;
    
    // Initialize category vectors
    this.initializeCategoryVectors();
  }

  /**
   * Initialize category vectors for text classification
   */
  private async initializeCategoryVectors(): Promise<void> {
    try {
      this.logger.debug('Initializing category vectors');
      
      const categories = await this.categoryManager.getCategories();
      
      for (const category of categories) {
        const vector = new Map<string, number>();
        
        // Add category name to vector with high weight
        const nameTokens = this.tokenize(category.name);
        for (const token of nameTokens) {
          vector.set(token, 5.0); // High weight for name tokens
        }
        
        // Add description tokens to vector
        if (category.description) {
          const descTokens = this.tokenize(category.description);
          for (const token of descTokens) {
            const currentWeight = vector.get(token) || 0;
            vector.set(token, currentWeight + 1.0);
          }
        }
        
        // Store the vector
        this.categoryVectors.set(category.id, vector);
      }
      
      this.logger.debug(`Initialized vectors for ${categories.length} categories`);
    } catch (error) {
      this.logger.error(`Error initializing category vectors: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Match newsletter content to categories
   * @param content The extracted content to categorize
   */
  async matchCategories(content: ExtractedContent): Promise<CategoryAssignment[]> {
    try {
      this.logger.debug(`Matching categories for newsletter: ${content.newsletterId}`);
      
      // 1. Extract text to categorize
      const { newsletterId } = content;
      const title = content.structure.title;
      const plainText = content.plainText;
      
      // 2. Calculate relevance scores for all categories
      const categories = await this.categoryManager.getCategories();
      const relevanceScores = await this.calculateRelevanceScores(content, categories.map(c => c.id));
      
      // 3. Filter to categories with confidence above threshold
      const assignments: CategoryAssignment[] = [];
      const now = new Date();
      
      for (const [categoryId, confidence] of Object.entries(relevanceScores)) {
        if (confidence >= this.confidenceThreshold) {
          const assignment: CategoryAssignment = {
            newsletterId,
            categoryId,
            confidence,
            isManual: false,
            assignedAt: now
          };
          
          assignments.push(assignment);
        }
      }
      
      // 4. Sort by confidence (descending)
      assignments.sort((a, b) => b.confidence - a.confidence);
      
      // 5. Store the assignments
      this.assignmentStore.set(newsletterId, assignments);
      
      // 6. Optionally update category vectors with new content
      await this.updateCategoryVectors(content, assignments);
      
      this.logger.debug(`Matched ${assignments.length} categories for newsletter: ${newsletterId}`);
      return assignments;
    } catch (error) {
      this.logger.error(`Error matching categories: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Calculate relevance scores for categories
   * @param content The extracted content
   * @param categoryIds The category IDs to calculate relevance for
   */
  async calculateRelevanceScores(content: ExtractedContent, categoryIds: string[]): Promise<Record<string, number>> {
    try {
      this.logger.debug(`Calculating relevance scores for ${categoryIds.length} categories`);
      
      const { newsletterId, topics, structure, plainText } = content;
      const title = structure.title;
      
      // Create content vector
      const contentVector = new Map<string, number>();
      
      // Add title tokens with high weight
      const titleTokens = this.tokenize(title);
      for (const token of titleTokens) {
        contentVector.set(token, 3.0); // High weight for title tokens
      }
      
      // Add topic keywords with medium-high weight
      for (const topic of topics) {
        for (const keyword of topic.keywords) {
          const normalizedKeyword = keyword.toLowerCase();
          const currentWeight = contentVector.get(normalizedKeyword) || 0;
          const topicWeight = topic.confidence * 2.0; // Weight by topic confidence
          contentVector.set(normalizedKeyword, currentWeight + topicWeight);
        }
        
        // Add topic name
        const topicNameTokens = this.tokenize(topic.name);
        for (const token of topicNameTokens) {
          const currentWeight = contentVector.get(token) || 0;
          const topicWeight = topic.confidence * 2.5; // Slightly higher weight for topic name
          contentVector.set(token, currentWeight + topicWeight);
        }
      }
      
      // Add content tokens with lower weight
      const contentTokens = this.tokenize(plainText);
      const contentFrequencies = this.calculateTokenFrequencies(contentTokens);
      
      for (const [token, frequency] of contentFrequencies.entries()) {
        const currentWeight = contentVector.get(token) || 0;
        // Scale by frequency but cap to avoid common words dominating
        const frequencyWeight = Math.min(frequency / 10, 1.0);
        contentVector.set(token, currentWeight + frequencyWeight);
      }
      
      // Calculate similarity with each category
      const relevanceScores: Record<string, number> = {};
      
      for (const categoryId of categoryIds) {
        const categoryVector = this.categoryVectors.get(categoryId);
        
        if (!categoryVector) {
          relevanceScores[categoryId] = 0;
          continue;
        }
        
        // Calculate cosine similarity
        const similarity = this.calculateCosineSimilarity(contentVector, categoryVector);
        relevanceScores[categoryId] = similarity;
      }
      
      return relevanceScores;
    } catch (error) {
      this.logger.error(`Error calculating relevance scores: ${error instanceof Error ? error.message : String(error)}`);
      
      // Return empty scores
      return categoryIds.reduce((scores, id) => {
        scores[id] = 0;
        return scores;
      }, {} as Record<string, number>);
    }
  }

  /**
   * Get categories for a newsletter
   * @param newsletterId The ID of the newsletter
   */
  async getCategoriesForNewsletter(newsletterId: string): Promise<CategoryAssignment[]> {
    try {
      this.logger.debug(`Getting categories for newsletter: ${newsletterId}`);
      
      const assignments = this.assignmentStore.get(newsletterId) || [];
      return assignments;
    } catch (error) {
      this.logger.error(`Error getting categories for newsletter: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Get newsletters for a category
   * @param categoryId The ID of the category
   * @param minConfidence Minimum confidence threshold
   */
  async getNewslettersForCategory(categoryId: string, minConfidence = 0.4): Promise<CategoryAssignment[]> {
    try {
      this.logger.debug(`Getting newsletters for category: ${categoryId}`);
      
      const assignments: CategoryAssignment[] = [];
      
      // Iterate through all newsletter assignments
      for (const [newsletterId, newsletterAssignments] of this.assignmentStore.entries()) {
        // Find assignment for this category
        const assignment = newsletterAssignments.find(a => a.categoryId === categoryId);
        
        if (assignment && assignment.confidence >= minConfidence) {
          assignments.push(assignment);
        }
      }
      
      // Sort by confidence (descending)
      assignments.sort((a, b) => b.confidence - a.confidence);
      
      return assignments;
    } catch (error) {
      this.logger.error(`Error getting newsletters for category: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Add a manual category assignment
   * @param newsletterId The ID of the newsletter
   * @param categoryId The ID of the category
   */
  async addCategoryAssignment(newsletterId: string, categoryId: string, isManual = false): Promise<CategoryAssignment> {
    try {
      this.logger.debug(`Adding category assignment: ${newsletterId} -> ${categoryId}`);
      
      const now = new Date();
      const assignment: CategoryAssignment = {
        newsletterId,
        categoryId,
        confidence: isManual ? 1.0 : 0.7, // High confidence for manual assignments
        isManual,
        assignedAt: now
      };
      
      // Get existing assignments
      let assignments = this.assignmentStore.get(newsletterId) || [];
      
      // Remove any existing assignment for this category
      assignments = assignments.filter(a => a.categoryId !== categoryId);
      
      // Add new assignment
      assignments.push(assignment);
      
      // Store assignments
      this.assignmentStore.set(newsletterId, assignments);
      
      return assignment;
    } catch (error) {
      this.logger.error(`Error adding category assignment: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to add category assignment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Remove a category assignment
   * @param newsletterId The ID of the newsletter
   * @param categoryId The ID of the category
   */
  async removeCategoryAssignment(newsletterId: string, categoryId: string): Promise<boolean> {
    try {
      this.logger.debug(`Removing category assignment: ${newsletterId} -> ${categoryId}`);
      
      // Get existing assignments
      const assignments = this.assignmentStore.get(newsletterId) || [];
      
      // Remove assignment for this category
      const filteredAssignments = assignments.filter(a => a.categoryId !== categoryId);
      
      // Store assignments
      this.assignmentStore.set(newsletterId, filteredAssignments);
      
      return assignments.length !== filteredAssignments.length;
    } catch (error) {
      this.logger.error(`Error removing category assignment: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Update category vectors with new content
   * @param content The extracted content
   * @param assignments The category assignments
   */
  private async updateCategoryVectors(content: ExtractedContent, assignments: CategoryAssignment[]): Promise<void> {
    try {
      if (assignments.length === 0) {
        return;
      }
      
      this.logger.debug(`Updating category vectors with new content: ${content.newsletterId}`);
      
      // Only update vectors for high confidence assignments
      const highConfidenceAssignments = assignments.filter(a => a.confidence > 0.7 || a.isManual);
      
      if (highConfidenceAssignments.length === 0) {
        return;
      }
      
      // Extract content tokens
      const titleTokens = this.tokenize(content.structure.title);
      const contentTokens = this.tokenize(content.plainText);
      
      // Calculate token frequencies
      const contentFrequencies = this.calculateTokenFrequencies([...titleTokens, ...contentTokens]);
      
      // Get topic keywords
      const topicKeywords = content.topics.flatMap(topic => topic.keywords);
      
      // Update vectors for each high confidence category
      for (const assignment of highConfidenceAssignments) {
        const categoryVector = this.categoryVectors.get(assignment.categoryId);
        
        if (!categoryVector) {
          continue;
        }
        
        // Update with topic keywords (higher weight)
        for (const keyword of topicKeywords) {
          const normalizedKeyword = keyword.toLowerCase();
          const currentWeight = categoryVector.get(normalizedKeyword) || 0;
          categoryVector.set(normalizedKeyword, currentWeight + 0.5);
        }
        
        // Update with content tokens (lower weight, based on frequency)
        for (const [token, frequency] of contentFrequencies.entries()) {
          if (frequency > 1) { // Only use tokens that appear multiple times
            const currentWeight = categoryVector.get(token) || 0;
            const learningRate = assignment.isManual ? 0.3 : 0.1; // Higher learning rate for manual assignments
            categoryVector.set(token, currentWeight + (learningRate * Math.min(frequency / 5, 1.0)));
          }
        }
        
        // Store updated vector
        this.categoryVectors.set(assignment.categoryId, categoryVector);
      }
    } catch (error) {
      this.logger.error(`Error updating category vectors: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Tokenize text into normalized tokens
   * @param text Text to tokenize
   */
  private tokenize(text: string): string[] {
    // Common stop words to filter out
    const stopWords = new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'when',
      'at', 'from', 'by', 'on', 'off', 'for', 'in', 'out', 'over', 'to',
      'into', 'with', 'about', 'against', 'between', 'into', 'through',
      'during', 'before', 'after', 'above', 'below', 'up', 'down', 'of',
      'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your',
      'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she',
      'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their',
      'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that',
      'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'would',
      'should', 'could', 'ought', 'will', 'shall', 'can', 'may', 'might', 'must'
    ]);
    
    // Tokenize (split into words)
    const tokens = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .split(/\s+/) // Split by whitespace
      .filter(token => token.length > 2 && !stopWords.has(token)); // Remove stop words and short tokens
    
    return tokens;
  }

  /**
   * Calculate token frequencies
   * @param tokens List of tokens
   */
  private calculateTokenFrequencies(tokens: string[]): Map<string, number> {
    const frequencies = new Map<string, number>();
    
    for (const token of tokens) {
      frequencies.set(token, (frequencies.get(token) || 0) + 1);
    }
    
    return frequencies;
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param vectorA First vector
   * @param vectorB Second vector
   */
  private calculateCosineSimilarity(
    vectorA: Map<string, number>,
    vectorB: Map<string, number>
  ): number {
    // Calculate dot product
    let dotProduct = 0;
    
    for (const [term, weightA] of vectorA.entries()) {
      const weightB = vectorB.get(term) || 0;
      dotProduct += weightA * weightB;
    }
    
    // Calculate magnitudes
    let magnitudeA = 0;
    for (const weight of vectorA.values()) {
      magnitudeA += weight * weight;
    }
    magnitudeA = Math.sqrt(magnitudeA);
    
    let magnitudeB = 0;
    for (const weight of vectorB.values()) {
      magnitudeB += weight * weight;
    }
    magnitudeB = Math.sqrt(magnitudeB);
    
    // Calculate cosine similarity
    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }
    
    return dotProduct / (magnitudeA * magnitudeB);
  }
}