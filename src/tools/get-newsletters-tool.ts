/**
 * GetNewslettersTool
 * Retrieves newsletters from Gmail with filtering capabilities
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Tool } from '../interfaces/mcp-server.js';
import { GmailMcpClient } from '../modules/mcp-server/gmail-mcp-client.js';
import { createNewsletterDetector } from '../core/detection/index.js';
import { createContentProcessor } from '../core/content-processing/index.js';
import { createCategorizer } from '../core/categorization/index.js';
import { Logger } from '../utils/logger.js';

// Define time range schema
const TimeRangeSchema = z.object({
  startDate: z.string().describe('Start date in ISO format'),
  endDate: z.string().optional().describe('End date in ISO format (defaults to current time)')
});

// Define input schema
const GetNewslettersSchema = z.object({
  timeRange: TimeRangeSchema.optional().describe('Time range for filtering newsletters'),
  sources: z.array(z.string()).optional().describe('List of newsletter sources to filter by'),
  limit: z.number().positive().optional().describe('Maximum number of newsletters to return'),
  categories: z.array(z.string()).optional().describe('List of categories to filter newsletters by'),
  includeContent: z.boolean().optional().describe('Whether to include full newsletter content')
});

// Define newsletter response schema for clarity
const NewsletterResponseSchema = z.object({
  id: z.string(),
  emailId: z.string(),
  subject: z.string(),
  sender: z.string(),
  receivedDate: z.string(),
  categories: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    confidence: z.number()
  })),
  topics: z.array(z.string()).optional(),
  summary: z.string().optional(),
  content: z.any().optional(),
  links: z.array(z.object({
    url: z.string(),
    title: z.string().optional(),
    context: z.string().optional()
  })).optional()
});

export const GetNewslettersTool: Tool = {
  name: 'get_newsletters',
  description: 'Retrieves newsletters from Gmail with filtering by time range, sources, and categories',
  inputSchema: zodToJsonSchema(GetNewslettersSchema),
  
  handler: async (args) => {
    const logger = new Logger('GetNewslettersTool');
    
    try {
      logger.info('Retrieving newsletters', { timeRange: args.timeRange, sources: args.sources });
      
      // Create necessary components
      const gmailClient = new GmailMcpClient();
      const detector = createNewsletterDetector();
      const contentProcessor = createContentProcessor();
      const categorizer = createCategorizer();
      
      // Connect to Gmail
      await gmailClient.connect();
      
      // Build Gmail query
      let query = 'is:inbox';
      
      // Add time range to query if provided
      if (args.timeRange) {
        const startDate = new Date(args.timeRange.startDate);
        const endDate = args.timeRange.endDate ? new Date(args.timeRange.endDate) : new Date();
        
        query += ` after:${formatDate(startDate)} before:${formatDate(endDate)}`;
      }
      
      // Add sources to query if provided
      if (args.sources && args.sources.length > 0) {
        query += ` (${args.sources.map(source => `from:${source}`).join(' OR ')})`;
      }
      
      // Retrieve emails from Gmail
      logger.debug(`Executing Gmail query: ${query}`);
      const emails = await gmailClient.searchEmails(query, { 
        maxResults: args.limit || 50 
      });
      
      // Process emails to identify newsletters
      const newsletters = [];
      
      for (const email of emails) {
        try {
          // Fetch full email content if only metadata was returned
          const fullEmail = email.payload ? email : await gmailClient.getEmail(email.id, { format: 'full' });
          
          // Detect if the email is a newsletter
          const detectionResult = await detector.detectNewsletter(fullEmail);
          
          if (detectionResult.isNewsletter) {
            // Process the newsletter content
            const processedContent = await contentProcessor.processEmailContent(fullEmail);
            
            // Categorize the newsletter
            const categories = await categorizer.categorizeNewsletter(processedContent);
            
            // Filter by categories if specified
            if (args.categories && args.categories.length > 0) {
              const newsletterCategoryIds = categories.map(c => c.id);
              if (!args.categories.some(categoryId => newsletterCategoryIds.includes(categoryId))) {
                continue; // Skip this newsletter as it doesn't match the category filter
              }
            }
            
            // Extract topics if available
            const topics = processedContent.topics || [];
            
            // Create newsletter response object
            const newsletter = {
              id: processedContent.newsletterId,
              emailId: fullEmail.id,
              subject: processedContent.subject,
              sender: processedContent.sender,
              receivedDate: processedContent.receivedDate,
              categories: categories.map(category => ({
                id: category.id,
                name: category.name,
                description: category.description,
                confidence: category.confidence || 1.0
              })),
              topics,
              summary: processedContent.summary
            };
            
            // Include content and links if requested
            if (args.includeContent) {
              newsletter.content = processedContent.content;
              newsletter.links = processedContent.links;
            }
            
            newsletters.push(newsletter);
            
            // Limit the number of newsletters if specified
            if (args.limit && newsletters.length >= args.limit) {
              break;
            }
          }
        } catch (emailError) {
          logger.error(`Error processing email ${email.id}: ${emailError instanceof Error ? emailError.message : String(emailError)}`);
          // Continue processing other emails
        }
      }
      
      // Disconnect from Gmail
      await gmailClient.disconnect();
      
      logger.info(`Found ${newsletters.length} newsletters matching criteria`);
      
      return {
        content: [
          {
            type: 'text',
            text: `Found ${newsletters.length} newsletters matching your criteria.`
          },
          {
            type: 'json',
            json: { newsletters }
          }
        ]
      };
    } catch (error) {
      logger.error(`Error retrieving newsletters: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        content: [
          {
            type: 'text',
            text: `Error retrieving newsletters: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
};

/**
 * Helper function to format date for Gmail query
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0].replace(/-/g, '/');
}