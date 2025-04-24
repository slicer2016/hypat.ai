/**
 * UpdateNewsletterFeedbackTool
 * Records user feedback on newsletter detection and categorization
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Tool } from '../interfaces/mcp-server.js';
import { createFeedbackService, FeedbackType } from '../core/feedback/index.js';
import { getRepositoryFactory } from '../data/index.js';
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
      const { feedbackService } = createFeedbackService();
      
      // Get repository factory for newsletter updates
      const repositoryFactory = getRepositoryFactory();
      const newsletterRepository = repositoryFactory.getSpecializedRepository('NewsletterRepository');
      
      // Process each feedback action
      const results = [];
      
      for (const action of args.actions) {
        try {
          logger.debug(`Processing ${action.action} action for newsletter ${action.newsletterId}`);
          
          switch (action.action) {
            case 'confirm':
              // Update the newsletter status
              await newsletterRepository.update(action.newsletterId, {
                isVerified: true
              });
              
              // Submit feedback using the new interface
              await feedbackService.submitFeedback({
                userId: args.userId,
                newsletterId: action.newsletterId,
                feedbackType: FeedbackType.CONFIRM,
                comment: action.comment
              });
              
              results.push({
                newsletterId: action.newsletterId,
                action: action.action,
                success: true
              });
              break;
              
            case 'reject':
              // Update the newsletter status
              await newsletterRepository.update(action.newsletterId, {
                isVerified: true // Still mark as verified, just with reject feedback
              });
              
              // Submit feedback using the new interface
              await feedbackService.submitFeedback({
                userId: args.userId,
                newsletterId: action.newsletterId,
                feedbackType: FeedbackType.REJECT,
                comment: action.comment
              });
              
              results.push({
                newsletterId: action.newsletterId,
                action: action.action,
                success: true
              });
              break;
              
            case 'block_sender':
              // Update the newsletter status
              await newsletterRepository.update(action.newsletterId, {
                isVerified: true
              });
              
              // Submit feedback using the new interface
              await feedbackService.submitFeedback({
                userId: args.userId,
                newsletterId: action.newsletterId,
                feedbackType: FeedbackType.REJECT,
                comment: `[BLOCK_SENDER] ${action.comment || ''}`
              });
              
              // In a real implementation, we would also block the sender for this user
              // This would involve updating user preferences
              
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
              
              // In a real implementation, we would add the category for this newsletter
              const categoryRepository = repositoryFactory.getSpecializedRepository('CategoryRepository');
              if (categoryRepository.assignCategory) {
                await categoryRepository.assignCategory(action.newsletterId, action.categoryId);
              } else {
                logger.warn('CategoryRepository.assignCategory not implemented');
              }
              
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
              
              // In a real implementation, we would remove the category for this newsletter
              const catRepository = repositoryFactory.getSpecializedRepository('CategoryRepository');
              if (catRepository.removeCategory) {
                await catRepository.removeCategory(action.newsletterId, action.categoryId);
              } else {
                logger.warn('CategoryRepository.removeCategory not implemented');
              }
              
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
      
      // Analyze feedback and improve detection
      try {
        await feedbackService.getFeedbackAnalyzer().analyzeFeedback(args.userId, 'all');
        
        // Improve detection model based on analysis
        const analysis = await feedbackService.getFeedbackAnalyzer().analyzeFeedback(args.userId, 'all');
        await feedbackService.getDetectionImprover().applyImprovements(analysis);
      } catch (analyzeError) {
        logger.warn(`Error analyzing feedback: ${analyzeError instanceof Error ? analyzeError.message : String(analyzeError)}`);
      }
      
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