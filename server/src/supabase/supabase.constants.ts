/**
 * Kept in its own file for the same reason as database.constants.ts —
 * avoids a circular import between supabase.module.ts and
 * supabase.service.ts that left this token `undefined` at decorator
 * evaluation time.
 */
export const SUPABASE_CLIENT = 'SUPABASE_CLIENT'
