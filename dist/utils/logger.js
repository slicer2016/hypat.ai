/**
 * Simple logger utility for consistent logging across the application
 */
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (LogLevel = {}));
class Logger {
    constructor(context) {
        this.context = context;
        // Set default log level based on environment
        this.logLevel = process.env.NODE_ENV === 'production'
            ? LogLevel.INFO
            : LogLevel.DEBUG;
    }
    setLogLevel(level) {
        this.logLevel = level;
    }
    formatMessage(level, message) {
        const timestamp = new Date().toISOString();
        return `${timestamp} [${level}] [${this.context}] ${message}`;
    }
    debug(message, ...args) {
        if (this.logLevel <= LogLevel.DEBUG) {
            console.debug(this.formatMessage('DEBUG', message), ...args);
        }
    }
    info(message, ...args) {
        if (this.logLevel <= LogLevel.INFO) {
            console.info(this.formatMessage('INFO', message), ...args);
        }
    }
    warn(message, ...args) {
        if (this.logLevel <= LogLevel.WARN) {
            console.warn(this.formatMessage('WARN', message), ...args);
        }
    }
    error(message, ...args) {
        if (this.logLevel <= LogLevel.ERROR) {
            console.error(this.formatMessage('ERROR', message), ...args);
        }
    }
}
export { Logger, LogLevel };
//# sourceMappingURL=logger.js.map