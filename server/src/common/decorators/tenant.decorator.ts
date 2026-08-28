import { createParamDecorator, type ExecutionContext } from '@nestjs/common'
import type { TenantContext } from '../types/tenant-context.type'

export const Tenant = createParamDecorator((_data: unknown, ctx: ExecutionContext): TenantContext => {
  const request = ctx.switchToHttp().getRequest()
  return request.tenant
})
