import { z } from 'zod';

export const createId = (): string => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const validateEmail = (email: string): boolean => {
    const emailSchema = z.string().email();
    return emailSchema.safeParse(email).success;
};

export const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0]!;
};

export const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => (globalThis as any).setTimeout(resolve, ms));
};
