import { createSession } from '../src/services/sessionService';

async function main() {

    const createdSession = await createSession();
    console.log("Created session:", createdSession);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});