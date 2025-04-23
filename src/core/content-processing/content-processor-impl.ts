/**
 * Content Processor Implementation
 * Main implementation of the content processor interface
 */

import { 
  ContentProcessor, 
  ContentRepository, 
  ExtractedContent, 
  ExtractionOptions, 
  HtmlContentExtractor, 
  Link, 
  LinkExtractor, 
  NewsletterStructure, 
  NewsletterStructureParser, 
  Topic, 
  TopicExtractor 
} from '../../interfaces/content-processing.js';
import { Logger } from '../../utils/logger.js';
import { HtmlContentExtractorImpl } from './extractors/html-content-extractor.js';
import { LinkExtractorImpl } from './extractors/link-extractor.js';
import { TopicExtractorImpl } from './extractors/topic-extractor.js';
import { NewsletterStructureParserImpl } from './parsers/newsletter-structure-parser.js';
import { InMemoryContentRepository } from './utils/content-repository.js';

/**
 * Default implementation of the ContentProcessor interface
 */
export class ContentProcessorImpl implements ContentProcessor {
  private logger: Logger;
  private htmlExtractor: HtmlContentExtractor;
  private structureParser: NewsletterStructureParser;
  private linkExtractor: LinkExtractor;
  private topicExtractor: TopicExtractor;
  private contentRepository: ContentRepository;
  
  // In a real implementation, this would come from the Gmail MCP Client
  private emailCache: Map<string, { html: string, raw: string }>;

  constructor() {
    this.logger = new Logger('ContentProcessor');
    this.htmlExtractor = new HtmlContentExtractorImpl();
    this.structureParser = new NewsletterStructureParserImpl();
    this.linkExtractor = new LinkExtractorImpl();
    this.topicExtractor = new TopicExtractorImpl();
    this.contentRepository = new InMemoryContentRepository();
    
    // Initialize email cache (for demo purposes)
    this.emailCache = new Map<string, { html: string, raw: string }>();
  }

  /**
   * Extract content from an email
   * @param emailId The ID of the email to extract content from
   * @param options Options for extraction
   */
  async extractContent(emailId: string, options?: ExtractionOptions): Promise<ExtractedContent> {
    try {
      this.logger.info(`Extracting content from email: ${emailId}`);
      
      // Check if content already exists for this email
      const existingContent = await this.contentRepository.getContent(emailId);
      if (existingContent) {
        this.logger.debug(`Content already exists for email: ${emailId}`);
        return existingContent;
      }
      
      // Get email content (in a real implementation, this would come from Gmail MCP Client)
      const emailContent = await this.getEmailContent(emailId);
      if (!emailContent) {
        throw new Error(`Email content not found for ID: ${emailId}`);
      }
      
      // Extract raw content and convert to plain text
      this.logger.debug('Extracting and cleaning HTML content');
      const rawContent = await this.htmlExtractor.extractMainContent(emailContent.html);
      const plainText = this.htmlExtractor.convertToPlainText(rawContent);
      
      // Parse structure
      this.logger.debug('Parsing newsletter structure');
      const structure = await this.parseStructure(rawContent);
      
      // Extract links
      this.logger.debug('Extracting links');
      const links = await this.extractLinks(rawContent);
      
      // Extract topics if requested or by default
      let topics: Topic[] = [];
      if (!options || options.extractTopics !== false) {
        this.logger.debug('Extracting topics');
        topics = await this.extractTopics(plainText);
      }
      
      // Create extracted content object
      const extractedContent: ExtractedContent = {
        newsletterId: emailId,
        rawContent,
        plainText,
        structure,
        links,
        topics,
        extractedAt: new Date()
      };
      
      // Store the extracted content
      await this.storeContent(extractedContent);
      
      this.logger.info(`Content extraction completed for email: ${emailId}`);
      return extractedContent;
    } catch (error) {
      this.logger.error(`Error extracting content: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Content extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Parse the structure of newsletter content
   * @param content The HTML content to parse
   */
  async parseStructure(content: string): Promise<NewsletterStructure> {
    try {
      return await this.structureParser.parseStructure(content);
    } catch (error) {
      this.logger.error(`Error parsing structure: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Structure parsing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extract links from newsletter content
   * @param content The HTML content to extract links from
   */
  async extractLinks(content: string): Promise<Link[]> {
    try {
      return await this.linkExtractor.extractLinks(content);
    } catch (error) {
      this.logger.error(`Error extracting links: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Link extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extract topics from newsletter content
   * @param content The text content to extract topics from
   */
  async extractTopics(content: string): Promise<Topic[]> {
    try {
      return await this.topicExtractor.extractTopics(content);
    } catch (error) {
      this.logger.error(`Error extracting topics: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Topic extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Store processed content for future retrieval
   * @param extractedContent The processed content to store
   */
  async storeContent(extractedContent: ExtractedContent): Promise<void> {
    try {
      await this.contentRepository.storeContent(extractedContent);
    } catch (error) {
      this.logger.error(`Error storing content: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Content storage failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Retrieve stored content by ID
   * @param newsletterId The ID of the newsletter
   */
  async getContent(newsletterId: string): Promise<ExtractedContent | null> {
    try {
      return await this.contentRepository.getContent(newsletterId);
    } catch (error) {
      this.logger.error(`Error retrieving content: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Content retrieval failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get email content from cache or source
   * In a real implementation, this would use the Gmail MCP Client
   * @param emailId The ID of the email
   */
  private async getEmailContent(emailId: string): Promise<{ html: string; raw: string } | null> {
    // In a real implementation, this would call gmailMcpClient.getEmail(emailId)
    // For now, we'll use a simple cache with mock data
    if (this.emailCache.has(emailId)) {
      return this.emailCache.get(emailId) || null;
    }
    
    // For demo purposes, return mock content
    // In a real implementation, this would fetch from Gmail
    const mockContent = this.createMockEmailContent(emailId);
    this.emailCache.set(emailId, mockContent);
    
    return mockContent;
  }

  /**
   * Create mock email content for testing
   * @param emailId The ID of the email
   */
  private createMockEmailContent(emailId: string): { html: string; raw: string } {
    const mockHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Tech Newsletter - Issue #42</title>
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
    
    const mockRaw = `
    From: tech-newsletter@example.com
    To: user@example.com
    Subject: Tech Newsletter - Issue #42
    Date: Fri, 23 Apr 2025 09:00:00 -0700
    Content-Type: text/html; charset=UTF-8
    
    ${mockHtml}
    `;
    
    return { html: mockHtml, raw: mockRaw };
  }
}