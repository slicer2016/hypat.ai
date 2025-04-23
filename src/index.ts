/**
 * Hypat.ai - Main Entry Point
 * A specialized Model Context Protocol (MCP) server that transforms newsletter emails 
 * into an organized knowledge system.
 */

// Export all modules
export * from './core/digest/index.js';
export * from './core/feedback/index.js';

// Import services
import { createDigestService } from './core/digest/index.js';
import { createFeedbackService } from './core/feedback/index.js';

// This is a placeholder for the actual server startup
// In a real implementation, this would initialize the MCP server
console.log('Starting Hypat.ai MCP server...');

// When proper implementations are available, the services can be initialized like this:
/*
// Initialize the digest service
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

// Initialize the feedback service
const feedbackService = createFeedbackService(
  newsletterDetector,
  {
    verificationExpiryDays: 7,
    maxResendCount: 3,
    verificationBaseUrl: 'https://hypat.ai/verify'
  }
);

// Start services
digestService.scheduleDigests();
*/