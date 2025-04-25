/**
 * Simple logger utility for consistent logging across the application
 */
declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
declare class Logger {
    private context;
    private logLevel;
    constructor(context: string);
    setLogLevel(level: LogLevel): void;
    private formatMessage;
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
}
export { Logger, LogLevel };
