/**
 * Categorization Module
 * Main entry point for the categorization module
 */

// Export interfaces
export * from './interfaces.js';

// Export implementations
export { CategoryManagerImpl } from './category-manager.js';
export { ThemeDetectorImpl } from './theme-detector.js';
export { CategoryMatcherImpl } from './category-matcher.js';
export { RelationshipGenerator } from './relationship-generator.js';
export { ManualCategorizationHandlerImpl } from './manual-categorization-handler.js';
export { CategorizerImpl } from './categorizer-impl.js';

// Export factory function for creating a complete categorizer
import { CategoryManagerImpl } from './category-manager.js';
import { ThemeDetectorImpl } from './theme-detector.js';
import { CategoryMatcherImpl } from './category-matcher.js';
import { RelationshipGenerator } from './relationship-generator.js';
import { ManualCategorizationHandlerImpl } from './manual-categorization-handler.js';
import { CategorizerImpl } from './categorizer-impl.js';
import { Categorizer } from './interfaces.js';

/**
 * Create a complete categorizer with all required components
 * @param confidenceThreshold Minimum confidence threshold for categorization
 */
export function createCategorizer(confidenceThreshold = 0.4): Categorizer {
  // Create components
  const categoryManager = new CategoryManagerImpl();
  const themeDetector = new ThemeDetectorImpl();
  const categoryMatcher = new CategoryMatcherImpl(categoryManager, confidenceThreshold);
  const relationshipGenerator = new RelationshipGenerator(categoryManager);
  const manualHandler = new ManualCategorizationHandlerImpl(categoryManager, categoryMatcher);
  
  // Create and return categorizer
  return new CategorizerImpl(
    categoryManager,
    categoryMatcher,
    themeDetector,
    manualHandler,
    confidenceThreshold
  );
}