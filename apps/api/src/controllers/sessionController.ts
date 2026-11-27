import { Context } from 'hono';
import * as sessionService from '../services/sessionService';

const getSessionByToken = async (c: Context) => {
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return c.json({ error: 'Missing token' }, 400);
    }
    const session = await sessionService.getSessionByToken(token);
    if (!session) {
        return c.json({ error: 'Session not found' }, 404);
    }
    return c.json(session);
}

const createSession = async (c: Context) => {
    const response = await sessionService.createSession();
    return c.json(response);
}

const updateSession = async (c: Context) => {
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return c.json({ error: 'Missing token' }, 400);
    }
    const updatedSession = await sessionService.updateSession(token);
    if (!updatedSession) {
        return c.json({ error: 'Session not found' }, 404);
    }
    return c.json(updatedSession);
}

export { getSessionByToken, createSession, updateSession };