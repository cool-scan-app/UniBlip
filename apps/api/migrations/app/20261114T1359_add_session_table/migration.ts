#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/41e2fa3dd9276fac03e9c56e90040075acb267486c0d70e92200cc507ca26090/contract';
import endContract from '../../snapshots/41e2fa3dd9276fac03e9c56e90040075acb267486c0d70e92200cc507ca26090/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/9bf8aeae06a5973ab4d772c6d18173111325cd62f4b6357ac9d97edb7a879928/contract';
import startContract from '../../snapshots/9bf8aeae06a5973ab4d772c6d18173111325cd62f4b6357ac9d97edb7a879928/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'sessions',
        columns: [
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('expiresAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
