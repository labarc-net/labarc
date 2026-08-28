import { Global, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { DRIZZLE_CLIENT } from './database.constants'
import { DatabaseService } from './database.service'
import { createDrizzleClient } from './drizzle/client'

// Re-exported so every other module in the app can keep doing
// `import { DRIZZLE_CLIENT } from '.../database.module'` unchanged — the
// canonical definition lives in database.constants.ts to avoid a circular
// import with DatabaseService (see that file for why).
export { DRIZZLE_CLIENT }

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DRIZZLE_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('database.url')
        if (!url) {
          throw new Error('DATABASE_URL is not configured')
        }
        return createDrizzleClient(url)
      },
    },
    DatabaseService,
  ],
  exports: [DRIZZLE_CLIENT, DatabaseService],
})
export class DatabaseModule {}
