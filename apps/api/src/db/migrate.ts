import 'dotenv/config'
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const db_url = process.env.DATABASE_URL
if (!db_url) {
  throw new Error('DATABASE_URL is not defined in the environment variables.')
}


const runMigrations = async () => {
    try {
        const migrationClient = postgres(db_url, { max: 1 });

        await migrate(drizzle(migrationClient), { migrationsFolder: "./drizzle" });
        await migrationClient.end();
    } catch (error) {
        console.error("Error running migrations:", error);
        process.exit(1);
    }
}

export default runMigrations