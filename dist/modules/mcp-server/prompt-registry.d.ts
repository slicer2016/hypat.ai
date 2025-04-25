/**
 * PromptRegistry - Registers and manages MCP prompts
 */
import { Prompt, PromptRegistry as IPromptRegistry } from '../../interfaces/mcp-server.js';
declare class PromptRegistry implements IPromptRegistry {
    private prompts;
    private logger;
    constructor();
    /**
     * Register a new prompt
     */
    registerPrompt(prompt: Prompt): void;
    /**
     * Get a prompt by name
     */
    getPrompt(name: string): Prompt | undefined;
    /**
     * Get all registered prompts
     */
    getAllPrompts(): Prompt[];
}
export { PromptRegistry };
