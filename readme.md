# Hypat.ai

Hypat.ai is a specialized Model Context Protocol (MCP) server that transforms newsletter emails into an organized knowledge system. It's built on top of the GongRzhe/Gmail-MCP-Server and designed for knowledge workers who subscribe to multiple newsletters.

## MCP Server Architecture

The MCP Server module has been implemented with the following components:

1. **McpServerManager** - Initializes and manages the MCP server instance
2. **ToolRegistry** - Registers and manages MCP tools
3. **ResourceRegistry** - Manages MCP resources
4. **PromptRegistry** - Manages MCP prompts
5. **GmailMcpClient** - Communicates with Gmail MCP Server

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/hypat.ai.git
   cd hypat.ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your Gmail API credentials:
   ```
   GMAIL_CLIENT_ID=your_client_id
   GMAIL_CLIENT_SECRET=your_client_secret
   GMAIL_REDIRECT_URI=your_redirect_uri
   ```

### Running the Server

1. Development mode:
   ```bash
   npm run dev
   ```

2. Production mode:
   ```bash
   npm run build
   npm start
   ```

## Authentication

The first time you run the server, you'll need to authenticate with Gmail. Follow these steps:

1. Run the server with the `auth` parameter:
   ```bash
   node dist/index.js auth
   ```

2. A browser window will open asking you to authorize the application.

3. After authorization, you'll be redirected to the callback URL, and the credentials will be saved for future use.

## Adding Custom Tools

You can add custom tools to the MCP server by using the ToolRegistry:

```typescript
// Import necessary modules
import { McpServerManager } from './modules/mcp-server';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Get the tool registry
const mcpServerManager = new McpServerManager();
const toolRegistry = mcpServerManager.getToolRegistry();

// Define the tool schema
const myToolSchema = z.object({
  parameter1: z.string().describe('Description of parameter 1'),
  parameter2: z.number().optional().describe('Description of parameter 2'),
});

// Register the tool
toolRegistry.registerTool({
  name: 'my_tool',
  description: 'Description of my custom tool',
  inputSchema: zodToJsonSchema(myToolSchema),
  handler: async (args) => {
    // Implementation of the tool
    const { parameter1, parameter2 } = args;
    
    // ... do something with the parameters
    
    // Return the result
    return {
      content: [
        {
          type: 'text',
          text: `Result: ${parameter1}, ${parameter2 || 'N/A'}`
        }
      ]
    };
  }
});
```

## License

This project is licensed under the ISC License.

## Acknowledgments

- Built on top of the GongRzhe/Gmail-MCP-Server
- Uses the Model Context Protocol (MCP) for AI assistants