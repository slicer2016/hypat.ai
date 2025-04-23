/**
 * Content Processor Tests
 * Tests for the Content Processing module
 */

import { ContentProcessorImpl } from '../../core/content-processing/content-processor-impl.js';
import { HtmlContentExtractorImpl } from '../../core/content-processing/extractors/html-content-extractor.js';
import { LinkExtractorImpl } from '../../core/content-processing/extractors/link-extractor.js';
import { TopicExtractorImpl } from '../../core/content-processing/extractors/topic-extractor.js';
import { NewsletterStructureParserImpl } from '../../core/content-processing/parsers/newsletter-structure-parser.js';

// Mock HTML content for testing
const mockHtmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Tech Newsletter - Test Issue</title>
  <meta name="description" content="Weekly updates on technology news">
</head>
<body>
  <div class="header">
    <h1>Tech Newsletter</h1>
    <div class="date">April 23, 2025</div>
    <div class="author">By Tech Team</div>
  </div>
  
  <div class="content">
    <h2>Latest Tech News</h2>
    <p>
      Welcome to our weekly tech newsletter. This week we're covering the latest 
      advancements in AI technology and how they're changing the industry.
    </p>
    
    <div class="section">
      <h3>AI Developments</h3>
      <p>
        A new breakthrough in natural language processing has enabled more human-like 
        conversations with AI assistants. <a href="https://example.com/ai-news">Read more</a>
        about how this technology works.
      </p>
      <p>
        Researchers at Tech University have published a paper on improved object detection
        algorithms that work in low-light conditions. This could revolutionize autonomous 
        driving technology.
      </p>
    </div>
    
    <div class="section">
      <h3>Industry Updates</h3>
      <p>
        Major tech companies are investing heavily in quantum computing research, with 
        <a href="https://example.com/quantum">TechCorp announcing a new quantum processor</a>
        that operates at near-zero temperatures.
      </p>
    </div>
    
    <div class="sponsored">
      <p>
        <strong>Sponsored:</strong> Upgrade your development environment with DevTools Pro.
        <a href="https://example.com/sponsor?ref=newsletter">Try it free for 30 days</a>.
      </p>
    </div>
  </div>
  
  <div class="footer">
    <p>
      To unsubscribe from this newsletter, <a href="https://example.com/unsubscribe">click here</a>.
    </p>
    <p>
      Copyright © 2025 Tech Newsletter. All rights reserved.
    </p>
  </div>
