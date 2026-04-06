import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { PlayerModule } from '../player/player.module';
import { BeastController } from './beast.controller';
import { BeastService } from './beast.service';

@Module({
  imports: [AccountModule, PlayerModule],
  controllers: [BeastController],
  providers: [BeastService],
})
export class BeastModule {}
