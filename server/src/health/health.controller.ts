import { Controller, Get } from '@nestjs/common'
import { HealthCheck, HealthCheckService, type HealthIndicatorResult } from '@nestjs/terminus'
import { Public } from '../common/decorators/public.decorator'
import { DatabaseService } from '../database/database.service'

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: DatabaseService,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => {
        const isHealthy = await this.db.pingDatabase()
        return {
          database: { status: isHealthy ? 'up' : 'down' },
        }
      },
    ])
  }
}
