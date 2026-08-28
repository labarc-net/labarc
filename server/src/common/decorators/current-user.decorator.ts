import { createParamDecorator, type ExecutionContext } from '@nestjs/common'
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type'

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
  const request = ctx.switchToHttp().getRequest()
  return request.user
})
