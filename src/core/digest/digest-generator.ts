/**
 * Digest Generator Implementation
 * Creates digest content from newsletter content
 */

import { v4 as uuidv4 } from 'uuid';
import { DateTime } from 'luxon';
import { Digest, DigestFormat, DigestFrequency, DigestGenerator, DigestItem, DigestSection, UserPreferenceManager } from './interfaces.js';
import { ContentProcessor, ExtractedContent, SectionType } from '../../interfaces/content-processing.js';
import { Category, Categorizer } from '../categorization/interfaces.js';
import { Logger } from '../../utils/logger.js';

/**
 * Implementation of the DigestGenerator interface
 */
export class DigestGeneratorImpl implements DigestGenerator {
  private logger: Logger;
  private contentProcessor: ContentProcessor;
  private categorizer: Categorizer;
  private userPreferenceManager: UserPreferenceManager;
  
  // In-memory cache for extracted content (would be replaced by database in production)
  private contentCache: Map<string, ExtractedContent>;
  
  constructor(
    contentProcessor: ContentProcessor, 
    categorizer: Categorizer,
    userPreferenceManager: UserPreferenceManager
  ) {
    this.logger = new Logger('DigestGenerator');
    this.contentProcessor = contentProcessor;
    this.categorizer = categorizer;
    this.userPreferenceManager = userPreferenceManager;
    this.contentCache = new Map<string, ExtractedContent>();
  }

  /**
   * Generate a daily digest for a user
   * @param userId The user ID to generate the digest for
   * @param date The date to generate the digest for (defaults to today)
   */
  async generateDailyDigest(userId: string, date?: Date): Promise<Digest> {
    try {
      this.logger.info(`Generating daily digest for user: ${userId}`);
      
      // Get user preferences
      const userPreferences = await this.userPreferenceManager.getDigestPreferences(userId);
      if (!userPreferences) {
        throw new Error(`User preferences not found for user: ${userId}`);
      }
      
      // Set time boundaries for the digest
      const today = date ? DateTime.fromJSDate(date) : DateTime.now();
      const startDate = today.startOf('day').minus({ days: 1 }).toJSDate();
      const endDate = today.startOf('day').toJSDate();
      
      // Get user's preferred format or default to standard
      const format = userPreferences.format || DigestFormat.STANDARD;
      
      // Generate the digest
      return this.generateCustomDigest(userId, startDate, endDate, format);
    } catch (error) {
      this.logger.error(`Error generating daily digest: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to generate daily digest: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate a weekly digest for a user
   * @param userId The user ID to generate the digest for
   * @param endDate The end date of the week (defaults to today)
   */
  async generateWeeklyDigest(userId: string, endDate?: Date): Promise<Digest> {
    try {
      this.logger.info(`Generating weekly digest for user: ${userId}`);
      
      // Get user preferences
      const userPreferences = await this.userPreferenceManager.getDigestPreferences(userId);
      if (!userPreferences) {
        throw new Error(`User preferences not found for user: ${userId}`);
      }
      
      // Set time boundaries for the digest
      const end = endDate ? DateTime.fromJSDate(endDate) : DateTime.now();
      const startDate = end.startOf('day').minus({ days: 7 }).toJSDate();
      const endDateJs = end.startOf('day').toJSDate();
      
      // Get user's preferred format or default to standard
      const format = userPreferences.format || DigestFormat.STANDARD;
      
      // Generate the digest
      return this.generateCustomDigest(userId, startDate, endDateJs, format);
    } catch (error) {
      this.logger.error(`Error generating weekly digest: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to generate weekly digest: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate a digest for a custom date range
   * @param userId The user ID to generate the digest for
   * @param startDate The start date of the range
   * @param endDate The end date of the range
   * @param format The digest format to use
   */
  async generateCustomDigest(
    userId: string, 
    startDate: Date, 
    endDate: Date, 
    format: DigestFormat = DigestFormat.STANDARD
  ): Promise<Digest> {
    try {
      this.logger.info(`Generating custom digest for user: ${userId} from ${startDate.toISOString()} to ${endDate.toISOString()}`);
      
      // Get user preferences
      const userPreferences = await this.userPreferenceManager.getDigestPreferences(userId);
      if (!userPreferences) {
        throw new Error(`User preferences not found for user: ${userId}`);
      }
      
      // Get newsletters received within the date range
      const newsletters = await this.getNewslettersInDateRange(startDate, endDate);
      
      // Filter newsletters based on user preferences
      const filteredNewsletters = this.filterNewslettersByPreferences(newsletters, userPreferences.excludedNewsletters || []);
      
      if (filteredNewsletters.length === 0) {
        this.logger.info(`No newsletters found in date range for user: ${userId}`);
        
        // Return an empty digest
        return {
          id: uuidv4(),
          userId,
          title: 'No New Content',
          description: `No new newsletter content from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
          frequency: this.getFrequencyFromDateRange(startDate, endDate),
          format,
          sections: [],
          startDate,
          endDate,
          generatedAt: new Date()
        };
      }
      
      // Get content details for each newsletter
      const digestItems = await this.createDigestItems(filteredNewsletters, format);
      
      // Organize items into sections based on user preferences
      const sections = await this.organizeIntoSections(digestItems, userId, userPreferences.categories || []);
      
      // Create the digest object
      const digest: Digest = {
        id: uuidv4(),
        userId,
        title: this.generateDigestTitle(startDate, endDate),
        description: this.generateDigestDescription(sections, startDate, endDate),
        frequency: this.getFrequencyFromDateRange(startDate, endDate),
        format,
        sections,
        startDate,
        endDate,
        generatedAt: new Date()
      };
      
      this.logger.info(`Generated digest with ${sections.length} sections and ${digestItems.length} items for user: ${userId}`);
      return digest;
    } catch (error) {
      this.logger.error(`Error generating custom digest: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to generate custom digest: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get newsletters received within a date range
   * @param startDate The start date
   * @param endDate The end date
   */
  private async getNewslettersInDateRange(startDate: Date, endDate: Date): Promise<string[]> {
    // In a real implementation, this would query a database
    // For now, we'll return some mock data
    
    // Mock newsletter IDs with received dates
    const mockNewsletters = [
      { id: 'newsletter-1', receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 4) }, // 4 hours ago
      { id: 'newsletter-2', receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 12) }, // 12 hours ago
      { id: 'newsletter-3', receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 24) }, // 1 day ago
      { id: 'newsletter-4', receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 36) }, // 1.5 days ago
      { id: 'newsletter-5', receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 48) }, // 2 days ago
      { id: 'newsletter-6', receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 72) }, // 3 days ago
      { id: 'newsletter-7', receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 96) }, // 4 days ago
      { id: 'newsletter-8', receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 120) }, // 5 days ago
    ];
    
