/**
 * Data Access Module Interfaces
 * Defines core interfaces for the data access layer
 */

/**
 * Base entity interface that all database entities should implement
 */
export interface Entity {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Query options interface for filtering, sorting, and pagination
 */
export interface QueryOptions<T> {
  // Filter options
  where?: Partial<T> | Record<string, any>; // Simple equality filters or complex conditions
  
  // Sorting options
  orderBy?: keyof T | Array<keyof T | { field: keyof T; direction: 'asc' | 'desc' }>;
  
  // Pagination options
  limit?: number;
  offset?: number;
  page?: number;
  
  // Include related entities
  include?: string[];
  
  // Select specific fields
  select?: Array<keyof T>;
  
  // Raw query options
  raw?: boolean;
}

/**
 * Database connection interface
 */
export interface DatabaseConnection {
  /**
   * Initialize the database connection
   */
  initialize(): Promise<void>;
  
  /**
   * Close the database connection
   */
  close(): Promise<void>;
  
  /**
   * Begin a transaction
   */
  beginTransaction(): Promise<Transaction>;
  
  /**
   * Perform a raw query
   * @param query The SQL query string
   * @param params Query parameters
   */
  query<T>(query: string, params?: any[]): Promise<T[]>;
  
  /**
   * Get the raw database connection/client
   */
  getConnection(): any;
  
  /**
   * Check if the connection is healthy
   */
  isHealthy(): Promise<boolean>;
  
  /**
   * Get the current database schema version
   */
  getSchemaVersion(): Promise<string>;
}

/**
 * Transaction interface for database operations
 */
export interface Transaction {
  /**
   * Commit the transaction
   */
  commit(): Promise<void>;
  
  /**
   * Rollback the transaction
   */
  rollback(): Promise<void>;
  
  /**
   * Perform a query within the transaction
   * @param query The SQL query string
   * @param params Query parameters
   */
  query<T>(query: string, params?: any[]): Promise<T[]>;
}

/**
 * Generic repository interface for CRUD operations
 */
export interface Repository<T extends Entity> {
  /**
   * Find an entity by ID
   * @param id The entity ID
   */
  findById(id: string): Promise<T | null>;
  
  /**
   * Find entities based on query options
   * @param options Query options for filtering, sorting, and pagination
   */
  find(options?: QueryOptions<T>): Promise<T[]>;
  
  /**
   * Find a single entity based on query options
   * @param options Query options for filtering
   */
  findOne(options: QueryOptions<T>): Promise<T | null>;
  
  /**
   * Count entities based on query options
   * @param options Query options for filtering
   */
  count(options?: QueryOptions<T>): Promise<number>;
  
  /**
   * Create a new entity
   * @param entity The entity to create
   */
  create(entity: Partial<T>): Promise<T>;
  
  /**
   * Create multiple entities
   * @param entities The entities to create
   */
  createMany(entities: Partial<T>[]): Promise<T[]>;
  
  /**
   * Update an entity
   * @param id The entity ID
   * @param entity The entity data to update
   */
  update(id: string, entity: Partial<T>): Promise<T>;
  
  /**
   * Update multiple entities
   * @param options Query options for filtering
   * @param entity The entity data to update
   */
  updateMany(options: QueryOptions<T>, entity: Partial<T>): Promise<number>;
  
  /**
   * Delete an entity
   * @param id The entity ID
   */
  delete(id: string): Promise<boolean>;
  
  /**
   * Delete multiple entities
   * @param options Query options for filtering
   */
  deleteMany(options: QueryOptions<T>): Promise<number>;
  
  /**
   * Execute a function within a transaction
   * @param fn The function to execute
   */
  transaction<R>(fn: (repo: Repository<T>) => Promise<R>): Promise<R>;
  
  /**
   * Get the database connection
   */
  getConnection(): DatabaseConnection;
}

/**
 * Repository factory interface for creating repositories
 */
export interface RepositoryFactory {
  /**
   * Get a repository for the specified entity type
   * @param entityType The entity type
   */
  getRepository<T extends Entity>(entityType: new () => T): Repository<T>;
  
  /**
   * Get a specialized repository by name
   * @param repositoryName The repository name
   */
  getSpecializedRepository<R>(repositoryName: string): R;
}

/**
 * Migration interface for database schema migrations
 */
export interface Migration {
  /**
   * Get the migration ID (usually a timestamp)
   */
  id: string;
  
