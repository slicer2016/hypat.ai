/**
 * ResourceRegistry - Registers and manages MCP resources
 */

import { Resource, ResourceRegistry as IResourceRegistry } from '../../interfaces/mcp-server.js';
import { Logger } from '../../utils/logger.js';

class ResourceRegistry implements IResourceRegistry {
  private resources: Map<string, Resource>;
  private logger: Logger;

  constructor() {
    this.resources = new Map<string, Resource>();
    this.logger = new Logger('ResourceRegistry');
  }

  /**
   * Register a new resource
   */
  registerResource(resource: Resource): void {
    if (this.resources.has(resource.name)) {
      this.logger.warn(`Resource with name '${resource.name}' already exists and will be overwritten`);
    }
    
    this.resources.set(resource.name, resource);
    this.logger.info(`Registered resource: ${resource.name}`);
  }

  /**
   * Get a resource by name
   */
  getResource(name: string): Resource | undefined {
    const resource = this.resources.get(name);
    
    if (!resource) {
      this.logger.warn(`Resource with name '${name}' not found`);
    }
    
    return resource;
  }

  /**
   * Get all registered resources
   */
  getAllResources(): Resource[] {
    return Array.from(this.resources.values());
  }
}

export { ResourceRegistry };