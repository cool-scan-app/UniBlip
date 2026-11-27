import * as sessionRepo from '../repositories/sessionRepository';
import { hashToken } from '../hashing/hashToken';

const getSessionByToken = async (token: string) => {
    const tokenHash = await hashToken(token);
    return sessionRepo.getSessionByTokenHash(tokenHash);
}

const createSession = async () => {
    const token = crypto.randomUUID();
    const tokenHash = await hashToken(token);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
    const newSession = await sessionRepo.createSession(tokenHash, expiresAt);
    
    return { token, session: newSession };
}

const updateSession = async (token: string) => {
    const tokenHash = await hashToken(token);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
    return sessionRepo.updateSession(tokenHash, expiresAt);
}

export { getSessionByToken, createSession, updateSession };