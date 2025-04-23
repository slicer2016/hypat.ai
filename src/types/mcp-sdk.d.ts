declare module '@modelcontextprotocol/sdk/server' {
  export class Server {
    constructor(options: {
      name: string;
      version: string;
      capabilities: {
        tools: Record<string, any>;
      };
    });
    
    connect(transport: any): void;
    setRequestHandler(schema: any, handler: (request: any) => Promise<any>): void;
  }
}

declare module '@modelcontextprotocol/sdk/server/stdio' {
  export class StdioServerTransport {
    constructor();
  }
}

declare module '@modelcontextprotocol/sdk/types' {
  export const ListToolsRequestSchema: any;
  export const CallToolRequestSchema: any;
}