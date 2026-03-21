import { building } from "$app/environment";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "$lib/server/db/client";
import * as schema from "$lib/db/schema";
import { uuidv7 } from "uuidv7";

function createAuth() {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    emailAndPassword: {
      enabled: true,
    },
    advanced: {
      database: {
        generateId: () => uuidv7(),
      },
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          defaultValue: "member",
          input: false,
        },
        profile: {
          type: "string",
          defaultValue: "{}",
          input: false,
        },
        isActive: {
          type: "boolean",
          defaultValue: true,
          input: false,
        },
      },
    },
  });
}

export const auth = building ? (null as unknown as ReturnType<typeof createAuth>) : createAuth();
