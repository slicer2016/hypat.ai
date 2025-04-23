/**
 * Tests for ToolRegistrar
 */

import { ToolRegistrar } from '../../tools/tool-registrar.js';
import { registerHypatTools, HYPAT_TOOLS } from '../../tools/index.js';

describe('ToolRegistrar', () => {
  // Mock MCP server manager
  const mockToolRegistry = {
    registerTool: jest.fn(),
    getTool: jest.fn(),
    getAllTools: jest.fn()
  };
  
  const mockServerManager = {
    getToolRegistry: jest.fn().mockReturnValue(mockToolRegistry),
    initialize: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    getResourceRegistry: jest.fn(),
    getPromptRegistry: jest.fn()
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should organize tools by category', () => {
    const registrar = new ToolRegistrar();
    
    // Check categories
    const categories = registrar.getCategories();
    expect(categories).toContain('detection');
    expect(categories).toContain('content');
    expect(categories).toContain('categorization');
    expect(categories).toContain('digest');
    
    // Check each category has tools
    for (const category of categories) {
      const tools = registrar.getToolsByCategory(category);
      expect(tools.length).toBeGreaterThan(0);
    }
  });
  
  it('should register all tools correctly', () => {
    const registrar = new ToolRegistrar();
    registrar.registerAllTools(mockServerManager);
    
    // Count total number of tools to be registered
    const allTools = registrar.getAllTools();
    
    // Verify each tool was registered
    expect(mockToolRegistry.registerTool).toHaveBeenCalledTimes(allTools.length);
    
    // Verify server manager was used correctly
    expect(mockServerManager.getToolRegistry).toHaveBeenCalled();
  });
  
  it('should register tools by category', () => {
    const registrar = new ToolRegistrar();
    
    // Register just the digest tools
    registrar.registerToolsByCategory(mockServerManager, 'digest');
    
    // Get count of digest tools
    const digestTools = registrar.getToolsByCategory('digest');
    
    // Verify only digest tools were registered
    expect(mockToolRegistry.registerTool).toHaveBeenCalledTimes(digestTools.length);
  });
  
  it('should throw error for unknown category', () => {
    const registrar = new ToolRegistrar();
    
    // Try to register tools from a non-existent category
    expect(() => {
      registrar.registerToolsByCategory(mockServerManager, 'unknown-category');
    }).toThrow('Unknown tool category');
  });
  
  it('should expose all tools through the HYPAT_TOOLS constant', () => {
    // Create a new registrar
    const registrar = new ToolRegistrar();
    
    // Compare tools from registrar with HYPAT_TOOLS
    expect(HYPAT_TOOLS.length).toBe(registrar.getAllTools().length);
    
    // Check if each tool in HYPAT_TOOLS has a name and handler
    for (const tool of HYPAT_TOOLS) {
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');
      expect(tool).toHaveProperty('inputSchema');
      expect(tool).toHaveProperty('handler');
    }
  });
  
  it('should register tools through the registerHypatTools function', () => {
    // Register tools using the exported function
    registerHypatTools(mockServerManager);
    
    // Create a new registrar to compare
    const registrar = new ToolRegistrar();
    const allTools = registrar.getAllTools();
    
    // Verify registration happened correctly
    expect(mockToolRegistry.registerTool).toHaveBeenCalledTimes(allTools.length);
  });
});