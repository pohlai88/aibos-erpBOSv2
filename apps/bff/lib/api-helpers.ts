import {
    ValidationError,
    NotFoundError,
    BusinessError,
    UnauthorizedError,
    ForbiddenError,
} from '@aibos/contracts/shared/errors';

/**
 * API response helpers for BFF routes
 */

export function ok<T>(data: T, status = 200): Response {
    return Response.json(data, { status });
}

export function created<T>(data: T): Response {
    return Response.json(data, { status: 201 });
}

export function noContent(): Response {
    return new Response(null, { status: 204 });
}

export function badRequest(message: string, field?: string): Response {
    return Response.json(
        {
            error: 'Bad Request',
            message,
            field,
        },
        { status: 400 }
    );
}

export function unauthorized(message: string): Response {
    return Response.json(
        {
            error: 'Unauthorized',
            message,
        },
        { status: 401 }
    );
}

export function forbidden(message: string): Response {
    return Response.json(
        {
            error: 'Forbidden',
            message,
        },
        { status: 403 }
    );
}

export function notFound(message: string, resourceType?: string): Response {
    return Response.json(
        {
            error: 'Not Found',
            message,
            resourceType,
        },
        { status: 404 }
    );
}

export function businessError(message: string, code?: string): Response {
    return Response.json(
        {
            error: 'Business Rule Violation',
            message,
            code,
        },
        { status: 422 }
    );
}

export function internalError(message: string): Response {
    return Response.json(
        {
            error: 'Internal Server Error',
            message,
        },
        { status: 500 }
    );
}

/**
 * Error mapping middleware
 * Maps domain errors to appropriate HTTP responses
 */
export function handleApiError(error: unknown): Response {
    if (error instanceof ValidationError) {
        return badRequest(error.message, error.field);
    }

    if (error instanceof NotFoundError) {
        return notFound(error.message, error.resourceType);
    }

    if (error instanceof BusinessError) {
        return businessError(error.message, error.code);
    }

    if (error instanceof UnauthorizedError) {
        return unauthorized(error.message);
    }

    if (error instanceof ForbiddenError) {
        return forbidden(error.message);
    }

    // Zod validation errors
    if (error && typeof error === 'object' && 'issues' in error) {
        const zodError = error as { issues: Array<{ message: string; path: string[] }> };
        const firstIssue = zodError.issues[0];
        return badRequest(
            firstIssue?.message || 'Validation failed',
            firstIssue?.path.join('.') || undefined
        );
    }

    // Unknown errors
    console.error('[API Error]', error);
    return internalError(
        error instanceof Error ? error.message : 'An unexpected error occurred'
    );
}

/**
 * Route error wrapper HOF
 * Usage: export const POST = withRouteErrors(async (req) => { ... });
 */
export function withRouteErrors<T extends unknown[]>(
    handler: (...args: T) => Promise<Response>
): (...args: T) => Promise<Response> {
    return async (...args: T) => {
        try {
            return await handler(...args);
        } catch (error) {
            return handleApiError(error);
        }
    };
}
