import { redirect, type Handle } from "@sveltejs/kit";
import { auth } from "$lib/server/auth";

const PROTECTED_PREFIXES = ["/app", "/api/v1"];

export const handle: Handle = async ({ event, resolve }) => {
  const session = await auth.api.getSession({
    headers: event.request.headers,
  });

  event.locals.user = session?.user ?? null;
  event.locals.session = session?.session ?? null;

  const isProtected = PROTECTED_PREFIXES.some((p) =>
    event.url.pathname.startsWith(p),
  );
  if (isProtected && !event.locals.user) {
    redirect(302, "/login");
  }

  return resolve(event);
};
