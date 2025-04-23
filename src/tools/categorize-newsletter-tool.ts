/**
 * Categorize Newsletter Tool
 * MCP tool for categorizing newsletter content
 */

import { z } from 'zod';
import { Tool } from '../interfaces/mcp-server.js';
import { createCategorizer } from '../core/categorization/index.js';
import { Category } from '../core/categorization/interfaces.js';
import { ExtractedContent } from '../interfaces/content-processing.js';
import { Logger } from '../utils/logger.js';

// Create categorizer instance
const categorizer = createCategorizer();

// Input schema for the tool
const CategorizeNewsletterInput = z.object({
  extractedContentId: z.string().describe('The ID of the extracted content to categorize'),
  extractedContent: z.any().describe('The extracted content object from extract_newsletter_content tool')
});

// Output schema for the tool
const CategorizeNewsletterOutput = z.object({
  newsletterId: z.string().describe('The ID of the newsletter'),
  categories: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    icon: z.string().optional(),
    color: z.string().optional(),
    parent: z.string().optional()
  })).describe('Categories assigned to the newsletter')
});

// Input and output type definitions
type CategorizeNewsletterInputType = z.infer<typeof CategorizeNewsletterInput>;
type CategorizeNewsletterOutputType = z.infer<typeof CategorizeNewsletterOutput>;

/**
 * Tool implementation for categorizing newsletters
 */
export const CategorizeNewsletterTool: Tool = {
  name: 'categorize_newsletter',
  description: 'Categorizes a newsletter based on its content using AI analysis',
  inputSchema: CategorizeNewsletterInput,
  
  handler: async (params: CategorizeNewsletterInputType): Promise<CategorizeNewsletterOutputType> => {
    const logger = new Logger('CategorizeNewsletterTool');
    
    try {
      logger.info(`Categorizing newsletter: ${params.extractedContentId}`);
      
      // Use the provided extracted content
      const extractedContent = params.extractedContent as ExtractedContent;
      
      if (!extractedContent) {
        throw new Error('Extracted content is required');
      }
      
      // Categorize the newsletter
      const categories = await categorizer.categorizeNewsletter(extractedContent);
      
      // Prepare the response
      const response: CategorizeNewsletterOutputType = {
        newsletterId: extractedContent.newsletterId,
        categories: categories.map(category => ({
          id: category.id,
          name: category.name,
          description: category.description,
          icon: category.icon,
          color: category.color,
          parent: category.parent
        }))
      };
      
      logger.info(`Successfully categorized newsletter into ${categories.length} categories`);
      return response;
    } catch (error) {
      logger.error(`Error categorizing newsletter: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to categorize newsletter: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};