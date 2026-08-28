import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { eq } from 'drizzle-orm'
import { createHash, randomUUID } from 'node:crypto'
import { AuditService } from '../audit/audit.service'
import { hashPassword, verifyPassword } from '../common/security/hash.util'
import { DRIZZLE_CLIENT } from '../database/database.module'
import type { DrizzleClient } from '../database/drizzle/client'
import * as schema from '../database/drizzle/schema'
import type { AuthenticatedUser } from './types/authenticated-user.type'

// Exported: AuthController's login()/refresh() infer this in their public
// return type, and with `declaration: true` in tsconfig, TS needs to be
// able to name it in the emitted .d.ts (TS4053 otherwise).
export interface TokenPair {
  accessToken: string
  refreshToken: string
}

interface RefreshTokenPayload {
  sub: string
  jti: string
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  async login(email: string, password: string): Promise<TokenPair & { user: AuthenticatedUser }> {
    const [user] = await this.db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1)

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Invalid credentials.')
    }

    const passwordValid = await verifyPassword(password, user.passwordHash)
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials.')
    }

    const tokens = await this.issueTokens(user.id)
    await this.audit.log({ userId: user.id, action: 'auth.login', entityType: 'user', entityId: user.id })

    return { ...tokens, user: this.toAuthenticatedUser(user) }
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    let payload: RefreshTokenPayload
    try {
      payload = this.jwt.verify<RefreshTokenPayload>(refreshToken, {
        secret: this.config.get<string>('auth.jwtRefreshSecret'),
      })
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.')
    }

    const tokenHash = this.hashToken(refreshToken)
    const [stored] = await this.db
      .select()
      .from(schema.refreshTokens)
      .where(eq(schema.refreshTokens.id, payload.jti))
      .limit(1)

    if (!stored || stored.revokedAt || stored.tokenHash !== tokenHash || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token.')
    }

    // Rotate: revoke the old refresh token, issue a new pair.
    await this.db
      .update(schema.refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(schema.refreshTokens.id, stored.id))

    return this.issueTokens(payload.sub)
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = this.jwt.verify<RefreshTokenPayload>(refreshToken, {
        secret: this.config.get<string>('auth.jwtRefreshSecret'),
      })
      await this.db
        .update(schema.refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(schema.refreshTokens.id, payload.jti))
    } catch {
      // Already invalid/expired — logging out is idempotent either way.
    }
  }

  async findActiveUserById(id: string): Promise<AuthenticatedUser | null> {
    const [user] = await this.db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1)
    if (!user || user.status !== 'active') {
      return null
    }
    return this.toAuthenticatedUser(user)
  }

  async hashPasswordForNewUser(plain: string): Promise<string> {
    const saltRounds = this.config.get<number>('auth.bcryptSaltRounds') ?? 12
    return hashPassword(plain, saltRounds)
  }

  private async issueTokens(userId: string): Promise<TokenPair> {
    const accessToken = this.jwt.sign(
      { sub: userId },
      {
        secret: this.config.get<string>('auth.jwtAccessSecret'),
        expiresIn: this.config.get<string>('auth.jwtAccessTtl'),
      },
    )

    const jti = randomUUID()
    const refreshTtlDays = this.config.get<number>('auth.jwtRefreshTtlDays') ?? 7
    const expiresAt = new Date(Date.now() + refreshTtlDays * 24 * 60 * 60 * 1000)

    const refreshToken = this.jwt.sign(
      { sub: userId, jti },
      {
        secret: this.config.get<string>('auth.jwtRefreshSecret'),
        expiresIn: `${refreshTtlDays}d`,
      },
    )

    await this.db.insert(schema.refreshTokens).values({
      id: jti,
      userId,
      tokenHash: this.hashToken(refreshToken),
      expiresAt,
    })

    return { accessToken, refreshToken }
  }

  private hashToken(token: string): string {
    // Refresh tokens are opaque JWTs already; store a hash rather than the
    // raw token so a leaked database doesn't hand out valid tokens directly.
    return createHash('sha256').update(token).digest('hex')
  }

  private toAuthenticatedUser(user: typeof schema.users.$inferSelect): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isSuperAdmin: user.isSuperAdmin,
    }
  }
}
