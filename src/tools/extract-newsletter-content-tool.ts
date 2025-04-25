/**
 * Extract Newsletter Content Tool
 * MCP tool for extracting content from newsletters
 */

import { z } from 'zod';
import { Tool } from '../interfaces/mcp-server.js';
import { createContentProcessor } from '../core/content-processing/index.js';
import { Logger } from '../utils/logger.js';

// Input schema for the tool
const ExtractNewsletterContentInput = z.object({
  emailId: z.string().describe('The ID of the email to extract content from'),
  includeImages: z.boolean().default(false).describe('Whether to include images in the extraction'),
  extractTopics: z.boolean().default(true).describe('Whether to extract topics from the content')
});

// Output schema for the tool
const ExtractNewsletterContentOutput = z.object({
  newsletterId: z.string().describe('The ID of the newsletter'),
  title: z.string().describe('The title of the newsletter'),
  plainText: z.string().describe('The plain text content of the newsletter'),
  sections: z.array(z.object({
    id: z.string(),
    title: z.string().optional(),
    type: z.string(),
    content: z.string().describe('The text content of the section'),
    level: z.number(),
    links: z.array(z.object({
      url: z.string(),
      text: z.string()
    }))
  })).describe('The sections of the newsletter'),
  links: z.array(z.object({
    url: z.string(),
    text: z.string(),
    category: z.string().optional(),
    isSponsored: z.boolean().optional()
  })).describe('Links extracted from the newsletter'),
  topics: z.array(z.object({
    name: z.string(),
    confidence: z.number(),
    keywords: z.array(z.string())
  })).describe('Topics extracted from the newsletter content'),
  metadata: z.record(z.string(), z.string()).describe('Metadata extracted from the newsletter')
});

// Input and output type definitions
type ExtractNewsletterContentInputType = z.infer<typeof ExtractNewsletterContentInput>;
type ExtractNewsletterContentOutputType = z.infer<typeof ExtractNewsletterContentOutput>;

/**
 * Tool implementation for extracting content from newsletters
 */
export const ExtractNewsletterContentTool: Tool = {
  name: 'extract_newsletter_content',
  description: 'Extracts and processes content from a newsletter email, including structure, links, and topics',
  inputSchema: ExtractNewsletterContentInput,
  
  handler: async (params: ExtractNewsletterContentInputType): Promise<ExtractNewsletterContentOutputType> => {
    const logger = new Logger('ExtractNewsletterContentTool');
    const contentProcessor = createContentProcessor();
    
    try {
      logger.info(`Executing ExtractNewsletterContentTool for email: ${params.emailId}`);
      
      // Extract content from the newsletter
      const extractedContent = await contentProcessor.extractContent(params.emailId, {
        includeImages: params.includeImages,
        extractTopics: params.extractTopics
      });
      
      // Convert to the expected output format
      const result: ExtractNewsletterContentOutputType = {
        newsletterId: extractedContent.newsletterId,
        title: extractedContent.structure.title,
        plainText: extractedContent.plainText,
        sections: extractedContent.structure.sections.map(section => ({
          id: section.id,
          title: section.title,
          type: section.type,
          content: section.content,
          level: section.level,
          links: section.links.map(link => ({
            url: link.url,
            text: link.text
          }))
        })),
        links: extractedContent.links.map(link => ({
          url: link.url,
          text: link.text,
          category: link.category,
          isSponsored: link.isSponsored
        })),
        topics: extractedContent.topics.map(topic => ({
          name: topic.name,
          confidence: topic.confidence,
          keywords: topic.keywords
        })),
        metadata: extractedContent.structure.metadata
      };
      
      logger.info(`Successfully extracted content from email: ${params.emailId}`);
      return result;
    } catch (error) {
      logger.error(`Error extracting newsletter content: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to extract newsletter content: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};