#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/233b254ae61f2ff0c6fe2b3329fe16dd5858313ed314e1d53bc7dace445a7e33/contract';
import endContract from '../../snapshots/233b254ae61f2ff0c6fe2b3329fe16dd5858313ed314e1d53bc7dace445a7e33/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/41e2fa3dd9276fac03e9c56e90040075acb267486c0d70e92200cc507ca26090/contract';
import startContract from '../../snapshots/41e2fa3dd9276fac03e9c56e90040075acb267486c0d70e92200cc507ca26090/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropColumn({ schema: 'public', table: 'sessions', column: 'createdAt' }),
      this.dropColumn({ schema: 'public', table: 'sessions', column: 'expiresAt' }),
      this.addColumn({
        schema: 'public',
        table: 'sessions',
        column: col('created_at', 'timestamptz(3)', {
          notNull: true,
          default: fn(sql`now()`),
          codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'sessions',
        column: col('updated_at', 'timestamptz(3)', {
          notNull: true,
          default: fn(sql`now()`),
          codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
        }),
      }),
      this.addColumnWithTemporaryDefault({
        schema: 'public',
        table: 'sessions',
        column: 'expires_at',
        type: 'timestamptz(3)',
        temporaryDefault: sql`'epoch'`,
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
