import { createAuthClient } from "better-auth/svelte";

export const authClient = createAuthClient({
  basePath: "/api/v1/auth",
});
