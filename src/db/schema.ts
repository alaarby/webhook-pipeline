import { relations } from 'drizzle-orm';
import { pgTable, uuid, text, jsonb, boolean, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import crypto from 'crypto';

export const jobStatusEnum = pgEnum('job_status', ['pending', 'processing', 'completed', 'failed']);

export const pipelines = pgTable('pipelines', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  sourcePath: text('source_path').notNull().unique(), 
  signingSecret: text('signing_secret').notNull().$defaultFn(() => crypto.randomBytes(32).toString('hex')),
  actionType: text('action_type').notNull(), 
  actionConfig: jsonb('action_config'), 
  createdAt: timestamp('created_at').defaultNow(),
});

export const subscribers = pgTable('subscribers', {
  id: uuid('id').primaryKey().defaultRandom(),
  pipelineId: uuid('pipeline_id').references(() => pipelines.id).notNull(),
  targetUrl: text('target_url').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  pipelineId: uuid('pipeline_id').references(() => pipelines.id).notNull(),
  status: jobStatusEnum('status').default('pending'),
  payload: jsonb('payload').notNull(), 
  result: jsonb('result'), 
  error: text('error'), 
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const deliveryAttempts = pgTable('delivery_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').references(() => jobs.id).notNull(),
  subscriberId: uuid('subscriber_id').references(() => subscribers.id).notNull(),
  status: text('status').notNull(), // 'success' or 'failed'
  responseCode: integer('response_code'),
  attemptNumber: integer('attempt_number').default(1),
  createdAt: timestamp('created_at').defaultNow(),
});

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  isActive: boolean('is_active').default(true), 
  createdAt: timestamp('created_at').defaultNow(),
});

export const pipelineRelations = relations(pipelines, ({ many }) => ({
  subscribers: many(subscribers),
  jobs: many(jobs),
}));

export const jobRelations = relations(jobs, ({ one, many }) => ({
  pipeline: one(pipelines, { fields: [jobs.pipelineId], references: [pipelines.id] }),
  attempts: many(deliveryAttempts),
}));