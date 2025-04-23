/**
 * Category Manager Implementation
 * Manages the category taxonomy for the system
 */

import { v4 as uuidv4 } from 'uuid';
import { Category, CategoryManager } from './interfaces.js';
import { Logger } from '../../utils/logger.js';

/**
 * In-memory implementation of CategoryManager
 * In a production environment, this would be replaced with a database-backed implementation
 */
export class CategoryManagerImpl implements CategoryManager {
  private logger: Logger;
  private categories: Map<string, Category>;

  constructor() {
    this.logger = new Logger('CategoryManager');
    this.categories = new Map<string, Category>();
    
    // Initialize with default categories
    this.initializeDefaultCategories();
  }

  /**
   * Initialize default categories
   */
  private async initializeDefaultCategories(): Promise<void> {
    try {
      this.logger.debug('Initializing default categories');
      
      // Add root categories
      const techCategory = await this.addCategory({
        name: 'Technology',
        description: 'Technology news and updates',
        icon: 'computer',
        color: '#3498db'
      });
      
      const businessCategory = await this.addCategory({
        name: 'Business',
        description: 'Business insights and trends',
        icon: 'business',
        color: '#2ecc71'
      });
      
      const scienceCategory = await this.addCategory({
        name: 'Science',
        description: 'Scientific discoveries and research',
        icon: 'science',
        color: '#9b59b6'
      });
      
      // Add subcategories
      await this.addCategory({
        name: 'AI & Machine Learning',
        description: 'Artificial intelligence and machine learning news',
        parent: techCategory.id,
        icon: 'smart_toy',
        color: '#3498db'
      });
      
      await this.addCategory({
        name: 'Web Development',
        description: 'Web development and design',
        parent: techCategory.id,
        icon: 'web',
        color: '#3498db'
      });
      
      await this.addCategory({
        name: 'Startups',
        description: 'Startup news and funding',
        parent: businessCategory.id,
        icon: 'rocket_launch',
        color: '#2ecc71'
      });
      
      await this.addCategory({
        name: 'Finance',
        description: 'Financial news and market trends',
        parent: businessCategory.id,
        icon: 'attach_money',
        color: '#2ecc71'
      });
      
      await this.addCategory({
        name: 'Physics',
        description: 'Physics discoveries and research',
        parent: scienceCategory.id,
        icon: 'science',
        color: '#9b59b6'
      });
      
      await this.addCategory({
        name: 'Biology',
        description: 'Biology and medical research',
        parent: scienceCategory.id,
        icon: 'biotech',
        color: '#9b59b6'
      });
      
      this.logger.debug('Default categories initialized successfully');
    } catch (error) {
      this.logger.error(`Error initializing default categories: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Add a new category
   * @param categoryData The category data to add
   */
  async addCategory(categoryData: Partial<Category>): Promise<Category> {
    try {
      this.logger.debug(`Adding new category: ${categoryData.name}`);
      
      const now = new Date();
      const categoryId = categoryData.id || uuidv4();
      
      const category: Category = {
        id: categoryId,
        name: categoryData.name || 'Unnamed Category',
        description: categoryData.description,
        parent: categoryData.parent,
        children: categoryData.children || [],
        metadata: categoryData.metadata || {},
        icon: categoryData.icon,
        color: categoryData.color,
        createdAt: now,
        updatedAt: now
      };
      
      // Store the category
      this.categories.set(categoryId, category);
      
      // Update parent's children array if parent exists
      if (category.parent) {
        const parent = this.categories.get(category.parent);
        if (parent) {
          if (!parent.children) {
            parent.children = [];
          }
          if (!parent.children.includes(categoryId)) {
            parent.children.push(categoryId);
            parent.updatedAt = now;
            this.categories.set(parent.id, parent);
          }
        } else {
          this.logger.warn(`Parent category ${category.parent} not found for ${categoryId}`);
          // Remove the parent reference if parent doesn't exist
          category.parent = undefined;
          this.categories.set(categoryId, category);
        }
      }
      
      this.logger.debug(`Category added successfully: ${categoryId}`);
      return category;
    } catch (error) {
      this.logger.error(`Error adding category: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to add category: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update an existing category
   * @param categoryId The ID of the category to update
   * @param changes The changes to apply
   */
  async updateCategory(categoryId: string, changes: Partial<Category>): Promise<Category> {
    try {
      this.logger.debug(`Updating category: ${categoryId}`);
      
      const existingCategory = await this.getCategory(categoryId);
      if (!existingCategory) {
        throw new Error(`Category not found: ${categoryId}`);
      }
      
      // Handle parent change
      if (changes.parent !== undefined && changes.parent !== existingCategory.parent) {
        // Remove from old parent's children
        if (existingCategory.parent) {
          const oldParent = this.categories.get(existingCategory.parent);
          if (oldParent && oldParent.children) {
            oldParent.children = oldParent.children.filter(id => id !== categoryId);
            oldParent.updatedAt = new Date();
            this.categories.set(oldParent.id, oldParent);
          }
        }
        
        // Add to new parent's children
        if (changes.parent) {
          const newParent = this.categories.get(changes.parent);
          if (newParent) {
            if (!newParent.children) {
              newParent.children = [];
            }
            if (!newParent.children.includes(categoryId)) {
              newParent.children.push(categoryId);
              newParent.updatedAt = new Date();
              this.categories.set(newParent.id, newParent);
            }
          } else {
            this.logger.warn(`New parent category ${changes.parent} not found for ${categoryId}`);
            // Don't update parent if the new parent doesn't exist
            changes.parent = existingCategory.parent;
          }
        }
      }
      
      // Update the category
      const updatedCategory: Category = {
        ...existingCategory,
        ...changes,
        id: categoryId, // Ensure ID doesn't change
        updatedAt: new Date()
      };
      
      this.categories.set(categoryId, updatedCategory);
      
      this.logger.debug(`Category updated successfully: ${categoryId}`);
      return updatedCategory;
    } catch (error) {
      this.logger.error(`Error updating category: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to update category: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete a category
   * @param categoryId The ID of the category to delete
   */
  async deleteCategory(categoryId: string): Promise<boolean> {
    try {
      this.logger.debug(`Deleting category: ${categoryId}`);
      
      const category = await this.getCategory(categoryId);
      if (!category) {
        this.logger.warn(`Category not found for deletion: ${categoryId}`);
        return false;
      }
      
      // Handle parent reference
      if (category.parent) {
        const parent = this.categories.get(category.parent);
        if (parent && parent.children) {
          parent.children = parent.children.filter(id => id !== categoryId);
          parent.updatedAt = new Date();
          this.categories.set(parent.id, parent);
        }
      }
      
      // Handle children
      if (category.children && category.children.length > 0) {
        // Move children to parent or make them root categories
        for (const childId of category.children) {
          const child = this.categories.get(childId);
          if (child) {
            child.parent = category.parent; // Move to grandparent or make root
            child.updatedAt = new Date();
            this.categories.set(childId, child);
            
            // Add to new parent's children if applicable
            if (child.parent) {
              const newParent = this.categories.get(child.parent);
              if (newParent) {
                if (!newParent.children) {
                  newParent.children = [];
                }
                if (!newParent.children.includes(childId)) {
                  newParent.children.push(childId);
                  newParent.updatedAt = new Date();
                  this.categories.set(newParent.id, newParent);
                }
              }
            }
          }
        }
      }
      
      // Delete the category
      const result = this.categories.delete(categoryId);
      
      this.logger.debug(`Category deletion ${result ? 'successful' : 'failed'}: ${categoryId}`);
      return result;
    } catch (error) {
      this.logger.error(`Error deleting category: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to delete category: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get a category by ID
   * @param categoryId The ID of the category
   */
  async getCategory(categoryId: string): Promise<Category | null> {
    try {
      this.logger.debug(`Getting category: ${categoryId}`);
      
      const category = this.categories.get(categoryId);
      if (!category) {
        this.logger.debug(`Category not found: ${categoryId}`);
        return null;
      }
      
      return category;
    } catch (error) {
      this.logger.error(`Error getting category: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Get all categories
   * @param filter Optional filter criteria
   */
  async getCategories(filter?: Partial<Category>): Promise<Category[]> {
    try {
      this.logger.debug('Getting categories');
      
      let categories = Array.from(this.categories.values());
      
      // Apply filters if provided
      if (filter) {
        categories = categories.filter(category => {
          for (const [key, value] of Object.entries(filter)) {
            if (key === 'metadata') {
              // Special handling for metadata
              const filterMetadata = value as Record<string, string>;
              const categoryMetadata = category.metadata || {};
              
              for (const [metaKey, metaValue] of Object.entries(filterMetadata)) {
                if (categoryMetadata[metaKey] !== metaValue) {
                  return false;
                }
              }
            } else if (category[key as keyof Category] !== value) {
              return false;
            }
          }
          return true;
        });
      }
      
      return categories;
    } catch (error) {
      this.logger.error(`Error getting categories: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Get child categories
   * @param parentId The ID of the parent category
   */
  async getChildCategories(parentId: string): Promise<Category[]> {
    try {
      this.logger.debug(`Getting child categories for parent: ${parentId}`);
      
      const parent = await this.getCategory(parentId);
      if (!parent) {
        this.logger.warn(`Parent category not found: ${parentId}`);
        return [];
      }
      
      if (!parent.children || parent.children.length === 0) {
        return [];
      }
      
      const children: Category[] = [];
      for (const childId of parent.children) {
        const child = await this.getCategory(childId);
        if (child) {
          children.push(child);
        }
      }
      
      return children;
    } catch (error) {
      this.logger.error(`Error getting child categories: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Move a category to a new parent
   * @param categoryId The ID of the category to move
   * @param newParentId The ID of the new parent category (undefined for root)
   */
  async moveCategory(categoryId: string, newParentId?: string): Promise<Category> {
    try {
      this.logger.debug(`Moving category ${categoryId} to parent ${newParentId || 'root'}`);
      
      // Update the category
      return await this.updateCategory(categoryId, { parent: newParentId });
    } catch (error) {
      this.logger.error(`Error moving category: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to move category: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}