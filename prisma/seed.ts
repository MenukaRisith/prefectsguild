import { PrismaClient, Role, AccountStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_SUPER_ADMIN_EMAIL;
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;
  const fullName =
    process.env.SEED_SUPER_ADMIN_NAME ?? "KCC Prefects Guild Super Admin";

  if (!email || !password) {
    console.log(
      "Skipping seed because SEED_SUPER_ADMIN_EMAIL and SEED_SUPER_ADMIN_PASSWORD are not set.",
    );
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`Super admin already exists for ${email}.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      fullName,
      passwordHash,
      role: Role.SUPER_ADMIN,
      status: AccountStatus.ACTIVE,
    },
  });

  console.log(`Seeded super admin for ${email}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
