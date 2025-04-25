/**
 * Integration Test Fixture
 * 
 * This file provides a fixture for integration testing that sets up:
 * - In-memory SQLite database
 * - Mock Gmail MCP client
 * - Mock email sender for digest delivery
 * - Test user accounts
 * - Sample newsletter data
 */

import { createDataAccess, DatabaseManager, RepositoryFactory, MigrationManager, initializeRepositoryFactory } from '../../data/index.js';
import { integrationTestConfig, getTestDataAccessConfig } from './config.js';
import { MockGmailMcpClient } from './mocks/mock-gmail-mcp-client.js';
import { MockEmailSender } from './mocks/mock-email-sender.js';
import { getSampleEmails } from './test-data/sample-emails.js';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../../utils/logger.js';

/**
 * Test fixture for integration testing
 */
export class TestFixture {
  // Data access components
  public databaseManager: DatabaseManager;
  public repositoryFactory: RepositoryFactory;
  public migrationManager: MigrationManager;
  
  // Mock external services
  public mockGmailClient: MockGmailMcpClient;
  public mockEmailSender: MockEmailSender;
  
  // Test data
  public testUsers: Map<string, any>;
  
  // Logger
  private logger: Logger;
  
  constructor() {
    this.logger = new Logger('TestFixture');
    this.testUsers = new Map();
    
    // Initialize mock services
    this.mockGmailClient = new MockGmailMcpClient();
    this.mockEmailSender = new MockEmailSender();
    
    // Initialize empty properties
    this.databaseManager = null as any;
    this.repositoryFactory = null as any;
    this.migrationManager = null as any;
  }
  
  /**
   * Set up the test fixture with in-memory database and mock services
   */
  async setup(): Promise<void> {
    this.logger.info('Setting up test fixture');
    
    // Configure deterministic IDs if needed
    if (integrationTestConfig.features.deterministicIds) {
      this.setupDeterministicIds();
    }
    
    // Set up database and repositories
    await this.setupDatabase();
    
    // Add test data
    await this.setupTestData();
    
    // Set up mock Gmail client
    await this.setupMockGmailClient();
    
    this.logger.info('Test fixture setup complete');
  }
  
  /**
   * Clean up test resources
   */
  async teardown(): Promise<void> {
    this.logger.info('Tearing down test fixture');
    
    // Wait for any pending async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Close database connections
    if (this.databaseManager) {
      try {
        await this.databaseManager.closeAll();
      } catch (error) {
        this.logger.warn(`Error closing database connections: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Clear mock services
    try {
      this.mockEmailSender.clearEmails();
      this.mockGmailClient.clearEmails();
    } catch (error) {
      this.logger.warn(`Error clearing mock services: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Clear globals
    global.testDatabaseManager = null;
    global.testRepositoryFactory = null;
    
    this.logger.info('Test fixture teardown complete');
  }
  
  /**
   * Set up the in-memory database and run migrations
   */
  private async setupDatabase(): Promise<void> {
    // Create data access components with test config
    const dataAccess = await createDataAccess(getTestDataAccessConfig());
    
    this.databaseManager = dataAccess.databaseManager;
    this.repositoryFactory = dataAccess.repositoryFactory;
    this.migrationManager = dataAccess.migrationManager;
    
    // Initialize the global repository factory for tools
    initializeRepositoryFactory(this.repositoryFactory);
    
    // Set globals for test helpers to access
    global.testDatabaseManager = this.databaseManager;
    global.testRepositoryFactory = this.repositoryFactory;
    
    // Load migrations
    const migrationsDir = path.join(process.cwd(), 'src', 'data', 'migrations');
    await this.migrationManager.loadMigrations(migrationsDir);
    
    // Run migrations
    await this.migrationManager.migrate();
    
    // Verify migrations ran
    const status = await this.migrationManager.getMigrationStatus();
    this.logger.info(`Applied ${status.filter(m => m.applied).length} migrations`);
  }
  
  /**
   * Set up mock Gmail client with sample emails
   */
  private async setupMockGmailClient(): Promise<void> {
    await this.mockGmailClient.connect();
    
    // Load sample emails
    const sampleEmails = getSampleEmails();
    this.mockGmailClient.addTestEmails(sampleEmails);
    
    this.logger.info(`Loaded ${sampleEmails.length} sample emails into mock Gmail client`);
  }
  
  /**
   * Set up test data including users and categories
   */
  private async setupTestData(): Promise<void> {
    await this.setupTestUsers();
    await this.setupTestCategories();
  }
  
  /**
   * Create test user accounts
   */
  private async setupTestUsers(): Promise<void> {
    const userRepository = this.repositoryFactory.getSpecializedRepository('UserRepository');
    
    // Create a primary test user
    const primaryUser = await userRepository.create({
      email: 'test@example.com',
      name: 'Test User'
    });
    
    this.testUsers.set('primary', primaryUser);
    
    // Create secondary test user
    const secondaryUser = await userRepository.create({
      email: 'test2@example.com',
      name: 'Test User 2'
    });
    
    this.testUsers.set('secondary', secondaryUser);
    
    this.logger.info('Test users created');
  }
  
  /**
   * Create test categories
   */
  private async setupTestCategories(): Promise<void> {
    const categoryRepository = this.repositoryFactory.getSpecializedRepository('CategoryRepository');
    
    // Create parent categories
    const techCategory = await categoryRepository.create({
      name: 'Technology',
      description: 'Technology and computing topics'
    });
    
    const financeCategory = await categoryRepository.create({
      name: 'Finance',
      description: 'Business and financial news'
    });
    
    const scienceCategory = await categoryRepository.create({
      name: 'Science',
      description: 'Scientific discoveries and research'
    });
    
    const designCategory = await categoryRepository.create({
      name: 'Design',
      description: 'Design, art, and creativity'
    });
    
    // Create subcategories
    await categoryRepository.create({
      name: 'Software Development',
      description: 'Programming and software engineering',
      parentId: techCategory.id
    });
    
    await categoryRepository.create({
      name: 'AI & Machine Learning',
      description: 'Artificial intelligence and ML advances',
      parentId: techCategory.id
    });
    
    await categoryRepository.create({
      name: 'Market Updates',
      description: 'Stock market and investment news',
      parentId: financeCategory.id
    });
    
    await categoryRepository.create({
      name: 'Astronomy',
      description: 'Space and astronomy discoveries',
      parentId: scienceCategory.id
    });
    
    await categoryRepository.create({
      name: 'UX/UI Design',
      description: 'User experience and interface design',
      parentId: designCategory.id
    });
    
    this.logger.info('Test categories created');
  }
  
  /**
   * Set up deterministic UUIDs for testing
   */
  private setupDeterministicIds(): void {
    // The global setup in jest.setup.ts handles UUID and Date mocking
    // So we don't need to do anything here
    this.logger.info('Using global test configuration for deterministic IDs');
  }
}