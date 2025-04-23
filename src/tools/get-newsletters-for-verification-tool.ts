/**
 * GetNewslettersForVerificationTool
 * MCP tool for retrieving emails that need newsletter verification
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Tool } from '../interfaces/mcp-server.js';
import { createNewsletterDetector } from '../core/detection/index.js';
import { Logger } from '../utils/logger.js';

// Define the tool schema
const GetNewslettersForVerificationSchema = z.object({
  userId: z.string().optional().describe('User ID to get verification items for'),
  limit: z.number().optional().describe('Maximum number of emails to return'),
  includeDetails: z.boolean().optional().describe('Whether to include detection details')
});

export const GetNewslettersForVerificationTool: Tool = {
  name: 'get_newsletters_for_verification',
  description: 'Gets emails that need user verification for newsletter detection',
  inputSchema: zodToJsonSchema(GetNewslettersForVerificationSchema),
  
  handler: async (args) => {
    const logger = new Logger('GetNewslettersForVerificationTool');
    
    try {
      logger.info(`Getting newsletters for verification for user ${args.userId || 'default_user'}`);
      
      // Create newsletter detector
      const detector = createNewsletterDetector();
      
      // In a real implementation, we would get unclassified emails from Gmail API
      // and run detection on them to find ambiguous ones
      // For this demo, we return mock data
      const verificationItems = await getMockVerificationItems(args.limit || 5);
      
      if (verificationItems.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No emails need verification at this time.'
            }
          ]
        };
      }
      
      // Format response
      let responseText = `Found ${verificationItems.length} emails that need verification:\\n\\n`;
      
      for (const item of verificationItems) {
        responseText += `ID: ${item.emailId}\\n`;
        responseText += `From: ${item.from}\\n`;
        responseText += `Subject: ${item.subject}\\n`;
        responseText += `Current score: ${(item.score * 100).toFixed(1)}%\\n`;
        
        if (args.includeDetails && item.details) {
          responseText += 'Detection details:\\n';
          for (const detail of item.details) {
            responseText += `- ${detail.method}: ${(detail.score * 100).toFixed(1)}%\\n`;
          }
        }
        
        responseText += '\\n';
      }
      
      return {
        content: [
          {
            type: 'text',
            text: responseText
          }
        ]
      };
    } catch (error) {
      logger.error(`Error getting newsletters for verification: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        content: [
          {
            type: 'text',
            text: `Error getting newsletters for verification: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
};

/**
 * Get mock verification items for demonstration
 * In a real implementation, this would get emails from Gmail API and run detection
 */
async function getMockVerificationItems(limit: number) {
  // Return mock verification items
  return [
    {
      emailId: 'ambiguous-email-1',
      from: 'updates@company.com',
      subject: 'Your Account Update',
      score: 0.52,
      details: [
        { method: 'header_analysis', score: 0.4 },
        { method: 'content_structure', score: 0.6 },
        { method: 'sender_reputation', score: 0.5 },
        { method: 'user_feedback', score: 0.5 }
      ]
    },
    {
      emailId: 'ambiguous-email-2',
      from: 'digest@example.org',
      subject: 'Daily Digest',
      score: 0.58,
      details: [
        { method: 'header_analysis', score: 0.6 },
        { method: 'content_structure', score: 0.4 },
        { method: 'sender_reputation', score: 0.6 },
        { method: 'user_feedback', score: 0.5 }
      ]
    },
    {
      emailId: 'ambiguous-email-3',
      from: 'info@business.com',
      subject: 'Important Information',
      score: 0.45,
      details: [
        { method: 'header_analysis', score: 0.3 },
        { method: 'content_structure', score: 0.4 },
        { method: 'sender_reputation', score: 0.7 },
        { method: 'user_feedback', score: 0.5 }
      ]
    }
  ].slice(0, limit);
}