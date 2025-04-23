# Categorization Module

## Overview

The Categorization Module is responsible for organizing newsletters into categories and themes, enabling users to easily find related content. It implements a multi-faceted categorization approach using text analysis, taxonomy matching, and learning from user feedback.

## Key Components

### CategoryManager

The `CategoryManager` maintains the hierarchical taxonomy of categories in the system.

```typescript
interface CategoryManager {
  addCategory(category: Partial<Category>): Promise<Category>;
  updateCategory(categoryId: string, changes: Partial<Category>): Promise<Category>;
  deleteCategory(categoryId: string): Promise<boolean>;
  getCategory(categoryId: string): Promise<Category | null>;
  getCategories(filter?: Partial<Category>): Promise<Category[]>;
  getChildCategories(parentId: string): Promise<Category[]>;
  moveCategory(categoryId: string, newParentId?: string): Promise<Category>;
}
```

It manages a hierarchical structure of categories with parent-child relationships, allowing for:
- Category metadata (description, icon, color)
- Hierarchical organization with multiple levels
- Filtering and searching categories
- Moving categories within the hierarchy

### ThemeDetector

The `ThemeDetector` identifies themes across multiple newsletters based on content analysis.

```typescript
interface ThemeDetector {
  detectThemes(content: ExtractedContent): Promise<Theme[]>;
  updateThemes(content: ExtractedContent, existingThemes: Theme[]): Promise<Theme[]>;
  mergeThemes(themes: Theme[]): Promise<Theme[]>;
  getThemesByKeywords(keywords: string[]): Promise<Theme[]>;
  getRelatedThemes(themeId: string): Promise<Theme[]>;
}
```

It analyzes newsletter content to:
- Extract themes using topic analysis and entity detection
- Identify relationships between themes
- Track themes across multiple newsletters
- Calculate confidence scores for themes
- Detect trending themes over time

### CategoryMatcher

The `CategoryMatcher` matches newsletter content to appropriate categories.

```typescript
interface CategoryMatcher {
  matchCategories(content: ExtractedContent): Promise<CategoryAssignment[]>;
  calculateRelevanceScores(content: ExtractedContent, categoryIds: string[]): Promise<Record<string, number>>;
  getCategoriesForNewsletter(newsletterId: string): Promise<CategoryAssignment[]>;
  getNewslettersForCategory(categoryId: string, minConfidence?: number): Promise<CategoryAssignment[]>;
}
```

It uses text classification techniques to:
- Analyze newsletter content for category relevance
- Calculate confidence scores for category assignments
- Support multi-category assignment with different confidence levels
- Learn from user feedback to improve future matching

### RelationshipGenerator

The `RelationshipGenerator` creates and manages relationships between categories.

```typescript
interface RelationshipGraph {
  addRelationship(relationship: CategoryRelationship): Promise<void>;
  getRelationshipsForCategory(categoryId: string, type?: RelationshipType): Promise<CategoryRelationship[]>;
  findPath(sourceId: string, targetId: string): Promise<CategoryRelationship[]>;
  getGraphData(): Promise<GraphData>;
  calculateSimilarity(categoryId1: string, categoryId2: string): Promise<number>;
}
```

It builds a graph of relationships between categories to:
- Identify related categories
- Establish parent-child relationships
- Calculate similarity between categories
- Generate visualization data for category maps
- Find paths between categories

### ManualCategorizationHandler

The `ManualCategorizationHandler` processes manual categorization from users.

```typescript
interface ManualCategorizationHandler {
  assignCategory(newsletterId: string, categoryId: string, userId: string): Promise<CategoryAssignment>;
  removeAssignment(newsletterId: string, categoryId: string, userId: string): Promise<boolean>;
  getUserCategoryPreferences(userId: string): Promise<Record<string, number>>;
  learnFromAssignment(assignment: CategoryAssignment): Promise<void>;
}
```

It handles user interactions with the categorization system to:
- Process manual category assignments
- Remove incorrect assignments
- Track user preferences for categories
- Learn from manual categorization to improve automatic categorization

