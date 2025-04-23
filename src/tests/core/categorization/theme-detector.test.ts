/**
 * ThemeDetector Tests
 * Tests for the ThemeDetector implementation
 */

import { ThemeDetectorImpl } from '../../../core/categorization/theme-detector.js';
import { ExtractedContent, NewsletterStructure, SectionType } from '../../../interfaces/content-processing.js';

describe('ThemeDetector', () => {
  let themeDetector: ThemeDetectorImpl;

  beforeEach(() => {
    themeDetector = new ThemeDetectorImpl();
  });

  test('should detect themes from content', async () => {
    // Create mock extracted content
    const mockContent: ExtractedContent = {
      newsletterId: 'test-newsletter-123',
      rawContent: '<div>Test content about artificial intelligence and machine learning</div>',
      plainText: 'Test content about artificial intelligence and machine learning. This newsletter discusses the latest AI advancements and their impact on various industries. Machine learning algorithms are becoming more sophisticated.',
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
          author: 'AI Research Team',
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
          name: 'Industry Impact',
          confidence: 0.7,
          keywords: ['impact', 'industry', 'business', 'applications'],
          context: 'impact on various industries'
        }
      ],
      extractedAt: new Date()
    };

    const themes = await themeDetector.detectThemes(mockContent);

    expect(themes).toBeDefined();
    expect(themes.length).toBeGreaterThan(0);
    
    // Check for AI theme
    const aiTheme = themes.find(theme => 
      theme.name.toLowerCase().includes('artificial') || 
      theme.name.toLowerCase().includes('ai')
    );
    expect(aiTheme).toBeDefined();
    expect(aiTheme?.keywords).toContain('intelligence');
    expect(aiTheme?.relatedNewsletters).toContain('test-newsletter-123');
  });

  test('should merge similar themes', async () => {
    // Create similar themes
    const theme1 = {
      id: 'theme-1',
      name: 'Artificial Intelligence',
      description: 'Theme about AI',
      keywords: ['ai', 'artificial', 'intelligence', 'machine', 'learning'],
      relatedCategories: [],
      relatedNewsletters: ['newsletter-1'],
      strength: 0.8,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const theme2 = {
      id: 'theme-2',
      name: 'Machine Learning',
      description: 'Theme about ML',
      keywords: ['machine', 'learning', 'ai', 'algorithms', 'neural'],
      relatedCategories: [],
      relatedNewsletters: ['newsletter-2'],
      strength: 0.7,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mergedThemes = await themeDetector.mergeThemes([theme1, theme2]);

    expect(mergedThemes.length).toBe(1);
    expect(mergedThemes[0].keywords.length).toBeGreaterThan(
      Math.max(theme1.keywords.length, theme2.keywords.length)
    );
    expect(mergedThemes[0].relatedNewsletters).toContain('newsletter-1');
    expect(mergedThemes[0].relatedNewsletters).toContain('newsletter-2');
  });

  test('should get themes by keywords', async () => {
    // Create mock extracted content to generate themes
    const mockContent: ExtractedContent = {
      newsletterId: 'test-newsletter-123',
      rawContent: '<div>Test content about artificial intelligence and machine learning</div>',
      plainText: 'Test content about artificial intelligence and machine learning.',
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
          author: 'AI Research Team',
          date: '2025-04-23'
        }
      },
      links: [],
      topics: [
        {
          name: 'Artificial Intelligence',
          confidence: 0.9,
          keywords: ['artificial', 'intelligence', 'ai', 'machine', 'learning'],
          context: 'Latest AI Developments'
        }
      ],
      extractedAt: new Date()
    };

    // Generate themes
    await themeDetector.detectThemes(mockContent);

    // Search by keywords
    const themes = await themeDetector.getThemesByKeywords(['artificial', 'intelligence']);

    expect(themes).toBeDefined();
    expect(themes.length).toBeGreaterThan(0);
    expect(themes[0].keywords.some(k => k === 'artificial' || k === 'intelligence')).toBe(true);
  });

  test('should update existing themes with new content', async () => {
    // Create first mock content
    const mockContent1: ExtractedContent = {
      newsletterId: 'test-newsletter-123',
      rawContent: '<div>Test content about artificial intelligence</div>',
      plainText: 'Test content about artificial intelligence.',
      structure: {
        title: 'AI Technology Newsletter',
        sections: [
          {
            id: 'section-1',
            title: 'AI News',
            content: 'News about AI',
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
          name: 'Artificial Intelligence',
          confidence: 0.9,
          keywords: ['artificial', 'intelligence', 'ai'],
          context: 'AI News'
        }
      ],
      extractedAt: new Date()
    };

    // Create themes from first content
    const themes1 = await themeDetector.detectThemes(mockContent1);
    expect(themes1.length).toBeGreaterThan(0);
    
    // Create second mock content with related themes
    const mockContent2: ExtractedContent = {
      newsletterId: 'test-newsletter-456',
      rawContent: '<div>More content about AI and deep learning</div>',
      plainText: 'More content about AI and deep learning.',
      structure: {
        title: 'Deep Learning Insights',
        sections: [
          {
            id: 'section-1',
            title: 'Deep Learning',
            content: 'News about deep learning',
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
          name: 'Deep Learning',
          confidence: 0.8,
          keywords: ['deep', 'learning', 'neural', 'networks', 'ai'],
          context: 'Deep Learning'
        }
      ],
      extractedAt: new Date()
    };

    // Update themes with second content
    const updatedThemes = await themeDetector.updateThemes(mockContent2, themes1);

    // Expect the AI theme to be updated with content from both newsletters
    expect(updatedThemes.length).toBeGreaterThan(0);
    const aiTheme = updatedThemes.find(theme => 
      theme.keywords.includes('ai') || theme.keywords.includes('artificial')
    );
    expect(aiTheme).toBeDefined();
    expect(aiTheme?.relatedNewsletters).toContain('test-newsletter-123');
    expect(aiTheme?.relatedNewsletters).toContain('test-newsletter-456');
  });
});