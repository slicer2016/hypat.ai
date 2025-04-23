/**
 * Content Repository
 * Stores and retrieves processed newsletter content
 */

import { ContentRepository, ExtractedContent } from '../../../interfaces/content-processing.js';
import { Logger } from '../../../utils/logger.js';

/**
 * In-memory implementation of the content repository
 * In a production environment, this would be replaced with a database-backed implementation
 */
export class InMemoryContentRepository implements ContentRepository {
  private logger: Logger;
  private contentStore: Map<string, ExtractedContent>;

  constructor() {
    this.logger = new Logger('ContentRepository');
    this.contentStore = new Map<string, ExtractedContent>();
  }

  /**
   * Store extracted content
   * @param content The content to store
   */
  async storeContent(content: ExtractedContent): Promise<void> {
    try {
      this.logger.debug(`Storing content for newsletter: ${content.newsletterId}`);
      
      // Store content with newsletter ID as key
      this.contentStore.set(content.newsletterId, content);
      
      this.logger.debug(`Content stored successfully for: ${content.newsletterId}`);
    } catch (error) {
      this.logger.error(`Error storing content: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to store content: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Retrieve content by newsletter ID
   * @param newsletterId The ID of the newsletter
   */
  async getContent(newsletterId: string): Promise<ExtractedContent | null> {
    try {
      this.logger.debug(`Retrieving content for newsletter: ${newsletterId}`);
      
      // Get content from store
      const content = this.contentStore.get(newsletterId);
      
      if (!content) {
        this.logger.debug(`No content found for newsletter: ${newsletterId}`);
        return null;
      }
      
      return content;
    } catch (error) {
      this.logger.error(`Error retrieving content: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * List content IDs based on criteria
   * @param criteria The search criteria
   */
  async listContentIds(criteria?: Record<string, any>): Promise<string[]> {
    try {
      this.logger.debug('Listing content IDs');
      
      // Filter IDs based on criteria if provided
      if (criteria) {
        const filteredIds: string[] = [];
        
        this.contentStore.forEach((content, id) => {
          let match = true;
          
          // Check each criterion
          for (const [key, value] of Object.entries(criteria)) {
            // Handle nested properties (e.g., "structure.title")
            const keys = key.split('.');
            let currentObj: any = content;
            
            // Navigate to the nested property
            for (const k of keys) {
              if (currentObj === undefined || currentObj === null) {
                match = false;
                break;
              }
              currentObj = currentObj[k];
            }
            
            // Check if value matches
            if (currentObj !== value) {
              match = false;
              break;
            }
          }
          
          if (match) {
            filteredIds.push(id);
          }
        });
        
        return filteredIds;
      }
      
      // If no criteria, return all IDs
      return Array.from(this.contentStore.keys());
    } catch (error) {
      this.logger.error(`Error listing content IDs: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Delete content by ID
   * @param newsletterId The ID of the newsletter
   */
  async deleteContent(newsletterId: string): Promise<boolean> {
    try {
      this.logger.debug(`Deleting content for newsletter: ${newsletterId}`);
      
      // Check if content exists
      if (!this.contentStore.has(newsletterId)) {
        this.logger.debug(`No content found for newsletter: ${newsletterId}`);
        return false;
      }
      
      // Delete content
      const result = this.contentStore.delete(newsletterId);
      
      this.logger.debug(`Content deletion ${result ? 'successful' : 'failed'} for: ${newsletterId}`);
      return result;
    } catch (error) {
      this.logger.error(`Error deleting content: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
}