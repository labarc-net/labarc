import * as Joi from 'joi'

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(4000),
  DATABASE_URL: Joi.string().uri().required(),
  SUPABASE_URL: Joi.string().uri().allow('').optional(),
  SUPABASE_ANON_KEY: Joi.string().allow('').optional(),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().allow('').optional(),
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),

  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_TTL: Joi.string().default('15m'),
  JWT_REFRESH_TTL_DAYS: Joi.number().default(7),
  BCRYPT_SALT_ROUNDS: Joi.number().default(12),

  SEED_SUPER_ADMIN_EMAIL: Joi.string().email().allow('').optional(),
  SEED_SUPER_ADMIN_PASSWORD: Joi.string().allow('').optional(),
  SEED_ORG_NAME: Joi.string().allow('').optional(),
  SEED_ORG_SLUG: Joi.string().allow('').optional(),
})
