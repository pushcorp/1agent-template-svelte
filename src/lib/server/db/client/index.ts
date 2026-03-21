import { env } from "$env/dynamic/private";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "$lib/db/schema";

let db: ReturnType<typeof drizzle<typeof schema>>;

export function getDb() {
  if (!db) {
    if (!env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    db = drizzle(postgres(env.DATABASE_URL), { schema });
  }
  return db;
}
