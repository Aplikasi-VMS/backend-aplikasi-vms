// prisma/seed.js
import { PrismaClient } from "../generated/prisma/index.js";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding...");

  await prisma.attendance.deleteMany({});
  await prisma.visitor.deleteMany({});
  await prisma.device.deleteMany({});
  await prisma.user.deleteMany({});
  console.log("Cleaned existing data.");

  const hashedPassword = await bcrypt.hash("password123", 10);

  console.log("Creating users with different roles...");

  await prisma.user.create({
    data: {
      name: "Super Admin",
      email: "superuser@example.com",
      password: hashedPassword,
      role: "SUPERUSER",
    },
  });
  console.log("Created SUPERUSER.");

  for (let i = 0; i < 2; i++) {
    await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: `admin${i + 1}@example.com`,
        password: hashedPassword,
        role: "ADMIN",
      },
    });
  }
  console.log("Created 2 ADMIN users.");

  for (let i = 0; i < 3; i++) {
    await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: `receptionist${i + 1}@example.com`,
        password: hashedPassword,
        role: "RECEPTIONIST",
      },
    });
  }
  console.log("Created 3 RECEPTIONIST users.");

    console.log('Creating fake devices...');
    for (let i = 0; i < 1000; i++) {
      await prisma.device.create({
        data: {
          name: faker.commerce.productName() + ' Device',
          deviceKey: faker.string.uuid(),
          groupId: faker.string.uuid(),
          location: faker.location.city(),
        },
      });
    }
    console.log('Created 5 fake devices.');

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
