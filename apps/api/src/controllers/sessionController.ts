import type { Context } from 'hono';
import type { AppEnv } from '../types/env';
import * as sessionService from '../services/sessionService';

/**
 * Starts a new session. The token is only returned here; the client must send it
 * as `Authorization: Bearer <token>` on routes protected by `requireSession`.
 */
const createSession = async (c: Context) => {
    const { token, session } = await sessionService.createSession();
    return c.json({ token, expiresAt: session.expiresAt }, 201);
}

/**
 * Returns the current session. Runs behind `requireSession`, which has already
 * validated the token and extended the expiry, so this doubles as a keep-alive.
 */
const getSession = (c: Context<AppEnv>) => {
    const session = c.get('session');
    return c.json({ expiresAt: session.expiresAt });
}

export { createSession, getSession };
