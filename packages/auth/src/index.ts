import { z } from 'zod';

export const UserSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    createdAt: z.date()
});

export type User = z.infer<typeof UserSchema>;

export const createUser = (data: Omit<User, 'id' | 'createdAt'>): User => {
    return {
        id: Math.random().toString(36).substring(2) + Date.now().toString(36),
        createdAt: new Date(),
        ...data
    };
};

export const validateUser = (data: unknown): User => {
    return UserSchema.parse(data);
};
