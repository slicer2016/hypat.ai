/**
 * Hypat.ai - Main Entry Point
 * A specialized Model Context Protocol (MCP) server that transforms newsletter emails 
 * into an organized knowledge system.
 */

// Export all modules
export * from './core/digest/index.js';

// Start the MCP server
import { createDigestService } from './core/digest/index.js';

// This is a placeholder for the actual server startup
// In a real implementation, this would initialize the MCP server
console.log('Starting Hypat.ai MCP server...');

// When proper implementations are available, the digest service can be initialized like this:
/*
const digestService = createDigestService(
  contentProcessor,
  categorizer,
  {
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: {
      user: 'user@example.com',
      pass: 'password'
    }
  }
);

// Start scheduling digests
digestService.scheduleDigests();
*/