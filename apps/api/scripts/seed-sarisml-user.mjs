/**
 * Dev-only: crea/actualiza un usuario local con wallet testnet de compañero
 * ($ilp.interledger-test.dev/sarisml) ya verificada, sin pasar por GNAP.
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

const WALLET = 'https://ilp.interledger-test.dev/sarisml';
const EMAIL = 'sarisml@taskstream.local';
const PASSWORD = 'password-ok';
const DISPLAY = 'Saris ML (testnet)';

const prisma = new PrismaClient();

try {
  const existingWallet = await prisma.userWallet.findUnique({
    where: { walletAddressUrl: WALLET },
  });

  if (existingWallet) {
    const passwordHash = await hashPassword(PASSWORD);
    await prisma.user.update({
      where: { id: existingWallet.userId },
      data: {
        passwordHash,
        displayName: DISPLAY,
        activeMode: 'SELLER',
      },
    });
    await prisma.userWallet.updateMany({
      where: { userId: existingWallet.userId, isActive: true, NOT: { id: existingWallet.id } },
      data: { isActive: false },
    });
    await prisma.userWallet.update({
      where: { id: existingWallet.id },
      data: {
        isVerified: true,
        isActive: true,
        verifiedAt: new Date(),
        assetCode: 'USD',
        assetScale: 2,
        authServerUrl: 'https://auth.interledger-test.dev',
        resourceServerUrl: 'https://ilp.interledger-test.dev',
      },
    });
    const user = await prisma.user.findUnique({ where: { id: existingWallet.userId } });
    const profile = await prisma.sellerProfile.findUnique({ where: { userId: existingWallet.userId } });
    if (!profile) {
      await prisma.sellerProfile.create({
        data: {
          userId: existingWallet.userId,
          headline: 'Freelancer de prueba (wallet compañero)',
          bio: 'Cuenta sembrada localmente para validar SPEC-05 con billetera testnet de compañero.',
          skills: ['testing'],
          languages: ['es'],
          webMonetizationEnabled: true,
        },
      });
    }
    console.log(
      JSON.stringify(
        {
          status: 'UPDATED_EXISTING_WALLET',
          email: user?.email,
          password: PASSWORD,
          displayName: DISPLAY,
          userId: existingWallet.userId,
          walletAddressUrl: WALLET,
          paymentPointer: '$ilp.interledger-test.dev/sarisml',
          note: 'Contraseña reseteada + wallet forzada a isVerified/isActive (solo local/dev).',
        },
        null,
        2,
      ),
    );
    process.exit(0);
  }

  let user = await prisma.user.findUnique({ where: { email: EMAIL } });
  const passwordHash = await hashPassword(PASSWORD);

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: EMAIL,
        passwordHash,
        displayName: DISPLAY,
        countryCode: 'CO',
        activeMode: 'SELLER',
      },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, displayName: DISPLAY, activeMode: 'SELLER' },
    });
  }

  await prisma.userWallet.updateMany({
    where: { userId: user.id, isActive: true },
    data: { isActive: false },
  });

  const wallet = await prisma.userWallet.create({
    data: {
      userId: user.id,
      walletAddressUrl: WALLET,
      assetCode: 'USD',
      assetScale: 2,
      authServerUrl: 'https://auth.interledger-test.dev',
      resourceServerUrl: 'https://ilp.interledger-test.dev',
      isVerified: true,
      isActive: true,
      verifiedAt: new Date(),
    },
  });

  const profile = await prisma.sellerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    await prisma.sellerProfile.create({
      data: {
        userId: user.id,
        headline: 'Freelancer de prueba (wallet compañero)',
        bio: 'Cuenta sembrada localmente para validar SPEC-05 con billetera testnet de compañero.',
        skills: ['testing'],
        languages: ['es'],
        webMonetizationEnabled: true,
      },
    });
  }

  console.log(
    JSON.stringify(
      {
        status: 'CREATED',
        email: EMAIL,
        password: PASSWORD,
        displayName: DISPLAY,
        userId: user.id,
        walletId: wallet.id,
        walletAddressUrl: WALLET,
        paymentPointer: '$ilp.interledger-test.dev/sarisml',
        note: 'Wallet marcada isVerified+isActive sin GNAP (solo local/dev).',
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
