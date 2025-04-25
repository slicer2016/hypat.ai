/**
 * ToolRegistry - Registers and manages MCP tools
 */
import { Tool, ToolRegistry as IToolRegistry } from '../../interfaces/mcp-server.js';
declare class ToolRegistry implements IToolRegistry {
    private tools;
    private logger;
    constructor();
    /**
     * Register a new tool
     */
    registerTool(tool: Tool): void;
    /**
     * Get a tool by name
     */
    getTool(name: string): Tool | undefined;
    /**
     * Get all registered tools
     */
    getAllTools(): Tool[];
}
export { ToolRegistry };
