/**
 * PromptRegistry - Registers and manages MCP prompts
 */

import { Prompt, PromptRegistry as IPromptRegistry } from '../../interfaces/mcp-server.js';
import { Logger } from '../../utils/logger.js';

class PromptRegistry implements IPromptRegistry {
  private prompts: Map<string, Prompt>;
  private logger: Logger;

  constructor() {
    this.prompts = new Map<string, Prompt>();
    this.logger = new Logger('PromptRegistry');
  }

  /**
   * Register a new prompt
   */
  registerPrompt(prompt: Prompt): void {
    if (this.prompts.has(prompt.name)) {
      this.logger.warn(`Prompt with name '${prompt.name}' already exists and will be overwritten`);
    }
    
    this.prompts.set(prompt.name, prompt);
    this.logger.info(`Registered prompt: ${prompt.name}`);
  }

  /**
   * Get a prompt by name
   */
  getPrompt(name: string): Prompt | undefined {
    const prompt = this.prompts.get(name);
    
    if (!prompt) {
      this.logger.warn(`Prompt with name '${name}' not found`);
    }
    
    return prompt;
  }

  /**
   * Get all registered prompts
   */
  getAllPrompts(): Prompt[] {
    return Array.from(this.prompts.values());
  }
}

export { PromptRegistry };