/**
 * UpdateNewsletterFeedbackTool
 * Records user feedback on newsletter detection and categorization
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Tool } from '../interfaces/mcp-server.js';
import { createFeedbackService } from '../core/feedback/index.js';
import { Logger } from '../utils/logger.js';

// Define feedback action schema
const FeedbackActionSchema = z.object({
  newsletterId: z.string().describe('ID of the newsletter'),
  action: z.enum(['confirm', 'reject', 'block_sender', 'add_category', 'remove_category'])
    .describe('Feedback action type'),
  categoryId: z.string().optional()
    .describe('Category ID when action is add_category or remove_category'),
  comment: z.string().optional()
    .describe('Optional user comment')
});

// Define input schema
const UpdateNewsletterFeedbackSchema = z.object({
  userId: z.string().describe('ID of the user providing feedback'),
  actions: z.array(FeedbackActionSchema)
    .describe('List of feedback actions')
});

export const UpdateNewsletterFeedbackTool: Tool = {
  name: 'update_newsletter_feedback',
  description: 'Records user feedback on newsletter detection and categorization',
  inputSchema: zodToJsonSchema(UpdateNewsletterFeedbackSchema),
  
  handler: async (args) => {
    const logger = new Logger('UpdateNewsletterFeedbackTool');
    
    try {
      logger.info(`Recording feedback from user ${args.userId}`, { 
        actionCount: args.actions.length 
      });
      
      // Create feedback service
      const feedbackService = createFeedbackService();
      
      // Process each feedback action
      const results = [];
      
      for (const action of args.actions) {
        try {
          logger.debug(`Processing ${action.action} action for newsletter ${action.newsletterId}`);
          
          switch (action.action) {
            case 'confirm':
              await feedbackService.confirmNewsletter(args.userId, action.newsletterId, action.comment);
              results.push({
                newsletterId: action.newsletterId,
                action: action.action,
                success: true
              });
              break;
              
            case 'reject':
              await feedbackService.rejectNewsletter(args.userId, action.newsletterId, action.comment);
              results.push({
                newsletterId: action.newsletterId,
                action: action.action,
                success: true
              });
              break;
              
            case 'block_sender':
              await feedbackService.blockSender(args.userId, action.newsletterId, action.comment);
              results.push({
                newsletterId: action.newsletterId,
                action: action.action,
                success: true
              });
              break;
              
            case 'add_category':
              if (!action.categoryId) {
                throw new Error('categoryId is required for add_category action');
              }
              
              await feedbackService.addCategory(args.userId, action.newsletterId, action.categoryId, action.comment);
              results.push({
                newsletterId: action.newsletterId,
                action: action.action,
                categoryId: action.categoryId,
                success: true
              });
              break;
              
            case 'remove_category':
              if (!action.categoryId) {
                throw new Error('categoryId is required for remove_category action');
              }
              
              await feedbackService.removeCategory(args.userId, action.newsletterId, action.categoryId, action.comment);
              results.push({
                newsletterId: action.newsletterId,
                action: action.action,
                categoryId: action.categoryId,
                success: true
              });
              break;
              
            default:
              throw new Error(`Unknown action: ${action.action}`);
          }
        } catch (actionError) {
          logger.error(`Error processing action ${action.action} for newsletter ${action.newsletterId}: ${actionError instanceof Error ? actionError.message : String(actionError)}`);
          
          results.push({
            newsletterId: action.newsletterId,
            action: action.action,
            success: false,
            error: actionError instanceof Error ? actionError.message : String(actionError)
          });
        }
      }
      
      // Update detection models with new feedback
      await feedbackService.updateDetectionModel();
      
      logger.info(`Processed ${results.length} feedback actions`);
      
      // Count successes and failures
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;
      
      return {
        content: [
          {
            type: 'text',
            text: `Processed ${results.length} feedback actions: ${successCount} successful, ${failureCount} failed.`
          },
          {
            type: 'json',
            json: { results }
          }
        ]
      };
    } catch (error) {
      logger.error(`Error processing newsletter feedback: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        content: [
          {
            type: 'text',
            text: `Error processing newsletter feedback: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
};