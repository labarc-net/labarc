import { Global, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_CLIENT } from './supabase.constants'
import { SupabaseService } from './supabase.service'

// Re-exported so any other file can keep doing
// `import { SUPABASE_CLIENT } from '.../supabase.module'` unchanged — the
// canonical definition lives in supabase.constants.ts to avoid a circular
// import with SupabaseService.
export { SUPABASE_CLIENT }

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: SUPABASE_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): SupabaseClient | null => {
        const url = config.get<string>('supabase.url')
        const serviceRoleKey = config.get<string>('supabase.serviceRoleKey')

        // Supabase auth/storage are wired up in a later phase — Phase 1
        // only needs the Postgres connection (see DatabaseModule), so it's
        // fine for these env vars to be blank for now.
        if (!url || !serviceRoleKey) {
          return null
        }

        return createClient(url, serviceRoleKey, {
          auth: { persistSession: false },
        })
      },
    },
    SupabaseService,
  ],
  exports: [SUPABASE_CLIENT, SupabaseService],
})
export class SupabaseModule {}
