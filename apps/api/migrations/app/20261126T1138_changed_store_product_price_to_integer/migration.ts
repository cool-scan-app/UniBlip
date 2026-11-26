#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/47c223bf6f917aefcb6232b729417eee1029dc021bc75b5e25bb1e1187a36f3d/contract';
import startContract from '../../snapshots/47c223bf6f917aefcb6232b729417eee1029dc021bc75b5e25bb1e1187a36f3d/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/ef7b4393f9e547660c1cf622e758b9292e664054136c050acb4d1203d20fd715/contract';
import endContract from '../../snapshots/ef7b4393f9e547660c1cf622e758b9292e664054136c050acb4d1203d20fd715/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropColumn({ schema: 'public', table: 'store_products', column: 'price' }),
      this.addColumnWithTemporaryDefault({
        schema: 'public',
        table: 'store_products',
        column: 'price_in_cents',
        type: 'int4',
        temporaryDefault: sql`0`,
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
