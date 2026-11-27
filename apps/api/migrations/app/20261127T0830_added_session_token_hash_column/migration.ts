#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/3f3e706e179d5c5d73f3f607a5d5d4a23ad97c8968ea72c188f94982bfcf2bf9/contract';
import startContract from '../../snapshots/3f3e706e179d5c5d73f3f607a5d5d4a23ad97c8968ea72c188f94982bfcf2bf9/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/a32c4e8e89dd71ee7116b7d8b7f82b73253a43fc811f22a3bc24b218ed02722e/contract';
import endContract from '../../snapshots/a32c4e8e89dd71ee7116b7d8b7f82b73253a43fc811f22a3bc24b218ed02722e/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addRequiredColumnToEmptyTable({
        schema: 'public',
        table: 'sessions',
        column: 'token_hash',
        type: 'text',
      }),
      this.addUnique({
        schema: 'public',
        table: 'sessions',
        constraint: 'sessions_token_hash_key',
        columns: ['token_hash'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
