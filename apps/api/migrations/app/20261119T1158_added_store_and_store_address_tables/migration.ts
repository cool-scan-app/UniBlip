#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/233b254ae61f2ff0c6fe2b3329fe16dd5858313ed314e1d53bc7dace445a7e33/contract';
import startContract from '../../snapshots/233b254ae61f2ff0c6fe2b3329fe16dd5858313ed314e1d53bc7dace445a7e33/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/69506ccadd416f70b6e225d83f896ca0392c4cc0758bc9ef06b375e06d67762e/contract';
import endContract from '../../snapshots/69506ccadd416f70b6e225d83f896ca0392c4cc0758bc9ef06b375e06d67762e/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
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
      this.createIndex({
        schema: 'public',
        table: 'stores',
        index: 'stores_address_id_idx_f563b795',
        columns: ['address_id'],
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
