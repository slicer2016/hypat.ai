/**
 * Demo Setup for Hypat.ai
 * Initializes the demo environment with sample data
 */
import { Logger } from '../utils/logger.js';
import { MockDataGenerator } from './mock-data-generator.js';
import { Config } from '../config/config.js';
import { createDataAccess } from '../data/index.js';
/**
 * Demo Setup class to initialize the system with sample data
 */
export class DemoSetup {
    constructor() {
        this.logger = new Logger('DemoSetup');
        this.mockDataGenerator = new MockDataGenerator();
    }
    /**
     * Initialize the demo environment
     */
    async initialize() {
        this.logger.info('Initializing demo environment');
        try {
            // Load demo configuration
            const config = Config.getInstance();
            
            // Create data access layer for demo
            const dataAccess = await createDataAccess({
                database: config.get('database'),
                cache: config.get('cache')
            });
            
            this.databaseManager = dataAccess.databaseManager;
            this.repositoryFactory = dataAccess.repositoryFactory;
            
            // Create migrations table if it doesn't exist
            const knex = this.databaseManager.getConnection().getConnection();
            const migrationsTableExists = await knex.schema.hasTable('migrations');
            
            if (!migrationsTableExists) {
                this.logger.info('Creating migrations table');
                await knex.schema.createTable('migrations', (table) => {
                    table.string('id').primary();
                    table.string('name').notNullable();
                    table.timestamp('applied_at').notNullable();
                });
            }
            
            // Apply the initial migration schema directly if tables don't exist
            const usersTableExists = await knex.schema.hasTable('users');
            
            if (!usersTableExists) {
                this.logger.info('Tables do not exist. Applying initial schema directly...');
                
                // Import the migration
                const initialSchemaModule = await import('../data/migrations/001-initial-schema.js');
                const initialSchemaMigration = initialSchemaModule.default;
                
                // Run the migration directly - create a simple connection wrapper
                const connectionWrapper = {
                    getConnection: () => knex
                };
                await initialSchemaMigration.up(connectionWrapper);
                
                // Record that we ran this migration
                await knex('migrations').insert({
                    id: initialSchemaMigration.id,
                    name: initialSchemaMigration.name,
                    applied_at: new Date()
                });
                
                this.logger.info('Initial schema applied successfully');
            }
            
            // Generate and store demo data
            await this.generateAndStoreDemoData();
            
            this.logger.info('Demo environment initialized successfully');
        }
        catch (error) {
            this.logger.error(`Failed to initialize demo environment: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Generate and store demo data
     */
    async generateAndStoreDemoData() {
        this.logger.info('Generating and storing demo data');
        try {
            // Get repositories
            const userRepository = this.repositoryFactory.getSpecializedRepository('UserRepository');
            const newsletterRepository = this.repositoryFactory.getSpecializedRepository('NewsletterRepository');
            const categoryRepository = this.repositoryFactory.getSpecializedRepository('CategoryRepository');
            const categoryAssignmentRepository = this.repositoryFactory.getSpecializedRepository('CategoryAssignmentRepository');
            const userPreferenceRepository = this.repositoryFactory.getSpecializedRepository('UserPreferenceRepository');
            // Check if demo data already exists
            const existingUsers = await userRepository.count();
            const existingNewsletters = await newsletterRepository.count();
            const existingCategories = await categoryRepository.count();
            if (existingUsers > 0 || existingNewsletters > 0 || existingCategories > 0) {
                this.logger.info('Demo data already exists, skipping data generation');
                return;
            }
            // Get demo configuration
            const config = Config.getInstance();
            const demoConfig = config.get('demo');
            const newsletterCount = demoConfig.newsletterCount || 30;
            // 1. Generate users
            let users = demoConfig.users || await this.mockDataGenerator.generateUsers(2);
            // Transform custom user objects to entity format if needed
            if (demoConfig.users) {
                users = demoConfig.users.map((user) => ({
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    preferencesJson: user.preferences ? JSON.stringify(user.preferences) : undefined,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }));
            }
            // Store users
            for (const user of users) {
                await userRepository.create(user);
            }
            this.logger.info(`Created ${users.length} sample users`);
            // 2. Generate categories
            const categories = await this.mockDataGenerator.generateCategories();
            // Store categories
            for (const category of categories) {
                await categoryRepository.create(category);
            }
            this.logger.info(`Created ${categories.length} sample categories`);
            // 3. Generate newsletters
            const newsletters = await this.mockDataGenerator.generateNewsletters(newsletterCount);
            // Store newsletters
            for (const newsletter of newsletters) {
                await newsletterRepository.create(newsletter);
            }
            this.logger.info(`Created ${newsletters.length} sample newsletters`);
            // 4. Generate category assignments
            const assignments = await this.mockDataGenerator.generateCategoryAssignments(newsletters, categories);
            // Store category assignments
            for (const assignment of assignments) {
                await categoryAssignmentRepository.create(assignment);
            }
            this.logger.info(`Created ${assignments.length} sample category assignments`);
            // 5. Generate user preferences
            for (const user of users) {
                const preferences = await this.mockDataGenerator.generateUserPreferences(user.id, categories);
                // Store user preferences
                for (const preference of preferences) {
                    await userPreferenceRepository.create(preference);
                }
                this.logger.info(`Created ${preferences.length} sample preferences for user ${user.id}`);
            }
            this.logger.info('All demo data generated and stored successfully');
        }
        catch (error) {
            this.logger.error(`Failed to generate and store demo data: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Clean up demo resources
     */
    async cleanup() {
        try {
            this.logger.info('Cleaning up demo resources');
            // Close database connection
            if (this.databaseManager) {
                await this.databaseManager.close();
            }
            this.logger.info('Demo resources cleaned up successfully');
        }
        catch (error) {
            this.logger.error(`Failed to clean up demo resources: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Get the repository factory for the demo
     */
    getRepositoryFactory() {
        return this.repositoryFactory;
    }
    /**
     * Get the database manager for the demo
     */
    getDatabaseManager() {
        return this.databaseManager;
    }
}
//# sourceMappingURL=demo-setup.js.map