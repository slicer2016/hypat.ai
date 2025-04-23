/**
 * RecordNewsletterFeedbackTool
 * MCP tool for recording user feedback on newsletter detection
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Tool } from '../interfaces/mcp-server.js';
import { createNewsletterDetector, NewsletterDetectorImpl } from '../core/detection/index.js';
import { Logger } from '../utils/logger.js';

// Define the tool schema
const RecordNewsletterFeedbackSchema = z.object({
  emailId: z.string().describe('ID of the email the feedback is for'),
  isNewsletter: z.boolean().describe('Whether the user confirms it as a newsletter'),
  userId: z.string().optional().describe('User ID providing the feedback')
});

export const RecordNewsletterFeedbackTool: Tool = {
  name: 'record_newsletter_feedback',
  description: 'Records user feedback on newsletter detection to improve future detection',
  inputSchema: zodToJsonSchema(RecordNewsletterFeedbackSchema),
  
  handler: async (args) => {
    const logger = new Logger('RecordNewsletterFeedbackTool');
    
    try {
      logger.info(`Recording newsletter feedback for email ${args.emailId}, isNewsletter=${args.isNewsletter}`);
      
      // Create newsletter detector
      const detector = createNewsletterDetector() as NewsletterDetectorImpl;
      
      // Record feedback
      await detector.recordFeedback(
        args.emailId, 
        args.isNewsletter, 
        args.userId || 'default_user'
      );
      
      return {
        content: [
          {
            type: 'text',
            text: `Successfully recorded feedback for email ${args.emailId}. Future newsletter detection will be improved.`
          }
        ]
      };
    } catch (error) {
      logger.error(`Error recording newsletter feedback: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        content: [
          {
            type: 'text',
            text: `Error recording newsletter feedback: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
};