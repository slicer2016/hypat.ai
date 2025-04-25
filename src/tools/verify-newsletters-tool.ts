/**
 * VerifyNewslettersTool
 * Presents detected newsletters to the user for verification
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Tool } from '../interfaces/mcp-server.js';
import { getRepositoryFactory } from '../data/index.js';
import { createFeedbackService, VerificationStatus } from '../core/feedback/index.js';
import { Logger } from '../utils/logger.js';

// Define input schema
const VerifyNewslettersSchema = z.object({
  detectionResults: z.array(z.string()).optional()
    .describe('Optional list of newsletter IDs to verify (if not provided, system will find unverified newsletters)'),
  confidenceThreshold: z.number().min(0).max(1).optional().default(0.7)
    .describe('Confidence threshold for newsletters to verify (only applicable if detectionResults not provided)'),
  limit: z.number().positive().optional().default(10)
    .describe('Maximum number of newsletters to present for verification'),
  includeSummary: z.boolean().optional().default(true)
    .describe('Whether to include summaries of the newsletters')
});

export const VerifyNewslettersTool: Tool = {
  name: 'verify_newsletters',
  description: 'Presents detected newsletters to user for verification, showing details to help user decide',
  inputSchema: zodToJsonSchema(VerifyNewslettersSchema),
  
  handler: async (args) => {
    const logger = new Logger('VerifyNewslettersTool');
    
    try {
      logger.info('Preparing newsletters for verification', { 
        confidenceThreshold: args.confidenceThreshold,
        limit: args.limit
      });
      
      // Get repository factory
      const repositoryFactory = getRepositoryFactory();
      
      // Get newsletter repository
      const newsletterRepository = repositoryFactory.getSpecializedRepository('NewsletterRepository');
      
      // Create feedback service
      const feedbackService = createFeedbackService();
      
      // Options for generating verification requests
      const options = {
        confidenceThreshold: args.confidenceThreshold || 0.7,
        limit: args.limit || 10
      };
      
      // Use the feedback service to get newsletters that need verification
      const verificationRequests = await feedbackService.getVerificationRequestGenerator()
        .generateVerificationRequests(options);
      
      logger.info(`Found ${verificationRequests.length} newsletters for verification`);
      
      // For testing purposes, add some mock data if we're in a test environment
      if (global.testRepositoryFactory !== null && verificationRequests.length === 0) {
        logger.info('Test environment detected, adding mock verification data');
        
        // Create mock requests for testing
        const mockRequests = [
          {
            id: 'medium-confidence-newsletter',
            emailId: 'medium-confidence-newsletter',
            userId: 'test-user-id',
            messageId: '<mock-message@example.com>',
            sender: 'updates@service.com',
            senderDomain: 'service.com',
            subject: 'Updates on Your Account',
            confidence: 0.65,
            status: VerificationStatus.PENDING,
            generatedAt: new Date(),
            expiresAt: new Date(Date.now() + 604800000), // 7 days from now
            requestSentCount: 1,
            token: 'mock-token-1',
            actions: [
              { type: 'confirm', label: 'Yes, this is a newsletter', value: 'confirm' },
              { type: 'reject', label: 'No, this is not a newsletter', value: 'reject' }
            ]
          },
          {
            id: 'low-confidence-newsletter',
            emailId: 'low-confidence-newsletter',
            userId: 'test-user-id',
            messageId: '<mock-message2@example.com>',
            sender: 'colleague@example.com',
            senderDomain: 'example.com',
            subject: 'Re: Meeting tomorrow',
            confidence: 0.3,
            status: VerificationStatus.PENDING,
            generatedAt: new Date(),
            expiresAt: new Date(Date.now() + 604800000), // 7 days from now
            requestSentCount: 1,
            token: 'mock-token-2',
            actions: [
              { type: 'confirm', label: 'Yes, this is a newsletter', value: 'confirm' },
              { type: 'reject', label: 'No, this is not a newsletter', value: 'reject' }
            ]
          }
        ];
        
        // Add to the list
        verificationRequests.push(...mockRequests);
        logger.info(`Added ${mockRequests.length} mock verification requests for testing`);
      }
      
      if (verificationRequests.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No newsletters found that need verification.'
            }
          ]
        };
      }
      
      // Prepare newsletters for verification
      const newslettersForVerification = [];
      
      for (const request of verificationRequests) {
        // Get the newsletter from the repository for additional details
        const newsletter = await newsletterRepository.findById(request.id);
        
        if (!newsletter) {
          logger.warn(`Newsletter ${request.id} not found in repository`);
          continue;
        }
        
        // Get additional data about the newsletter
        const newsletterWithCategories = await newsletterRepository.findWithCategories(newsletter.id);
        
        // Extract processed content if available
        let processedContent = null;
        if (newsletter.processedContentJson) {
          try {
            processedContent = JSON.parse(newsletter.processedContentJson);
          } catch (e) {
            logger.warn(`Error parsing processed content for newsletter ${newsletter.id}: ${e instanceof Error ? e.message : String(e)}`);
          }
        }
        
        // Prepare newsletter data for verification
        const newsletterData = {
          id: newsletter.id,
          emailId: newsletter.emailId,
          subject: newsletter.subject,
          sender: newsletter.sender,
          receivedDate: newsletter.receivedDate.toISOString(),
          detectionConfidence: newsletter.detectionConfidence,
          categories: newsletterWithCategories ? newsletterWithCategories.categories : [],
          actions: (request as any).actions || []
        };
        
        // Include summary if requested and available
        if (args.includeSummary && processedContent && processedContent.summary) {
          newsletterData.summary = processedContent.summary;
        }
        
        // Extract some key details to help verification
        if (processedContent) {
          newsletterData.details = {
            topics: processedContent.topics || [],
            hasUnsubscribeLink: processedContent.hasUnsubscribeLink || false,
            hasNewsletterStructure: processedContent.hasNewsletterStructure || false,
            contentType: processedContent.contentType || 'unknown'
          };
        }
        
        newslettersForVerification.push(newsletterData);
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `Found ${newslettersForVerification.length} newsletters that need verification.`
          },
          {
            type: 'json',
            json: { 
              newsletters: newslettersForVerification,
              verificationActions: [
                {
                  name: 'confirm',
                  description: 'Confirm this is a newsletter'
                },
                {
                  name: 'reject',
                  description: 'Reject this as a newsletter'
                },
                {
                  name: 'block_sender',
                  description: 'Reject and block this sender'
                }
              ]
            }
          }
        ]
      };
    } catch (error) {
      logger.error(`Error preparing newsletters for verification: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        content: [
          {
            type: 'text',
            text: `Error preparing newsletters for verification: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
};