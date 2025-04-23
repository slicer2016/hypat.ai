/**
 * Manage Category Tool
 * MCP tool for adding, updating, or deleting categories
 */

import { z } from 'zod';
import { Tool } from '../interfaces/mcp-server.js';
import { createCategorizer } from '../core/categorization/index.js';
import { Logger } from '../utils/logger.js';

// Create categorizer instance
const categorizer = createCategorizer();

// Input schema for the tool
const ManageCategoryInput = z.object({
  action: z.enum(['add', 'update', 'delete']).describe('The action to perform'),
  categoryId: z.string().optional().describe('The ID of the category (required for update and delete)'),
  name: z.string().optional().describe('The name of the category (required for add, optional for update)'),
  description: z.string().optional().describe('The description of the category'),
  parentId: z.string().optional().describe('The ID of the parent category'),
  icon: z.string().optional().describe('The icon for the category'),
  color: z.string().optional().describe('The color for the category')
});

// Output schema for the tool
const ManageCategoryOutput = z.object({
  success: z.boolean().describe('Whether the operation was successful'),
  category: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    parentId: z.string().optional(),
    children: z.array(z.string()).optional(),
    icon: z.string().optional(),
    color: z.string().optional()
  }).optional().describe('The category that was added or updated'),
  message: z.string().describe('A message describing the result')
});

// Input and output type definitions
type ManageCategoryInputType = z.infer<typeof ManageCategoryInput>;
type ManageCategoryOutputType = z.infer<typeof ManageCategoryOutput>;

/**
 * Tool implementation for managing categories
 */
export const ManageCategoryTool: Tool = {
  name: 'manage_category',
  description: 'Add, update, or delete categories in the system',
  inputSchema: ManageCategoryInput,
  
  handler: async (params: ManageCategoryInputType): Promise<ManageCategoryOutputType> => {
    const logger = new Logger('ManageCategoryTool');
    
    try {
      logger.info(`Performing ${params.action} operation on category`);
      
      // Access the category manager directly for update and delete operations
      const categoryManager = (categorizer as any).categoryManager;
      
      if (!categoryManager) {
        throw new Error('Category manager not available');
      }
      
      // Perform the requested action
      switch (params.action) {
        case 'add': {
          if (!params.name) {
            throw new Error('Name is required when adding a category');
          }
          
          // Add the category
          const category = await categoryManager.addCategory({
            name: params.name,
            description: params.description,
            parent: params.parentId,
            icon: params.icon,
            color: params.color
          });
          
          return {
            success: true,
            category: {
              id: category.id,
              name: category.name,
              description: category.description,
              parentId: category.parent,
              children: category.children,
              icon: category.icon,
              color: category.color
            },
            message: `Category "${params.name}" added successfully`
          };
        }
        
        case 'update': {
          if (!params.categoryId) {
            throw new Error('Category ID is required when updating a category');
          }
          
          // Check if category exists
          const existingCategory = await categoryManager.getCategory(params.categoryId);
          if (!existingCategory) {
            throw new Error(`Category not found: ${params.categoryId}`);
          }
          
          // Update the category
          const category = await categoryManager.updateCategory(params.categoryId, {
            name: params.name,
            description: params.description,
            parent: params.parentId,
            icon: params.icon,
            color: params.color
          });
          
          return {
            success: true,
            category: {
              id: category.id,
              name: category.name,
              description: category.description,
              parentId: category.parent,
              children: category.children,
              icon: category.icon,
              color: category.color
            },
            message: `Category "${category.name}" updated successfully`
          };
        }
        
        case 'delete': {
          if (!params.categoryId) {
            throw new Error('Category ID is required when deleting a category');
          }
          
          // Check if category exists
          const existingCategory = await categoryManager.getCategory(params.categoryId);
          if (!existingCategory) {
            throw new Error(`Category not found: ${params.categoryId}`);
          }
          
          // Delete the category
          const success = await categoryManager.deleteCategory(params.categoryId);
          
          return {
            success,
            message: success ? 
              `Category "${existingCategory.name}" deleted successfully` : 
              `Failed to delete category "${existingCategory.name}"`
          };
        }
        
        default:
          throw new Error(`Unsupported action: ${params.action}`);
      }
    } catch (error) {
      logger.error(`Error managing category: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
};