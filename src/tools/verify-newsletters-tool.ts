/**
 * VerifyNewslettersTool
 * Presents detected newsletters to the user for verification
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Tool } from '../interfaces/mcp-server.js';
import { getRepositoryFactory } from '../data/index.js';
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
      
      // Get newsletters to verify
      let newsletters = [];
      
      if (args.detectionResults && args.detectionResults.length > 0) {
        // Use provided newsletter IDs
        newsletters = await Promise.all(
          args.detectionResults
            .slice(0, args.limit)
            .map(id => newsletterRepository.findById(id))
        );
        
        // Filter out any null results (not found)
        newsletters = newsletters.filter(Boolean);
      } else {
        // Find unverified newsletters with confidence above threshold
        newsletters = await newsletterRepository.find({
          where: {
            isVerified: false,
            detectionConfidence: { $gte: args.confidenceThreshold }
          },
          orderBy: [{ field: 'detectionConfidence', direction: 'desc' }],
          limit: args.limit
        });
      }
      
      logger.info(`Found ${newsletters.length} newsletters for verification`);
      
      if (newsletters.length === 0) {
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
      
      for (const newsletter of newsletters) {
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
          categories: newsletterWithCategories ? newsletterWithCategories.categories : []
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