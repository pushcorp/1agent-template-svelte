import { type Handle, redirect } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import { getAuth } from "$lib/server/auth";

const PROTECTED_PREFIXES = ["/app", "/api/v1"];

export const handle: Handle = async ({ event, resolve }) => {
  if (env.DATABASE_URL) {
    const session = await getAuth().api.getSession({
      headers: event.request.headers,
    });

    event.locals.user = session?.user ?? null;
    event.locals.session = session?.session ?? null;
  } else {
    event.locals.user = null;
    event.locals.session = null;
  }

  const isProtected = PROTECTED_PREFIXES.some((p) => event.url.pathname.startsWith(p));
  if (isProtected && !event.locals.user) {
    redirect(302, "/login");
  }

  return resolve(event);
};
