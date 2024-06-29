import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const currencies = sqliteTable('currencies', {
  currencyCode: text('currency_code').primaryKey().notNull(),
  lastUpdated: integer('last_updated').notNull(),
  rates: text('rates').notNull(),
});

export const currencyCodes = sqliteTable('currencyCodes', {
  id: text('id').primaryKey().notNull(),
  currencyCodes: text('currency_codes', { mode: 'json' })
    .notNull()
    .$type<string[]>()
    .default(sql`'[]'`),
  lastUpdated: integer('last_updated').notNull(),
});
