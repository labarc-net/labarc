import { Module } from '@nestjs/common'
import { QcController } from './qc.controller'
import { QcRulesService } from './qc-rules.service'
import { QcService } from './qc.service'

@Module({
  controllers: [QcController],
  providers: [QcService, QcRulesService],
  exports: [QcService, QcRulesService],
})
export class QcModule {}
