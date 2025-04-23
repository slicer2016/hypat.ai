/**
 * Get Newsletter Links Tool
 * MCP tool for retrieving links from a newsletter
 */

import { z } from 'zod';
import { Tool } from '../interfaces/mcp-server.js';
import { ContentProcessorImpl } from '../core/content-processing/content-processor-impl.js';
import { Logger } from '../utils/logger.js';

// Input schema for the tool
const GetNewsletterLinksInput = z.object({
  emailId: z.string().describe('The ID of the email to get links from'),
  categories: z.array(z.string()).optional().describe('Filter links by categories'),
  includeSponsoredOnly: z.boolean().default(false).describe('Only include sponsored links')
});

// Output schema for the tool
const GetNewsletterLinksOutput = z.object({
  newsletterId: z.string().describe('The ID of the newsletter'),
  links: z.array(z.object({
    url: z.string(),
    text: z.string(),
    category: z.string().optional(),
    isSponsored: z.boolean().optional(),
    context: z.string().optional()
  })).describe('Links extracted from the newsletter')
});

// Input and output type definitions
type GetNewsletterLinksInputType = z.infer<typeof GetNewsletterLinksInput>;
type GetNewsletterLinksOutputType = z.infer<typeof GetNewsletterLinksOutput>;

/**
 * Tool implementation for retrieving links from a newsletter
 */
export const GetNewsletterLinksTool: Tool = {
  name: 'get_newsletter_links',
  description: 'Retrieves links from a newsletter with optional filtering by category or sponsored status',
  inputSchema: GetNewsletterLinksInput,
  
  handler: async (params: GetNewsletterLinksInputType): Promise<GetNewsletterLinksOutputType> => {
    const logger = new Logger('GetNewsletterLinksTool');
    const contentProcessor = new ContentProcessorImpl();
    
    try {
      logger.info(`Executing GetNewsletterLinksTool for email: ${params.emailId}`);
      
      // Get extracted content
      let extractedContent = await contentProcessor.getContent(params.emailId);
      
      // If content hasn't been extracted yet, extract it
      if (!extractedContent) {
        logger.debug(`Content not found for ${params.emailId}, extracting now`);
        extractedContent = await contentProcessor.extractContent(params.emailId, {
          includeImages: false,
          extractTopics: false
        });
      }
      
      // Filter links based on parameters
      let filteredLinks = extractedContent.links;
      
      // Filter by category if specified
      if (params.categories && params.categories.length > 0) {
        filteredLinks = filteredLinks.filter(link => 
          link.category && params.categories!.includes(link.category)
        );
      }
      
      // Filter by sponsored status if specified
      if (params.includeSponsoredOnly) {
        filteredLinks = filteredLinks.filter(link => link.isSponsored === true);
      }
      
      const result: GetNewsletterLinksOutputType = {
        newsletterId: extractedContent.newsletterId,
        links: filteredLinks.map(link => ({
          url: link.url,
          text: link.text,
          category: link.category,
          isSponsored: link.isSponsored,
          context: link.context
        }))
      };
      
      logger.info(`Successfully retrieved ${filteredLinks.length} links for email: ${params.emailId}`);
      return result;
    } catch (error) {
      logger.error(`Error retrieving newsletter links: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to retrieve newsletter links: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};