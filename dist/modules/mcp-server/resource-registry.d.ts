/**
 * ResourceRegistry - Registers and manages MCP resources
 */
import { Resource, ResourceRegistry as IResourceRegistry } from '../../interfaces/mcp-server.js';
declare class ResourceRegistry implements IResourceRegistry {
    private resources;
    private logger;
    constructor();
    /**
     * Register a new resource
     */
    registerResource(resource: Resource): void;
    /**
     * Get a resource by name
     */
    getResource(name: string): Resource | undefined;
    /**
     * Get all registered resources
     */
    getAllResources(): Resource[];
}
export { ResourceRegistry };
