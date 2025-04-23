/**
 * SendDigestEmailTool
 * Sends a generated digest to the user via email
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Tool } from '../interfaces/mcp-server.js';
import { getRepositoryFactory } from '../data/index.js';
import { createDigestService } from '../core/digest/index.js';
import { Logger } from '../utils/logger.js';

// Define input schema
const SendDigestEmailSchema = z.object({
  digestId: z.string().optional()
    .describe('ID of an existing digest to send (if not provided, a new digest will be generated)'),
  userId: z.string().describe('ID of the user to send digest to'),
  emailAddress: z.string().email().optional()
    .describe('Email address to send to (defaults to user\'s email address)'),
  format: z.enum(['html', 'text', 'markdown']).optional().default('html')
    .describe('Format of the digest email'),
  timeRange: z.object({
    startDate: z.string().describe('Start date in ISO format'),
    endDate: z.string().optional().describe('End date in ISO format (defaults to current time)')
  }).optional().describe('Time range for generating a new digest (only used if digestId not provided)'),
  categories: z.array(z.string()).optional()
    .describe('Categories to include (only used if digestId not provided)'),
  includeTracking: z.boolean().optional().default(true)
    .describe('Whether to include open and click tracking')
});

export const SendDigestEmailTool: Tool = {
  name: 'send_digest_email',
  description: 'Sends a generated digest to the user via email with tracking capabilities',
  inputSchema: zodToJsonSchema(SendDigestEmailSchema),
  
  handler: async (args) => {
    const logger = new Logger('SendDigestEmailTool');
    
    try {
      logger.info(`Preparing to send digest email for user ${args.userId}`, { 
        digestId: args.digestId,
        emailAddress: args.emailAddress,
        format: args.format
      });
      
      // Get repositories
      const repositoryFactory = getRepositoryFactory();
      const userRepository = repositoryFactory.getSpecializedRepository('UserRepository');
      const digestRepository = repositoryFactory.getSpecializedRepository('DigestRepository');
      
      // Get digest service
      const digestService = createDigestService();
      
      // Verify user exists
      const user = await userRepository.findById(args.userId);
      
      if (!user) {
        throw new Error(`User with ID ${args.userId} not found`);
      }
      
      // Determine email address
      const emailAddress = args.emailAddress || user.email;
      
      if (!emailAddress) {
        throw new Error('No email address provided and user does not have an email address');
      }
      
      // Get or generate digest
      let digest;
      
      if (args.digestId) {
        // Use existing digest
        digest = await digestRepository.findWithItems(args.digestId);
        
        if (!digest) {
          throw new Error(`Digest with ID ${args.digestId} not found`);
        }
        
        if (digest.userId !== args.userId) {
          throw new Error(`Digest with ID ${args.digestId} does not belong to user ${args.userId}`);
        }
      } else {
        // Generate new digest
        if (!args.timeRange) {
          throw new Error('Time range is required when generating a new digest');
        }
        
        const startDate = new Date(args.timeRange.startDate);
        const endDate = args.timeRange.endDate ? new Date(args.timeRange.endDate) : new Date();
        
        // Get user preferences for digest format if not specified
        const userPreferences = await repositoryFactory
          .getSpecializedRepository('UserPreferenceRepository')
          .getAllForUser(args.userId);
        
        let formatPreferences = {
          type: args.format,
          includeImages: true,
          includeFullContent: false
        };
        
        if (userPreferences.digestConfig) {
          try {
            const config = JSON.parse(userPreferences.digestConfig);
            if (config.format) {
              formatPreferences = {
                ...config.format,
                type: args.format || config.format.type
              };
            }
          } catch (e) {
            logger.warn(`Error parsing user digest preferences: ${e instanceof Error ? e.message : String(e)}`);
          }
        }
        
        // Generate digest
        digest = await digestService.generateDigestForDelivery({
          userId: args.userId,
          startDate,
          endDate,
          categories: args.categories,
          format: formatPreferences.type,
          includeImages: formatPreferences.includeImages,
          includeFullContent: formatPreferences.includeFullContent
        });
      }
      
      // Send digest email
      const result = await digestService.sendDigestEmail({
        digest,
        recipientEmail: emailAddress,
        format: args.format || 'html',
        includeTracking: args.includeTracking
      });
      
      logger.info(`Digest email sent successfully to ${emailAddress}`);
      
      return {
        content: [
          {
            type: 'text',
            text: `Digest email sent successfully to ${emailAddress}.`
          },
          {
            type: 'json',
            json: { 
              success: true,
              digestId: digest.id,
              emailId: result.emailId,
              sentAt: result.sentAt
            }
          }
        ]
      };
    } catch (error) {
      logger.error(`Error sending digest email: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        content: [
          {
            type: 'text',
            text: `Error sending digest email: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
};