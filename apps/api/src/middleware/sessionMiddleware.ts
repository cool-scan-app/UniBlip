import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../types/env';
import { touchSession } from '../services/sessionService';

const BEARER_PATTERN = /^Bearer ([A-Za-z0-9]+)$/;

/**
 * Requires a valid, unexpired session token in `Authorization: Bearer <token>`.
 * On success the session's expiry is extended and the session is available as
 * `c.get('session')`. Otherwise responds with 401 and does not create a session;
 * clients start a session explicitly with `POST /session`.
 */
export const requireSession = createMiddleware<AppEnv>(async (c, next) => {
    const match = c.req.header('Authorization')?.match(BEARER_PATTERN);
    if (!match) {
        return c.json({ error: 'Missing or malformed session token' }, 401);
    }

    const session = await touchSession(match[1]!);
    if (!session) {
        return c.json({ error: 'Session not found or expired' }, 401);
    }

    c.set('session', session);
    await next();
});
