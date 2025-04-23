/**
 * Migration Manager Implementation
 * Manages database schema migrations
 */

import path from 'path';
import fs from 'fs';
import { 
  DatabaseConnection, 
  Migration, 
  MigrationManager 
} from '../interfaces.js';
import { Logger } from '../../utils/logger.js';

/**
 * Implementation of the MigrationManager interface
 */
export class MigrationManagerImpl implements MigrationManager {
  private migrations: Migration[] = [];
  private connection: DatabaseConnection;
  private logger: Logger;
  
  constructor(connection: DatabaseConnection) {
    this.connection = connection;
    this.logger = new Logger('MigrationManager');
  }
  
  /**
   * Load migrations from a directory
   * @param directory The directory containing migration files
   */
  async loadMigrations(directory: string): Promise<void> {
    try {
      this.logger.info(`Loading migrations from directory: ${directory}`);
      
      // Ensure the directory exists
      if (!fs.existsSync(directory)) {
        this.logger.warn(`Migrations directory does not exist: ${directory}`);
        return;
      }
      
      // Get all JavaScript/TypeScript files in the directory
      const files = fs.readdirSync(directory)
        .filter(file => file.endsWith('.js') || file.endsWith('.ts'))
        .sort();
      
      // Load each migration
      for (const file of files) {
        const filePath = path.join(directory, file);
        
        try {
          // Import the migration module
          const migrationModule = await import(filePath);
          
          // Check if the module exports a Migration
          if (typeof migrationModule.default?.up === 'function' && 
              typeof migrationModule.default?.down === 'function' &&
              typeof migrationModule.default?.id === 'string' &&
              typeof migrationModule.default?.name === 'string') {
            this.migrations.push(migrationModule.default);
            this.logger.info(`Loaded migration: ${migrationModule.default.name} (${migrationModule.default.id})`);
          } else {
            this.logger.warn(`Invalid migration format in file: ${file}`);
          }
        } catch (error) {
          this.logger.error(`Error loading migration from file ${file}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      // Sort migrations by ID
      this.migrations.sort((a, b) => a.id.localeCompare(b.id));
      
      this.logger.info(`Loaded ${this.migrations.length} migrations`);
    } catch (error) {
      this.logger.error(`Error loading migrations: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get all available migrations
   */
  getMigrations(): Migration[] {
    return this.migrations;
  }
  
  /**
   * Apply all pending migrations
   */
  async migrate(): Promise<void> {
    try {
      this.logger.info('Running migrations');
      
      // Get applied migrations
      const appliedMigrations = await this.getAppliedMigrations();
      const appliedIds = new Set(appliedMigrations.map(m => m.id));
      
      // Filter pending migrations
      const pendingMigrations = this.migrations.filter(m => !appliedIds.has(m.id));
      
      if (pendingMigrations.length === 0) {
        this.logger.info('No pending migrations');
        return;
      }
      
      this.logger.info(`Found ${pendingMigrations.length} pending migrations`);
      
      // Apply each pending migration
      for (const migration of pendingMigrations) {
        this.logger.info(`Applying migration: ${migration.name} (${migration.id})`);
        
        try {
          // Run the migration
          await migration.up(this.connection);
          
          // Record the migration
          await this.recordMigration(migration.id, migration.name);
          
          this.logger.info(`Migration applied successfully: ${migration.name} (${migration.id})`);
        } catch (error) {
          this.logger.error(`Error applying migration ${migration.name} (${migration.id}): ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      }
      
      this.logger.info(`Applied ${pendingMigrations.length} migrations`);
    } catch (error) {
      this.logger.error(`Error running migrations: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Rollback the most recent migration
   */
  async rollback(): Promise<void> {
    try {
      this.logger.info('Rolling back the most recent migration');
      
      // Get applied migrations
      const appliedMigrations = await this.getAppliedMigrations();
      
      if (appliedMigrations.length === 0) {
        this.logger.info('No migrations to roll back');
        return;
      }
      
      // Get the most recent migration
      const latestMigration = appliedMigrations[appliedMigrations.length - 1];
      
      // Find the migration in our loaded migrations
      const migration = this.migrations.find(m => m.id === latestMigration.id);
      
      if (!migration) {
        throw new Error(`Migration not found: ${latestMigration.id}`);
      }
      
      this.logger.info(`Rolling back migration: ${migration.name} (${migration.id})`);
      
      try {
        // Run the down migration
        await migration.down(this.connection);
        
        // Remove the migration record
        await this.removeMigration(migration.id);
        
        this.logger.info(`Migration rolled back successfully: ${migration.name} (${migration.id})`);
      } catch (error) {
        this.logger.error(`Error rolling back migration ${migration.name} (${migration.id}): ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    } catch (error) {
      this.logger.error(`Error rolling back migration: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Rollback all migrations
   */
  async reset(): Promise<void> {
    try {
      this.logger.info('Resetting all migrations');
      
      // Get applied migrations
      const appliedMigrations = await this.getAppliedMigrations();
      
      if (appliedMigrations.length === 0) {
        this.logger.info('No migrations to reset');
        return;
      }
      
      // Sort applied migrations in reverse order
      appliedMigrations.sort((a, b) => b.id.localeCompare(a.id));
      
      // Roll back each migration
      for (const appliedMigration of appliedMigrations) {
        // Find the migration in our loaded migrations
        const migration = this.migrations.find(m => m.id === appliedMigration.id);
        
        if (!migration) {
          this.logger.warn(`Migration not found: ${appliedMigration.id}`);
          continue;
        }
        
        this.logger.info(`Rolling back migration: ${migration.name} (${migration.id})`);
        
        try {
          // Run the down migration
          await migration.down(this.connection);
          
          // Remove the migration record
          await this.removeMigration(migration.id);
          
          this.logger.info(`Migration rolled back successfully: ${migration.name} (${migration.id})`);
        } catch (error) {
          this.logger.error(`Error rolling back migration ${migration.name} (${migration.id}): ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      }
      
      this.logger.info(`Reset ${appliedMigrations.length} migrations`);
    } catch (error) {
      this.logger.error(`Error resetting migrations: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get the current database schema version
   */
  async getCurrentVersion(): Promise<string> {
    try {
      return await this.connection.getSchemaVersion();
    } catch (error) {
      this.logger.error(`Error getting current version: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get the status of all migrations
   */
  async getMigrationStatus(): Promise<Array<{
    id: string;
    name: string;
    applied: boolean;
    appliedAt?: Date;
  }>> {
    try {
      // Get applied migrations
      const appliedMigrations = await this.getAppliedMigrations();
      const appliedMigrationsMap = new Map(
        appliedMigrations.map(m => [m.id, m.appliedAt])
      );
      
      // Create status for all migrations
      return this.migrations.map(migration => ({
        id: migration.id,
        name: migration.name,
        applied: appliedMigrationsMap.has(migration.id),
        appliedAt: appliedMigrationsMap.get(migration.id)
      }));
    } catch (error) {
      this.logger.error(`Error getting migration status: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get all applied migrations
   */
  private async getAppliedMigrations(): Promise<Array<{
    id: string;
    name: string;
    appliedAt: Date;
  }>> {
    try {
      // Check if migrations table exists
      const knex = this.connection.getConnection();
      const migrationTableExists = await this.tableExists();
      
      if (!migrationTableExists) {
        return [];
      }
      
      // Get all applied migrations
      const migrations = await knex('migrations')
        .select('id', 'name', 'applied_at as appliedAt')
        .orderBy('id');
      
      return migrations;
    } catch (error) {
      this.logger.error(`Error getting applied migrations: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Record a migration as applied
   * @param id The migration ID
   * @param name The migration name
   */
  private async recordMigration(id: string, name: string): Promise<void> {
    try {
      const knex = this.connection.getConnection();
      
      await knex('migrations').insert({
        id,
        name,
        applied_at: new Date()
      });
    } catch (error) {
      this.logger.error(`Error recording migration: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Remove a migration record
   * @param id The migration ID
   */
  private async removeMigration(id: string): Promise<void> {
    try {
      const knex = this.connection.getConnection();
      
      await knex('migrations')
        .where({ id })
        .delete();
    } catch (error) {
      this.logger.error(`Error removing migration: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Check if migrations table exists
   */
  private async tableExists(): Promise<boolean> {
    return await this.connection.getConnection().schema.hasTable('migrations');
  }
}