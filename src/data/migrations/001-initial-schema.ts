/**
 * Initial Database Schema Migration
 * Creates the initial database tables
 */

import { DatabaseConnection, Migration } from '../interfaces.js';

const migration: Migration = {
  id: '001',
  name: 'Initial Schema',
  
  /**
   * Apply the migration
   * @param connection The database connection
   */
  async up(connection: DatabaseConnection): Promise<void> {
    const knex = connection.getConnection();
    
    // Create users table
    await knex.schema.createTable('users', (table) => {
      table.string('id').primary();
      table.string('email').notNullable().unique();
      table.string('name');
      table.text('preferences_json');
      table.timestamp('created_at').notNullable();
      table.timestamp('updated_at');
      
      // Indexes
      table.index('email');
    });
    
    // Create newsletters table
    await knex.schema.createTable('newsletters', (table) => {
      table.string('id').primary();
      table.string('email_id').notNullable();
      table.string('subject').notNullable();
      table.string('sender').notNullable();
      table.timestamp('received_date').notNullable();
      table.text('content_html');
      table.text('content_text');
      table.text('processed_content_json');
      table.text('metadata_json');
      table.float('detection_confidence').notNullable().defaultTo(0);
      table.boolean('is_verified').notNullable().defaultTo(false);
      table.timestamp('created_at').notNullable();
      table.timestamp('updated_at');
      
      // Indexes
      table.index('email_id');
      table.index('sender');
      table.index('received_date');
    });
    
    // Create categories table
    await knex.schema.createTable('categories', (table) => {
      table.string('id').primary();
      table.string('name').notNullable();
      table.text('description');
      table.string('parent_id').references('id').inTable('categories').onDelete('SET NULL');
      table.string('icon');
      table.timestamp('created_at').notNullable();
      table.timestamp('updated_at');
      
      // Indexes
      table.index('name');
      table.index('parent_id');
    });
    
    // Create category_assignments table
    await knex.schema.createTable('category_assignments', (table) => {
      table.string('id').primary();
      table.string('newsletter_id').notNullable().references('id').inTable('newsletters').onDelete('CASCADE');
      table.string('category_id').notNullable().references('id').inTable('categories').onDelete('CASCADE');
      table.float('confidence').notNullable().defaultTo(0);
      table.boolean('is_manual').notNullable().defaultTo(false);
      table.timestamp('created_at').notNullable();
      table.timestamp('updated_at');
      
      // Indexes
      table.index('newsletter_id');
      table.index('category_id');
      table.unique(['newsletter_id', 'category_id']);
    });
    
    // Create feedback table
    await knex.schema.createTable('feedback', (table) => {
      table.string('id').primary();
      table.string('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('newsletter_id').notNullable().references('id').inTable('newsletters').onDelete('CASCADE');
      table.string('feedback_type').notNullable();
      table.text('comment');
      table.timestamp('created_at').notNullable();
      table.timestamp('updated_at');
      
      // Indexes
      table.index('user_id');
      table.index('newsletter_id');
      table.index('feedback_type');
    });
    
    // Create digests table
    await knex.schema.createTable('digests', (table) => {
      table.string('id').primary();
      table.string('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('digest_type').notNullable();
      table.timestamp('generation_date').notNullable();
      table.string('delivery_status').notNullable();
      table.timestamp('opened_at');
      table.timestamp('created_at').notNullable();
      table.timestamp('updated_at');
      
      // Indexes
      table.index('user_id');
      table.index('digest_type');
      table.index('generation_date');
      table.index('delivery_status');
    });
    
    // Create digest_items table
    await knex.schema.createTable('digest_items', (table) => {
      table.string('id').primary();
      table.string('digest_id').notNullable().references('id').inTable('digests').onDelete('CASCADE');
      table.string('newsletter_id').notNullable().references('id').inTable('newsletters').onDelete('CASCADE');
      table.integer('position').notNullable();
      table.timestamp('created_at').notNullable();
      table.timestamp('updated_at');
      
      // Indexes
      table.index('digest_id');
      table.index('newsletter_id');
      table.unique(['digest_id', 'newsletter_id']);
    });
    
    // Create user_preferences table
    await knex.schema.createTable('user_preferences', (table) => {
      table.string('id').primary();
      table.string('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('preference_key').notNullable();
      table.text('preference_value').notNullable();
      table.timestamp('created_at').notNullable();
      table.timestamp('updated_at');
      
      // Indexes
      table.index('user_id');
      table.unique(['user_id', 'preference_key']);
    });
  },
  
  /**
   * Revert the migration
   * @param connection The database connection
   */
  async down(connection: DatabaseConnection): Promise<void> {
    const knex = connection.getConnection();
    
    // Drop tables in reverse order of creation (to handle foreign key constraints)
    await knex.schema.dropTableIfExists('user_preferences');
    await knex.schema.dropTableIfExists('digest_items');
    await knex.schema.dropTableIfExists('digests');
    await knex.schema.dropTableIfExists('feedback');
    await knex.schema.dropTableIfExists('category_assignments');
    await knex.schema.dropTableIfExists('categories');
    await knex.schema.dropTableIfExists('newsletters');
    await knex.schema.dropTableIfExists('users');
  }
};

export default migration;