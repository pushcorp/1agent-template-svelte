import { eq } from "drizzle-orm";
import { users } from "$lib/db/schema";
import { db } from "$lib/server/db/client";

export async function fetchUserById(userId: string) {
	const normalizedUserId = userId.trim();

	if (!normalizedUserId) {
		throw new Error("Invalid user ID.");
	}

	const [row] = await db
		.select()
		.from(users)
		.where(eq(users.id, normalizedUserId))
		.limit(1);

	return row ?? null;
}
