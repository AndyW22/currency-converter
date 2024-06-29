import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const currencies = sqliteTable('currencies', {
  currencyCode: text('currency_code').primaryKey().notNull(),
  description: text('description'),
  rates: text('rates').notNull(),
});
