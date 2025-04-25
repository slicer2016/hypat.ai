/**
 * PromptRegistry - Registers and manages MCP prompts
 */
import { Logger } from '../../utils/logger.js';
class PromptRegistry {
    constructor() {
        this.prompts = new Map();
        this.logger = new Logger('PromptRegistry');
    }
    /**
     * Register a new prompt
     */
    registerPrompt(prompt) {
        if (this.prompts.has(prompt.name)) {
            this.logger.warn(`Prompt with name '${prompt.name}' already exists and will be overwritten`);
        }
        this.prompts.set(prompt.name, prompt);
        this.logger.info(`Registered prompt: ${prompt.name}`);
    }
    /**
     * Get a prompt by name
     */
    getPrompt(name) {
        const prompt = this.prompts.get(name);
        if (!prompt) {
            this.logger.warn(`Prompt with name '${name}' not found`);
        }
        return prompt;
    }
    /**
     * Get all registered prompts
     */
    getAllPrompts() {
        return Array.from(this.prompts.values());
    }
}
export { PromptRegistry };
//# sourceMappingURL=prompt-registry.js.map