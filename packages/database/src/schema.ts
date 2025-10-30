import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const challengeTable = pgTable('challenge', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  instructions: text('instructions').notNull(),
  // e.g. https://github.com/huan231/toml-nodejs.git
  repositoryUrl: text('repository_url').notNull(),
  // e.g. 72
  startIn: integer('start_in').notNull(),
  // e.g. 48
  completeIn: integer('complete_in').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const assignmentTable = pgTable('assignment', {
  id: serial('id').primaryKey(),
  candidateEmail: text('candidate_email').notNull(),
  hash: text('hash').notNull().unique(),
  challengeId: integer('challenge_id')
    .notNull()
    .references(() => challengeTable.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  closesAt: timestamp('closes_at'),
  commit: text('commit'),
  updatedAt: timestamp('updated_at')
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Challenge = typeof challengeTable.$inferSelect;
export type Assignment = typeof assignmentTable.$inferSelect;
