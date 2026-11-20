#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/01a09d5f17b6807ab384ef194863509277052aa4429b5aecb1eb9deda0a97621/contract';
import startContract from '../../snapshots/01a09d5f17b6807ab384ef194863509277052aa4429b5aecb1eb9deda0a97621/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/ce85edc050045e7d049f84f1531ea0643dab2c4a210f820a2c780c810f3385f8/contract';
import endContract from '../../snapshots/ce85edc050045e7d049f84f1531ea0643dab2c4a210f820a2c780c810f3385f8/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropConstraint({
        schema: 'public',
        table: 'cart_items',
        constraint: 'cart_items_cart_id_fkey',
        kind: 'foreignKey',
      }),
      this.dropConstraint({
        schema: 'public',
        table: 'cart_items',
        constraint: 'cart_items_product_id_fkey',
        kind: 'foreignKey',
      }),
      this.dropConstraint({
        schema: 'public',
        table: 'cart_items',
        constraint: 'cart_items_store_id_fkey',
        kind: 'foreignKey',
      }),
      this.dropConstraint({
        schema: 'public',
        table: 'carts',
        constraint: 'carts_session_id_fkey',
        kind: 'foreignKey',
      }),
      this.dropIndex({
        schema: 'public',
        table: 'cart_items',
        index: 'cart_items_cart_id_idx_0b3cd05c',
      }),
      this.dropIndex({
        schema: 'public',
        table: 'cart_items',
        index: 'cart_items_product_id_idx_22a2b7d2',
      }),
      this.dropIndex({
        schema: 'public',
        table: 'cart_items',
        index: 'cart_items_store_id_idx_e817cc5e',
      }),
      this.setDefault({
        schema: 'public',
        table: 'cart_items',
        column: col('quantity', 'int4', { default: lit(1), codecRef: { codecId: 'pg/int4@1' } }),
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
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
