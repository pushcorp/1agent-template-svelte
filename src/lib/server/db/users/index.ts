import { eq } from "drizzle-orm";
import { user } from "$lib/db/schema";
import { db } from "$lib/server/db/client";

export async function fetchUserById(userId: string) {
  const normalizedUserId = userId.trim();

  if (!normalizedUserId) {
    throw new Error("Invalid user ID.");
  }

  const [row] = await db.select().from(user).where(eq(user.id, normalizedUserId)).limit(1);

  return row ?? null;
}
