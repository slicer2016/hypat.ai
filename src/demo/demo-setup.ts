/**
 * Demo Setup for Hypat.ai
 * Initializes the demo environment with sample data
 */

import { Logger } from '../utils/logger.js';
import { MockDataGenerator } from './mock-data-generator.js';
import { Config } from '../config/config.js';
import { 
  DatabaseManager, 
  RepositoryFactory, 
  createDataAccess,
  UserRepository,
  NewsletterRepository,
  CategoryRepository,
  CategoryAssignmentRepository,
  UserPreferenceRepository
} from '../data/index.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Demo Setup class to initialize the system with sample data
 */
export class DemoSetup {
  private logger: Logger;
  private mockDataGenerator: MockDataGenerator;
  private databaseManager: DatabaseManager;
  private repositoryFactory: RepositoryFactory;
  
  constructor() {
    this.logger = new Logger('DemoSetup');
    this.mockDataGenerator = new MockDataGenerator();
  }
  
  /**
   * Initialize the demo environment
   */
  async initialize(): Promise<void> {
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
      
      // Run migrations to ensure database schema is up-to-date
      await dataAccess.migrationManager.migrate();
      
      // Generate and store demo data
      await this.generateAndStoreDemoData();
      
      this.logger.info('Demo environment initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize demo environment: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Generate and store demo data
   */
  private async generateAndStoreDemoData(): Promise<void> {
    this.logger.info('Generating and storing demo data');
    
    try {
      // Get repositories
      const userRepository = this.repositoryFactory.getSpecializedRepository<UserRepository>('UserRepository');
      const newsletterRepository = this.repositoryFactory.getSpecializedRepository<NewsletterRepository>('NewsletterRepository');
      const categoryRepository = this.repositoryFactory.getSpecializedRepository<CategoryRepository>('CategoryRepository');
      const categoryAssignmentRepository = this.repositoryFactory.getSpecializedRepository<CategoryAssignmentRepository>('CategoryAssignmentRepository');
      const userPreferenceRepository = this.repositoryFactory.getSpecializedRepository<UserPreferenceRepository>('UserPreferenceRepository');
      
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
        users = demoConfig.users.map((user: any) => ({
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
    } catch (error) {
      this.logger.error(`Failed to generate and store demo data: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Clean up demo resources
   */
  async cleanup(): Promise<void> {
    try {
      this.logger.info('Cleaning up demo resources');
      
      // Close database connection
      if (this.databaseManager) {
        await this.databaseManager.close();
      }
      
      this.logger.info('Demo resources cleaned up successfully');
    } catch (error) {
      this.logger.error(`Failed to clean up demo resources: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get the repository factory for the demo
   */
  getRepositoryFactory(): RepositoryFactory {
    return this.repositoryFactory;
  }
  
  /**
   * Get the database manager for the demo
   */
  getDatabaseManager(): DatabaseManager {
    return this.databaseManager;
  }
}