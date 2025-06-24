import { pgTable, serial, text, varchar, timestamp, boolean, integer } from 'drizzle-orm/pg-core';
export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    clerkId: varchar('clerk_id', { length: 256 }).notNull().unique(),
    email: varchar('email', { length: 256 }).notNull().unique(),
});
export const tasks = pgTable('tasks', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    content: text('content').notNull(),
    category: varchar('category', { length: 128 }),
    completed: boolean('completed').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
