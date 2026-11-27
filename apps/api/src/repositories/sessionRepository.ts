import { db } from '../prisma/db';
import { v4 as UUID } from 'uuid';

const createSession = async (tokenHash: string, expiresAt: Date) => {
    const newSession = await db.orm.public.Session
        .select("id", "createdAt", "updatedAt", "expiresAt")
        .create({
            id: UUID(),
            tokenHash: tokenHash,
            expiresAt: expiresAt,
        });

    return newSession;
}

/**
 * Extends a session that has not yet expired, in a single UPDATE.
 * Returns null if no session matches the hash or it has already expired.
 */
const extendActiveSession = async (tokenHash: string, now: Date, expiresAt: Date) => {
    const updatedSession = await db.orm.public.Session
        .select("id", "createdAt", "updatedAt", "expiresAt")
        .where({ tokenHash: tokenHash })
        .where((s) => s.expiresAt.gt(now))
        .update({
            expiresAt: expiresAt,
            updatedAt: now,
        });

    return updatedSession;
}

/**
 * Deletes all sessions that expired before `now`. Carts cascade with them.
 * Returns the number of deleted sessions.
 */
const deleteExpiredSessions = async (now: Date) => {
    return db.orm.public.Session
        .where((s) => s.expiresAt.lt(now))
        .deleteAndCount();
}

export { createSession, extendActiveSession, deleteExpiredSessions };
