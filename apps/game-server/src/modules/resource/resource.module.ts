import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ResourceController } from './resource.controller';
import {
  createRewardAuditLogRepository,
  ResourceService,
  REWARD_AUDIT_LOG_REPOSITORY,
} from './resource.service';

@Module({
  imports: [AccountModule, InventoryModule],
  controllers: [ResourceController],
  providers: [
    ResourceService,
    {
      provide: REWARD_AUDIT_LOG_REPOSITORY,
      useFactory: createRewardAuditLogRepository,
    },
  ],
})
export class ResourceModule {}
