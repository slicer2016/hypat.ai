/**
 * Interfaces for Gmail MCP Client
 */
export interface SearchOptions {
    maxResults?: number;
    labelIds?: string[];
    includeSpamTrash?: boolean;
}
export interface GetEmailOptions {
    format?: 'full' | 'metadata' | 'minimal' | 'raw';
    metadataHeaders?: string[];
}
export interface Email {
    id: string;
    threadId?: string;
    labelIds?: string[];
    snippet?: string;
    payload?: any;
    sizeEstimate?: number;
    historyId?: string;
    internalDate?: string;
}
export interface GmailMcpClient {
    connect(): Promise<void>;
    searchEmails(query: string, options: SearchOptions): Promise<Email[]>;
    getEmail(id: string, options: GetEmailOptions): Promise<Email>;
    disconnect(): Promise<void>;
}
