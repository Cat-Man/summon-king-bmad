import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccountModule } from '../modules/account/account.module';
import { BeastModule } from '../modules/beast/beast.module';
import { InventoryModule } from '../modules/inventory/inventory.module';
import { PlayerModule } from '../modules/player/player.module';
import { ResourceModule } from '../modules/resource/resource.module';

@Module({
  imports: [
    AccountModule,
    InventoryModule,
    PlayerModule,
    BeastModule,
    ResourceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
