/**
 * Data Access Module
 * Provides a consistent interface for database operations
 */

// Export interfaces
export * from './interfaces.js';

// Export implementations
export { DatabaseManagerImpl } from './database-manager.js';
export { RepositoryFactoryImpl, BaseRepository } from './repository-factory.js';
export { UserRepositoryImpl } from './repositories/user-repository.js';
export { NewsletterRepositoryImpl } from './repositories/newsletter-repository.js';
export { CategoryRepositoryImpl } from './repositories/category-repository.js';
export { FeedbackRepositoryImpl } from './repositories/feedback-repository.js';
export { DigestRepositoryImpl } from './repositories/digest-repository.js';
export { UserPreferenceRepositoryImpl } from './repositories/user-preference-repository.js';
export { CacheManagerImpl } from './cache/cache-manager.js';
export { MigrationManagerImpl } from './migrations/migration-manager.js';
export { DataIntegrityValidatorImpl } from './validation/data-integrity-validator.js';

// Factory function to create all data access components
import { DatabaseManagerImpl } from './database-manager.js';
import { RepositoryFactoryImpl } from './repository-factory.js';
import { CacheManagerImpl } from './cache/cache-manager.js';
import { MigrationManagerImpl } from './migrations/migration-manager.js';
import { DataIntegrityValidatorImpl } from './validation/data-integrity-validator.js';
import { 
  DatabaseConfig, 
  DataAccessConfig, 
  DatabaseManager, 
  RepositoryFactory, 
  CacheManager, 
  MigrationManager, 
  DataIntegrityValidator 
} from './interfaces.js';

/**
 * Create a data access module instance
 * @param config Data access configuration
 */
export async function createDataAccess(config: DataAccessConfig): Promise<{
  databaseManager: DatabaseManager;
  repositoryFactory: RepositoryFactory;
  cacheManager: CacheManager;
  migrationManager: MigrationManager;
  dataIntegrityValidator: DataIntegrityValidator;
}> {
  // Create database manager
  const databaseManager = new DatabaseManagerImpl(config.database);
  await databaseManager.initialize();
  
  // Create cache manager
  const cacheManager = new CacheManagerImpl(config.cache);
  
  // Create repository factory
  const repositoryFactory = new RepositoryFactoryImpl(
    databaseManager.getConnection(), 
    cacheManager
  );
  
  // Create migration manager
  const migrationManager = new MigrationManagerImpl(
    databaseManager.getConnection()
  );
  
  // Create data integrity validator
  const dataIntegrityValidator = new DataIntegrityValidatorImpl(
    databaseManager.getConnection()
  );
  
  return {
    databaseManager,
    repositoryFactory,
    cacheManager,
    migrationManager,
    dataIntegrityValidator
  };
}

/**
 * Default configuration for SQLite
 */
export const defaultSqliteConfig: DatabaseConfig = {
  type: 'sqlite',
  filename: './data/database.sqlite',
  poolMin: 0,
  poolMax: 10,
  debug: false,
  migrate: true
};

/**
 * Global repository factory for convenience
 * This is primarily used by tools and services that need quick access to repositories
 */
let globalRepositoryFactory: RepositoryFactory | null = null;

/**
 * Get the global repository factory
 * This should be initialized during application startup
 */
export function getRepositoryFactory(): RepositoryFactory {
  if (!globalRepositoryFactory) {
    throw new Error('Repository factory not initialized. Call initializeRepositoryFactory first.');
  }
  return globalRepositoryFactory;
}

/**
 * Initialize the global repository factory
 * @param factory The repository factory to use globally
 */
export function initializeRepositoryFactory(factory: RepositoryFactory): void {
  globalRepositoryFactory = factory;
}