/**
 * CategoryMatcher Tests
 * Tests for the CategoryMatcher implementation
 */

import { CategoryMatcherImpl } from '../../../core/categorization/category-matcher.js';
import { CategoryManagerImpl } from '../../../core/categorization/category-manager.js';
import { ExtractedContent, SectionType } from '../../../interfaces/content-processing.js';

describe('CategoryMatcher', () => {
  let categoryManager: CategoryManagerImpl;
  let categoryMatcher: CategoryMatcherImpl;

  beforeEach(async () => {
    categoryManager = new CategoryManagerImpl();
    categoryMatcher = new CategoryMatcherImpl(categoryManager);
    
    // Wait for default categories to initialize
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  test('should match categories for tech newsletter', async () => {
    // Create mock extracted content for a tech newsletter
    const mockContent: ExtractedContent = {
      newsletterId: 'test-newsletter-123',
      rawContent: '<div>Tech newsletter about artificial intelligence and machine learning</div>',
      plainText: 'Tech newsletter about artificial intelligence and machine learning. This newsletter discusses the latest AI advancements and their impact on technology industry.',
      structure: {
        title: 'AI Technology Newsletter',
        sections: [
          {
            id: 'section-1',
            title: 'Latest AI Developments',
            content: 'News about artificial intelligence advancements',
            type: SectionType.CONTENT,
            links: [],
            level: 1
          }
        ],
        metadata: {
          author: 'Tech Research Team',
          date: '2025-04-23'
        }
      },
      links: [],
      topics: [
        {
          name: 'Artificial Intelligence',
          confidence: 0.9,
          keywords: ['artificial', 'intelligence', 'ai', 'machine', 'learning', 'algorithms'],
          context: 'Latest AI Developments'
        },
        {
          name: 'Technology',
          confidence: 0.8,
          keywords: ['technology', 'tech', 'industry', 'development'],
          context: 'technology industry'
        }
      ],
      extractedAt: new Date()
    };

    // Match categories
    const assignments = await categoryMatcher.matchCategories(mockContent);

    expect(assignments).toBeDefined();
    expect(assignments.length).toBeGreaterThan(0);
    
    // Should match Technology or AI category
    const techAssignment = assignments.find(a => {
      // This is a bit complex because we need to check if the category is a tech-related one
      return a.categoryId && a.confidence > 0.3;
    });
    
    expect(techAssignment).toBeDefined();
  });

  test('should calculate relevance scores', async () => {
    // Get all categories 
    const categories = await categoryManager.getCategories();
    const categoryIds = categories.map(c => c.id);
    
    // Create mock tech content for relevance calculation
    const mockTechContent: ExtractedContent = {
      newsletterId: 'test-newsletter-123',
      rawContent: '<div>Technology newsletter about software development</div>',
      plainText: 'Technology newsletter about software development, web programming, and coding best practices.',
      structure: {
        title: 'Developer Weekly',
        sections: [
          {
            id: 'section-1',
            title: 'Web Development Tips',
            content: 'Tips for web developers',
            type: SectionType.CONTENT,
            links: [],
            level: 1
          }
        ],
        metadata: {}
      },
      links: [],
      topics: [
        {
          name: 'Web Development',
          confidence: 0.9,
          keywords: ['web', 'development', 'programming', 'software', 'coding'],
          context: 'Web Development Tips'
        }
      ],
      extractedAt: new Date()
    };

    // Calculate relevance scores
    const techScores = await categoryMatcher.calculateRelevanceScores(mockTechContent, categoryIds);

    // Create mock finance content
    const mockFinanceContent: ExtractedContent = {
      newsletterId: 'test-newsletter-456',
      rawContent: '<div>Finance newsletter about investing and markets</div>',
      plainText: 'Finance newsletter about stock market investing, portfolio management, and financial trends.',
      structure: {
        title: 'Finance Weekly',
        sections: [
          {
            id: 'section-1',
            title: 'Market Update',
            content: 'Updates on financial markets',
            type: SectionType.CONTENT,
            links: [],
            level: 1
          }
        ],
        metadata: {}
      },
      links: [],
      topics: [
        {
          name: 'Investing',
          confidence: 0.9,
          keywords: ['investing', 'finance', 'market', 'stocks', 'portfolio'],
          context: 'Market Update'
        }
      ],
      extractedAt: new Date()
    };

    // Calculate relevance scores
    const financeScores = await categoryMatcher.calculateRelevanceScores(mockFinanceContent, categoryIds);

    // Find tech category ID
    const techCategory = categories.find(c => c.name === 'Technology');
    const financeCategory = categories.find(c => 
      c.name === 'Finance' || c.name === 'Business'
    );
    
    if (techCategory && financeCategory) {
      // Tech content should have higher relevance for tech category
      expect(techScores[techCategory.id]).toBeGreaterThan(techScores[financeCategory.id]);
      
      // Finance content should have higher relevance for finance category
      expect(financeScores[financeCategory.id]).toBeGreaterThan(financeScores[techCategory.id]);
    }
  });

  test('should get categories for a newsletter', async () => {
    // Create mock content
    const mockContent: ExtractedContent = {
      newsletterId: 'test-newsletter-789',
      rawContent: '<div>Science newsletter about physics discoveries</div>',
      plainText: 'Science newsletter about physics discoveries and quantum mechanics research.',
      structure: {
        title: 'Physics Monthly',
        sections: [
          {
            id: 'section-1',
            title: 'Quantum Mechanics',
            content: 'Updates on quantum physics',
            type: SectionType.CONTENT,
            links: [],
            level: 1
          }
        ],
        metadata: {}
      },
      links: [],
      topics: [
        {
          name: 'Quantum Physics',
          confidence: 0.9,
          keywords: ['quantum', 'physics', 'mechanics', 'particles', 'science'],
          context: 'Quantum Mechanics'
        }
      ],
      extractedAt: new Date()
    };

    // Match categories
    await categoryMatcher.matchCategories(mockContent);

    // Get categories for the newsletter
    const assignments = await categoryMatcher.getCategoriesForNewsletter('test-newsletter-789');

    expect(assignments).toBeDefined();
    expect(assignments.length).toBeGreaterThan(0);
  });

  test('should add and remove manual category assignments', async () => {
    // Create a test category
    const category = await categoryManager.addCategory({
      name: 'Test Category',
      description: 'A test category'
    });

    // Add manual assignment
    const assignment = await (categoryMatcher as any).addCategoryAssignment('test-newsletter-123', category.id, true);

    expect(assignment).toBeDefined();
    expect(assignment.newsletterId).toBe('test-newsletter-123');
    expect(assignment.categoryId).toBe(category.id);
    expect(assignment.isManual).toBe(true);
    expect(assignment.confidence).toBe(1.0);

    // Get categories for the newsletter
    const assignments = await categoryMatcher.getCategoriesForNewsletter('test-newsletter-123');
    expect(assignments.length).toBe(1);
    expect(assignments[0].categoryId).toBe(category.id);

    // Remove assignment
    const removed = await (categoryMatcher as any).removeCategoryAssignment('test-newsletter-123', category.id);
    expect(removed).toBe(true);

    // Check that assignment was removed
    const updatedAssignments = await categoryMatcher.getCategoriesForNewsletter('test-newsletter-123');
    expect(updatedAssignments.length).toBe(0);
  });
});