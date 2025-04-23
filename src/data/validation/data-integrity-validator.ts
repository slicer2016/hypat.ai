/**
 * Data Integrity Validator Implementation
 * Validates data integrity and relationships between entities
 */

import { 
  DataIntegrityValidator, 
  DatabaseConnection, 
  Entity, 
  ValidationResult, 
  ValidationIssue 
} from '../interfaces.js';
import { Logger } from '../../utils/logger.js';

/**
 * Implementation of the DataIntegrityValidator interface
 */
export class DataIntegrityValidatorImpl implements DataIntegrityValidator {
  private connection: DatabaseConnection;
  private logger: Logger;
  private validators: Map<string, (entity: any) => Promise<ValidationResult>> = new Map();
  private relationshipValidators: Map<string, (entity: any, relationships: Record<string, any>) => Promise<ValidationResult>> = new Map();
  private orphanCheckers: Array<() => Promise<ValidationResult[]>> = [];
  
  constructor(connection: DatabaseConnection) {
    this.connection = connection;
    this.logger = new Logger('DataIntegrityValidator');
    
    // Register entity validators
    this.registerValidators();
    
    // Register relationship validators
    this.registerRelationshipValidators();
    
    // Register orphan checkers
    this.registerOrphanCheckers();
  }
  
  /**
   * Validate an entity
   * @param entity The entity to validate
   */
  async validate<T extends Entity>(entity: T): Promise<ValidationResult> {
    try {
      const entityName = entity.constructor.name;
      const validator = this.validators.get(entityName);
      
      if (!validator) {
        return { valid: true, issues: [] };
      }
      
      return await validator(entity);
    } catch (error) {
      this.logger.error(`Error validating entity: ${error instanceof Error ? error.message : String(error)}`);
      return {
        valid: false,
        issues: [{
          entity: entity.constructor.name,
          entityId: entity.id,
          issueType: 'integrity',
          message: `Validation error: ${error instanceof Error ? error.message : String(error)}`,
          severity: 'error'
        }]
      };
    }
  }
  
  /**
   * Validate relationships between entities
   * @param entity The entity to validate
   * @param relationships The relationships to validate
   */
  async validateRelationships<T extends Entity>(
    entity: T,
    relationships: Record<string, any>
  ): Promise<ValidationResult> {
    try {
      const entityName = entity.constructor.name;
      const validator = this.relationshipValidators.get(entityName);
      
      if (!validator) {
        return { valid: true, issues: [] };
      }
      
      return await validator(entity, relationships);
    } catch (error) {
      this.logger.error(`Error validating relationships: ${error instanceof Error ? error.message : String(error)}`);
      return {
        valid: false,
        issues: [{
          entity: entity.constructor.name,
          entityId: entity.id,
          issueType: 'integrity',
          message: `Relationship validation error: ${error instanceof Error ? error.message : String(error)}`,
          severity: 'error'
        }]
      };
    }
  }
  
  /**
   * Check for orphaned records
   */
  async checkOrphanedRecords(): Promise<ValidationResult[]> {
    try {
      const results: ValidationResult[] = [];
      
      for (const checker of this.orphanCheckers) {
        const checkerResults = await checker();
        results.push(...checkerResults);
      }
      
      return results;
    } catch (error) {
      this.logger.error(`Error checking orphaned records: ${error instanceof Error ? error.message : String(error)}`);
      return [{
        valid: false,
        issues: [{
          entity: 'unknown',
          issueType: 'orphaned',
          message: `Orphan check error: ${error instanceof Error ? error.message : String(error)}`,
          severity: 'error'
        }]
      }];
    }
  }
  
  /**
   * Run all integrity checks
   */
  async runIntegrityChecks(): Promise<{
    valid: boolean;
    issues: ValidationIssue[];
  }> {
    try {
      this.logger.info('Running integrity checks');
      
      const allIssues: ValidationIssue[] = [];
      
      // Check for orphaned records
      const orphanResults = await this.checkOrphanedRecords();
      
      for (const result of orphanResults) {
        if (!result.valid) {
          allIssues.push(...result.issues);
        }
      }
      
      // Check entity integrity for each table
      const entityIntegrityIssues = await this.checkEntityIntegrity();
      allIssues.push(...entityIntegrityIssues);
      
      // Check relationship integrity
      const relationshipIntegrityIssues = await this.checkRelationshipIntegrity();
      allIssues.push(...relationshipIntegrityIssues);
      
      return {
        valid: allIssues.length === 0,
        issues: allIssues
      };
    } catch (error) {
      this.logger.error(`Error running integrity checks: ${error instanceof Error ? error.message : String(error)}`);
      return {
        valid: false,
        issues: [{
          entity: 'unknown',
          issueType: 'integrity',
          message: `Integrity check error: ${error instanceof Error ? error.message : String(error)}`,
          severity: 'error'
        }]
      };
    }
  }
  
