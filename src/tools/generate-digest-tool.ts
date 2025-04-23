/**
 * GenerateDigestTool
 * Creates a thematic digest of newsletter content
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Tool } from '../interfaces/mcp-server.js';
import { createDigestService } from '../core/digest/index.js';
import { Logger } from '../utils/logger.js';

// Define time period schema
const TimePeriodSchema = z.object({
  startDate: z.string().describe('Start date in ISO format'),
  endDate: z.string().optional().describe('End date in ISO format (defaults to current time)')
});

// Define input schema
const GenerateDigestSchema = z.object({
  timePeriod: TimePeriodSchema.describe('Time period for including newsletters in the digest'),
  categories: z.array(z.string()).optional().describe('List of categories to include in the digest'),
  detailLevel: z.enum(['summary', 'detailed', 'full']).default('summary')
    .describe('Level of detail to include for each newsletter'),
  format: z.enum(['text', 'html', 'markdown', 'json']).default('html')
    .describe('Format of the digest output'),
  userId: z.string().optional().describe('User ID for personalized digest'),
  maxNewslettersPerCategory: z.number().positive().optional().default(5)
    .describe('Maximum number of newsletters to include per category')
});

export const GenerateDigestTool: Tool = {
  name: 'generate_digest',
  description: 'Creates a thematic digest of newsletter content with customizable format and detail level',
  inputSchema: zodToJsonSchema(GenerateDigestSchema),
  
  handler: async (args) => {
    const logger = new Logger('GenerateDigestTool');
    
    try {
      logger.info('Generating newsletter digest', { 
        timePeriod: args.timePeriod,
        categories: args.categories,
        detailLevel: args.detailLevel,
        format: args.format
      });
      
      // Create digest service
      const digestService = createDigestService();
      
      // Prepare digest options
      const options = {
        startDate: new Date(args.timePeriod.startDate),
        endDate: args.timePeriod.endDate ? new Date(args.timePeriod.endDate) : new Date(),
        categories: args.categories || [],
        detailLevel: args.detailLevel,
        format: args.format,
        maxNewslettersPerCategory: args.maxNewslettersPerCategory,
        userId: args.userId
      };
      
      // Generate digest
      const digestResult = await digestService.generateDigest(options);
      
      // Format the response based on the requested format
      switch (args.format) {
        case 'json':
          return {
            content: [
              {
                type: 'text',
                text: `Generated digest for the period ${options.startDate.toLocaleDateString()} to ${options.endDate.toLocaleDateString()}.`
              },
              {
                type: 'json',
                json: digestResult
              }
            ]
          };
          
        case 'html':
          return {
            content: [
              {
                type: 'text',
                text: `Generated digest for the period ${options.startDate.toLocaleDateString()} to ${options.endDate.toLocaleDateString()}.`
              },
              {
                type: 'html',
                html: digestResult.content
              }
            ]
          };
          
        case 'markdown':
          return {
            content: [
              {
                type: 'text',
                text: `Generated digest for the period ${options.startDate.toLocaleDateString()} to ${options.endDate.toLocaleDateString()}.`
              },
              {
                type: 'text',
                text: digestResult.content
              }
            ]
          };
          
        default: // text
          return {
            content: [
              {
                type: 'text',
                text: `Generated digest for the period ${options.startDate.toLocaleDateString()} to ${options.endDate.toLocaleDateString()}.\n\n${digestResult.content}`
              }
            ]
          };
      }
    } catch (error) {
      logger.error(`Error generating digest: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        content: [
          {
            type: 'text',
            text: `Error generating digest: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
};