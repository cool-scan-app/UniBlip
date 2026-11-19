#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/01a09d5f17b6807ab384ef194863509277052aa4429b5aecb1eb9deda0a97621/contract';
import endContract from '../../snapshots/01a09d5f17b6807ab384ef194863509277052aa4429b5aecb1eb9deda0a97621/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/8a322251cb614fac8153216146324f2b5d297e1281c6a7e2d45bbd9512ddddc5/contract';
import startContract from '../../snapshots/8a322251cb614fac8153216146324f2b5d297e1281c6a7e2d45bbd9512ddddc5/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey, sql } from '@prisma/orm-postgres/migration';

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
          col('quantity', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
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
      this.createIndex({
        schema: 'public',
        table: 'cart_items',
        index: 'cart_items_cart_id_idx_0b3cd05c',
        columns: ['cart_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'cart_items',
        index: 'cart_items_product_id_idx_22a2b7d2',
        columns: ['product_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'cart_items',
        index: 'cart_items_store_id_idx_e817cc5e',
        columns: ['store_id'],
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
      this.addForeignKey({
        schema: 'public',
        table: 'cart_items',
        foreignKey: {
          name: 'cart_items_cart_id_fkey',
          columns: ['cart_id'],
          references: { schema: 'public', table: 'carts', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'cart_items',
        foreignKey: {
          name: 'cart_items_product_id_fkey',
          columns: ['product_id'],
          references: { schema: 'public', table: 'store_products', columns: ['product_id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'cart_items',
        foreignKey: {
          name: 'cart_items_store_id_fkey',
          columns: ['store_id'],
          references: { schema: 'public', table: 'store_products', columns: ['store_id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'carts',
        foreignKey: {
          name: 'carts_session_id_fkey',
          columns: ['session_id'],
          references: { schema: 'public', table: 'sessions', columns: ['id'] },
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
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