  /**
   * Check entity integrity for all entities
   */
  private async checkEntityIntegrity(): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    const knex = this.connection.getConnection();
    
    try {
      // Check users table
      const users = await knex('users').select('*');
      for (const user of users) {
        // Check required fields
        if (!user.email) {
          issues.push({
            entity: 'UserEntity',
            entityId: user.id,
            field: 'email',
            issueType: 'missing_required',
            message: 'User email is required',
            severity: 'error'
          });
        }
      }
      
      // Check newsletters table
      const newsletters = await knex('newsletters').select('*');
      for (const newsletter of newsletters) {
        // Check required fields
        if (!newsletter.email_id) {
          issues.push({
            entity: 'NewsletterEntity',
            entityId: newsletter.id,
            field: 'emailId',
            issueType: 'missing_required',
            message: 'Newsletter emailId is required',
            severity: 'error'
          });
        }
        
        if (!newsletter.subject) {
          issues.push({
            entity: 'NewsletterEntity',
            entityId: newsletter.id,
            field: 'subject',
            issueType: 'missing_required',
            message: 'Newsletter subject is required',
            severity: 'error'
          });
        }
        
        if (!newsletter.sender) {
          issues.push({
            entity: 'NewsletterEntity',
            entityId: newsletter.id,
            field: 'sender',
            issueType: 'missing_required',
            message: 'Newsletter sender is required',
            severity: 'error'
          });
        }
      }
      
      // Check categories table
      const categories = await knex('categories').select('*');
      for (const category of categories) {
        // Check required fields
        if (!category.name) {
          issues.push({
            entity: 'CategoryEntity',
            entityId: category.id,
            field: 'name',
            issueType: 'missing_required',
            message: 'Category name is required',
            severity: 'error'
          });
        }
      }
      
      return issues;
    } catch (error) {
      this.logger.error(`Error checking entity integrity: ${error instanceof Error ? error.message : String(error)}`);
      issues.push({
        entity: 'unknown',
        issueType: 'integrity',
        message: `Entity integrity check error: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'error'
      });
      
      return issues;
    }
  }
  
  /**
   * Check relationship integrity
   */
  private async checkRelationshipIntegrity(): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    const knex = this.connection.getConnection();
    
    try {
      // Check category_assignments relationships
      const categoryAssignments = await knex('category_assignments').select('*');
      const newsletterIds = new Set(await knex('newsletters').select('id').then(rows => rows.map(r => r.id)));
      const categoryIds = new Set(await knex('categories').select('id').then(rows => rows.map(r => r.id)));
      
      for (const assignment of categoryAssignments) {
        // Check if newsletter exists
        if (!newsletterIds.has(assignment.newsletter_id)) {
          issues.push({
            entity: 'CategoryAssignmentEntity',
            entityId: assignment.id,
            field: 'newsletterId',
            relationship: 'newsletter',
            issueType: 'integrity',
            message: `Newsletter with ID ${assignment.newsletter_id} does not exist`,
            severity: 'error'
          });
        }
        
        // Check if category exists
        if (!categoryIds.has(assignment.category_id)) {
          issues.push({
            entity: 'CategoryAssignmentEntity',
            entityId: assignment.id,
            field: 'categoryId',
            relationship: 'category',
            issueType: 'integrity',
            message: `Category with ID ${assignment.category_id} does not exist`,
            severity: 'error'
          });
        }
      }
      
      // Check feedback relationships
      const feedback = await knex('feedback').select('*');
      const userIds = new Set(await knex('users').select('id').then(rows => rows.map(r => r.id)));
      
      for (const item of feedback) {
        // Check if user exists
        if (!userIds.has(item.user_id)) {
          issues.push({
            entity: 'FeedbackEntity',
            entityId: item.id,
            field: 'userId',
            relationship: 'user',
            issueType: 'integrity',
            message: `User with ID ${item.user_id} does not exist`,
            severity: 'error'
          });
        }
        
        // Check if newsletter exists
        if (!newsletterIds.has(item.newsletter_id)) {
          issues.push({
            entity: 'FeedbackEntity',
            entityId: item.id,
            field: 'newsletterId',
            relationship: 'newsletter',
            issueType: 'integrity',
            message: `Newsletter with ID ${item.newsletter_id} does not exist`,
            severity: 'error'
          });
        }
      }
      
      // Check digest relationships
      const digests = await knex('digests').select('*');
      
      for (const digest of digests) {
        // Check if user exists
        if (!userIds.has(digest.user_id)) {
          issues.push({
            entity: 'DigestEntity',
            entityId: digest.id,
            field: 'userId',
            relationship: 'user',
            issueType: 'integrity',
            message: `User with ID ${digest.user_id} does not exist`,
            severity: 'error'
          });
        }
      }
      
      // Check digest_items relationships
      const digestItems = await knex('digest_items').select('*');
      const digestIds = new Set(digests.map(d => d.id));
      
      for (const item of digestItems) {
        // Check if digest exists
        if (!digestIds.has(item.digest_id)) {
          issues.push({
            entity: 'DigestItemEntity',
            entityId: item.id,
            field: 'digestId',
            relationship: 'digest',
            issueType: 'integrity',
            message: `Digest with ID ${item.digest_id} does not exist`,
            severity: 'error'
          });
        }
        
        // Check if newsletter exists
        if (!newsletterIds.has(item.newsletter_id)) {
          issues.push({
            entity: 'DigestItemEntity',
            entityId: item.id,
            field: 'newsletterId',
            relationship: 'newsletter',
            issueType: 'integrity',
            message: `Newsletter with ID ${item.newsletter_id} does not exist`,
            severity: 'error'
          });
        }
      }
      
      // Check user_preferences relationships
      const userPreferences = await knex('user_preferences').select('*');
      
      for (const pref of userPreferences) {
        // Check if user exists
        if (!userIds.has(pref.user_id)) {
          issues.push({
            entity: 'UserPreferenceEntity',
            entityId: pref.id,
            field: 'userId',
            relationship: 'user',
            issueType: 'integrity',
            message: `User with ID ${pref.user_id} does not exist`,
            severity: 'error'
          });
        }
      }
      
      return issues;
    } catch (error) {
      this.logger.error(`Error checking relationship integrity: ${error instanceof Error ? error.message : String(error)}`);
      issues.push({
        entity: 'unknown',
        issueType: 'integrity',
        message: `Relationship integrity check error: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'error'
      });
      
      return issues;
    }
  }
  
  /**
   * Register entity validators
   */
  private registerValidators(): void {
    // User validator
    this.validators.set('UserEntity', async (entity: any) => {
      const issues: ValidationIssue[] = [];
      
      // Check required fields
      if (!entity.email) {
        issues.push({
          entity: 'UserEntity',
          entityId: entity.id,
          field: 'email',
          issueType: 'missing_required',
          message: 'User email is required',
          severity: 'error'
        });
      }
      
      return {
        valid: issues.length === 0,
        issues
      };
    });
    
    // Newsletter validator
    this.validators.set('NewsletterEntity', async (entity: any) => {
      const issues: ValidationIssue[] = [];
      
      // Check required fields
      if (!entity.emailId) {
        issues.push({
          entity: 'NewsletterEntity',
          entityId: entity.id,
          field: 'emailId',
          issueType: 'missing_required',
          message: 'Newsletter emailId is required',
          severity: 'error'
        });
      }
      
      if (!entity.subject) {
        issues.push({
          entity: 'NewsletterEntity',
          entityId: entity.id,
          field: 'subject',
          issueType: 'missing_required',
          message: 'Newsletter subject is required',
          severity: 'error'
        });
      }
      
      if (!entity.sender) {
        issues.push({
          entity: 'NewsletterEntity',
          entityId: entity.id,
          field: 'sender',
          issueType: 'missing_required',
          message: 'Newsletter sender is required',
          severity: 'error'
        });
      }
      
      return {
        valid: issues.length === 0,
        issues
      };
    });
    
    // Category validator
    this.validators.set('CategoryEntity', async (entity: any) => {
      const issues: ValidationIssue[] = [];
      
      // Check required fields
      if (!entity.name) {
        issues.push({
          entity: 'CategoryEntity',
          entityId: entity.id,
          field: 'name',
          issueType: 'missing_required',
          message: 'Category name is required',
          severity: 'error'
        });
      }
      
      return {
        valid: issues.length === 0,
        issues
      };
    });
  }
  
  /**
   * Register relationship validators
   */
  private registerRelationshipValidators(): void {
    // Newsletter relationships validator
    this.relationshipValidators.set('NewsletterEntity', async (entity: any, relationships: any) => {
      const issues: ValidationIssue[] = [];
      const knex = this.connection.getConnection();
      
      // Check if categories exist
      if (relationships.categories && Array.isArray(relationships.categories)) {
        const categoryIds = relationships.categories.map((c: any) => c.id);
        
        if (categoryIds.length > 0) {
          const existingCategories = await knex('categories')
            .whereIn('id', categoryIds)
            .select('id');
          
          const existingIds = new Set(existingCategories.map(c => c.id));
          
          for (const categoryId of categoryIds) {
            if (!existingIds.has(categoryId)) {
              issues.push({
                entity: 'NewsletterEntity',
                entityId: entity.id,
                relationship: 'categories',
                issueType: 'integrity',
                message: `Category with ID ${categoryId} does not exist`,
                severity: 'error'
              });
            }
          }
        }
      }
      
      return {
        valid: issues.length === 0,
        issues
      };
    });
    
    // Category relationships validator
    this.relationshipValidators.set('CategoryEntity', async (entity: any, relationships: any) => {
      const issues: ValidationIssue[] = [];
      const knex = this.connection.getConnection();
      
      // Check if parent exists
      if (entity.parentId) {
        const parentExists = await knex('categories')
          .where('id', entity.parentId)
          .first();
        
        if (!parentExists) {
          issues.push({
            entity: 'CategoryEntity',
            entityId: entity.id,
            field: 'parentId',
            relationship: 'parent',
            issueType: 'integrity',
            message: `Parent category with ID ${entity.parentId} does not exist`,
            severity: 'error'
          });
        }
      }
      
      return {
        valid: issues.length === 0,
        issues
      };
    });
  }
  
  /**
   * Register orphan checkers
   */
  private registerOrphanCheckers(): void {
    // Check for orphaned category assignments
    this.orphanCheckers.push(async () => {
      const issues: ValidationIssue[] = [];
      const knex = this.connection.getConnection();
      
      try {
        // Find category assignments with non-existent newsletters
        const orphanedByNewsletter = await knex('category_assignments as ca')
          .leftJoin('newsletters as n', 'ca.newsletter_id', 'n.id')
          .whereNull('n.id')
          .select('ca.*');
        
        for (const orphan of orphanedByNewsletter) {
          issues.push({
            entity: 'CategoryAssignmentEntity',
            entityId: orphan.id,
            field: 'newsletterId',
            relationship: 'newsletter',
            issueType: 'orphaned',
            message: `Category assignment references non-existent newsletter ID: ${orphan.newsletter_id}`,
            severity: 'warning'
          });
        }
        
        // Find category assignments with non-existent categories
        const orphanedByCategory = await knex('category_assignments as ca')
          .leftJoin('categories as c', 'ca.category_id', 'c.id')
          .whereNull('c.id')
          .select('ca.*');
        
        for (const orphan of orphanedByCategory) {
          issues.push({
            entity: 'CategoryAssignmentEntity',
            entityId: orphan.id,
            field: 'categoryId',
            relationship: 'category',
            issueType: 'orphaned',
            message: `Category assignment references non-existent category ID: ${orphan.category_id}`,
            severity: 'warning'
          });
        }
        
        return [{
          valid: issues.length === 0,
          issues
        }];
      } catch (error) {
        this.logger.error(`Error checking for orphaned category assignments: ${error instanceof Error ? error.message : String(error)}`);
        return [{
          valid: false,
          issues: [{
            entity: 'CategoryAssignmentEntity',
            issueType: 'orphaned',
            message: `Error checking for orphaned category assignments: ${error instanceof Error ? error.message : String(error)}`,
            severity: 'error'
          }]
        }];
      }
    });
    
    // Check for orphaned feedback
    this.orphanCheckers.push(async () => {
      const issues: ValidationIssue[] = [];
      const knex = this.connection.getConnection();
      
      try {
        // Find feedback with non-existent users
        const orphanedByUser = await knex('feedback as f')
          .leftJoin('users as u', 'f.user_id', 'u.id')
          .whereNull('u.id')
          .select('f.*');
        
        for (const orphan of orphanedByUser) {
          issues.push({
            entity: 'FeedbackEntity',
            entityId: orphan.id,
            field: 'userId',
            relationship: 'user',
            issueType: 'orphaned',
            message: `Feedback references non-existent user ID: ${orphan.user_id}`,
            severity: 'warning'
          });
        }
        
        // Find feedback with non-existent newsletters
        const orphanedByNewsletter = await knex('feedback as f')
          .leftJoin('newsletters as n', 'f.newsletter_id', 'n.id')
          .whereNull('n.id')
          .select('f.*');
        
        for (const orphan of orphanedByNewsletter) {
          issues.push({
            entity: 'FeedbackEntity',
            entityId: orphan.id,
            field: 'newsletterId',
            relationship: 'newsletter',
            issueType: 'orphaned',
            message: `Feedback references non-existent newsletter ID: ${orphan.newsletter_id}`,
            severity: 'warning'
          });
        }
        
        return [{
          valid: issues.length === 0,
          issues
        }];
      } catch (error) {
        this.logger.error(`Error checking for orphaned feedback: ${error instanceof Error ? error.message : String(error)}`);
        return [{
          valid: false,
          issues: [{
            entity: 'FeedbackEntity',
            issueType: 'orphaned',
            message: `Error checking for orphaned feedback: ${error instanceof Error ? error.message : String(error)}`,
            severity: 'error'
          }]
        }];
      }
    });
  }
}