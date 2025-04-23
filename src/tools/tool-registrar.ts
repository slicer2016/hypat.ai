/**
 * ToolRegistrar
 * Organizes and manages MCP tool registration
 */

import { McpServerManager, Tool } from '../interfaces/mcp-server.js';
import { Logger } from '../utils/logger.js';

// Newsletter Detection Tools
import { DetectNewsletterTool } from './detect-newsletter-tool.js';
import { RecordNewsletterFeedbackTool } from './record-newsletter-feedback-tool.js';
import { GetNewslettersForVerificationTool } from './get-newsletters-for-verification-tool.js';
import { VerifyNewslettersTool } from './verify-newsletters-tool.js';
import { UpdateNewsletterFeedbackTool } from './update-newsletter-feedback-tool.js';

// Content Processing Tools
import { ExtractNewsletterContentTool } from './extract-newsletter-content-tool.js';
import { GetNewsletterTopicsTool } from './get-newsletter-topics-tool.js';
import { GetNewsletterLinksTool } from './get-newsletter-links-tool.js';
import { GetNewslettersTool } from './get-newsletters-tool.js';
import { SearchNewslettersTool } from './search-newsletters-tool.js';
import { GetNewsletterSourcesTool } from './get-newsletter-sources-tool.js';

// Categorization Tools
import { CategorizeNewsletterTool } from './categorize-newsletter-tool.js';
import { GetCategoriesTool } from './get-categories-tool.js';
import { ManageCategoryTool } from './manage-category-tool.js';
import { AssignCategoryTool } from './assign-category-tool.js';

// Digest Tools
import { GenerateDigestTool } from './generate-digest-tool.js';
import { ConfigureDigestDeliveryTool } from './configure-digest-delivery-tool.js';
import { SendDigestEmailTool } from './send-digest-email-tool.js';

/**
 * ToolRegistrar class for organizing tool registration
 */
export class ToolRegistrar {
  private logger: Logger;
  private toolsByCategory: Map<string, Tool[]>;
  private allTools: Tool[];
  
  constructor() {
    this.logger = new Logger('ToolRegistrar');
    this.toolsByCategory = new Map();
    this.allTools = [];
    
    // Initialize tool categories
    this.initializeCategories();
  }
  
  /**
   * Initialize tool categories
   */
  private initializeCategories(): void {
    // Newsletter Detection Tools
    const detectionTools = [
      DetectNewsletterTool,
      RecordNewsletterFeedbackTool,
      GetNewslettersForVerificationTool,
      VerifyNewslettersTool,
      UpdateNewsletterFeedbackTool
    ];
    this.toolsByCategory.set('detection', detectionTools);
    this.allTools.push(...detectionTools);
    
    // Content Processing Tools
    const contentTools = [
      ExtractNewsletterContentTool,
      GetNewsletterTopicsTool,
      GetNewsletterLinksTool,
      GetNewslettersTool,
      SearchNewslettersTool,
      GetNewsletterSourcesTool
    ];
    this.toolsByCategory.set('content', contentTools);
    this.allTools.push(...contentTools);
    
    // Categorization Tools
    const categorizationTools = [
      CategorizeNewsletterTool,
      GetCategoriesTool,
      ManageCategoryTool,
      AssignCategoryTool
    ];
    this.toolsByCategory.set('categorization', categorizationTools);
    this.allTools.push(...categorizationTools);
    
    // Digest Tools
    const digestTools = [
      GenerateDigestTool,
      ConfigureDigestDeliveryTool,
      SendDigestEmailTool
    ];
    this.toolsByCategory.set('digest', digestTools);
    this.allTools.push(...digestTools);
  }
  
  /**
   * Register all tools with the MCP server
   * @param serverManager The MCP server manager
   */
  public registerAllTools(serverManager: McpServerManager): void {
    this.logger.info('Registering all Hypat.ai tools with MCP server');
    
    const toolRegistry = serverManager.getToolRegistry();
    
    // Register all tools by category
    for (const [category, tools] of this.toolsByCategory.entries()) {
      this.logger.debug(`Registering ${category} tools`);
      
      for (const tool of tools) {
        toolRegistry.registerTool(tool);
        this.logger.debug(`Registered tool: ${tool.name}`);
      }
    }
    
    this.logger.info(`Successfully registered ${this.allTools.length} tools`);
  }
  
  /**
   * Register tools by category
   * @param serverManager The MCP server manager
   * @param category The tool category to register
   */
  public registerToolsByCategory(serverManager: McpServerManager, category: string): void {
    const tools = this.toolsByCategory.get(category);
    
    if (!tools) {
      throw new Error(`Unknown tool category: ${category}`);
    }
    
    this.logger.info(`Registering ${category} tools with MCP server`);
    
    const toolRegistry = serverManager.getToolRegistry();
    
    for (const tool of tools) {
      toolRegistry.registerTool(tool);
      this.logger.debug(`Registered tool: ${tool.name}`);
    }
    
    this.logger.info(`Successfully registered ${tools.length} ${category} tools`);
  }
  
  /**
   * Get all available tools
   */
  public getAllTools(): Tool[] {
    return [...this.allTools];
  }
  
  /**
   * Get tools by category
   * @param category The tool category
   */
  public getToolsByCategory(category: string): Tool[] {
    const tools = this.toolsByCategory.get(category);
    return tools ? [...tools] : [];
  }
  
  /**
   * Get available tool categories
   */
  public getCategories(): string[] {
    return Array.from(this.toolsByCategory.keys());
  }
}

// Export singleton instance
export const toolRegistrar = new ToolRegistrar();