import { getAuth } from "$lib/server/auth";
import type { RequestHandler } from "./$types";

const handler: RequestHandler = async (event) => {
  return getAuth().handler(event.request);
};

export const GET = handler;
export const POST = handler;
