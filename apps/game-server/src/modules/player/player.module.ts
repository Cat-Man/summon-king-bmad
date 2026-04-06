import { Module } from '@nestjs/common';
import { createInMemoryPlayerInitializationRepository } from '@workspace/db';
import { AccountModule } from '../account/account.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PlayerController } from './player.controller';
import {
  PLAYER_INITIALIZATION_REPOSITORY,
  PlayerService,
} from './player.service';

@Module({
  imports: [AccountModule, InventoryModule],
  controllers: [PlayerController],
  providers: [
    PlayerService,
    {
      provide: PLAYER_INITIALIZATION_REPOSITORY,
      useFactory: () => createInMemoryPlayerInitializationRepository(),
    },
  ],
  exports: [PLAYER_INITIALIZATION_REPOSITORY],
})
export class PlayerModule {}
