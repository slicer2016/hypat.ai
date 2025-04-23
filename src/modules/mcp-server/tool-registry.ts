/**
 * ToolRegistry - Registers and manages MCP tools
 */

import { Tool, ToolRegistry as IToolRegistry } from '../../interfaces/mcp-server.js';
import { Logger } from '../../utils/logger.js';

class ToolRegistry implements IToolRegistry {
  private tools: Map<string, Tool>;
  private logger: Logger;

  constructor() {
    this.tools = new Map<string, Tool>();
    this.logger = new Logger('ToolRegistry');
  }

  /**
   * Register a new tool
   */
  registerTool(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      this.logger.warn(`Tool with name '${tool.name}' already exists and will be overwritten`);
    }
    
    this.tools.set(tool.name, tool);
    this.logger.info(`Registered tool: ${tool.name}`);
  }

  /**
   * Get a tool by name
   */
  getTool(name: string): Tool | undefined {
    const tool = this.tools.get(name);
    
    if (!tool) {
      this.logger.warn(`Tool with name '${name}' not found`);
    }
    
    return tool;
  }

  /**
   * Get all registered tools
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }
}

export { ToolRegistry };