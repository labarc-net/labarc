import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { and, eq } from 'drizzle-orm'
import { AuditService } from '../audit/audit.service'
import { AuthService } from '../auth/auth.service'
import { DRIZZLE_CLIENT } from '../database/database.module'
import type { DrizzleClient } from '../database/drizzle/client'
import * as schema from '../database/drizzle/schema'
import type { InviteMemberDto } from './dto/invite-member.dto'
import type { UpdateMembershipDto } from './dto/update-membership.dto'

@Injectable()
export class MembershipsService {
  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly authService: AuthService,
    private readonly audit: AuditService,
  ) {}

  async list(organizationId: string) {
    return this.db
      .select({
        membershipId: schema.memberships.id,
        userId: schema.users.id,
        email: schema.users.email,
        fullName: schema.users.fullName,
        roleKey: schema.roles.key,
        roleName: schema.roles.name,
        departmentId: schema.memberships.departmentId,
        status: schema.memberships.status,
      })
      .from(schema.memberships)
      .innerJoin(schema.users, eq(schema.users.id, schema.memberships.userId))
      .innerJoin(schema.roles, eq(schema.roles.id, schema.memberships.roleId))
      .where(eq(schema.memberships.organizationId, organizationId))
  }

  async invite(organizationId: string, dto: InviteMemberDto, actingUserId: string) {
    const [role] = await this.db.select().from(schema.roles).where(eq(schema.roles.key, dto.roleKey)).limit(1)
    if (!role) {
      throw new NotFoundException(`Unknown role "${dto.roleKey}". Run "pnpm run db:seed" to seed system roles.`)
    }

    let [user] = await this.db.select().from(schema.users).where(eq(schema.users.email, dto.email)).limit(1)

    if (!user) {
      const passwordHash = await this.authService.hashPasswordForNewUser(dto.temporaryPassword)
      ;[user] = await this.db
        .insert(schema.users)
        .values({ email: dto.email, fullName: dto.fullName, passwordHash })
        .returning()
    }

    const existingMembership = await this.db
      .select()
      .from(schema.memberships)
      .where(and(eq(schema.memberships.userId, user.id), eq(schema.memberships.organizationId, organizationId)))
      .limit(1)

    if (existingMembership.length > 0) {
      throw new ConflictException('This user is already a member of the organization.')
    }

    const [membership] = await this.db
      .insert(schema.memberships)
      .values({
        userId: user.id,
        organizationId,
        roleId: role.id,
        departmentId: dto.departmentId ?? null,
      })
      .returning()

    await this.audit.log({
      userId: actingUserId,
      organizationId,
      action: 'membership.invite',
      entityType: 'membership',
      entityId: membership.id,
      metadata: { invitedEmail: dto.email, roleKey: dto.roleKey },
    })

    return membership
  }

  async update(organizationId: string, membershipId: string, dto: UpdateMembershipDto, actingUserId: string) {
    const [existing] = await this.db
      .select()
      .from(schema.memberships)
      .where(and(eq(schema.memberships.id, membershipId), eq(schema.memberships.organizationId, organizationId)))
      .limit(1)

    if (!existing) {
      throw new NotFoundException('Membership not found.')
    }

    let roleId = existing.roleId
    if (dto.roleKey) {
      const [role] = await this.db.select().from(schema.roles).where(eq(schema.roles.key, dto.roleKey)).limit(1)
      if (!role) {
        throw new NotFoundException(`Unknown role "${dto.roleKey}".`)
      }
      roleId = role.id
    }

    const [membership] = await this.db
      .update(schema.memberships)
      .set({
        roleId,
        departmentId: dto.departmentId ?? existing.departmentId,
        status: dto.status ?? existing.status,
        updatedAt: new Date(),
      })
      .where(eq(schema.memberships.id, membershipId))
      .returning()

    await this.audit.log({
      userId: actingUserId,
      organizationId,
      action: 'membership.update',
      entityType: 'membership',
      entityId: membershipId,
      metadata: dto,
    })

    return membership
  }
}
