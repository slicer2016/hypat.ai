/**
 * DetectNewsletterTool
 * MCP tool for detecting newsletters
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Tool } from '../interfaces/mcp-server.js';
import { createNewsletterDetector } from '../core/detection/index.js';
import { Logger } from '../utils/logger.js';

// Define the tool schema
const DetectNewsletterSchema = z.object({
  emailId: z.string().describe('ID of the email to analyze'),
  userId: z.string().optional().describe('User ID for personalized detection'),
  includeDetails: z.boolean().optional().describe('Whether to include detailed analysis')
});

export const DetectNewsletterTool: Tool = {
  name: 'detect_newsletter',
  description: 'Detects if an email is a newsletter using multiple detection methods',
  inputSchema: zodToJsonSchema(DetectNewsletterSchema),
  
  handler: async (args) => {
    const logger = new Logger('DetectNewsletterTool');
    
    try {
      logger.info(`Detecting newsletter for email ${args.emailId}`);
      
      // Create newsletter detector
      const detector = createNewsletterDetector();
      
      // In a real implementation, we would get the email from Gmail API
      // For this demo, we create a simple mock email
      const email = await getMockEmail(args.emailId);
      
      if (!email) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: Email ${args.emailId} not found`
            }
          ]
        };
      }
      
      // Get user feedback if available
      let userFeedback;
      if (args.userId) {
        userFeedback = await getUserFeedback(args.userId);
      }
      
      // Detect newsletter
      const result = await detector.detectNewsletter(email, userFeedback);
      
      // Prepare response
      let responseText = '';
      
      if (result.isNewsletter) {
        responseText += `Email ${args.emailId} is a newsletter with ${(result.combinedScore * 100).toFixed(1)}% confidence.`;
      } else {
        responseText += `Email ${args.emailId} is not a newsletter with ${((1 - result.combinedScore) * 100).toFixed(1)}% confidence.`;
      }
      
      if (result.needsVerification) {
        responseText += ' User verification is recommended.';
      }
      
      // Include detailed analysis if requested
      if (args.includeDetails) {
        responseText += '\n\nDetailed analysis:\n';
        
        for (const score of result.scores) {
          responseText += `- ${score.method}: ${(score.score * 100).toFixed(1)}% (confidence: ${(score.confidence * 100).toFixed(1)}%)\n`;
          responseText += `  Reason: ${score.reason}\n`;
        }
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
      logger.error(`Error detecting newsletter: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        content: [
          {
            type: 'text',
            text: `Error detecting newsletter: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
};

/**
 * Get a mock email for testing
 * In a real implementation, this would call the Gmail API
 */
async function getMockEmail(emailId: string) {
  // Check the mock ID to determine what type of email to return
  if (emailId === 'newsletter-example') {
    // Return a newsletter example
    return {
      id: emailId,
      payload: {
        headers: [
          { name: 'From', value: 'newsletter@example.com' },
          { name: 'Subject', value: 'Weekly Newsletter' },
          { name: 'List-Unsubscribe', value: '<https://example.com/unsubscribe>' }
        ],
        mimeType: 'text/html',
        body: {
          data: Buffer.from(`
            <html>
              <body>
                <table width="600" cellpadding="0" cellspacing="0" border="0" align="center">
                  <tr>
                    <td>
                      <div class="header">Newsletter Title</div>
                      <div class="content">
                        <h1>Main Article</h1>
                        <p>Content here</p>
                        <a href="#" class="button">Read More</a>
                      </div>
                      <div class="footer">
                        <p>You are receiving this because you subscribed.</p>
                        <p><a href="#">Unsubscribe</a> | <a href="#">View in browser</a></p>
                      </div>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
          `).toString('base64')
        }
      }
    };
  } else if (emailId === 'regular-email') {
    // Return a regular email example
    return {
      id: emailId,
      payload: {
        headers: [
          { name: 'From', value: 'person@example.com' },
          { name: 'Subject', value: 'Hello!' }
        ],
        mimeType: 'text/plain',
        body: {
          data: Buffer.from('Hello, this is a regular email message.').toString('base64')
        }
      }
    };
  } else if (emailId === 'ambiguous-email') {
    // Return an ambiguous email that might need verification
    return {
      id: emailId,
      payload: {
        headers: [
          { name: 'From', value: 'updates@example.com' },
          { name: 'Subject', value: 'Your Account Update' }
        ],
        mimeType: 'text/html',
        body: {
          data: Buffer.from(`
            <html>
              <body>
                <p>Hello,</p>
                <p>Your account has been updated with the latest information.</p>
                <p>Please log in to review the changes.</p>
                <p>Thanks,<br>The Team</p>
              </body>
            </html>
          `).toString('base64')
        }
      }
    };
  }
  
  // If email ID doesn't match any mock, return null
  return null;
}

/**
 * Get user feedback for personalized detection
 * In a real implementation, this would get feedback from database
 */
async function getUserFeedback(userId: string) {
  // For demo purposes, return mock feedback
  return {
    confirmedNewsletters: new Set<string>(['newsletter@example.com', 'weekly@demo.com']),
    rejectedNewsletters: new Set<string>(['noreply@accounts.google.com']),
    trustedDomains: new Set<string>(['newsletter.com']),
    blockedDomains: new Set<string>()
  };
}