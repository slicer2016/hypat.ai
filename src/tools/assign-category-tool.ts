/**
 * Assign Category Tool
 * MCP tool for manually assigning categories to newsletters
 */

import { z } from 'zod';
import { Tool } from '../interfaces/mcp-server.js';
import { createCategorizer } from '../core/categorization/index.js';
import { Logger } from '../utils/logger.js';

// Create categorizer instance
const categorizer = createCategorizer();

// Input schema for the tool
const AssignCategoryInput = z.object({
  newsletterId: z.string().describe('The ID of the newsletter'),
  categoryId: z.string().describe('The ID of the category to assign'),
  userId: z.string().describe('The ID of the user making the assignment'),
  action: z.enum(['assign', 'remove']).default('assign').describe('Whether to assign or remove the category')
});

// Output schema for the tool
const AssignCategoryOutput = z.object({
  success: z.boolean().describe('Whether the operation was successful'),
  newsletterId: z.string().describe('The ID of the newsletter'),
  categoryId: z.string().describe('The ID of the category'),
  action: z.enum(['assign', 'remove']).describe('The action that was performed'),
  message: z.string().describe('A message describing the result')
});

// Input and output type definitions
type AssignCategoryInputType = z.infer<typeof AssignCategoryInput>;
type AssignCategoryOutputType = z.infer<typeof AssignCategoryOutput>;

/**
 * Tool implementation for assigning categories to newsletters
 */
export const AssignCategoryTool: Tool = {
  name: 'assign_category',
  description: 'Manually assign or remove a category for a newsletter',
  inputSchema: AssignCategoryInput,
  
  handler: async (params: AssignCategoryInputType): Promise<AssignCategoryOutputType> => {
    const logger = new Logger('AssignCategoryTool');
    
    try {
      logger.info(`${params.action === 'assign' ? 'Assigning' : 'Removing'} category ${params.categoryId} ${params.action === 'assign' ? 'to' : 'from'} newsletter ${params.newsletterId}`);
      
      // Access the manual categorization handler
      const manualHandler = (categorizer as any).manualHandler;
      
      if (!manualHandler) {
        throw new Error('Manual categorization handler not available');
      }
      
      // Check if category exists
      const categoryManager = (categorizer as any).categoryManager;
      const category = await categoryManager.getCategory(params.categoryId);
      
      if (!category) {
        throw new Error(`Category not found: ${params.categoryId}`);
      }
      
      // Perform the requested action
      let success = false;
      if (params.action === 'assign') {
        const assignment = await manualHandler.assignCategory(
          params.newsletterId,
          params.categoryId,
          params.userId
        );
        
        success = !!assignment;
      } else {
        success = await manualHandler.removeAssignment(
          params.newsletterId,
          params.categoryId,
          params.userId
        );
      }
      
      return {
        success,
        newsletterId: params.newsletterId,
        categoryId: params.categoryId,
        action: params.action,
        message: success ? 
          `Successfully ${params.action === 'assign' ? 'assigned' : 'removed'} category "${category.name}" ${params.action === 'assign' ? 'to' : 'from'} newsletter` : 
          `Failed to ${params.action === 'assign' ? 'assign' : 'remove'} category "${category.name}" ${params.action === 'assign' ? 'to' : 'from'} newsletter`
      };
    } catch (error) {
      logger.error(`Error ${params.action === 'assign' ? 'assigning' : 'removing'} category: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        success: false,
        newsletterId: params.newsletterId,
        categoryId: params.categoryId,
        action: params.action,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
};