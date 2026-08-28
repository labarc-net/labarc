import * as bcrypt from 'bcryptjs'

export async function hashPassword(plain: string, saltRounds: number): Promise<string> {
  return bcrypt.hash(plain, saltRounds)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
