/**
 * Dev-only: crea/actualiza usuario ADMIN local para la consola de disputas (SPEC-10 beta).
 */
import { PrismaClient } from '@prisma/client';
import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 32);
  return `scrypt$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

const EMAIL = 'admin@taskstream.local';
const PASSWORD = 'password-ok';
const DISPLAY = 'Admin TaskStream';

const prisma = new PrismaClient();

try {
  const passwordHash = await hashPassword(PASSWORD);
  let user = await prisma.user.findUnique({ where: { email: EMAIL } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: EMAIL,
        passwordHash,
        displayName: DISPLAY,
        countryCode: 'CO',
        activeMode: 'BUYER',
        platformRole: 'ADMIN',
      },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        displayName: DISPLAY,
        platformRole: 'ADMIN',
      },
    });
  }

  console.log(
    JSON.stringify(
      {
        status: user ? 'READY' : 'FAILED',
        email: EMAIL,
        password: PASSWORD,
        displayName: DISPLAY,
        userId: user.id,
        platformRole: user.platformRole,
        note: 'Login local → /admin/disputes (solo platformRole ADMIN).',
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
