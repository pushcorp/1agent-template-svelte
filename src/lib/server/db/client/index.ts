import { building } from "$app/environment";
import { DATABASE_URL } from "$env/static/private";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "$lib/db/schema";

const client = building ? null : postgres(DATABASE_URL);
export const db = client
  ? drizzle(client, { schema })
  : (null as unknown as ReturnType<typeof drizzle<typeof schema>>);
