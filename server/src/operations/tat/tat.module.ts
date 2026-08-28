import { Module } from '@nestjs/common'
import { TatController } from './tat.controller'
import { TatService } from './tat.service'

@Module({
  controllers: [TatController],
  providers: [TatService],
})
export class TatModule {}
