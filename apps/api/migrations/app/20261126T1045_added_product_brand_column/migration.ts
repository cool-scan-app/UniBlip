#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/47c223bf6f917aefcb6232b729417eee1029dc021bc75b5e25bb1e1187a36f3d/contract';
import endContract from '../../snapshots/47c223bf6f917aefcb6232b729417eee1029dc021bc75b5e25bb1e1187a36f3d/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/ce85edc050045e7d049f84f1531ea0643dab2c4a210f820a2c780c810f3385f8/contract';
import startContract from '../../snapshots/ce85edc050045e7d049f84f1531ea0643dab2c4a210f820a2c780c810f3385f8/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumnWithTemporaryDefault({
        schema: 'public',
        table: 'products',
        column: 'brand',
        type: 'text',
        temporaryDefault: sql`''`,
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
