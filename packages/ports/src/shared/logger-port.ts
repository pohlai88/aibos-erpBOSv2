/**
 * Logger port - dependency inversion for logging
 * Adapters can implement with Pino, Winston, etc.
 */

export interface LogContext {
    [key: string]: unknown;
}

export interface Logger {
    info(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    error(message: string, context?: LogContext): void;
    debug(message: string, context?: LogContext): void;
}
