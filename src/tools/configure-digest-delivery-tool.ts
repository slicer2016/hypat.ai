/**
 * ConfigureDigestDeliveryTool
 * Sets up email digest delivery preferences
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Tool } from '../interfaces/mcp-server.js';
import { getRepositoryFactory } from '../data/index.js';
import { createDigestService } from '../core/digest/index.js';
import { Logger } from '../utils/logger.js';

// Define frequency schema
const FrequencySchema = z.enum([
  'daily', 
  'weekly', 
  'biweekly', 
  'monthly', 
  'custom'
]).describe('Frequency of digest delivery');

// Define digest format schema
const DigestFormatSchema = z.object({
  type: z.enum(['text', 'html', 'markdown']).default('html')
    .describe('Format of the digest content'),
  template: z.string().optional()
    .describe('Template to use for the digest'),
  includeImages: z.boolean().optional().default(true)
    .describe('Whether to include images in the digest'),
  includeFullContent: z.boolean().optional().default(false)
    .describe('Whether to include full newsletter content or just summaries')
});

// Define categories schema
const CategoriesConfigSchema = z.object({
  included: z.array(z.string()).optional()
    .describe('Categories to include in the digest'),
  excluded: z.array(z.string()).optional()
    .describe('Categories to exclude from the digest'),
  maxPerCategory: z.number().positive().optional().default(5)
    .describe('Maximum number of newsletters per category')
});

// Define input schema
const ConfigureDigestDeliverySchema = z.object({
  userId: z.string().describe('ID of the user configuring digest delivery'),
  frequency: FrequencySchema.describe('Frequency of digest delivery'),
  deliveryTime: z.string().describe('Time of day for delivery in HH:MM format (24-hour format)'),
  timeZone: z.string().optional().default('UTC')
    .describe('User\'s time zone (e.g., America/New_York)'),
  formatPreferences: DigestFormatSchema.optional()
    .describe('Format preferences for the digest'),
  categories: CategoriesConfigSchema.optional()
    .describe('Configuration for categories to include/exclude'),
  customSchedule: z.array(z.number().min(0).max(6)).optional()
    .describe('Days of week (0-6, Sunday is 0) for custom schedule (only used when frequency is "custom")'),
  enabled: z.boolean().optional().default(true)
    .describe('Whether digest delivery is enabled')
});

export const ConfigureDigestDeliveryTool: Tool = {
  name: 'configure_digest_delivery',
  description: 'Sets up email digest delivery preferences including frequency, format, and content preferences',
  inputSchema: zodToJsonSchema(ConfigureDigestDeliverySchema),
  
  handler: async (args) => {
    const logger = new Logger('ConfigureDigestDeliveryTool');
    
    try {
      logger.info(`Configuring digest delivery for user ${args.userId}`, { 
        frequency: args.frequency,
        deliveryTime: args.deliveryTime,
        timeZone: args.timeZone
      });
      
      // Get repositories
      const repositoryFactory = getRepositoryFactory();
      const userRepository = repositoryFactory.getSpecializedRepository('UserRepository');
      const userPreferenceRepository = repositoryFactory.getSpecializedRepository('UserPreferenceRepository');
      
      // Get digest service
      const digestService = createDigestService();
      
      // Verify user exists
      const user = await userRepository.findById(args.userId);
      
      if (!user) {
        throw new Error(`User with ID ${args.userId} not found`);
      }
      
      // Parse delivery time
      const [hours, minutes] = args.deliveryTime.split(':').map(Number);
      
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        throw new Error('Invalid delivery time format. Use HH:MM in 24-hour format.');
      }
      
      // Validate custom schedule if provided
      if (args.frequency === 'custom' && (!args.customSchedule || args.customSchedule.length === 0)) {
        throw new Error('Custom schedule is required when frequency is "custom"');
      }
      
      // Prepare digest configuration
      const digestConfig = {
        enabled: args.enabled,
        frequency: args.frequency,
        deliveryTime: {
          hours,
          minutes
        },
        timeZone: args.timeZone,
        format: args.formatPreferences || {
          type: 'html',
          includeImages: true,
          includeFullContent: false
        },
        categories: args.categories || {
          maxPerCategory: 5
        }
      };
      
      // Add custom schedule if provided
      if (args.customSchedule) {
        digestConfig.customSchedule = args.customSchedule;
      }
      
      // Save configuration to user preferences
      await userPreferenceRepository.setPreference(
        args.userId,
        'digestConfig',
        JSON.stringify(digestConfig)
      );
      
      // Update scheduler with new config
      await digestService.updateSchedule(args.userId, digestConfig);
      
      logger.info(`Digest delivery configured successfully for user ${args.userId}`);
      
      // Prepare next delivery information
      const nextDelivery = await digestService.getNextDeliveryTime(args.userId);
      
      return {
        content: [
          {
            type: 'text',
            text: `Digest delivery preferences have been configured successfully.${
              args.enabled && nextDelivery 
                ? ` Your next digest will be delivered on ${nextDelivery.toLocaleString('en-US', { 
                    timeZone: args.timeZone,
                    dateStyle: 'full',
                    timeStyle: 'short'
                  })}.`
                : ''
            }`
          },
          {
            type: 'json',
            json: { 
              configuration: digestConfig,
              nextDelivery: nextDelivery ? nextDelivery.toISOString() : null
            }
          }
        ]
      };
    } catch (error) {
      logger.error(`Error configuring digest delivery: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        content: [
          {
            type: 'text',
            text: `Error configuring digest delivery: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
};