</body>
</html>
`;

describe('Content Processing Module', () => {
  describe('HtmlContentExtractor', () => {
    const htmlExtractor = new HtmlContentExtractorImpl();
    
    test('should extract main content from HTML', async () => {
      const mainContent = await htmlExtractor.extractMainContent(mockHtmlContent);
      
      // Check that main content contains key sections
      expect(mainContent).toContain('Latest Tech News');
      expect(mainContent).toContain('AI Developments');
      expect(mainContent).toContain('Industry Updates');
    });
    
    test('should convert HTML to plain text', () => {
      const plainText = htmlExtractor.convertToPlainText(mockHtmlContent);
      
      // Check that HTML tags are removed
      expect(plainText).not.toContain('<div');
      expect(plainText).not.toContain('<a href');
      
      // Check that text content is preserved
      expect(plainText).toContain('Tech Newsletter');
      expect(plainText).toContain('Latest Tech News');
      expect(plainText).toContain('AI Developments');
    });
    
    test('should clean HTML', () => {
      const cleanedHtml = htmlExtractor.cleanHtml(mockHtmlContent);
      
      // Check that DOCTYPE and comments are removed
      expect(cleanedHtml).not.toContain('<!DOCTYPE');
      
      // Check that content is preserved
      expect(cleanedHtml).toContain('Tech Newsletter');
      expect(cleanedHtml).toContain('Latest Tech News');
    });
  });
  
  describe('LinkExtractor', () => {
    const linkExtractor = new LinkExtractorImpl();
    
    test('should extract links from HTML content', async () => {
      const links = await linkExtractor.extractLinks(mockHtmlContent);
      
      // Check that links are extracted
      expect(links.length).toBeGreaterThan(0);
      
      // Verify link properties
      const aiNewsLink = links.find(link => link.url === 'https://example.com/ai-news');
      expect(aiNewsLink).toBeDefined();
      expect(aiNewsLink?.text).toContain('Read more');
      
      // Check sponsored link detection
      const sponsoredLink = links.find(link => link.url === 'https://example.com/sponsor?ref=newsletter');
      expect(sponsoredLink).toBeDefined();
      expect(sponsoredLink?.isSponsored).toBe(true);
    });
  });
  
  describe('NewsletterStructureParser', () => {
    const structureParser = new NewsletterStructureParserImpl();
    
    test('should parse newsletter structure', async () => {
      const structure = await structureParser.parseStructure(mockHtmlContent);
      
      // Check title extraction
      expect(structure.title).toBe('Tech Newsletter');
      
      // Check sections
      expect(structure.sections.length).toBeGreaterThan(0);
      
      // Check metadata
      expect(structure.metadata).toBeDefined();
      expect(structure.metadata.author).toBe('By Tech Team');
    });
    
    test('should identify sections in newsletter', () => {
      const sections = structureParser.identifySections(mockHtmlContent);
      
      // Verify sections were identified
      expect(sections.length).toBeGreaterThan(0);
      
      // Check for header and footer
      const headerSection = sections.find(section => section.type === 'header');
      expect(headerSection).toBeDefined();
      
      const footerSection = sections.find(section => section.type === 'footer');
      expect(footerSection).toBeDefined();
      
      // Check for content sections
      const contentSections = sections.filter(section => section.type === 'content');
      expect(contentSections.length).toBeGreaterThan(0);
    });
  });
  
  describe('TopicExtractor', () => {
    const topicExtractor = new TopicExtractorImpl();
    
    test('should extract topics from content', async () => {
      // Convert HTML to plain text first
      const htmlExtractor = new HtmlContentExtractorImpl();
      const plainText = htmlExtractor.convertToPlainText(mockHtmlContent);
      
      const topics = await topicExtractor.extractTopics(plainText);
      
      // Verify topics were extracted
      expect(topics.length).toBeGreaterThan(0);
      
      // Check for expected topics
      const aiTopic = topics.find(topic => 
        topic.name.toLowerCase().includes('ai') || 
        topic.keywords.some(kw => kw.toLowerCase().includes('ai'))
      );
      expect(aiTopic).toBeDefined();
      
      // Check confidence scores
      topics.forEach(topic => {
        expect(topic.confidence).toBeGreaterThanOrEqual(0);
        expect(topic.confidence).toBeLessThanOrEqual(1);
      });
    });
    
    test('should extract keywords from content', async () => {
      const keywords = await topicExtractor.extractKeywords('AI technology is revolutionizing the industry with new natural language processing capabilities. Advanced machine learning models are enabling more human-like conversations.');
      
      // Verify keywords were extracted
      expect(keywords.length).toBeGreaterThan(0);
      
      // Check for expected keywords
      expect(keywords).toContain('technology');
      expect(keywords).toContain('language');
      expect(keywords).toContain('processing');
    });
  });
  
  describe('ContentProcessor', () => {
    const contentProcessor = new ContentProcessorImpl();
    
    test('should extract content from an email', async () => {
      // This test would normally require mocking the Gmail MCP client
      // We're testing the basic functionality with the mock data
      
      const newsletterId = 'test-newsletter-123';
      
      // Extract content
      const extractedContent = await contentProcessor.extractContent(newsletterId);
      
      // Verify content was extracted
      expect(extractedContent).toBeDefined();
      expect(extractedContent.newsletterId).toBe(newsletterId);
      expect(extractedContent.structure).toBeDefined();
      expect(extractedContent.links.length).toBeGreaterThan(0);
      expect(extractedContent.topics.length).toBeGreaterThan(0);
    });
    
    test('should store and retrieve content', async () => {
      const newsletterId = 'test-newsletter-456';
      
      // Extract and store content
      const extractedContent = await contentProcessor.extractContent(newsletterId);
      
      // Retrieve content
      const retrievedContent = await contentProcessor.getContent(newsletterId);
      
      // Verify content was stored and retrieved correctly
      expect(retrievedContent).toBeDefined();
      expect(retrievedContent?.newsletterId).toBe(newsletterId);
      expect(retrievedContent?.structure.title).toBe(extractedContent.structure.title);
    });
  });
});