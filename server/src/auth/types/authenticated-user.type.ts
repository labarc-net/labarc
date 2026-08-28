/** Attached to `request.user` by JwtAuthGuard — see auth/strategies/jwt.strategy.ts. */
export interface AuthenticatedUser {
  id: string
  email: string
  fullName: string
  isSuperAdmin: boolean
}
