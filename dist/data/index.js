/**
 * Data Access Module
 * Provides a consistent interface for database operations
 */

// Export interfaces
export * from './interfaces.js';
// Export implementations
export { DatabaseManagerImpl } from './database-manager.js';
// Fixed: Only export RepositoryFactoryImpl from repository-factory.js
export { RepositoryFactoryImpl } from './repository-factory.js';
// Directly export BaseRepository from its actual location
export { BaseRepository } from './repositories/base-repository.js';

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

/**
 * Create a data access module instance
 * @param config Data access configuration
 */
export async function createDataAccess(config) {
    // Create database manager
    const databaseManager = new DatabaseManagerImpl(config.database);
    await databaseManager.initialize();

    // Create cache manager
    const cacheManager = new CacheManagerImpl(config.cache);

    // Create repository factory
    const repositoryFactory = new RepositoryFactoryImpl(databaseManager.getConnection(), cacheManager);

    // Create migration manager
    const migrationManager = new MigrationManagerImpl(databaseManager.getConnection());
    
    // Manually import the initial schema migration
    // This is needed because the usual migration loading mechanism isn't working properly
    import('./migrations/001-initial-schema.js').then(async (module) => {
        const initialSchemaMigration = module.default;
        if (initialSchemaMigration && typeof initialSchemaMigration.up === 'function') {
            // Add the migration to the manager's list manually
            migrationManager.migrations = [initialSchemaMigration];
            
            // Run the migration if necessary
            if (config.database.migrate) {
                await migrationManager.migrate();
            }
        }
    }).catch(error => {
        console.error("Failed to load initial schema migration:", error);
    });

    // Create data integrity validator
    const dataIntegrityValidator = new DataIntegrityValidatorImpl(databaseManager.getConnection());

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
export const defaultSqliteConfig = {
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
let globalRepositoryFactory = null;

/**
 * Get the global repository factory
 * This should be initialized during application startup
 */
export function getRepositoryFactory() {
    if (!globalRepositoryFactory) {
        throw new Error('Repository factory not initialized. Call initializeRepositoryFactory first.');
    }
    return globalRepositoryFactory;
}

/**
 * Initialize the global repository factory
 * @param factory The repository factory to use globally
 */
export function initializeRepositoryFactory(factory) {
    globalRepositoryFactory = factory;
}