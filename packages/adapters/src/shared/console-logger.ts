import type { Logger, LogContext } from '@aibos/ports/shared/logger-port';

/**
 * Console logger adapter for development
 * TODO: Replace with Pino adapter for production
 */
export class ConsoleLogger implements Logger {
    info(message: string, context?: LogContext): void {
        console.log(`[INFO] ${message}`, context ? JSON.stringify(context) : '');
    }

    warn(message: string, context?: LogContext): void {
        console.warn(`[WARN] ${message}`, context ? JSON.stringify(context) : '');
    }

    error(message: string, context?: LogContext): void {
        console.error(`[ERROR] ${message}`, context ? JSON.stringify(context) : '');
    }

    debug(message: string, context?: LogContext): void {
        console.debug(`[DEBUG] ${message}`, context ? JSON.stringify(context) : '');
    }
}
