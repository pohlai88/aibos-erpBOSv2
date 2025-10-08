/**
 * Domain error types for the AIBOS ERP system
 * These map to specific HTTP status codes in API layer
 */

export class ValidationError extends Error {
    constructor(message: string, public readonly field?: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class NotFoundError extends Error {
    constructor(message: string, public readonly resourceType?: string) {
        super(message);
        this.name = 'NotFoundError';
    }
}

export class BusinessError extends Error {
    constructor(message: string, public readonly code?: string) {
        super(message);
        this.name = 'BusinessError';
    }
}

export class UnauthorizedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ForbiddenError';
    }
}
