import { db } from '../prisma/db';
import { v4 as UUID } from 'uuid';

const getSessionByTokenHash = async (tokenHash: string) => {
    const session = await db.orm.public.Session
        .select("createdAt", "updatedAt", "expiresAt")
        .where({
        tokenHash: tokenHash,
    }).first();

    return session;
}

const createSession = async (tokenHash: string, expiresAt: Date) => {
    const newSession = await db.orm.public.Session
        .select("createdAt", "updatedAt", "expiresAt")
        .create({
            id: UUID(),
            tokenHash: tokenHash,
            expiresAt: expiresAt,
        });

    return newSession;
}

const updateSession = async (tokenHash: string, expiresAt: Date) => {
    const updatedSession = await db.orm.public.Session
        .select("createdAt", "updatedAt", "expiresAt")
        .where({
            tokenHash: tokenHash,
        })
        .update({
            expiresAt: expiresAt,
        });

    return updatedSession;
}

export { getSessionByTokenHash, createSession, updateSession };