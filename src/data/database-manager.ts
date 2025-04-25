/**
 * Database Manager Implementation
 * Manages database connections and provides a consistent interface for database operations
 */

import knex, { Knex } from 'knex';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { 
  DatabaseConfig, 
  DatabaseConnection, 
  DatabaseManager, 
  Transaction 
} from './interfaces.js';
import { Logger } from '../utils/logger.js';

/**
 * Implementation of the Transaction interface for Knex
 */
class KnexTransaction implements Transaction {
  private trx: Knex.Transaction;
  private logger: Logger;
  
  constructor(trx: Knex.Transaction) {
    this.trx = trx;
    this.logger = new Logger('KnexTransaction');
  }
  
  /**
   * Commit the transaction
   */
  async commit(): Promise<void> {
    try {
      this.logger.info('Committing transaction');
      await this.trx.commit();
    } catch (error) {
      this.logger.error(`Error committing transaction: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Rollback the transaction
   */
  async rollback(): Promise<void> {
    try {
      this.logger.info('Rolling back transaction');
      await this.trx.rollback();
    } catch (error) {
      this.logger.error(`Error rolling back transaction: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Execute a query within the transaction
   * @param query SQL query string
   * @param params Query parameters
   */
  async query<T>(query: string, params?: any[]): Promise<T[]> {
    try {
      this.logger.debug(`Executing query in transaction: ${query}`);
      const result = await this.trx.raw(query, params || []);
      return result as T[];
    } catch (error) {
      this.logger.error(`Error executing query in transaction: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get the Knex transaction object
   */
  getKnexTransaction(): Knex.Transaction {
    return this.trx;
  }
}

/**
 * Implementation of the DatabaseConnection interface for Knex
 */
class KnexDatabaseConnection implements DatabaseConnection {
  private knexInstance: Knex;
  private config: DatabaseConfig;
  private logger: Logger;
  private initialized: boolean = false;
  
  constructor(config: DatabaseConfig) {
    this.config = config;
    this.logger = new Logger('KnexDatabaseConnection');
    
    // Create Knex configuration based on database type
    let knexConfig: Knex.Config = {};
    
    switch (config.type) {
      case 'sqlite':
        knexConfig = {
          client: 'sqlite3',
          connection: {
            filename: config.filename || path.join(process.cwd(), 'database.sqlite')
          },
          useNullAsDefault: true,
          pool: {
            min: config.poolMin || 0,
            max: config.poolMax || 10,
            afterCreate: (conn: any, done: (err: any, conn: any) => void) => {
              // Enable foreign keys in SQLite
              conn.run('PRAGMA foreign_keys = ON', done);
            }
          }
        };
        break;
      
      case 'mysql':
        knexConfig = {
          client: 'mysql2',
          connection: {
            host: config.host || 'localhost',
            port: config.port || 3306,
            user: config.username,
            password: config.password,
            database: config.database
          },
          pool: {
            min: config.poolMin || 0,
            max: config.poolMax || 10
          }
        };
        break;
      
      case 'postgres':
        knexConfig = {
          client: 'pg',
          connection: {
            host: config.host || 'localhost',
            port: config.port || 5432,
            user: config.username,
            password: config.password,
            database: config.database
          },
          pool: {
            min: config.poolMin || 0,
            max: config.poolMax || 10
          }
        };
        break;
      
      default:
        throw new Error(`Unsupported database type: ${config.type}`);
    }
    
    // Enable debug logging if requested
    if (config.debug) {
      knexConfig.debug = true;
    }
    
    // Create Knex instance
    this.knexInstance = knex(knexConfig);
  }
  
  /**
   * Initialize the database connection
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing database connection');
      
      // For SQLite, ensure the directory exists
      if (this.config.type === 'sqlite' && this.config.filename) {
        const dir = path.dirname(this.config.filename);
        if (!fs.existsSync(dir)) {
          this.logger.info(`Creating directory: ${dir}`);
          fs.mkdirSync(dir, { recursive: true });
        }
      }
      
      // Test the connection
      await this.knexInstance.raw('SELECT 1');
      
      // Ensure migrations table exists
      await this.ensureMigrationsTable();
      
      this.initialized = true;
      this.logger.info('Database connection initialized successfully');
    } catch (error) {
      this.logger.error(`Error initializing database connection: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    try {
      this.logger.info('Closing database connection');
      await this.knexInstance.destroy();
      this.initialized = false;
      this.logger.info('Database connection closed successfully');
    } catch (error) {
      this.logger.error(`Error closing database connection: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Begin a database transaction
   */
  async beginTransaction(): Promise<Transaction> {
    try {
      this.logger.info('Beginning transaction');
      const trx = await this.knexInstance.transaction();
      return new KnexTransaction(trx);
    } catch (error) {
      this.logger.error(`Error beginning transaction: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Execute a raw SQL query
   * @param query SQL query string
   * @param params Query parameters
   */
  async query<T>(query: string, params?: any[]): Promise<T[]> {
    try {
      this.logger.debug(`Executing query: ${query}`);
      const result = await this.knexInstance.raw(query, params || []);
      
      // Different database drivers return results in different formats
      if (this.config.type === 'sqlite') {
        return result as T[];
      } else if (this.config.type === 'mysql') {
        return result[0] as T[];
      } else if (this.config.type === 'postgres') {
        return result.rows as T[];
      }
      
      return result as T[];
    } catch (error) {
      this.logger.error(`Error executing query: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get the underlying Knex instance
   */
  getConnection(): Knex {
    return this.knexInstance;
  }
  
  /**
   * Check if the database connection is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.knexInstance.raw('SELECT 1');
      return true;
    } catch (error) {
      this.logger.error(`Database health check failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
  
  /**
   * Get the current database schema version from the migrations table
   */
  async getSchemaVersion(): Promise<string> {
    try {
      // Check if migrations table exists
      const migrationTableExists = await this.tableExists('migrations');
      if (!migrationTableExists) {
        return '0';
      }
      
      // Get the latest migration
      const latestMigration = await this.knexInstance('migrations')
        .orderBy('id', 'desc')
        .first();
      
      return latestMigration ? latestMigration.id : '0';
    } catch (error) {
      this.logger.error(`Error getting schema version: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Check if a table exists in the database
   * @param tableName The table name
   */
  async tableExists(tableName: string): Promise<boolean> {
    try {
      if (this.config.type === 'sqlite') {
        const result = await this.knexInstance.raw(
          'SELECT name FROM sqlite_master WHERE type=\'table\' AND name=?',
          [tableName]
        );
        return result.length > 0;
      } else if (this.config.type === 'mysql') {
        const result = await this.knexInstance.raw(
          'SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_name = ?',
          [this.config.database, tableName]
        );
        return result[0].length > 0;
      } else if (this.config.type === 'postgres') {
        const result = await this.knexInstance.raw(
          'SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' AND table_name = ?',
          [tableName]
        );
        return result.rows.length > 0;
      }
      
      return false;
    } catch (error) {
      this.logger.error(`Error checking if table exists: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Ensure the migrations table exists
   */
  private async ensureMigrationsTable(): Promise<void> {
    try {
      const migrationTableExists = await this.tableExists('migrations');
      
      if (!migrationTableExists) {
        this.logger.info('Creating migrations table');
        
        await this.knexInstance.schema.createTable('migrations', (table) => {
          table.string('id').primary();
          table.string('name').notNullable();
          table.timestamp('applied_at').defaultTo(this.knexInstance.fn.now());
        });
      }
    } catch (error) {
      this.logger.error(`Error ensuring migrations table exists: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}

/**
 * Implementation of the DatabaseManager interface
 */
export class DatabaseManagerImpl implements DatabaseManager {
  private connections: Map<string, DatabaseConnection> = new Map();
  private defaultConnection: string = 'default';
  private config: DatabaseConfig;
  private logger: Logger;
  
  constructor(config: DatabaseConfig) {
    this.config = config;
    this.logger = new Logger('DatabaseManager');
  }
  
  /**
   * Initialize the database manager
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing database manager');
      
      // Create and initialize the default connection
      const connection = new KnexDatabaseConnection(this.config);
      await connection.initialize();
      
      this.connections.set(this.defaultConnection, connection);
      
      this.logger.info('Database manager initialized successfully');
    } catch (error) {
      this.logger.error(`Error initializing database manager: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get a database connection
   * @param name The connection name (optional, defaults to the default connection)
   */
  getConnection(name: string = this.defaultConnection): DatabaseConnection {
    const connection = this.connections.get(name);
    
    if (!connection) {
      throw new Error(`Database connection not found: ${name}`);
    }
    
    return connection;
  }
  
  /**
   * Close all database connections
   */
  async closeAll(): Promise<void> {
    try {
      this.logger.info('Closing all database connections');
      
      const closePromises = Array.from(this.connections.values()).map(connection => 
        connection.close()
      );
      
      await Promise.all(closePromises);
      this.connections.clear();
      
      this.logger.info('All database connections closed successfully');
    } catch (error) {
      this.logger.error(`Error closing database connections: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Create a new database connection
   * @param name The connection name
   * @param config The connection configuration
   */
  async createConnection(name: string, config: DatabaseConfig): Promise<DatabaseConnection> {
    try {
      this.logger.info(`Creating database connection: ${name}`);
      
      if (this.connections.has(name)) {
        throw new Error(`Database connection already exists: ${name}`);
      }
      
      const connection = new KnexDatabaseConnection(config);
      await connection.initialize();
      
      this.connections.set(name, connection);
      
      this.logger.info(`Database connection created successfully: ${name}`);
      return connection;
    } catch (error) {
      this.logger.error(`Error creating database connection: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Set the default connection
   * @param name The connection name
   */
  setDefaultConnection(name: string): void {
    if (!this.connections.has(name)) {
      throw new Error(`Database connection not found: ${name}`);
    }
    
    this.defaultConnection = name;
  }
  
  /**
   * Get the names of all connections
   */
  getConnectionNames(): string[] {
    return Array.from(this.connections.keys());
  }
  
  /**
   * Get the default connection name
   */
  getDefaultConnectionName(): string {
    return this.defaultConnection;
  }
  
  /**
   * Close the default database connection
   */
  async close(): Promise<void> {
    try {
      this.logger.info('Closing default database connection');
      
      const connection = this.getConnection();
      await connection.close();
      this.connections.delete(this.defaultConnection);
      
      this.logger.info('Default database connection closed successfully');
    } catch (error) {
      this.logger.error(`Error closing database connection: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}