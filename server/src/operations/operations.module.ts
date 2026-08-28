import { Module } from '@nestjs/common'
import { TatModule } from './tat/tat.module'
import { WorkflowModule } from './workflow/workflow.module'
import { WorkforceModule } from './workforce/workforce.module'

@Module({
  imports: [WorkflowModule, WorkforceModule, TatModule],
})
export class OperationsModule {}