  /**
   * Get the migration name
   */
  name: string;
  
  /**
   * Apply the migration
   * @param connection The database connection
   */
  up(connection: DatabaseConnection): Promise<void>;
  
  /**
   * Revert the migration
   * @param connection The database connection
   */
  down(connection: DatabaseConnection): Promise<void>;
}

/**
 * Migration manager interface for handling database migrations
 */
export interface MigrationManager {
  /**
   * Get all available migrations
   */
  getMigrations(): Migration[];
  
  /**
   * Apply all pending migrations
   */
  migrate(): Promise<void>;
  
  /**
   * Rollback the most recent migration
   */
  rollback(): Promise<void>;
  
  /**
   * Rollback all migrations
   */
  reset(): Promise<void>;
  
  /**
   * Get the current database schema version
   */
  getCurrentVersion(): Promise<string>;
  
  /**
   * Get the status of all migrations
   */
  getMigrationStatus(): Promise<Array<{
    id: string;
    name: string;
    applied: boolean;
    appliedAt?: Date;
  }>>;
}

/**
 * Cache interface for data caching
 */
export interface Cache {
  /**
   * Get a value from the cache
   * @param key The cache key
   */
  get<T>(key: string): Promise<T | null>;
  
  /**
   * Set a value in the cache
   * @param key The cache key
   * @param value The value to cache
   * @param ttl Time to live in seconds
   */
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  
  /**
   * Delete a value from the cache
   * @param key The cache key
   */
  delete(key: string): Promise<void>;
  
  /**
   * Check if a key exists in the cache
   * @param key The cache key
   */
  has(key: string): Promise<boolean>;
  
  /**
   * Clear the entire cache
   */
  clear(): Promise<void>;
  
  /**
   * Get cache stats
   */
  getStats(): Promise<{
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
  }>;
}

/**
 * Cache manager interface for managing caches
 */
export interface CacheManager {
  /**
   * Get a cache instance
   * @param name The cache name
   */
  getCache(name: string): Cache;
  
  /**
   * Create a new cache instance
   * @param name The cache name
   * @param options Cache options
   */
  createCache(name: string, options?: {
    ttl?: number;
    maxSize?: number;
    maxAge?: number;
  }): Cache;
  
  /**
   * Delete a cache instance
   * @param name The cache name
   */
  deleteCache(name: string): Promise<void>;
  
  /**
   * Clear all caches
   */
  clearAll(): Promise<void>;
}

/**
 * Data integrity validator interface for validating entity integrity
 */
export interface DataIntegrityValidator {
  /**
   * Validate an entity
   * @param entity The entity to validate
   */
  validate<T extends Entity>(entity: T): Promise<ValidationResult>;
  
  /**
   * Validate relationships between entities
   * @param entity The entity to validate
   * @param relationships The relationships to validate
   */
  validateRelationships<T extends Entity>(
    entity: T,
    relationships: Record<string, any>
  ): Promise<ValidationResult>;
  
  /**
   * Check for orphaned records
   */
  checkOrphanedRecords(): Promise<ValidationResult[]>;
  
  /**
   * Run all integrity checks
   */
  runIntegrityChecks(): Promise<{
    valid: boolean;
    issues: ValidationIssue[];
  }>;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

/**
 * Validation issue interface
 */
export interface ValidationIssue {
  entity: string;
  entityId?: string;
  field?: string;
  relationship?: string;
  issueType: 'missing_required' | 'invalid_value' | 'duplicate' | 'orphaned' | 'integrity';
  message: string;
  severity: 'warning' | 'error';
}

/**
 * Database manager interface for managing database connections
 */
export interface DatabaseManager {
  /**
   * Get a database connection
   */
  getConnection(): DatabaseConnection;
  
  /**
   * Initialize the database manager
   */
  initialize(): Promise<void>;
  
  /**
   * Close all database connections
   */
  closeAll(): Promise<void>;
  
