/**
 * Content Processing Module Interfaces
 * Defines interfaces for extracting and processing content from newsletter emails
 */

/**
 * Represents a link extracted from newsletter content
 */
export interface Link {
  url: string;
  text: string;
  category?: string;
  context?: string;
  isSponsored?: boolean;
}

/**
 * Represents a topic extracted from newsletter content
 */
export interface Topic {
  name: string;
  confidence: number;
  keywords: string[];
  context?: string;
}

/**
 * Represents the structure of a newsletter
 */
export interface NewsletterStructure {
  title: string;
  sections: NewsletterSection[];
  metadata: Record<string, string>;
}

/**
 * Represents a section within a newsletter
 */
export interface NewsletterSection {
  id: string;
  title?: string;
  content: string;
  type: SectionType;
  links: Link[];
  images?: string[];
  level: number; // Nesting level
}

/**
 * Supported section types
 */
export enum SectionType {
  HEADER = 'header',
  CONTENT = 'content',
  FEATURED = 'featured',
  QUOTE = 'quote',
  LIST = 'list',
  SPONSORED = 'sponsored',
  FOOTER = 'footer'
}

/**
 * Represents extracted content from a newsletter
 */
export interface ExtractedContent {
  newsletterId: string;
  rawContent: string;
  plainText: string;
  structure: NewsletterStructure;
  links: Link[];
  topics: Topic[];
  extractedAt: Date;
}

/**
 * Options for content extraction
 */
export interface ExtractionOptions {
  includeImages: boolean;
  maxDepth?: number;
  preserveFormatting?: boolean;
  extractTopics?: boolean;
}

/**
 * Main interface for the content processor
 */
export interface ContentProcessor {
  /**
   * Extract content from an email
   * @param emailId The ID of the email to extract content from
   * @param options Options for extraction
   */
  extractContent(emailId: string, options?: ExtractionOptions): Promise<ExtractedContent>;
  
  /**
   * Parse the structure of newsletter content
   * @param content The HTML content to parse
   */
  parseStructure(content: string): Promise<NewsletterStructure>;
  
  /**
   * Extract links from newsletter content
   * @param content The HTML content to extract links from
   */
  extractLinks(content: string): Promise<Link[]>;
  
  /**
   * Extract topics from newsletter content
   * @param content The text content to extract topics from
   */
  extractTopics(content: string): Promise<Topic[]>;
  
  /**
   * Store processed content for future retrieval
   * @param extractedContent The processed content to store
   */
  storeContent(extractedContent: ExtractedContent): Promise<void>;
  
  /**
   * Retrieve stored content by ID
   * @param newsletterId The ID of the newsletter
   */
  getContent(newsletterId: string): Promise<ExtractedContent | null>;
}

/**
 * HTML content extractor interface
 */
export interface HtmlContentExtractor {
  /**
   * Extract the main content from HTML
   * @param html The HTML content
   */
  extractMainContent(html: string): Promise<string>;
  
  /**
   * Convert HTML to plain text
   * @param html The HTML content
   */
  convertToPlainText(html: string): string;
  
  /**
   * Remove unnecessary elements from HTML
   * @param html The HTML content
   */
  cleanHtml(html: string): string;
}

/**
 * Newsletter structure parser interface
 */
export interface NewsletterStructureParser {
  /**
   * Parse newsletter HTML into a structured format
   * @param html The HTML content
   */
  parseStructure(html: string): Promise<NewsletterStructure>;
  
  /**
   * Identify sections in the newsletter
   * @param html The HTML content
   */
  identifySections(html: string): NewsletterSection[];
  
  /**
   * Extract metadata from the newsletter
   * @param html The HTML content
   */
  extractMetadata(html: string): Record<string, string>;
}

/**
 * Link extractor interface
 */
export interface LinkExtractor {
  /**
   * Extract links from HTML content
   * @param html The HTML content
   */
  extractLinks(html: string): Promise<Link[]>;
  
  /**
   * Categorize extracted links
   * @param links The links to categorize
   */
  categorizeLinks(links: Link[]): Promise<Link[]>;
  
  /**
   * Identify sponsored links
   * @param links The links to check
   */
  identifySponsoredLinks(links: Link[]): Promise<Link[]>;
}

/**
 * Topic extractor interface
 */
export interface TopicExtractor {
  /**
   * Extract topics from content
   * @param text The text content
   */
  extractTopics(text: string): Promise<Topic[]>;
  
  /**
   * Extract keywords from content
   * @param text The text content
   */
  extractKeywords(text: string): Promise<string[]>;
  
  /**
   * Calculate confidence scores for topics
   * @param topics The topics to score
   * @param text The original text
   */
  calculateConfidence(topics: Topic[], text: string): Promise<Topic[]>;
}

/**
 * Content repository interface
 */
export interface ContentRepository {
  /**
   * Store extracted content
   * @param content The content to store
   */
  storeContent(content: ExtractedContent): Promise<void>;
  
  /**
   * Retrieve content by newsletter ID
   * @param newsletterId The ID of the newsletter
   */
  getContent(newsletterId: string): Promise<ExtractedContent | null>;
  
  /**
   * List content IDs based on criteria
   * @param criteria The search criteria
   */
  listContentIds(criteria?: Record<string, any>): Promise<string[]>;
  
  /**
   * Delete content by ID
   * @param newsletterId The ID of the newsletter
   */
  deleteContent(newsletterId: string): Promise<boolean>;
}