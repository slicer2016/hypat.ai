/**
 * MCP Tools Registration
 * Main entry point for registering all Hypat.ai tools with the MCP server
 */

import { McpServerManager } from '../modules/mcp-server/index.js';
import { Logger } from '../utils/logger.js';

// Newsletter Detection Tools
import { DetectNewsletterTool } from './detect-newsletter-tool.js';
import { RecordNewsletterFeedbackTool } from './record-newsletter-feedback-tool.js';
import { GetNewslettersForVerificationTool } from './get-newsletters-for-verification-tool.js';

// Content Processing Tools
import { ExtractNewsletterContentTool } from './extract-newsletter-content-tool.js';
import { GetNewsletterTopicsTool } from './get-newsletter-topics-tool.js';
import { GetNewsletterLinksTool } from './get-newsletter-links-tool.js';

const logger = new Logger('ToolsRegistration');

/**
 * Register all Hypat.ai tools with the MCP server
 * @param serverManager The MCP server manager instance
 */
export function registerHypatTools(serverManager: McpServerManager): void {
  logger.info('Registering Hypat.ai tools with MCP server');
  
  // Get the tool registry
  const toolRegistry = serverManager.getToolRegistry();
  
  // Register newsletter detection tools
  logger.debug('Registering newsletter detection tools');
  toolRegistry.registerTool(DetectNewsletterTool);
  toolRegistry.registerTool(RecordNewsletterFeedbackTool);
  toolRegistry.registerTool(GetNewslettersForVerificationTool);
  
  // Register content processing tools
  logger.debug('Registering content processing tools');
  toolRegistry.registerTool(ExtractNewsletterContentTool);
  toolRegistry.registerTool(GetNewsletterTopicsTool);
  toolRegistry.registerTool(GetNewsletterLinksTool);
  
  logger.info('All Hypat.ai tools registered successfully');
}

/**
 * List of all available tools
 */
export const HYPAT_TOOLS = [
  // Newsletter Detection Tools
  DetectNewsletterTool,
  RecordNewsletterFeedbackTool,
  GetNewslettersForVerificationTool,
  
  // Content Processing Tools
  ExtractNewsletterContentTool,
  GetNewsletterTopicsTool,
  GetNewsletterLinksTool
];