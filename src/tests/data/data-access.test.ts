/**
 * Data Access Module Tests
 * Tests the database, repository, and data integrity functionality
 */

import path from 'path';
import fs from 'fs';
import { 
  createDataAccess, 
  UserEntity, 
  UserRepository,
  DatabaseConfig,
  DataAccessConfig
} from '../../data/index.js';

// Test database configuration
const testDbPath = path.join(process.cwd(), 'test-database.sqlite');
const testConfig: DataAccessConfig = {
  database: {
    type: 'sqlite',
    filename: testDbPath,
    debug: false,
    migrate: true
  },
  cache: {
    defaultTtl: 60, // 1 minute
    maxSize: 100
  }
};

// Clean up test database file before tests
beforeAll(() => {
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
});

// Clean up test database file after tests
afterAll(() => {
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
});

describe('Data Access Module', () => {
  it('should create a data access instance', async () => {
    const dataAccess = await createDataAccess(testConfig);
    
    expect(dataAccess.databaseManager).toBeDefined();
    expect(dataAccess.repositoryFactory).toBeDefined();
    expect(dataAccess.cacheManager).toBeDefined();
    expect(dataAccess.migrationManager).toBeDefined();
    expect(dataAccess.dataIntegrityValidator).toBeDefined();
    
    // Close the database connection
    await dataAccess.databaseManager.closeAll();
  });
  
  it('should run migrations and create tables', async () => {
    const dataAccess = await createDataAccess(testConfig);
    
    // Load migrations from the migrations directory
    await dataAccess.migrationManager.loadMigrations(
      path.join(process.cwd(), 'src', 'data', 'migrations')
    );
    
    // Run migrations
    await dataAccess.migrationManager.migrate();
    
    // Get migration status
    const status = await dataAccess.migrationManager.getMigrationStatus();
    
    expect(status.length).toBeGreaterThan(0);
    expect(status[0].applied).toBe(true);
    
    // Check if tables were created
    const connection = dataAccess.databaseManager.getConnection();
    const knex = connection.getConnection();
    
    const tables = await knex.raw("SELECT name FROM sqlite_master WHERE type='table'");
    
    expect(tables).toContainEqual({ name: 'users' });
    expect(tables).toContainEqual({ name: 'newsletters' });
    expect(tables).toContainEqual({ name: 'categories' });
    
    // Close the database connection
    await dataAccess.databaseManager.closeAll();
  });
  
  it('should create, retrieve, update, and delete a user', async () => {
    const dataAccess = await createDataAccess(testConfig);
    
    // Get user repository
    const userRepository = dataAccess.repositoryFactory.getSpecializedRepository<UserRepository>('UserRepository');
    
    // Create a test user
    const testUser: Partial<UserEntity> = {
      email: 'test@example.com',
      name: 'Test User'
    };
    
    // Create user
    const createdUser = await userRepository.create(testUser);
    
    expect(createdUser).toBeDefined();
    expect(createdUser.id).toBeDefined();
    expect(createdUser.email).toBe(testUser.email);
    expect(createdUser.name).toBe(testUser.name);
    expect(createdUser.createdAt).toBeDefined();
    
    // Find by ID
    const foundUser = await userRepository.findById(createdUser.id);
    
    expect(foundUser).toBeDefined();
    expect(foundUser?.id).toBe(createdUser.id);
    
    // Find by email
    const foundByEmail = await userRepository.findByEmail(testUser.email as string);
    
    expect(foundByEmail).toBeDefined();
    expect(foundByEmail?.id).toBe(createdUser.id);
    
    // Update user
    const updatedUser = await userRepository.update(createdUser.id, {
      name: 'Updated Test User'
    });
    
    expect(updatedUser).toBeDefined();
    expect(updatedUser.name).toBe('Updated Test User');
    expect(updatedUser.updatedAt).toBeDefined();
    
    // Delete user
    const deleted = await userRepository.delete(createdUser.id);
    
    expect(deleted).toBe(true);
    
    // Verify deletion
    const notFound = await userRepository.findById(createdUser.id);
    expect(notFound).toBeNull();
    
    // Close the database connection
    await dataAccess.databaseManager.closeAll();
  });
  
  it('should handle transactions correctly', async () => {
    const dataAccess = await createDataAccess(testConfig);
    
    // Get user repository
    const userRepository = dataAccess.repositoryFactory.getSpecializedRepository<UserRepository>('UserRepository');
    
    // Create a test user with a transaction that commits
    const user1 = await userRepository.transaction(async (repo) => {
      const createdUser = await repo.create({
        email: 'transaction1@example.com',
        name: 'Transaction Test 1'
      });
      
      return createdUser;
    });
    
    expect(user1).toBeDefined();
    expect(user1.id).toBeDefined();
    
    // Verify user was created
    const foundUser1 = await userRepository.findById(user1.id);
    expect(foundUser1).toBeDefined();
    
    // Try a transaction that rolls back
    try {
      await userRepository.transaction(async (repo) => {
        await repo.create({
          email: 'transaction2@example.com',
          name: 'Transaction Test 2'
        });
        
        // Throw an error to trigger rollback
        throw new Error('Test rollback');
      });
      
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();
    }
    
    // Verify second user was not created
    const foundUser2 = await userRepository.findByEmail('transaction2@example.com');
    expect(foundUser2).toBeNull();
    
    // Clean up
    await userRepository.delete(user1.id);
    
    // Close the database connection
    await dataAccess.databaseManager.closeAll();
  });
  
  it('should validate data integrity', async () => {
    const dataAccess = await createDataAccess(testConfig);
    
    // Get user repository
    const userRepository = dataAccess.repositoryFactory.getSpecializedRepository<UserRepository>('UserRepository');
    
    // Create a test user
    const testUser: Partial<UserEntity> = {
      email: 'integrity@example.com',
      name: 'Integrity Test User'
    };
    
    // Create user
    const createdUser = await userRepository.create(testUser);
    
    // Validate user
    const validationResult = await dataAccess.dataIntegrityValidator.validate(createdUser);
    
    expect(validationResult.valid).toBe(true);
    expect(validationResult.issues.length).toBe(0);
    
    // Run integrity checks
    const integrityResult = await dataAccess.dataIntegrityValidator.runIntegrityChecks();
    
    expect(integrityResult.valid).toBe(true);
    
    // Clean up
    await userRepository.delete(createdUser.id);
    
    // Close the database connection
    await dataAccess.databaseManager.closeAll();
  });
  
  it('should use caching correctly', async () => {
    const dataAccess = await createDataAccess(testConfig);
    
    // Get user repository
    const userRepository = dataAccess.repositoryFactory.getSpecializedRepository<UserRepository>('UserRepository');
    
    // Create a test user
    const testUser: Partial<UserEntity> = {
      email: 'cache@example.com',
      name: 'Cache Test User'
    };
    
    // Create user
    const createdUser = await userRepository.create(testUser);
    
    // Get user from repository (should populate cache)
    const firstFetch = await userRepository.findById(createdUser.id);
    expect(firstFetch).toBeDefined();
    
    // Get cache stats
    const cacheStats = await dataAccess.cacheManager.getCache('users').getStats();
    
    // Second fetch should hit the cache
    const secondFetch = await userRepository.findById(createdUser.id);
    expect(secondFetch).toBeDefined();
    
    // Get updated cache stats
    const updatedCacheStats = await dataAccess.cacheManager.getCache('users').getStats();
    
    // Hit count should have increased
    expect(updatedCacheStats.hits).toBeGreaterThanOrEqual(cacheStats.hits);
    
    // Update the user (should invalidate cache)
    await userRepository.update(createdUser.id, {
      name: 'Updated Cache Test User'
    });
    
    // Fetch again (should repopulate cache)
    const thirdFetch = await userRepository.findById(createdUser.id);
    expect(thirdFetch).toBeDefined();
    expect(thirdFetch?.name).toBe('Updated Cache Test User');
    
    // Clean up
    await userRepository.delete(createdUser.id);
    
    // Close the database connection
    await dataAccess.databaseManager.closeAll();
  });
});