### Categorizer

The `Categorizer` is the main interface for the module, orchestrating all components.

```typescript
interface Categorizer {
  categorizeNewsletter(content: ExtractedContent): Promise<Category[]>;
  getCategories(userId: string): Promise<Category[]>;
  addCategory(category: Partial<Category>): Promise<void>;
  linkNewsletterToCategory(newsletterId: string, categoryId: string, confidence: number): Promise<void>;
}
```

It provides a unified interface for categorizing newsletters:
- Automatically categorizes newsletter content
- Returns user-specific categories with preferences
- Adds new categories to the system
- Links newsletters to categories manually or programmatically

## Data Model

### Category

```typescript
interface Category {
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
```

### Theme

```typescript
interface Theme {
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
```

### CategoryAssignment

```typescript
interface CategoryAssignment {
  newsletterId: string;
  categoryId: string;
  confidence: number;
  isManual: boolean;
  assignedAt: Date;
}
```

### CategoryRelationship

```typescript
interface CategoryRelationship {
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  strength: number; // 0-1 strength of relationship
  metadata?: Record<string, string>;
}

enum RelationshipType {
  PARENT_CHILD = 'parent-child',
  RELATED = 'related',
  SIMILAR = 'similar',
  CONTRASTING = 'contrasting'
}
```

## Categorization Process

1. **Content Extraction**
   - Newsletter content is extracted and processed by the Content Processing Module
   - Topics, keywords, and structure are identified

2. **Category Matching**
   - The content is analyzed and matched against existing categories
   - Vectors are created for newsletter content
   - Vector similarity is calculated with category vectors
   - Confidence scores are assigned for each potential category

3. **Theme Detection**
   - Themes are extracted from the content
   - Related to existing themes from other newsletters
   - New themes are created or existing ones are updated

4. **Relationship Mapping**
   - Relationships between categories are identified
   - Similarity scores are calculated
   - Graph of relationships is updated

5. **User Feedback Integration**
   - Manual categorization is processed
   - User preferences are updated
   - Automatic categorization is improved based on feedback

## Implementation Approaches

### Text Classification

The module implements vector-based text classification:
- Content is converted to token vectors with weights
- Categories are represented as token vectors
- Cosine similarity is used to calculate relevance
- TF-IDF approach for term importance

### Entity Recognition

A simplified approach to named entity recognition:
- Identifies capitalized words and phrases
- Extracts proper nouns and important concepts
- Understands multi-word entities
- Contextualizes entities within the content

### Theme Analysis

Themes are detected across multiple newsletters:
- Keyword clustering for related topics
- Sentiment analysis for theme context
- Temporal analysis for trending themes
- Topic evolution tracking

### Learning from Feedback

The system improves over time by:
- Adjusting category vectors based on user feedback
- Strengthening category assignments with confirmation
- Weakening incorrect assignments
- Tracking user preferences for personalization

## Usage Example

```typescript
// Create a categorizer instance
const categorizer = createCategorizer();

// Extract newsletter content (using Content Processing Module)
const extractedContent = await contentProcessor.extractContent('newsletter-123');

// Categorize the newsletter
const categories = await categorizer.categorizeNewsletter(extractedContent);

// Get categories for a specific user
const userCategories = await categorizer.getCategories('user-456');

// Add a custom category
await categorizer.addCategory({
  name: 'Custom Category',
  description: 'A custom category',
  icon: 'category_icon',
  color: '#4caf50'
});

// Manually link a newsletter to a category
await categorizer.linkNewsletterToCategory('newsletter-789', 'category-123', 0.9);
```

## Future Improvements

1. **Advanced NLP**
   - Integration with a proper NLP library for better entity extraction
   - Improved sentiment analysis for theme context

2. **Machine Learning**
   - Train models on categorization data
   - Personalized category matching based on user behavior

3. **Advanced Visualization**
   - Interactive graph visualization for category relationships
   - Theme evolution visualization over time

4. **Persistent Storage**
   - Replace in-memory storage with database persistence
   - Support for large-scale newsletter archives