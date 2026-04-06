import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PlayerModule } from '../player/player.module';
import { ResourceModule } from '../resource/resource.module';
import { BeastController } from './beast.controller';
import { BeastService } from './beast.service';

@Module({
  imports: [AccountModule, PlayerModule, InventoryModule, ResourceModule],
  controllers: [BeastController],
  providers: [BeastService],
})
export class BeastModule {}
