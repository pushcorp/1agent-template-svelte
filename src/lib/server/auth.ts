import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "$lib/server/db/client";
import * as schema from "$lib/db/schema";
import { uuidv7 } from "uuidv7";

export type Auth = ReturnType<typeof createAuth>;

function createAuth() {
  return betterAuth({
    database: drizzleAdapter(getDb(), {
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

let auth: Auth;

export function getAuth() {
  if (!auth) {
    auth = createAuth();
  }
  return auth;
}
