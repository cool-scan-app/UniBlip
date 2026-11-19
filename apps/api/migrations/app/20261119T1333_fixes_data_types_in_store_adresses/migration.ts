#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/cb29d9cf5add1f3f4f8c7ec8bd2755a4505e5c29623df4ea659d82e385687ac7/contract';
import startContract from '../../snapshots/cb29d9cf5add1f3f4f8c7ec8bd2755a4505e5c29623df4ea659d82e385687ac7/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/ce85edc050045e7d049f84f1531ea0643dab2c4a210f820a2c780c810f3385f8/contract';
import endContract from '../../snapshots/ce85edc050045e7d049f84f1531ea0643dab2c4a210f820a2c780c810f3385f8/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
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
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
