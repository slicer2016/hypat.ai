/**
 * Hypat.ai - Main Entry Point
 * A specialized MCP server for transforming newsletter emails into an organized knowledge system
 */

import { McpServerManager } from './modules/mcp-server/index.js';
import { Logger } from './utils/logger.js';

const logger = new Logger('Main');

async function main() {
  try {
    logger.info('Starting Hypat.ai MCP server...');
    
    // Initialize MCP Server Manager
    const mcpServerManager = new McpServerManager();
    
    // Initialize the server
    await mcpServerManager.initialize({
      name: 'hypat.ai',
      version: '1.0.0'
    });
    
    // Start the server
    await mcpServerManager.start();
    
    logger.info('Hypat.ai MCP server started successfully');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT signal, shutting down...');
      await mcpServerManager.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM signal, shutting down...');
      await mcpServerManager.stop();
      process.exit(0);
    });
  } catch (error) {
    logger.error(`Failed to start Hypat.ai MCP server: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Start the server
main();