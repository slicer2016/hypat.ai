/**
 * GmailMcpClient - Communicates with Gmail MCP Server
 */
import { Email, GmailMcpClient as IGmailMcpClient, GetEmailOptions, SearchOptions } from '../../interfaces/gmail-mcp.js';
declare class GmailMcpClient implements IGmailMcpClient {
    private gmailMcpServer;
    private isConnected;
    private logger;
    constructor();
    /**
     * Connect to the Gmail MCP Server
     */
    connect(): Promise<void>;
    /**
     * Search for emails using Gmail query syntax
     */
    searchEmails(query: string, options?: SearchOptions): Promise<Email[]>;
    /**
     * Get detailed information about a specific email
     */
    getEmail(id: string, options?: GetEmailOptions): Promise<Email>;
    /**
     * Disconnect from the Gmail MCP Server
     */
    disconnect(): Promise<void>;
    /**
     * Ensure that the client is connected before making requests
     */
    private ensureConnected;
}
export { GmailMcpClient };
