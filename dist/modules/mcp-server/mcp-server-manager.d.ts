/**
 * McpServerManager - Initializes and manages the MCP server instance
 */
import { McpServerConfig, McpServerManager as IMcpServerManager, ToolRegistry as IToolRegistry, ResourceRegistry as IResourceRegistry, PromptRegistry as IPromptRegistry } from '../../interfaces/mcp-server.js';
declare class McpServerManager implements IMcpServerManager {
    private server;
    private toolRegistry;
    private resourceRegistry;
    private promptRegistry;
    private gmailMcpClient;
    private isInitialized;
    private isRunning;
    private logger;
    constructor();
    /**
     * Initialize the MCP server with configuration
     */
    initialize(config: McpServerConfig): Promise<void>;
    /**
     * Start the MCP server
     */
    start(): Promise<void>;
    /**
     * Stop the MCP server
     */
    stop(): Promise<void>;
    /**
     * Get the tool registry
     */
    getToolRegistry(): IToolRegistry;
    /**
     * Get the resource registry
     */
    getResourceRegistry(): IResourceRegistry;
    /**
     * Get the prompt registry
     */
    getPromptRegistry(): IPromptRegistry;
    /**
     * Register tools with the server
     */
    private registerTools;
}
export { McpServerManager };
