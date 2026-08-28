import { Inject, Injectable } from '@nestjs/common'
import type { SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_CLIENT } from './supabase.constants'

@Injectable()
export class SupabaseService {
  constructor(@Inject(SUPABASE_CLIENT) private readonly client: SupabaseClient | null) {}

  get isConfigured(): boolean {
    return this.client !== null
  }

  getClient(): SupabaseClient {
    if (!this.client) {
      throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.')
    }
    return this.client
  }
}
