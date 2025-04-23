/**
 * Get Newsletter Topics Tool
 * MCP tool for retrieving topics from a newsletter
 */

import { z } from 'zod';
import { Tool } from '../interfaces/mcp-server.js';
import { ContentProcessorImpl } from '../core/content-processing/content-processor-impl.js';
import { Logger } from '../utils/logger.js';

// Input schema for the tool
const GetNewsletterTopicsInput = z.object({
  emailId: z.string().describe('The ID of the email to get topics from'),
  minConfidence: z.number().default(0.3).describe('Minimum confidence threshold for topics (0-1)')
});

// Output schema for the tool
const GetNewsletterTopicsOutput = z.object({
  newsletterId: z.string().describe('The ID of the newsletter'),
  topics: z.array(z.object({
    name: z.string(),
    confidence: z.number(),
    keywords: z.array(z.string()),
    context: z.string().optional()
  })).describe('Topics extracted from the newsletter content')
});

// Input and output type definitions
type GetNewsletterTopicsInputType = z.infer<typeof GetNewsletterTopicsInput>;
type GetNewsletterTopicsOutputType = z.infer<typeof GetNewsletterTopicsOutput>;

/**
 * Tool implementation for retrieving topics from a newsletter
 */
export const GetNewsletterTopicsTool: Tool = {
  name: 'get_newsletter_topics',
  description: 'Retrieves the main topics discussed in a newsletter with confidence scores',
  inputSchema: GetNewsletterTopicsInput,
  
  handler: async (params: GetNewsletterTopicsInputType): Promise<GetNewsletterTopicsOutputType> => {
    const logger = new Logger('GetNewsletterTopicsTool');
    const contentProcessor = new ContentProcessorImpl();
    
    try {
      logger.info(`Executing GetNewsletterTopicsTool for email: ${params.emailId}`);
      
      // Get extracted content
      let extractedContent = await contentProcessor.getContent(params.emailId);
      
      // If content hasn't been extracted yet, extract it
      if (!extractedContent) {
        logger.debug(`Content not found for ${params.emailId}, extracting now`);
        extractedContent = await contentProcessor.extractContent(params.emailId, {
          includeImages: false,
          extractTopics: true
        });
      }
      
      // Filter topics by confidence threshold
      const filteredTopics = extractedContent.topics.filter(
        topic => topic.confidence >= params.minConfidence
      );
      
      const result: GetNewsletterTopicsOutputType = {
        newsletterId: extractedContent.newsletterId,
        topics: filteredTopics.map(topic => ({
          name: topic.name,
          confidence: topic.confidence,
          keywords: topic.keywords,
          context: topic.context
        }))
      };
      
      logger.info(`Successfully retrieved ${filteredTopics.length} topics for email: ${params.emailId}`);
      return result;
    } catch (error) {
      logger.error(`Error retrieving newsletter topics: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to retrieve newsletter topics: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};