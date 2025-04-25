/**
 * ResourceRegistry - Registers and manages MCP resources
 */
import { Logger } from '../../utils/logger.js';
class ResourceRegistry {
    constructor() {
        this.resources = new Map();
        this.logger = new Logger('ResourceRegistry');
    }
    /**
     * Register a new resource
     */
    registerResource(resource) {
        if (this.resources.has(resource.name)) {
            this.logger.warn(`Resource with name '${resource.name}' already exists and will be overwritten`);
        }
        this.resources.set(resource.name, resource);
        this.logger.info(`Registered resource: ${resource.name}`);
    }
    /**
     * Get a resource by name
     */
    getResource(name) {
        const resource = this.resources.get(name);
        if (!resource) {
            this.logger.warn(`Resource with name '${name}' not found`);
        }
        return resource;
    }
    /**
     * Get all registered resources
     */
    getAllResources() {
        return Array.from(this.resources.values());
    }
}
export { ResourceRegistry };
//# sourceMappingURL=resource-registry.js.map