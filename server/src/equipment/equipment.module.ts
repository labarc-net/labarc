import { Module } from '@nestjs/common'
import { QcModule } from '../qc/qc.module'
import { EquipmentController } from './equipment.controller'
import { EquipmentService } from './equipment.service'
import { EquipmentHealthService } from './health/equipment-health.service'

@Module({
  imports: [QcModule],
  controllers: [EquipmentController],
  providers: [EquipmentService, EquipmentHealthService],
  exports: [EquipmentHealthService],
})
export class EquipmentModule {}
