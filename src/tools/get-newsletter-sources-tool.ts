/**
 * GetNewsletterSourcesTool
 * Retrieves a list of identified newsletter sources
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Tool } from '../interfaces/mcp-server.js';
import { getRepositoryFactory } from '../data/index.js';
import { Logger } from '../utils/logger.js';

// Define input schema (minimal as this tool doesn't require many parameters)
const GetNewsletterSourcesSchema = z.object({
  includeStats: z.boolean().optional().default(true).describe('Whether to include source statistics'),
  limit: z.number().positive().optional().default(100).describe('Maximum number of sources to return'),
  sortBy: z.enum(['name', 'count', 'recentActivity']).optional().default('count')
    .describe('How to sort the sources')
});

export const GetNewsletterSourcesTool: Tool = {
  name: 'get_newsletter_sources',
  description: 'Retrieves a list of identified newsletter sources with statistics',
  inputSchema: zodToJsonSchema(GetNewsletterSourcesSchema),
  
  handler: async (args) => {
    const logger = new Logger('GetNewsletterSourcesTool');
    
    try {
      logger.info('Retrieving newsletter sources', { 
        includeStats: args.includeStats,
        limit: args.limit,
        sortBy: args.sortBy
      });
      
      // Get repository factory
      const repositoryFactory = getRepositoryFactory();
      
      // Get newsletter repository
      const newsletterRepository = repositoryFactory.getSpecializedRepository('NewsletterRepository');
      
      // Query database for sources
      const query = `
        SELECT 
          sender, 
          COUNT(*) AS newsletter_count, 
          MAX(received_date) AS latest_date
        FROM newsletters
        WHERE is_verified = true
        GROUP BY sender
        ORDER BY ${getSortField(args.sortBy)} ${args.sortBy === 'name' ? 'ASC' : 'DESC'}
        LIMIT ?
      `;
      
      const sourceResults = await newsletterRepository.getConnection().query(query, [args.limit]);
      
      // Process results
      const sources = [];
      
      for (const source of sourceResults) {
        // Get the domain from the email
        const domain = extractDomain(source.sender);
        
        // Find or create source entry
        let sourceEntry = sources.find(s => s.domain === domain);
        
        if (!sourceEntry) {
          sourceEntry = {
            domain,
            emails: [],
            totalNewsletters: 0,
            latestActivity: null
          };
          sources.push(sourceEntry);
        }
        
        // Add email to source
        sourceEntry.emails.push({
          email: source.sender,
          count: source.newsletter_count,
          latestActivity: new Date(source.latest_date).toISOString()
        });
        
        // Update source stats
        sourceEntry.totalNewsletters += source.newsletter_count;
        
        const activityDate = new Date(source.latest_date);
        if (!sourceEntry.latestActivity || activityDate > new Date(sourceEntry.latestActivity)) {
          sourceEntry.latestActivity = activityDate.toISOString();
        }
      }
      
      // Get category statistics if requested
      if (args.includeStats) {
        // Get additional stats for each source
        for (const source of sources) {
          // Get most common categories for this source
          const categoryQuery = `
            SELECT 
              c.id, 
              c.name, 
              COUNT(*) AS category_count
            FROM categories c
            JOIN category_assignments ca ON c.id = ca.category_id
            JOIN newsletters n ON ca.newsletter_id = n.id
            WHERE n.sender IN (${source.emails.map(() => '?').join(',')})
            GROUP BY c.id
            ORDER BY category_count DESC
            LIMIT 5
          `;
          
          const categoryResults = await newsletterRepository.getConnection().query(
            categoryQuery, 
            source.emails.map(e => e.email)
          );
          
          // Add categories to source
          source.topCategories = categoryResults.map(cat => ({
            id: cat.id,
            name: cat.name,
            count: cat.category_count
          }));
        }
      }
      
      logger.info(`Retrieved ${sources.length} newsletter sources`);
      
      return {
        content: [
          {
            type: 'text',
            text: `Found ${sources.length} newsletter sources.`
          },
          {
            type: 'json',
            json: { sources }
          }
        ]
      };
    } catch (error) {
      logger.error(`Error retrieving newsletter sources: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        content: [
          {
            type: 'text',
            text: `Error retrieving newsletter sources: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
};

/**
 * Helper function to get sort field based on sort type
 */
function getSortField(sortBy: string): string {
  switch (sortBy) {
    case 'name':
      return 'sender';
    case 'recentActivity':
      return 'latest_date';
    case 'count':
    default:
      return 'newsletter_count';
  }
}

/**
 * Helper function to extract domain from email
 */
function extractDomain(email: string): string {
  try {
    // Try to get domain from email
    const match = email.match(/@([^@]+)$/);
    return match ? match[1] : email;
  } catch {
    return email;
  }
}