/**
 * Relationship Generator Implementation
 * Creates and manages relationships between categories
 */

import { 
  Category, 
  CategoryManager, 
  CategoryRelationship, 
  RelationshipGraph, 
  RelationshipType 
} from './interfaces.js';
import { Logger } from '../../utils/logger.js';

/**
 * Implementation of RelationshipGraph for managing category relationships
 */
export class RelationshipGenerator implements RelationshipGraph {
  private logger: Logger;
  private categoryManager: CategoryManager;
  private relationships: CategoryRelationship[];

  constructor(categoryManager: CategoryManager) {
    this.logger = new Logger('RelationshipGenerator');
    this.categoryManager = categoryManager;
    this.relationships = [];
  }

  /**
   * Add a relationship between categories
   * @param relationship The relationship to add
   */
  async addRelationship(relationship: CategoryRelationship): Promise<void> {
    try {
      this.logger.debug(`Adding relationship: ${relationship.sourceId} -> ${relationship.targetId}`);
      
      // Validate that both categories exist
      const sourceCategory = await this.categoryManager.getCategory(relationship.sourceId);
      const targetCategory = await this.categoryManager.getCategory(relationship.targetId);
      
      if (!sourceCategory) {
        throw new Error(`Source category not found: ${relationship.sourceId}`);
      }
      
      if (!targetCategory) {
        throw new Error(`Target category not found: ${relationship.targetId}`);
      }
      
      // Check if relationship already exists
      const existingIndex = this.relationships.findIndex(r => 
        r.sourceId === relationship.sourceId && 
        r.targetId === relationship.targetId && 
        r.type === relationship.type
      );
      
      if (existingIndex >= 0) {
        // Update existing relationship
        this.relationships[existingIndex] = relationship;
      } else {
        // Add new relationship
        this.relationships.push(relationship);
        
        // If the relationship is bidirectional, add reverse relationship
        if (relationship.type === RelationshipType.RELATED || 
            relationship.type === RelationshipType.SIMILAR) {
          
          const reverseRelationship: CategoryRelationship = {
            sourceId: relationship.targetId,
            targetId: relationship.sourceId,
            type: relationship.type,
            strength: relationship.strength,
            metadata: relationship.metadata
          };
          
          // Check if reverse relationship already exists
          const reverseIndex = this.relationships.findIndex(r => 
            r.sourceId === reverseRelationship.sourceId && 
            r.targetId === reverseRelationship.targetId && 
            r.type === reverseRelationship.type
          );
          
          if (reverseIndex >= 0) {
            // Update existing reverse relationship
            this.relationships[reverseIndex] = reverseRelationship;
          } else {
            // Add new reverse relationship
            this.relationships.push(reverseRelationship);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error adding relationship: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to add relationship: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get relationships for a category
   * @param categoryId The ID of the category
   * @param type Optional filter by relationship type
   */
  async getRelationshipsForCategory(categoryId: string, type?: RelationshipType): Promise<CategoryRelationship[]> {
    try {
      this.logger.debug(`Getting relationships for category: ${categoryId}`);
      
      // Get relationships where this category is the source
      let relations = this.relationships.filter(r => r.sourceId === categoryId);
      
      // Filter by type if specified
      if (type) {
        relations = relations.filter(r => r.type === type);
      }
      
      // Sort by strength descending
      return relations.sort((a, b) => b.strength - a.strength);
    } catch (error) {
      this.logger.error(`Error getting relationships for category: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Find the shortest path between categories
   * @param sourceId The source category ID
   * @param targetId The target category ID
   */
  async findPath(sourceId: string, targetId: string): Promise<CategoryRelationship[]> {
    try {
      this.logger.debug(`Finding path between categories: ${sourceId} -> ${targetId}`);
      
      // Use breadth-first search to find the shortest path
      const queue: Array<{ id: string; path: CategoryRelationship[] }> = [{ id: sourceId, path: [] }];
      const visited = new Set<string>([sourceId]);
      
      while (queue.length > 0) {
        const { id, path } = queue.shift()!;
        
        // Get relationships for this category
        const relationships = this.relationships.filter(r => r.sourceId === id);
        
        for (const relationship of relationships) {
          if (relationship.targetId === targetId) {
            // Found the target
            return [...path, relationship];
          }
          
          if (!visited.has(relationship.targetId)) {
            // Add to queue
            visited.add(relationship.targetId);
            queue.push({
              id: relationship.targetId,
              path: [...path, relationship]
            });
          }
        }
      }
      
      // No path found
      return [];
    } catch (error) {
      this.logger.error(`Error finding path between categories: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Get visualization data for the graph
   */
  async getGraphData(): Promise<{
    nodes: Array<{ id: string; label: string; data: Category }>;
    edges: Array<{ source: string; target: string; label: string; data: CategoryRelationship }>;
  }> {
    try {
      this.logger.debug('Getting graph visualization data');
      
      // Get all categories
      const categories = await this.categoryManager.getCategories();
      const nodes: Array<{ id: string; label: string; data: Category }> = [];
      
      // Create nodes
      for (const category of categories) {
        nodes.push({
          id: category.id,
          label: category.name,
          data: category
        });
      }
      
      // Create edges
      const edges: Array<{ source: string; target: string; label: string; data: CategoryRelationship }> = [];
      
      for (const relationship of this.relationships) {
        // Only include one direction for bidirectional relationships
        if (relationship.type === RelationshipType.RELATED || 
            relationship.type === RelationshipType.SIMILAR) {
          
          const existingEdge = edges.find(e => 
            (e.source === relationship.sourceId && e.target === relationship.targetId) ||
            (e.source === relationship.targetId && e.target === relationship.sourceId)
          );
          
          if (existingEdge) {
            continue;
          }
        }
        
        // Create edge label based on relationship type
        let label = '';
        switch (relationship.type) {
          case RelationshipType.PARENT_CHILD:
            label = 'parent_of';
            break;
          case RelationshipType.RELATED:
            label = 'related_to';
            break;
          case RelationshipType.SIMILAR:
            label = 'similar_to';
            break;
          case RelationshipType.CONTRASTING:
            label = 'contrasts_with';
            break;
        }
        
        edges.push({
          source: relationship.sourceId,
          target: relationship.targetId,
          label,
          data: relationship
        });
      }
      
      return { nodes, edges };
    } catch (error) {
      this.logger.error(`Error getting graph data: ${error instanceof Error ? error.message : String(error)}`);
      return { nodes: [], edges: [] };
    }
  }

  /**
   * Calculate similarity between two categories
   * @param categoryId1 First category ID
   * @param categoryId2 Second category ID
   */
  async calculateSimilarity(categoryId1: string, categoryId2: string): Promise<number> {
    try {
      this.logger.debug(`Calculating similarity between categories: ${categoryId1} and ${categoryId2}`);
      
      const category1 = await this.categoryManager.getCategory(categoryId1);
      const category2 = await this.categoryManager.getCategory(categoryId2);
      
      if (!category1 || !category2) {
        return 0;
      }
      
      // Calculate name similarity
      const name1 = category1.name.toLowerCase();
      const name2 = category2.name.toLowerCase();
      
      let nameSimilarity = 0;
      if (name1 === name2) {
        nameSimilarity = 1.0;
      } else if (name1.includes(name2) || name2.includes(name1)) {
        nameSimilarity = 0.7;
      } else {
        // Calculate token overlap
        const tokens1 = new Set(this.tokenize(name1));
        const tokens2 = new Set(this.tokenize(name2));
        
        const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
        const union = new Set([...tokens1, ...tokens2]);
        
        nameSimilarity = intersection.size / union.size;
      }
      
      // Calculate description similarity if available
      let descriptionSimilarity = 0;
      if (category1.description && category2.description) {
        const desc1 = category1.description.toLowerCase();
        const desc2 = category2.description.toLowerCase();
        
        const tokens1 = new Set(this.tokenize(desc1));
        const tokens2 = new Set(this.tokenize(desc2));
        
        const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
        const union = new Set([...tokens1, ...tokens2]);
        
        descriptionSimilarity = intersection.size / union.size;
      }
      
      // Check if they have a parent-child relationship
      const isParentChild = 
        category1.parent === categoryId2 || 
        category2.parent === categoryId1 || 
        (category1.children && category1.children.includes(categoryId2)) || 
        (category2.children && category2.children.includes(categoryId1));
      
      const parentChildBonus = isParentChild ? 0.3 : 0;
      
      // Check if they have the same parent
      const sameParent = 
        category1.parent && 
        category2.parent && 
        category1.parent === category2.parent;
      
      const sameParentBonus = sameParent ? 0.2 : 0;
      
      // Calculate overall similarity
      const similarity = (nameSimilarity * 0.6) + 
                         (descriptionSimilarity * 0.2) + 
                         parentChildBonus + 
                         sameParentBonus;
      
      return Math.min(1.0, similarity);
    } catch (error) {
      this.logger.error(`Error calculating category similarity: ${error instanceof Error ? error.message : String(error)}`);
      return 0;
    }
  }

  /**
   * Generate relationships between all categories
   */
  async generateAllRelationships(): Promise<void> {
    try {
      this.logger.debug('Generating relationships between all categories');
      
      // Get all categories
      const categories = await this.categoryManager.getCategories();
      
      // Process parent-child relationships
      for (const category of categories) {
        if (category.parent) {
          await this.addRelationship({
            sourceId: category.parent,
            targetId: category.id,
            type: RelationshipType.PARENT_CHILD,
            strength: 1.0
          });
        }
        
        if (category.children && category.children.length > 0) {
          for (const childId of category.children) {
            await this.addRelationship({
              sourceId: category.id,
              targetId: childId,
              type: RelationshipType.PARENT_CHILD,
              strength: 1.0
            });
          }
        }
      }
      
      // Generate similarity relationships
      for (let i = 0; i < categories.length; i++) {
        for (let j = i + 1; j < categories.length; j++) {
          const similarity = await this.calculateSimilarity(categories[i].id, categories[j].id);
          
          if (similarity > 0.5) {
            await this.addRelationship({
              sourceId: categories[i].id,
              targetId: categories[j].id,
              type: RelationshipType.SIMILAR,
              strength: similarity
            });
          } else if (similarity > 0.3) {
            await this.addRelationship({
              sourceId: categories[i].id,
              targetId: categories[j].id,
              type: RelationshipType.RELATED,
              strength: similarity
            });
          }
        }
      }
      
      this.logger.debug(`Generated ${this.relationships.length} relationships for ${categories.length} categories`);
    } catch (error) {
      this.logger.error(`Error generating relationships: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Tokenize text into normalized tokens
   * @param text Text to tokenize
   */
  private tokenize(text: string): string[] {
    // Common stop words to filter out
    const stopWords = new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'when',
      'at', 'from', 'by', 'on', 'off', 'for', 'in', 'out', 'over', 'to',
      'into', 'with', 'about', 'against', 'between', 'into', 'through',
      'during', 'before', 'after', 'above', 'below', 'up', 'down', 'of'
    ]);
    
    // Tokenize (split into words)
    const tokens = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .split(/\s+/) // Split by whitespace
      .filter(token => token.length > 2 && !stopWords.has(token)); // Remove stop words and short tokens
    
    return tokens;
  }
}