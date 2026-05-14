import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) {
    throw new Error('ADMIN_EMAIL no definido en .env');
  }

  // Reglas singleton
  await prisma.rules.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      pointsExact: 3,
      pointsWinner: 1,
      pointsChampion: 25,
      lockOffsetMin: 15,
    },
  });
  console.log('✓ Rules singleton listo');

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN', hasPaid: true },
    create: {
      email: adminEmail,
      role: 'ADMIN',
      hasPaid: true,
      paidAt: new Date(),
      paidNote: 'Bootstrap admin',
      name: 'Admin PADELBOX',
    },
  });
  console.log(`✓ Admin: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
