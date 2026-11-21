#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/233b254ae61f2ff0c6fe2b3329fe16dd5858313ed314e1d53bc7dace445a7e33/contract';
import startContract from '../../snapshots/233b254ae61f2ff0c6fe2b3329fe16dd5858313ed314e1d53bc7dace445a7e33/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/8a322251cb614fac8153216146324f2b5d297e1281c6a7e2d45bbd9512ddddc5/contract';
import endContract from '../../snapshots/8a322251cb614fac8153216146324f2b5d297e1281c6a7e2d45bbd9512ddddc5/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
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
        table: 'store_addresses',
        columns: [
          col('city', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('postal_code', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('street', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('street_nr', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
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
      this.createTable({
        schema: 'public',
        table: 'stores',
        columns: [
          col('address_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('latitude', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
          col('longitude', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'products',
        constraint: 'products_barcode_key',
        columns: ['barcode'],
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
      this.createIndex({
        schema: 'public',
        table: 'stores',
        index: 'stores_address_id_idx_f563b795',
        columns: ['address_id'],
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
      this.addForeignKey({
        schema: 'public',
        table: 'stores',
        foreignKey: {
          name: 'stores_address_id_fkey',
          columns: ['address_id'],
          references: { schema: 'public', table: 'store_addresses', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
