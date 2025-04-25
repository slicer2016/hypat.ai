/**
 * Configuration System
 * Loads and validates configuration from environment variables and config files
 */
import path from 'path';
import fs from 'fs';
import { Logger } from '../utils/logger.js';
/**
 * Configuration class for Hypat.ai
 * Loads configuration from environment variables and config files
 */
export class Config {
    /**
     * Private constructor for singleton
     */
    constructor() {
        this.logger = new Logger('Config');
        this.environment = process.env.NODE_ENV || 'development';
        this.config = this.loadConfig();
    }
    
    /**
     * Initialize config with custom options
     * @param options Initialization options
     */
    static initialize(options) {
        // Reset instance if it exists
        if (Config.instance) {
            Config.instance = null;
        }
        
        // Set config path if provided
        if (options?.path) {
            process.env.CONFIG_PATH = options.path;
        }
        
        // Create new instance
        return Config.getInstance();
    }
    
    /**
     * Get the singleton instance
     * @returns The Config instance
     */
    static getInstance() {
        if (!Config.instance) {
            Config.instance = new Config();
        }
        return Config.instance;
    }
    /**
     * Load configuration from environment variables and config files
     * @returns The merged and validated configuration
     */
    loadConfig() {
        try {
            this.logger.info(`Loading configuration for environment: ${this.environment}`);
            // Start with default configuration
            let config = this.getDefaultConfig();
            // Load config from JSON file
            const configFromFile = this.loadConfigFromFile();
            if (configFromFile) {
                config = this.mergeConfigs(config, configFromFile);
            }
            // Override with environment variables
            config = this.loadConfigFromEnv(config);
            // Validate config
            this.validateConfig(config);
            this.logger.info('Configuration loaded successfully');
            return config;
        }
        catch (error) {
            this.logger.error(`Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`);
            throw new Error(`Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Get the default configuration values
     * @returns The default config
     */
    getDefaultConfig() {
        return {
            app: {
                port: 3000,
                host: 'localhost',
                templatesDir: path.resolve(process.cwd(), 'src/core/digest/templates')
            },
            database: {
                type: 'sqlite',
                filename: path.resolve(process.cwd(), 'data/database.sqlite'),
                poolMin: 0,
                poolMax: 10,
                debug: false,
                migrate: true
            },
            cache: {
                defaultTtl: 300, // 5 minutes
                maxSize: 1000
            },
            email: {
                transport: 'smtp',
                host: 'localhost',
                port: 25,
                secure: false,
                senderAddress: 'hypat@example.com',
                senderName: 'Hypat.ai'
            },
            logging: {
                level: 'info',
                disableFileLogging: false,
                logDir: path.resolve(process.cwd(), 'logs')
            },
            mcp: {
                name: 'Hypat.ai',
                version: '1.0.0',
                useMockGmailClient: false
            },
            features: {
                deterministicIds: false,
                disableHeavyProcessing: false
            }
        };
    }
    /**
     * Load configuration from JSON file
     * @returns The config from file
     */
    loadConfigFromFile() {
        try {
            // Check if CONFIG_PATH environment variable is set
            if (process.env.CONFIG_PATH) {
                const configPath = path.resolve(process.cwd(), process.env.CONFIG_PATH);
                if (fs.existsSync(configPath)) {
                    this.logger.info(`Loading configuration from ${configPath}`);
                    const configJson = fs.readFileSync(configPath, 'utf8');
                    return JSON.parse(configJson);
                }
                else {
                    this.logger.warn(`Config file specified in CONFIG_PATH not found: ${configPath}`);
                }
            }
            
            // Try to load config from environment-specific file
            const configPath = path.resolve(process.cwd(), `config.${this.environment}.json`);
            if (fs.existsSync(configPath)) {
                this.logger.info(`Loading configuration from ${configPath}`);
                const configJson = fs.readFileSync(configPath, 'utf8');
                return JSON.parse(configJson);
            }
            
            // Try to load from default config file
            const defaultConfigPath = path.resolve(process.cwd(), 'config.json');
            if (fs.existsSync(defaultConfigPath)) {
                this.logger.info(`Loading configuration from ${defaultConfigPath}`);
                const configJson = fs.readFileSync(defaultConfigPath, 'utf8');
                return JSON.parse(configJson);
            }
            
            this.logger.warn('No configuration file found. Using default values and environment variables.');
            return null;
        }
        catch (error) {
            this.logger.error(`Failed to load configuration from file: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }
    /**
     * Load configuration from environment variables
     * @param config The base configuration to override
     * @returns The updated configuration
     */
    loadConfigFromEnv(config) {
        // Helper function to set nested property if environment variable exists
        const setFromEnv = (envVar, configPath) => {
            if (process.env[envVar] !== undefined) {
                let value = process.env[envVar];
                // Try to parse as JSON (for objects/arrays)
                try {
                    value = JSON.parse(value);
                }
                catch (e) {
                    // Not JSON, convert to appropriate type
                    if (value === 'true')
                        value = true;
                    else if (value === 'false')
                        value = false;
                    else if (!isNaN(Number(value)) && value !== '')
                        value = Number(value);
                }
                // Set the value in the config object
                let current = config;
                for (let i = 0; i < configPath.length - 1; i++) {
                    if (!current[configPath[i]]) {
                        current[configPath[i]] = {};
                    }
                    current = current[configPath[i]];
                }
                current[configPath[configPath.length - 1]] = value;
            }
        };
        // App Configuration
        setFromEnv('APP_PORT', ['app', 'port']);
        setFromEnv('APP_HOST', ['app', 'host']);
        setFromEnv('TEMPLATES_DIR', ['app', 'templatesDir']);
        // Database Configuration
        setFromEnv('DB_TYPE', ['database', 'type']);
        setFromEnv('DB_FILENAME', ['database', 'filename']);
        setFromEnv('DB_HOST', ['database', 'host']);
        setFromEnv('DB_PORT', ['database', 'port']);
        setFromEnv('DB_USERNAME', ['database', 'username']);
        setFromEnv('DB_PASSWORD', ['database', 'password']);
        setFromEnv('DB_DATABASE', ['database', 'database']);
        setFromEnv('DB_POOL_MIN', ['database', 'poolMin']);
        setFromEnv('DB_POOL_MAX', ['database', 'poolMax']);
        setFromEnv('DB_DEBUG', ['database', 'debug']);
        setFromEnv('DB_MIGRATE', ['database', 'migrate']);
        // Cache Configuration
        setFromEnv('CACHE_TTL', ['cache', 'defaultTtl']);
        setFromEnv('CACHE_MAX_SIZE', ['cache', 'maxSize']);
        // Email Configuration
        setFromEnv('EMAIL_TRANSPORT', ['email', 'transport']);
        setFromEnv('EMAIL_HOST', ['email', 'host']);
        setFromEnv('EMAIL_PORT', ['email', 'port']);
        setFromEnv('EMAIL_SECURE', ['email', 'secure']);
        setFromEnv('EMAIL_USER', ['email', 'auth', 'user']);
        setFromEnv('EMAIL_PASSWORD', ['email', 'auth', 'pass']);
        setFromEnv('EMAIL_REGION', ['email', 'region']);
        setFromEnv('EMAIL_SENDER_ADDRESS', ['email', 'senderAddress']);
        setFromEnv('EMAIL_SENDER_NAME', ['email', 'senderName']);
        setFromEnv('EMAIL_DEFAULT_RECIPIENT', ['email', 'defaultRecipient']);
        setFromEnv('EMAIL_CAPTURE', ['email', 'captureEmails']);
        // Logging Configuration
        setFromEnv('LOG_LEVEL', ['logging', 'level']);
        setFromEnv('LOG_DISABLE_FILE', ['logging', 'disableFileLogging']);
        setFromEnv('LOG_DIR', ['logging', 'logDir']);
        // MCP Configuration
        setFromEnv('MCP_NAME', ['mcp', 'name']);
        setFromEnv('MCP_VERSION', ['mcp', 'version']);
        setFromEnv('MCP_MOCK_GMAIL', ['mcp', 'useMockGmailClient']);
        // Feature Flags
        setFromEnv('FEATURE_DETERMINISTIC_IDS', ['features', 'deterministicIds']);
        setFromEnv('FEATURE_DISABLE_HEAVY_PROCESSING', ['features', 'disableHeavyProcessing']);
        return config;
    }
    /**
     * Validate the configuration
     * @param config The configuration to validate
     * @throws Error if validation fails
     */
    validateConfig(config) {
        // Validate database config
        if (!['sqlite', 'mysql', 'postgresql'].includes(config.database.type)) {
            throw new Error(`Invalid database type: ${config.database.type}`);
        }
        if (config.database.type === 'sqlite' && !config.database.filename) {
            throw new Error('SQLite database requires a filename');
        }
        if (config.database.type !== 'sqlite') {
            if (!config.database.host)
                throw new Error(`${config.database.type} requires a host`);
            if (!config.database.port)
                throw new Error(`${config.database.type} requires a port`);
            if (!config.database.username)
                throw new Error(`${config.database.type} requires a username`);
            if (!config.database.database)
                throw new Error(`${config.database.type} requires a database name`);
        }
        // Validate email config
        if (!['smtp', 'ses', 'mock'].includes(config.email.transport)) {
            throw new Error(`Invalid email transport: ${config.email.transport}`);
        }
        if (config.email.transport === 'smtp') {
            if (!config.email.host)
                throw new Error('SMTP transport requires a host');
            if (!config.email.port)
                throw new Error('SMTP transport requires a port');
        }
        if (config.email.transport === 'ses' && !config.email.region) {
            throw new Error('SES transport requires a region');
        }
        if (!config.email.senderAddress) {
            throw new Error('Email sender address is required');
        }
        // Validate logging config
        if (!['error', 'warn', 'info', 'debug'].includes(config.logging.level)) {
            throw new Error(`Invalid logging level: ${config.logging.level}`);
        }
        // Validate MCP config
        if (!config.mcp.name) {
            throw new Error('MCP server name is required');
        }
        if (!config.mcp.version) {
            throw new Error('MCP server version is required');
        }
    }
    /**
     * Merge configurations
     * @param base The base configuration
     * @param override The override configuration
     * @returns The merged configuration
     */
    mergeConfigs(base, override) {
        const result = { ...base };
        // Merge first level properties
        for (const key of Object.keys(override)) {
            if (override[key] === undefined)
                continue;
            if (typeof override[key] === 'object' && override[key] !== null && !Array.isArray(override[key])) {
                // Merge nested objects
                result[key] = {
                    ...result[key],
                    ...override[key]
                };
            }
            else {
                // Override primitive values
                result[key] = override[key];
            }
        }
        return result;
    }
    /**
     * Get the entire configuration
     * @returns The entire configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Get a specific configuration section
     * @param section The configuration section to get
     * @returns The requested configuration section
     */
    get(section) {
        return { ...this.config[section] };
    }
    /**
     * Get the current environment
     * @returns The current environment
     */
    getEnvironment() {
        return this.environment;
    }
    /**
     * Check if a feature flag is enabled
     * @param feature The feature flag to check
     * @returns True if the feature is enabled
     */
    isFeatureEnabled(feature) {
        return this.config.features?.[feature] === true;
    }
    /**
     * Override configuration values (for testing only)
     * @param overrides The configuration overrides
     */
    override(overrides) {
        if (this.environment !== 'test') {
            this.logger.warn('Configuration override is only allowed in test environment');
            return;
        }
        this.config = this.mergeConfigs(this.config, overrides);
    }
}
/**
 * Get the configuration instance
 * @returns The configuration instance
 */
export function getConfig() {
    return Config.getInstance();
}
//# sourceMappingURL=config.js.map