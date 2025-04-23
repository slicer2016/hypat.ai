/**
 * Interfaces for MCP Server components
 */

export interface Tool {
  name: string;
  description: string;
  inputSchema: any;
  handler: (args: any) => Promise<any>;
}

export interface Resource {
  name: string;
  description: string;
  content: any;
}

export interface Prompt {
  name: string;
  description: string;
  content: string;
}

export interface McpServerConfig {
  name: string;
  version: string;
  port?: number;
  host?: string;
}

export interface ToolRegistry {
  registerTool(tool: Tool): void;
  getTool(name: string): Tool | undefined;
  getAllTools(): Tool[];
}

export interface ResourceRegistry {
  registerResource(resource: Resource): void;
  getResource(name: string): Resource | undefined;
  getAllResources(): Resource[];
}

export interface PromptRegistry {
  registerPrompt(prompt: Prompt): void;
  getPrompt(name: string): Prompt | undefined; 
  getAllPrompts(): Prompt[];
}

export interface McpServerManager {
  initialize(config: McpServerConfig): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  getToolRegistry(): ToolRegistry;
  getResourceRegistry(): ResourceRegistry;
  getPromptRegistry(): PromptRegistry;
}