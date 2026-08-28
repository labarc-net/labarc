/**
 * Kept in its own file, deliberately with no imports of its own.
 * database.module.ts imports DatabaseService, and DatabaseService needs
 * this token — defining the token inside database.module.ts created a
 * circular import (module -> service -> module) where the token read as
 * `undefined` at decorator-evaluation time, mid-cycle, before
 * database.module.ts had finished executing. See DatabaseModule for the
 * re-export that keeps every other file's existing import unchanged.
 */
export const DRIZZLE_CLIENT = 'DRIZZLE_CLIENT'
