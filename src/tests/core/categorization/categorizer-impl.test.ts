/**
 * Categorizer Implementation Tests
 * Tests for the main Categorizer implementation
 */

import { createCategorizer } from '../../../core/categorization/index.js';
import { Categorizer } from '../../../core/categorization/interfaces.js';
import { ExtractedContent, SectionType } from '../../../interfaces/content-processing.js';

describe('CategorizerImpl', () => {
  let categorizer: Categorizer;

  beforeEach(() => {
    categorizer = createCategorizer();
  });

  test('should categorize newsletter content', async () => {
    // Create mock extracted content
    const mockContent: ExtractedContent = {
      newsletterId: 'test-newsletter-123',
      rawContent: '<div>Business newsletter about finance and investing</div>',
      plainText: 'Business newsletter about finance and investing. This newsletter covers market trends, investment strategies, and financial news.',
      structure: {
        title: 'Finance Weekly',
        sections: [
          {
            id: 'section-1',
            title: 'Market Trends',
            content: 'Analysis of current market trends',
            type: SectionType.CONTENT,
            links: [],
            level: 1
          },
          {
            id: 'section-2',
            title: 'Investment Strategies',
            content: 'Tips for effective investing',
            type: SectionType.CONTENT,
            links: [],
            level: 1
          }
        ],
        metadata: {
          author: 'Finance Team',
          date: '2025-04-23'
        }
      },
      links: [],
      topics: [
        {
          name: 'Finance',
          confidence: 0.9,
          keywords: ['finance', 'financial', 'market', 'markets', 'investing', 'investment', 'strategy'],
          context: 'Business newsletter about finance and investing'
        },
        {
          name: 'Market Trends',
          confidence: 0.8,
          keywords: ['market', 'trends', 'analysis', 'prediction'],
          context: 'Analysis of current market trends'
        }
      ],
      extractedAt: new Date()
    };

    // Categorize the newsletter
    const categories = await categorizer.categorizeNewsletter(mockContent);

    expect(categories).toBeDefined();
    expect(categories.length).toBeGreaterThan(0);
    
    // Should match business/finance category
    const financeCategory = categories.find(c => 
      c.name.toLowerCase().includes('finance') || 
      c.name.toLowerCase().includes('business')
    );
    expect(financeCategory).toBeDefined();
  });

  test('should add a new category', async () => {
    const customCategory = {
      name: 'Custom Category',
      description: 'A custom test category',
      icon: 'custom_icon',
      color: '#ff5722'
    };

    await categorizer.addCategory(customCategory);

    // Get all categories
    const categories = await categorizer.getCategories('test-user');
    const addedCategory = categories.find(c => c.name === 'Custom Category');

    expect(addedCategory).toBeDefined();
    expect(addedCategory?.description).toBe('A custom test category');
    expect(addedCategory?.icon).toBe('custom_icon');
    expect(addedCategory?.color).toBe('#ff5722');
  });

  test('should link newsletter to category', async () => {
    // Add a test category
    const customCategory = {
      name: 'Test Link Category',
      description: 'A category for testing links'
    };

    await categorizer.addCategory(customCategory);

    // Get the added category
    const categories = await categorizer.getCategories('test-user');
    const testCategory = categories.find(c => c.name === 'Test Link Category');
    
    if (!testCategory) {
      throw new Error('Test category not found');
    }

    // Link newsletter to category
    await categorizer.linkNewsletterToCategory('test-newsletter-456', testCategory.id, 0.8);

    // Create simple content to categorize
    const mockContent: ExtractedContent = {
      newsletterId: 'test-newsletter-456',
      rawContent: '<div>Simple newsletter</div>',
      plainText: 'Simple newsletter for testing.',
      structure: {
        title: 'Test Newsletter',
        sections: [{
          id: 'section-1',
          content: 'Test content',
          type: SectionType.CONTENT,
          links: [],
          level: 1
        }],
        metadata: {}
      },
      links: [],
      topics: [],
      extractedAt: new Date()
    };

    // Categorize the newsletter
    const assignedCategories = await categorizer.categorizeNewsletter(mockContent);

    // The test category should be assigned due to our manual linking
    expect(assignedCategories.some(c => c.id === testCategory.id)).toBe(true);
  });

  test('should retrieve categories for a user', async () => {
    // Add user-specific category via the ManualCategorizationHandler
    const userCategories = await categorizer.getCategories('test-user-123');
    
    // Should return default categories
    expect(userCategories.length).toBeGreaterThan(0);
    expect(userCategories.some(c => c.name === 'Technology')).toBe(true);
    expect(userCategories.some(c => c.name === 'Business')).toBe(true);
    expect(userCategories.some(c => c.name === 'Science')).toBe(true);
  });
});