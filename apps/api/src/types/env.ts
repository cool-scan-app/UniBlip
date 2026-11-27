import type { touchSession } from '../services/sessionService';

/** The session row as returned by the session service. */
export type Session = NonNullable<Awaited<ReturnType<typeof touchSession>>>;

export type AppEnv = {
    Variables: {
        session: Session;
    };
}
