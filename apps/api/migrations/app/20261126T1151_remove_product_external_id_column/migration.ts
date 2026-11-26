#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/3f3e706e179d5c5d73f3f607a5d5d4a23ad97c8968ea72c188f94982bfcf2bf9/contract';
import endContract from '../../snapshots/3f3e706e179d5c5d73f3f607a5d5d4a23ad97c8968ea72c188f94982bfcf2bf9/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/ef7b4393f9e547660c1cf622e758b9292e664054136c050acb4d1203d20fd715/contract';
import startContract from '../../snapshots/ef7b4393f9e547660c1cf622e758b9292e664054136c050acb4d1203d20fd715/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [this.dropColumn({ schema: 'public', table: 'products', column: 'external_id' })];
  }
}

MigrationCLI.run(import.meta.url, M);