  /**
   * Close the default database connection
   */
  close(): Promise<void>;
}

/**
 * Entity declarations for TypeScript code completion
 */

// User entity
export interface UserEntity extends Entity {
  email: string;
  name?: string;
  preferencesJson?: string;
}

// Newsletter entity
export interface NewsletterEntity extends Entity {
  emailId: string;
  subject: string;
  sender: string;
  receivedDate: Date;
  contentHtml?: string;
  contentText?: string;
  processedContentJson?: string;
  metadataJson?: string;
  detectionConfidence: number;
  isVerified: boolean;
}

// Category entity
export interface CategoryEntity extends Entity {
  name: string;
  description?: string;
  parentId?: string;
  icon?: string;
}

// CategoryAssignment entity
export interface CategoryAssignmentEntity extends Entity {
  newsletterId: string;
  categoryId: string;
  confidence: number;
  isManual: boolean;
}

// Feedback entity
export interface FeedbackEntity extends Entity {
  userId: string;
  newsletterId: string;
  feedbackType: string;
  comment?: string;
}

// Digest entity
export interface DigestEntity extends Entity {
  userId: string;
  digestType: string;
  generationDate: Date;
  deliveryStatus: string;
  openedAt?: Date;
}

// DigestItem entity
export interface DigestItemEntity extends Entity {
  digestId: string;
  newsletterId: string;
  position: number;
}

// UserPreference entity
export interface UserPreferenceEntity extends Entity {
  userId: string;
  preferenceKey: string;
  preferenceValue: string;
}

/**
 * Repository interfaces for specific entity types
 */

export interface UserRepository extends Repository<UserEntity> {
  findByEmail(email: string): Promise<UserEntity | null>;
  findWithPreferences(userId: string): Promise<UserEntity & { preferences: Record<string, any> } | null>;
}

export interface NewsletterRepository extends Repository<NewsletterEntity> {
  findBySender(sender: string): Promise<NewsletterEntity[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<NewsletterEntity[]>;
  findWithCategories(newsletterId: string): Promise<NewsletterEntity & { categories: CategoryEntity[] } | null>;
}

export interface CategoryRepository extends Repository<CategoryEntity> {
  findWithParent(categoryId: string): Promise<CategoryEntity & { parent?: CategoryEntity } | null>;
  findWithChildren(categoryId: string): Promise<CategoryEntity & { children: CategoryEntity[] } | null>;
}

/**
 * Category assignment entity interface
 */
export interface CategoryAssignmentEntity extends Entity {
  newsletterId: string;
  categoryId: string;
  confidence: number;
  isManual: boolean;
}

/**
 * Category assignment repository interface
 */
export interface CategoryAssignmentRepository extends Repository<CategoryAssignmentEntity> {
  findByNewsletterAndCategory(newsletterId: string, categoryId: string): Promise<CategoryAssignmentEntity | null>;
  findByNewsletter(newsletterId: string): Promise<CategoryAssignmentEntity[]>;
  findByCategory(categoryId: string): Promise<CategoryAssignmentEntity[]>;
  deleteForNewsletter(newsletterId: string): Promise<number>;
}

export interface FeedbackRepository extends Repository<FeedbackEntity> {
  findByUserAndNewsletter(userId: string, newsletterId: string): Promise<FeedbackEntity[]>;
  getStatistics(): Promise<Record<string, number>>;
}

export interface DigestRepository extends Repository<DigestEntity> {
  findWithItems(digestId: string): Promise<DigestEntity & { items: Array<DigestItemEntity & { newsletter: NewsletterEntity }> } | null>;
  findByUserAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<DigestEntity[]>;
}

export interface UserPreferenceRepository extends Repository<UserPreferenceEntity> {
  getAllForUser(userId: string): Promise<Record<string, string>>;
  setPreference(userId: string, key: string, value: string): Promise<void>;
}

/**
 * Database configuration interface
 */
export interface DatabaseConfig {
  type: 'sqlite' | 'mysql' | 'postgres';
  filename?: string; // For SQLite
  host?: string; // For MySQL/Postgres
  port?: number; // For MySQL/Postgres
  username?: string; // For MySQL/Postgres
  password?: string; // For MySQL/Postgres
  database?: string; // For MySQL/Postgres
  poolMin?: number;
  poolMax?: number;
  debug?: boolean;
  migrate?: boolean;
}

/**
 * Data access module configuration
 */
export interface DataAccessConfig {
  database: DatabaseConfig;
  cache?: {
    defaultTtl?: number;
    maxSize?: number;
  };
}