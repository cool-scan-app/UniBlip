import * as sessionRepo from '../repositories/sessionRepository';
import { generateToken, hashToken } from '../hashing/hashToken';

/** How long a session stays valid after it was created or last used. */
export const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

/** Creates a new session and returns the plain token. Only its hash is stored. */
const createSession = async () => {
    const token = generateToken();
    const tokenHash = await hashToken(token);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const session = await sessionRepo.createSession(tokenHash, expiresAt);

    return { token, session };
}

/**
 * Looks up a session by token and extends its expiry (sliding expiration).
 * Returns null if the token is unknown or the session has expired.
 */
const touchSession = async (token: string) => {
    const tokenHash = await hashToken(token);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

    return sessionRepo.extendActiveSession(tokenHash, now, expiresAt);
}

/** Removes expired sessions (and, via cascade, their carts). */
const deleteExpiredSessions = async () => {
    return sessionRepo.deleteExpiredSessions(new Date());
}

export { createSession, touchSession, deleteExpiredSessions };
