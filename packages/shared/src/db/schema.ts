import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import {
  SOURCE_KINDS,
  SOURCE_LIFETIME_DAYS,
  SOURCE_STATES,
  SUBSCRIPTION_PLANS,
} from "../constants";

export const userRole = pgEnum("user_role", ["user", "admin"]);

export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  clerkId: text("clerk_id").notNull().unique(),
  stripeCustomerId: text("stripe_customer_id").unique(),
  email: text("email").notNull().unique(),
  role: userRole("role").notNull().default("user"),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const subscriptionPlan = pgEnum("subscription_plan", SUBSCRIPTION_PLANS);

export const subscriptions = pgTable("subscriptions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeEventId: text("stripe_event_id").notNull(),
  stripeEventCreatedAt: timestamp("stripe_event_created_at").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
  plan: subscriptionPlan("plan").notNull(),
  stripePriceId: text("stripe_price_id").notNull(),
  status: text("status").notNull(),
  recurringInterval: text("recurring_interval").notNull(),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;

// --------------- Product ---------------------
export const sourceKind = pgEnum("source_kind", SOURCE_KINDS);
export const sourceState = pgEnum("source_state", SOURCE_STATES);

export const sources = pgTable(
  "sources",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: sourceKind("kind").notNull(),
    title: text("title").notNull(),
    author: text("author").notNull(),
    pageCount: integer("page_count"), // books only
    postCount: integer("post_count"), // blogs only
    address: text("address"), // blogs only
    state: sourceState("state").notNull().default("ingesting"),
    ingestionProgress: integer("ingestion_progress").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true })
      .default(sql.raw(`now() + interval '${SOURCE_LIFETIME_DAYS} days'`))
      .notNull(),
  },
  (table) => [
    index("sources_user_id_idx").on(table.userId),
    index("sources_expires_at_idx").on(table.expiresAt),
  ],
);

export type SourceRow = typeof sources.$inferSelect;
export type NewSourceRow = typeof sources.$inferInsert;
