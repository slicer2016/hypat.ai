/**
 * SearchNewslettersTool
 * Search across processed newsletter content with filtering capabilities
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Tool } from '../interfaces/mcp-server.js';
import { getRepositoryFactory } from '../data/index.js';
import { createContentProcessor } from '../core/content-processing/index.js';
import { Logger } from '../utils/logger.js';

// Define date range schema
const DateRangeSchema = z.object({
  startDate: z.string().describe('Start date in ISO format'),
  endDate: z.string().optional().describe('End date in ISO format (defaults to current time)')
});

// Define input schema
const SearchNewslettersSchema = z.object({
  query: z.string().describe('The search query string'),
  categories: z.array(z.string()).optional().describe('List of category IDs to filter by'),
  dateRange: DateRangeSchema.optional().describe('Date range for filtering newsletters'),
  sources: z.array(z.string()).optional().describe('List of newsletter sources to filter by'),
  limit: z.number().positive().optional().default(20).describe('Maximum number of results to return'),
  includeSummary: z.boolean().optional().default(true).describe('Whether to include newsletter summaries')
});

export const SearchNewslettersTool: Tool = {
  name: 'search_newsletters',
  description: 'Search across processed newsletter content with advanced filtering',
  inputSchema: zodToJsonSchema(SearchNewslettersSchema),
  
  handler: async (args) => {
    const logger = new Logger('SearchNewslettersTool');
    
    try {
      logger.info(`Searching newsletters with query: ${args.query}`, { 
        categories: args.categories,
        dateRange: args.dateRange,
        sources: args.sources 
      });
      
      // Get repository and content processor
      const repositoryFactory = getRepositoryFactory();
      const contentProcessor = createContentProcessor();
      
      // Get repositories
      const newsletterRepository = repositoryFactory.getSpecializedRepository('NewsletterRepository');
      
      // Build query filters
      const filters: Record<string, unknown> = {};
      
      if (args.dateRange) {
        const startDate = new Date(args.dateRange.startDate);
        const endDate = args.dateRange.endDate ? new Date(args.dateRange.endDate) : new Date();
        
        filters.receivedDate = { $gte: startDate, $lte: endDate };
      }
      
      if (args.sources && args.sources.length > 0) {
        filters.sender = { $in: args.sources };
      }
      
      // First, get all newsletter IDs based on filters
      let newsletterIds = [];
      
      if (Object.keys(filters).length > 0) {
        const filteredNewsletters = await newsletterRepository.find({ where: filters });
        newsletterIds = filteredNewsletters.map(newsletter => newsletter.id);
      }
      
      // Then, if category filter is applied, narrow down the list
      if (args.categories && args.categories.length > 0) {
        const categoryAssignmentRepository = repositoryFactory.getSpecializedRepository('CategoryAssignmentRepository');
        
        // Get all newsletters in these categories
        const categoryAssignments = await categoryAssignmentRepository.find({ 
          where: { categoryId: { $in: args.categories } } 
        });
        
        const newsletterIdsInCategories = categoryAssignments.map(assignment => assignment.newsletterId);
        
        // If we already have filtered newsletterIds, only keep those that are also in the categories
        if (newsletterIds.length > 0) {
          newsletterIds = newsletterIds.filter(id => newsletterIdsInCategories.includes(id));
        } else {
          newsletterIds = newsletterIdsInCategories;
        }
      }
      
      // Get content repository for searching
      const contentRepository = contentProcessor.getContentRepository();
      
      // Search the content
      const searchResults = await contentRepository.searchContent(
        args.query,
        newsletterIds.length > 0 ? newsletterIds : undefined,
        args.limit
      );
      
      // Prepare response
      const results = [];
      
      for (const result of searchResults) {
        // Get full newsletter data
        const newsletter = await newsletterRepository.findById(result.newsletterId);
        
        if (!newsletter) {
          continue; // Skip if newsletter not found
        }
        
        // Get category data
        const newsletterWithCategories = await newsletterRepository.findWithCategories(result.newsletterId);
        
        // Format result
        const formattedResult: Record<string, unknown> = {
          id: newsletter.id,
          emailId: newsletter.emailId,
          subject: newsletter.subject,
          sender: newsletter.sender,
          receivedDate: newsletter.receivedDate.toISOString(),
          relevanceScore: result.score,
          matchedContent: result.matchedContent,
          categories: newsletterWithCategories ? newsletterWithCategories.categories : []
        };
        
        // Include summary if requested
        if (args.includeSummary) {
          const processedContent = newsletter.processedContentJson ? 
            JSON.parse(newsletter.processedContentJson) : 
            await contentProcessor.getProcessedContent(newsletter.id);
          
          formattedResult.summary = processedContent.summary;
        }
        
        results.push(formattedResult);
      }
      
      logger.info(`Found ${results.length} newsletters matching search criteria`);
      
      return {
        content: [
          {
            type: 'text',
            text: `Found ${results.length} newsletters matching your search for "${args.query}".`
          },
          {
            type: 'json',
            json: { results }
          }
        ]
      };
    } catch (error) {
      logger.error(`Error searching newsletters: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        content: [
          {
            type: 'text',
            text: `Error searching newsletters: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
};