    // Filter by date range
    const filtered = mockNewsletters.filter(newsletter => 
      newsletter.receivedAt >= startDate && newsletter.receivedAt <= endDate
    );
    
    return filtered.map(n => n.id);
  }

  /**
   * Filter newsletters based on user exclusion preferences
   * @param newsletterIds The newsletter IDs to filter
   * @param excludedNewsletters The IDs of newsletters to exclude
   */
  private filterNewslettersByPreferences(newsletterIds: string[], excludedNewsletters: string[]): string[] {
    return newsletterIds.filter(id => !excludedNewsletters.includes(id));
  }

  /**
   * Create digest items from newsletter IDs
   * @param newsletterIds The newsletter IDs to create items from
   * @param format The digest format
   */
  private async createDigestItems(newsletterIds: string[], format: DigestFormat): Promise<DigestItem[]> {
    const items: DigestItem[] = [];
    
    for (const newsletterId of newsletterIds) {
      try {
        // Get extracted content (from cache or by processing)
        let content = this.contentCache.get(newsletterId);
        
        if (!content) {
          // In a real implementation, this would get actual content
          // For now, we're creating mock data
          content = await this.createMockExtractedContent(newsletterId);
          this.contentCache.set(newsletterId, content);
        }
        
        // Create a digest item from the content
        const item: DigestItem = {
          id: uuidv4(),
          newsletterId,
          newsletterName: this.getNewsletterName(newsletterId),
          title: content.structure.title,
          summary: this.generateSummary(content.plainText, format),
          content: this.formatContent(content.plainText, format),
          topics: content.topics,
          importance: this.calculateImportance(content),
          publishedAt: content.extractedAt, // In a real implementation, use the actual publication date
          createdAt: new Date()
        };
        
        items.push(item);
      } catch (error) {
        this.logger.error(`Error creating digest item for newsletter ${newsletterId}: ${error instanceof Error ? error.message : String(error)}`);
        // Continue with other newsletters
      }
    }
    
    // Sort by importance (descending)
    return items.sort((a, b) => b.importance - a.importance);
  }

  /**
   * Organize digest items into sections
   * @param items The digest items
   * @param userId The user ID
   * @param preferredCategories The user's preferred categories
   */
  private async organizeIntoSections(
    items: DigestItem[], 
    userId: string,
    preferredCategories: string[]
  ): Promise<DigestSection[]> {
    const sections: DigestSection[] = [];
    
    // Initialize categorized items
    const categorizedItems = new Map<string, DigestItem[]>();
    
    // Get categories for items
    for (const item of items) {
      try {
        // Get categories for newsletter
        const categories = await this.categorizer.getCategories(userId);
        
        // In a real implementation, use categorizer to categorize the newsletter
        // For now, randomly assign to a category
        const randomIndex = Math.floor(Math.random() * categories.length);
        const category = categories[randomIndex];
        
        if (category) {
          // Store category with item
          const itemWithCategory = { ...item, category };
          
          // Add to categorized items
          const categoryItems = categorizedItems.get(category.id) || [];
          categoryItems.push(itemWithCategory);
          categorizedItems.set(category.id, categoryItems);
        }
      } catch (error) {
        this.logger.error(`Error categorizing item ${item.id}: ${error instanceof Error ? error.message : String(error)}`);
        // Continue with other items
      }
    }
    
    // Create sections for each category
    for (const [categoryId, categoryItems] of categorizedItems.entries()) {
      try {
        const category = await this.getCategoryById(categoryId);
        
        if (category) {
          const section: DigestSection = {
            id: uuidv4(),
            title: category.name,
            description: category.description,
            type: 'category',
            referenceId: category.id,
            items: categoryItems
          };
          
          sections.push(section);
        }
      } catch (error) {
        this.logger.error(`Error creating section for category ${categoryId}: ${error instanceof Error ? error.message : String(error)}`);
        // Continue with other categories
      }
    }
    
    // Ensure we have at least one section
    if (sections.length === 0 && items.length > 0) {
      sections.push({
        id: uuidv4(),
        title: 'Latest Content',
        type: 'custom',
        items
      });
    }
    
    // If there are preferred categories, prioritize them
    if (preferredCategories.length > 0) {
      // Sort sections by whether they're in preferred categories
      sections.sort((a, b) => {
        const aPreferred = a.referenceId && preferredCategories.includes(a.referenceId) ? 1 : 0;
        const bPreferred = b.referenceId && preferredCategories.includes(b.referenceId) ? 1 : 0;
        return bPreferred - aPreferred;
      });
    }
    
    return sections;
  }

  /**
   * Get a category by ID
   * @param categoryId The category ID
   */
  private async getCategoryById(categoryId: string): Promise<Category | null> {
    try {
      const categoryManager = (this.categorizer as any).categoryManager;
      if (categoryManager) {
        return await categoryManager.getCategory(categoryId);
      }
      return null;
    } catch (error) {
      this.logger.error(`Error getting category ${categoryId}: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Calculate importance score for content
   * @param content The extracted content
   */
  private calculateImportance(content: ExtractedContent): number {
    // In a real implementation, use more sophisticated scoring
    
    // Use topic confidence as a factor
    const topicConfidence = content.topics.reduce((sum, topic) => sum + topic.confidence, 0) / 
      Math.max(1, content.topics.length);
    
    // Use content length as a factor (normalized)
    const contentLength = Math.min(content.plainText.length / 5000, 1);
    
    // Use recency as a factor (normalized)
    const hoursSinceExtraction = (Date.now() - content.extractedAt.getTime()) / (1000 * 60 * 60);
    const recency = Math.max(0, 1 - (hoursSinceExtraction / 72)); // 72 hours = 3 days
    
    // Calculate importance score
    return (topicConfidence * 0.4) + (contentLength * 0.3) + (recency * 0.3);
  }

  /**
   * Generate a summary of content
   * @param text The text to summarize
   * @param format The digest format
   */
  private generateSummary(text: string, format: DigestFormat): string {
    // In a real implementation, use NLP to generate a summary
    
    const maxLength = {
      [DigestFormat.BRIEF]: 100,
      [DigestFormat.STANDARD]: 200,
      [DigestFormat.DETAILED]: 400
    }[format];
    
    // Simple approach: Take the first few sentences
    const firstParagraph = text.split('\n')[0] || '';
    const summary = firstParagraph.slice(0, maxLength);
    
    return summary.length < firstParagraph.length 
      ? summary.trim() + '...' 
      : summary.trim();
  }

  /**
   * Format content based on digest format
   * @param text The text to format
   * @param format The digest format
   */
  private formatContent(text: string, format: DigestFormat): string {
    // In a real implementation, format based on digest preference
    
    const maxLength = {
      [DigestFormat.BRIEF]: 500,
      [DigestFormat.STANDARD]: 1000,
      [DigestFormat.DETAILED]: 3000
    }[format];
    
    // Truncate content if necessary
    if (text.length > maxLength) {
      return text.slice(0, maxLength) + '...';
    }
    
    return text;
  }

  /**
   * Generate a title for a digest
   * @param startDate The start date
   * @param endDate The end date
   */
  private generateDigestTitle(startDate: Date, endDate: Date): string {
    const frequency = this.getFrequencyFromDateRange(startDate, endDate);
    
    switch (frequency) {
      case DigestFrequency.DAILY:
        return `Daily Digest: ${this.formatDate(endDate)}`;
      case DigestFrequency.WEEKLY:
        return `Weekly Digest: ${this.formatDate(startDate)} - ${this.formatDate(endDate)}`;
      default:
        return `Newsletter Digest: ${this.formatDate(startDate)} - ${this.formatDate(endDate)}`;
    }
  }

  /**
   * Generate a description for a digest
   * @param sections The digest sections
   * @param startDate The start date
   * @param endDate The end date
   */
  private generateDigestDescription(sections: DigestSection[], startDate: Date, endDate: Date): string {
    const totalItems = sections.reduce((sum, section) => sum + section.items.length, 0);
    
    if (totalItems === 0) {
      return `No new content from ${this.formatDate(startDate)} to ${this.formatDate(endDate)}.`;
    }
    
    const frequency = this.getFrequencyFromDateRange(startDate, endDate);
    
    switch (frequency) {
      case DigestFrequency.DAILY:
        return `${totalItems} new items from your newsletters on ${this.formatDate(endDate)}.`;
      case DigestFrequency.WEEKLY:
        return `${totalItems} new items from your newsletters for the week of ${this.formatDate(startDate)} to ${this.formatDate(endDate)}.`;
      default:
        return `${totalItems} new items from your newsletters from ${this.formatDate(startDate)} to ${this.formatDate(endDate)}.`;
    }
  }

  /**
   * Get frequency based on date range
   * @param startDate The start date
   * @param endDate The end date
   */
  private getFrequencyFromDateRange(startDate: Date, endDate: Date): DigestFrequency {
    const diffInDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays <= 1) {
      return DigestFrequency.DAILY;
    } else if (diffInDays <= 7) {
      return DigestFrequency.WEEKLY;
    } else if (diffInDays <= 14) {
      return DigestFrequency.BI_WEEKLY;
    } else {
      return DigestFrequency.MONTHLY;
    }
  }

  /**
   * Format a date for display
   * @param date The date to format
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }

  /**
   * Get newsletter name from ID
   * @param newsletterId The newsletter ID
   */
  private getNewsletterName(newsletterId: string): string {
    // In a real implementation, look up the newsletter name
    
    // Mock newsletter names
    const names: Record<string, string> = {
      'newsletter-1': 'Tech Insider',
      'newsletter-2': 'Business Daily',
      'newsletter-3': 'Science Weekly',
      'newsletter-4': 'AI Update',
      'newsletter-5': 'Developer Digest',
      'newsletter-6': 'Finance Times',
      'newsletter-7': 'Health Bulletin',
      'newsletter-8': 'Design Trends'
    };
    
    return names[newsletterId] || `Newsletter ${newsletterId}`;
  }

  /**
   * Create mock extracted content for testing
   * @param newsletterId The newsletter ID
   */
  private async createMockExtractedContent(newsletterId: string): Promise<ExtractedContent> {
    const newsletterName = this.getNewsletterName(newsletterId);
    
    // Mock content based on newsletter name
    const mockContent: ExtractedContent = {
      newsletterId,
      rawContent: `<div><h1>${newsletterName}</h1><p>This is sample content for ${newsletterName}.</p></div>`,
      plainText: `${newsletterName}\n\nThis is sample content for ${newsletterName}.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`,
      structure: {
        title: newsletterName,
        sections: [
          {
            id: 'section-1',
            title: 'Main Content',
            content: `This is sample content for ${newsletterName}.`,
            type: SectionType.CONTENT,
            links: [],
            level: 0
          }
        ],
        metadata: {
          author: 'Newsletter Author',
          date: new Date().toISOString()
        }
      },
      links: [],
      topics: [
        {
          name: newsletterName.split(' ')[0], // First word as topic name
          confidence: 0.9,
          keywords: [newsletterName.split(' ')[0].toLowerCase(), 'newsletter', 'update', 'news'],
          context: newsletterName
        }
      ],
      extractedAt: new Date()
    };
    
    return mockContent;
  }
}