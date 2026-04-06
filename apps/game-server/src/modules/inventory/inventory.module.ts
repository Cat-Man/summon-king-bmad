import { Module } from '@nestjs/common';
import { createInMemoryPlayerInventoryRepository } from '@workspace/db';
import { AccountModule } from '../account/account.module';
import { InventoryController } from './inventory.controller';
import {
  InventoryService,
  PLAYER_INVENTORY_REPOSITORY,
} from './inventory.service';

@Module({
  imports: [AccountModule],
  controllers: [InventoryController],
  providers: [
    InventoryService,
    {
      provide: PLAYER_INVENTORY_REPOSITORY,
      useFactory: () => createInMemoryPlayerInventoryRepository(),
    },
  ],
  exports: [PLAYER_INVENTORY_REPOSITORY],
})
export class InventoryModule {}
