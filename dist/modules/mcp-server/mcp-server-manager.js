/**
 * McpServerManager - Initializes and manages the MCP server instance
 */
import { ToolRegistry } from './tool-registry.js';
import { ResourceRegistry } from './resource-registry.js';
import { PromptRegistry } from './prompt-registry.js';
import { GmailMcpClient } from './gmail-mcp-client.js';
import { Logger } from '../../utils/logger.js';
// Import dynamically to handle ESM module
const dynamicImport = async (modulePath) => {
    try {
        return await import(modulePath);
    }
    catch (error) {
        throw new Error(`Failed to import module ${modulePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
};
class McpServerManager {
    constructor() {
        this.isInitialized = false;
        this.isRunning = false;
        this.toolRegistry = new ToolRegistry();
        this.resourceRegistry = new ResourceRegistry();
        this.promptRegistry = new PromptRegistry();
        this.gmailMcpClient = new GmailMcpClient();
        this.logger = new Logger('McpServerManager');
    }
    /**
     * Initialize the MCP server with configuration
     */
    async initialize(config) {
        try {
            this.logger.info(`Initializing MCP server: ${config.name} v${config.version}`);
            // Import the Server class
            const serverModule = await dynamicImport('@modelcontextprotocol/sdk/server');
            const Server = serverModule.Server;
            // Create MCP server instance
            this.server = new Server({
                name: config.name,
                version: config.version,
                capabilities: {
                    tools: {}
                }
            });
            // Connect to Gmail MCP Server
            await this.gmailMcpClient.connect();
            this.isInitialized = true;
            this.logger.info('MCP server initialized successfully');
        }
        catch (error) {
            this.logger.error(`Failed to initialize MCP server: ${error instanceof Error ? error.message : String(error)}`);
            throw new Error(`Failed to initialize MCP server: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Start the MCP server
     */
    async start() {
        if (!this.isInitialized) {
            throw new Error('MCP server is not initialized. Call initialize() first.');
        }
        if (this.isRunning) {
            this.logger.warn('MCP server is already running');
            return;
        }
        try {
            this.logger.info('Starting MCP server...');
            // Register all tools with the server
            await this.registerTools();
            // Connect the server to the transport
            const stdioModule = await dynamicImport('@modelcontextprotocol/sdk/server/stdio');
            const StdioServerTransport = stdioModule.StdioServerTransport;
            const transport = new StdioServerTransport();
            this.server.connect(transport);
            this.isRunning = true;
            this.logger.info('MCP server started successfully');
        }
        catch (error) {
            this.logger.error(`Failed to start MCP server: ${error instanceof Error ? error.message : String(error)}`);
            throw new Error(`Failed to start MCP server: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Stop the MCP server
     */
    async stop() {
        if (!this.isRunning) {
            this.logger.warn('MCP server is not running');
            return;
        }
        try {
            this.logger.info('Stopping MCP server...');
            // Disconnect from Gmail MCP Server
            await this.gmailMcpClient.disconnect();
            // Disconnect the server (assuming there's a method like this)
            // await this.server.disconnect();
            this.isRunning = false;
            this.logger.info('MCP server stopped successfully');
        }
        catch (error) {
            this.logger.error(`Failed to stop MCP server: ${error instanceof Error ? error.message : String(error)}`);
            throw new Error(`Failed to stop MCP server: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Get the tool registry
     */
    getToolRegistry() {
        return this.toolRegistry;
    }
    /**
     * Get the resource registry
     */
    getResourceRegistry() {
        return this.resourceRegistry;
    }
    /**
     * Get the prompt registry
     */
    getPromptRegistry() {
        return this.promptRegistry;
    }
    /**
     * Register tools with the server
     */
    async registerTools() {
        const typesModule = await dynamicImport('@modelcontextprotocol/sdk/types');
        const { ListToolsRequestSchema, CallToolRequestSchema } = typesModule;
        const tools = this.toolRegistry.getAllTools();
        // Register list tools handler
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: tools.map(tool => ({
                name: tool.name,
                description: tool.description,
                inputSchema: tool.inputSchema
            }))
        }));
        // Register call tool handler
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            const tool = this.toolRegistry.getTool(name);
            if (!tool) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error: Unknown tool: ${name}`
                        }
                    ]
                };
            }
            try {
                return await tool.handler(args);
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error: ${error instanceof Error ? error.message : String(error)}`
                        }
                    ]
                };
            }
        });
    }
}
export { McpServerManager };
//# sourceMappingURL=mcp-server-manager.js.map