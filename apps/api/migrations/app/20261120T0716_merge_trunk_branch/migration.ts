#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/69506ccadd416f70b6e225d83f896ca0392c4cc0758bc9ef06b375e06d67762e/contract';
import startContract from '../../snapshots/69506ccadd416f70b6e225d83f896ca0392c4cc0758bc9ef06b375e06d67762e/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/ce85edc050045e7d049f84f1531ea0643dab2c4a210f820a2c780c810f3385f8/contract';
import endContract from '../../snapshots/ce85edc050045e7d049f84f1531ea0643dab2c4a210f820a2c780c810f3385f8/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  col,
  fn,
  lit,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'cart_items',
        columns: [
          col('cart_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('product_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('quantity', 'int4', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('store_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['cart_id', 'product_id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'carts',
        columns: [
          col('created_at', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('session_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('store_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'products',
        columns: [
          col('barcode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('external_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'store_products',
        columns: [
          col('price', 'money', { notNull: true, codecRef: { codecId: 'pg/money@1' } }),
          col('product_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('store_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['store_id', 'product_id'])],
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'store_addresses',
        column: 'postal_code',
        type: 'text',
        operationClass: 'widening',
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'store_addresses',
        column: 'street_nr',
        type: 'text',
        operationClass: 'widening',
      }),
      this.addUnique({
        schema: 'public',
        table: 'carts',
        constraint: 'carts_id_store_id_key',
        columns: ['id', 'store_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'carts',
        constraint: 'carts_session_id_store_id_key',
        columns: ['session_id', 'store_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'products',
        constraint: 'products_barcode_key',
        columns: ['barcode'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'cart_items',
        index: 'cart_items_cart_id_store_id_idx_5c3d078b',
        columns: ['cart_id', 'store_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'cart_items',
        index: 'cart_items_product_id_store_id_idx_2afee116',
        columns: ['product_id', 'store_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'carts',
        index: 'carts_session_id_idx_00ba47bf',
        columns: ['session_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'carts',
        index: 'carts_store_id_idx_e817cc5e',
        columns: ['store_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'store_products',
        index: 'store_products_product_id_idx_22a2b7d2',
        columns: ['product_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'store_products',
        index: 'store_products_store_id_idx_e817cc5e',
        columns: ['store_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'cart_items',
        foreignKey: {
          name: 'cart_items_cart_id_store_id_fkey',
          columns: ['cart_id', 'store_id'],
          references: { schema: 'public', table: 'carts', columns: ['id', 'store_id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'cart_items',
        foreignKey: {
          name: 'cart_items_product_id_store_id_fkey',
          columns: ['product_id', 'store_id'],
          references: {
            schema: 'public',
            table: 'store_products',
            columns: ['product_id', 'store_id'],
          },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'carts',
        foreignKey: {
          name: 'carts_session_id_fkey',
          columns: ['session_id'],
          references: { schema: 'public', table: 'sessions', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'carts',
        foreignKey: {
          name: 'carts_store_id_fkey',
          columns: ['store_id'],
          references: { schema: 'public', table: 'stores', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'store_products',
        foreignKey: {
          name: 'store_products_store_id_fkey',
          columns: ['store_id'],
          references: { schema: 'public', table: 'stores', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'store_products',
        foreignKey: {
          name: 'store_products_product_id_fkey',
          columns: ['product_id'],
          references: { schema: 'public', table: 'products', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
