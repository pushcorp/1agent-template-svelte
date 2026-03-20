import { relations, sql } from "drizzle-orm";
import {
	boolean,
	index,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";

export const userRole = pgEnum("user_role", ["admin", "member"]);
export const postStatus = pgEnum("post_status", [
	"draft",
	"published",
	"archived",
]);

export const users = pgTable(
	"users",
	{
		id: uuid("id").$defaultFn(uuidv7).primaryKey(),
		email: varchar("email", { length: 255 }).notNull(),
		displayName: varchar("display_name", { length: 120 }).notNull(),
		role: userRole("role").default("member").notNull(),
		avatarUrl: text("avatar_url"),
		profile: jsonb("profile")
			.default(sql`'{}'::jsonb`)
			.notNull(),
		isActive: boolean("is_active").default(true).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [uniqueIndex("users_email_key").on(table.email)],
);

export const sessions = pgTable(
	"sessions",
	{
		id: uuid("id").$defaultFn(uuidv7).primaryKey(),
		userId: uuid("user_id")
			.references(() => users.id, { onDelete: "cascade" })
			.notNull(),
		token: text("token").notNull(),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		uniqueIndex("sessions_token_key").on(table.token),
		index("sessions_user_id_idx").on(table.userId),
	],
);

export const posts = pgTable(
	"posts",
	{
		id: uuid("id").$defaultFn(uuidv7).primaryKey(),
		authorId: uuid("author_id").references(() => users.id, {
			onDelete: "set null",
		}),
		slug: varchar("slug", { length: 200 }).notNull(),
		title: varchar("title", { length: 200 }).notNull(),
		excerpt: text("excerpt"),
		body: text("body").notNull(),
		status: postStatus("status").default("draft").notNull(),
		publishedAt: timestamp("published_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		uniqueIndex("posts_slug_key").on(table.slug),
		index("posts_author_id_idx").on(table.authorId),
		index("posts_status_idx").on(table.status),
	],
);

export const usersRelations = relations(users, ({ many }) => ({
	sessions: many(sessions),
	posts: many(posts),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
}));

export const postsRelations = relations(posts, ({ one }) => ({
	author: one(users, {
		fields: [posts.authorId],
		references: [users.id],
	}),
}));
