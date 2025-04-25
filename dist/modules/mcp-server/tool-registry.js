/**
 * ToolRegistry - Registers and manages MCP tools
 */
import { Logger } from '../../utils/logger.js';
class ToolRegistry {
    constructor() {
        this.tools = new Map();
        this.logger = new Logger('ToolRegistry');
    }
    /**
     * Register a new tool
     */
    registerTool(tool) {
        if (this.tools.has(tool.name)) {
            this.logger.warn(`Tool with name '${tool.name}' already exists and will be overwritten`);
        }
        this.tools.set(tool.name, tool);
        this.logger.info(`Registered tool: ${tool.name}`);
    }
    /**
     * Get a tool by name
     */
    getTool(name) {
        const tool = this.tools.get(name);
        if (!tool) {
            this.logger.warn(`Tool with name '${name}' not found`);
        }
        return tool;
    }
    /**
     * Get all registered tools
     */
    getAllTools() {
        return Array.from(this.tools.values());
    }
}
export { ToolRegistry };
//# sourceMappingURL=tool-registry.js.map