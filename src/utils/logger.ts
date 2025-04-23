/**
 * Logger Utility
 * Simple logger for the application
 */

/**
 * Logger levels
 */
export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

/**
 * Logger implementation
 */
export class Logger {
  private module: string;
  private level: LogLevel = LogLevel.INFO; // Default level

  constructor(module: string) {
    this.module = module;
  }

  /**
   * Set the log level
   * @param level The log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Log an error message
   * @param message The message to log
   * @param error Optional error object
   */
  error(message: string, error?: Error): void {
    this.log(LogLevel.ERROR, message, error);
  }

  /**
   * Log a warning message
   * @param message The message to log
   */
  warn(message: string): void {
    this.log(LogLevel.WARN, message);
  }

  /**
   * Log an info message
   * @param message The message to log
   */
  info(message: string): void {
    this.log(LogLevel.INFO, message);
  }

  /**
   * Log a debug message
   * @param message The message to log
   */
  debug(message: string): void {
    this.log(LogLevel.DEBUG, message);
  }

  /**
   * Log a message with a specific level
   * @param level The log level
   * @param message The message to log
   * @param error Optional error object
   */
  private log(level: LogLevel, message: string, error?: Error): void {
    // Check if we should log this level
    if (!this.shouldLog(level)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level}] [${this.module}] ${message}`;

    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage);
        if (error) {
          console.error(error);
        }
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
    }
  }

  /**
   * Check if we should log a message with the given level
   * @param level The log level to check
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const currentLevelIndex = levels.indexOf(this.level);
    const levelIndex = levels.indexOf(level);

    return levelIndex <= currentLevelIndex;
  }
}