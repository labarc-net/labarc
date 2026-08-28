import { Module } from '@nestjs/common'
import { InventoryController } from './inventory.controller'
import { InventoryRulesService } from './inventory-rules.service'
import { InventoryService } from './inventory.service'

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, InventoryRulesService],
})
export class InventoryModule {}
