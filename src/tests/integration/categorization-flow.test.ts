/**
 * Categorization Flow Integration Test
 * 
 * Tests the newsletter categorization system:
 * - Automatic categorization of newsletters
 * - Manual categorization through tool calls
 * - Theme detection and relationship generation
 */

import { TestFixture } from './test-fixture.js';
import { createCategorizer } from '../../core/categorization/index.js';
import { createContentProcessor } from '../../core/content-processing/index.js';
import { getNewsletterEmails } from './test-data/sample-emails.js';
import { CategorizeNewsletterTool } from '../../tools/categorize-newsletter-tool.js';
import { GetCategoriesTool } from '../../tools/get-categories-tool.js';
import { AssignCategoryTool } from '../../tools/assign-category-tool.js';

describe('Categorization Flow Integration Tests', () => {
  // Test fixture
  let fixture: TestFixture;
  let newsletterId: string;
  
  // Hook to set up test fixture before all tests
  beforeAll(async () => {
    fixture = new TestFixture();
    await fixture.setup();
    
    // Create a test newsletter for categorization tests
    const newsletterRepository = fixture.repositoryFactory.getSpecializedRepository('NewsletterRepository');
    
    const newsletter = await newsletterRepository.create({
      emailId: 'tech-newsletter-123',
      subject: 'Latest in Technology and AI Advancements',
      sender: 'tech-updates@example.com',
      receivedDate: new Date(),
      detectionConfidence: 0.95,
      isVerified: true,
      processedContentJson: JSON.stringify({
        content: `
          <h1>Tech Updates Weekly</h1>
          <h2>Latest in AI and Software Development</h2>
          <p>This week's top stories in artificial intelligence and technology advancements.</p>
          <h3>New Deep Learning Framework Released</h3>
          <p>Researchers at MIT have released a new deep learning framework that promises to improve training efficiency by 40%.</p>
          <h3>Cloud Computing Trends for 2023</h3>
          <p>Major cloud providers are shifting towards serverless architectures and improved containerization support.</p>
          <h3>Programming Language Popularity</h3>
          <p>Python continues to dominate the programming language landscape, with TypeScript seeing the fastest growth.</p>
        `,
        links: [
          { url: 'https://example.com/ai-framework', title: 'New AI Framework' },
          { url: 'https://example.com/cloud-trends', title: 'Cloud Computing Trends' },
          { url: 'https://example.com/programming-languages', title: 'Programming Languages' }
        ],
        summary: 'A weekly update on technology topics including AI, cloud computing, and programming languages.',
        topics: ['artificial intelligence', 'software development', 'cloud computing', 'programming languages']
      })
    });
    
    newsletterId = newsletter.id;
  });
  
  // Hook to tear down test fixture after all tests
  afterAll(async () => {
    await fixture.teardown();
  });
  
  // Test category management and retrieval
  describe('Category Management', () => {
    it('should retrieve categories through the GetCategoriesTool', async () => {
      // Use the GetCategoriesTool to retrieve categories
      const result = await GetCategoriesTool.handler({});
      
      // Verify tool output
      expect(result).toHaveProperty('content');
      expect(result.content.length).toBeGreaterThan(0);
      
      // Should include JSON output with categories
      const jsonOutput = result.content.find(c => c.type === 'json');
      expect(jsonOutput).toBeDefined();
      expect(jsonOutput?.json).toHaveProperty('categories');
      
      // Should have categories
      const categories = jsonOutput?.json.categories;
      expect(categories.length).toBeGreaterThan(0);
      
      // Verify at least the main categories we created in the fixture
      const mainCategories = ['Technology', 'Finance', 'Science', 'Design'];
      for (const mainCategory of mainCategories) {
        expect(categories.some((c: any) => c.name === mainCategory)).toBe(true);
      }
    });
    
    it('should retrieve subcategories for a parent category', async () => {
      // First, get all categories to find the Technology category ID
      const allCategoriesResult = await GetCategoriesTool.handler({});
      const categoriesJson = allCategoriesResult.content.find(c => c.type === 'json')?.json;
      const techCategory = categoriesJson.categories.find((c: any) => c.name === 'Technology');
      
      // Use the GetCategoriesTool to retrieve subcategories
      const result = await GetCategoriesTool.handler({
        parentCategory: techCategory.id
      });
      
      // Verify tool output
      const jsonOutput = result.content.find(c => c.type === 'json');
      expect(jsonOutput).toBeDefined();
      expect(jsonOutput?.json).toHaveProperty('categories');
      
      // Should have subcategories
      const subcategories = jsonOutput?.json.categories;
      expect(subcategories.length).toBeGreaterThan(0);
      
      // Should include the expected tech subcategories
      const techSubcategories = ['Software Development', 'AI & Machine Learning'];
      for (const subCategory of techSubcategories) {
        expect(subcategories.some((c: any) => c.name === subCategory)).toBe(true);
      }
    });
  });
  
  // Test automatic categorization
  describe('Automatic Categorization', () => {
    it('should categorize a newsletter automatically', async () => {
      // Get the categorizer
      const categorizer = createCategorizer();
      
      // Get the content processor to prepare input for categorization
      const contentProcessor = createContentProcessor();
      
      // Get a sample newsletter
      const newsletterEmail = getNewsletterEmails()[0];
      
      // Process the newsletter content
      const processedContent = await contentProcessor.processEmailContent(newsletterEmail);
      
      // Categorize the newsletter
      const categories = await categorizer.categorizeNewsletter(processedContent);
      
      // Verify categorization results
      expect(categories).toBeDefined();
      expect(categories.length).toBeGreaterThan(0);
      
      // Each category should have expected properties
      for (const category of categories) {
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('confidence');
        expect(category.confidence).toBeGreaterThan(0);
        expect(category.confidence).toBeLessThanOrEqual(1);
      }
    });
    
    it('should use the CategorizeNewsletterTool correctly', async () => {
      // Get a sample newsletter
      const newsletterRepository = fixture.repositoryFactory.getSpecializedRepository('NewsletterRepository');
      const newsletter = await newsletterRepository.findById(newsletterId);
      
      // Use the tool with the pre-created test newsletter
      const extractedContent = {
        newsletterId: newsletter?.id,
        subject: newsletter?.subject,
        sender: newsletter?.sender,
        receivedDate: newsletter?.receivedDate.toISOString(),
        content: JSON.parse(newsletter?.processedContentJson || '{}').content,
        links: JSON.parse(newsletter?.processedContentJson || '{}').links,
        summary: JSON.parse(newsletter?.processedContentJson || '{}').summary,
        topics: JSON.parse(newsletter?.processedContentJson || '{}').topics
      };
      
      const result = await CategorizeNewsletterTool.handler({
        extractedContentId: newsletterId,
        extractedContent
      });
      
      // Verify tool output
      expect(result).toHaveProperty('newsletterId');
      expect(result).toHaveProperty('categories');
      
      // Should have assigned categories
      expect(result.categories.length).toBeGreaterThan(0);
      
      // For tech newsletter, should include tech-related categories
      const categoryNames = result.categories.map(c => c.name.toLowerCase());
      expect(categoryNames.some(name => 
        name.includes('tech') || 
        name.includes('software') || 
        name.includes('ai') || 
        name.includes('computer')
      )).toBe(true);
    });
  });
  
  // Test manual categorization
  describe('Manual Categorization', () => {
    it('should assign a category to a newsletter manually', async () => {
      // First, get all categories to find a specific category ID
      const allCategoriesResult = await GetCategoriesTool.handler({});
      const categoriesJson = allCategoriesResult.content.find(c => c.type === 'json')?.json;
      const designCategory = categoriesJson.categories.find((c: any) => c.name === 'Design');
      
      // Use the AssignCategoryTool to manually assign a category
      const result = await AssignCategoryTool.handler({
        newsletterId,
        categoryId: designCategory.id,
        confidence: 1.0 // Manual assignment is 100% confidence
      });
      
      // Verify tool output
      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('successfully assigned');
      
      // Verify the assignment in the database
      const categoryAssignmentRepository = fixture.repositoryFactory.getSpecializedRepository('CategoryAssignmentRepository');
      
      const assignments = await categoryAssignmentRepository.find({
        where: {
          newsletterId,
          categoryId: designCategory.id
        }
      });
      
      // Should have created the assignment
      expect(assignments.length).toBe(1);
      expect(assignments[0].isManual).toBe(true);
      expect(assignments[0].confidence).toBe(1.0);
    });
    
    it('should retrieve a newsletter with its categories', async () => {
      // Get newsletter repository
      const newsletterRepository = fixture.repositoryFactory.getSpecializedRepository('NewsletterRepository');
      
      // Retrieve the newsletter with categories
      const newsletterWithCategories = await newsletterRepository.findWithCategories(newsletterId);
      
      // Verify retrieved data
      expect(newsletterWithCategories).not.toBeNull();
      expect(newsletterWithCategories?.categories).toBeDefined();
      expect(newsletterWithCategories?.categories.length).toBeGreaterThan(0);
      
      // Should include both automatic and manual categories
      const categoryNames = newsletterWithCategories?.categories.map(c => c.name) || [];
      
      // Should include the manually assigned 'Design' category
      expect(categoryNames).toContain('Design');
      
      // Should also have some automatically assigned tech categories
      const hasTechCategory = categoryNames.some(name => 
        name.includes('Technology') || 
        name.includes('Software') || 
        name.includes('AI') ||
        name.includes('Tech')
      );
      expect(hasTechCategory).toBe(true);
    });
  });
  
  // Test category relationships and theme detection
  describe('Theme Detection and Relationships', () => {
    it('should detect themes across newsletters in the same category', async () => {
      // Get category repository
      const categoryRepository = fixture.repositoryFactory.getSpecializedRepository('CategoryRepository');
      
      // Get the technology category
      const techCategory = await categoryRepository.findOne({
        where: { name: 'Technology' }
      });
      
      // Create multiple tech newsletters to establish themes
      const newsletterRepository = fixture.repositoryFactory.getSpecializedRepository('NewsletterRepository');
      const categoryAssignmentRepository = fixture.repositoryFactory.getSpecializedRepository('CategoryAssignmentRepository');
      
      // Create first AI-focused newsletter
      const aiNewsletter1 = await newsletterRepository.create({
        emailId: 'ai-newsletter-1',
        subject: 'Advances in Machine Learning',
        sender: 'ai-updates@example.com',
        receivedDate: new Date(),
        detectionConfidence: 0.95,
        isVerified: true,
        processedContentJson: JSON.stringify({
          content: `<h1>AI Weekly</h1><p>Updates on machine learning and neural networks</p>`,
          summary: 'Weekly updates on machine learning research and applications.',
          topics: ['machine learning', 'neural networks', 'AI research']
        })
      });
      
      // Create second AI-focused newsletter
      const aiNewsletter2 = await newsletterRepository.create({
        emailId: 'ai-newsletter-2',
        subject: 'Latest in Deep Learning',
        sender: 'deep-learning@example.com',
        receivedDate: new Date(),
        detectionConfidence: 0.95,
        isVerified: true,
        processedContentJson: JSON.stringify({
          content: `<h1>Deep Learning Digest</h1><p>The latest in neural network architectures</p>`,
          summary: 'A digest of deep learning research and applications.',
          topics: ['deep learning', 'neural networks', 'computer vision']
        })
      });
      
      // Assign both to technology category
      await categoryAssignmentRepository.create({
        newsletterId: aiNewsletter1.id,
        categoryId: techCategory.id,
        confidence: 0.95,
        isManual: false
      });
      
      await categoryAssignmentRepository.create({
        newsletterId: aiNewsletter2.id,
        categoryId: techCategory.id,
        confidence: 0.95,
        isManual: false
      });
      
      // Get the theme detector from categorizer
      const categorizer = createCategorizer();
      const themeDetector = categorizer.getThemeDetector();
      
      // Detect themes within the technology category
      const themes = await themeDetector.detectThemes(techCategory.id);
      
      // Verify theme detection
      expect(themes).toBeDefined();
      expect(themes.length).toBeGreaterThan(0);
      
      // Look for AI/ML related themes
      const aiTheme = themes.find(theme => 
        theme.label.toLowerCase().includes('ai') || 
        theme.label.toLowerCase().includes('machine learning') ||
        theme.label.toLowerCase().includes('neural') ||
        theme.keywords.some(k => k.includes('neural') || k.includes('ai') || k.includes('learning'))
      );
      
      expect(aiTheme).toBeDefined();
      expect(aiTheme?.newsletters.length).toBeGreaterThanOrEqual(2);
      expect(aiTheme?.confidence).toBeGreaterThan(0.7);
    });
  });
});