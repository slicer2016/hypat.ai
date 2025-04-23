/**
 * MCP Tools Registration
 * Main entry point for registering all Hypat.ai tools with the MCP server
 */

import { McpServerManager } from '../modules/mcp-server/index.js';
import { toolRegistrar, ToolRegistrar } from './tool-registrar.js';

// Export all tools by category
export * from './detect-newsletter-tool.js';
export * from './record-newsletter-feedback-tool.js';
export * from './get-newsletters-for-verification-tool.js';
export * from './verify-newsletters-tool.js';
export * from './update-newsletter-feedback-tool.js';

export * from './extract-newsletter-content-tool.js';
export * from './get-newsletter-topics-tool.js';
export * from './get-newsletter-links-tool.js';
export * from './get-newsletters-tool.js';
export * from './search-newsletters-tool.js';
export * from './get-newsletter-sources-tool.js';

export * from './categorize-newsletter-tool.js';
export * from './get-categories-tool.js';
export * from './manage-category-tool.js';
export * from './assign-category-tool.js';

export * from './generate-digest-tool.js';
export * from './configure-digest-delivery-tool.js';
export * from './send-digest-email-tool.js';

// Export the tool registrar
export { toolRegistrar, ToolRegistrar };

/**
 * Register all Hypat.ai tools with the MCP server
 * @param serverManager The MCP server manager instance
 */
export function registerHypatTools(serverManager: McpServerManager): void {
  toolRegistrar.registerAllTools(serverManager);
}

/**
 * List of all available tools
 */
export const HYPAT_TOOLS = toolRegistrar.getAllTools();