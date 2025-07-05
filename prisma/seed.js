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

  // SUPERUSER
  await prisma.user.create({
    data: {
      name: "Super Admin",
      email: "superuser@example.com",
      password: hashedPassword,
      role: "SUPERUSER",
    },
  });
  console.log("Created SUPERUSER.");

  // ADMIN (multiple admins)
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

  // RECEPTIONIST (multiple receptionists)
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

    // --- Buat Data Device (Opsional, contoh) ---
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

  //   // --- Buat Data Visitor (Opsional, contoh) ---
  //   console.log('Creating fake visitors...');
  //   for (let i = 0; i < 10; i++) {
  //     await prisma.visitor.create({
  //       data: {
  //         name: faker.person.fullName(),
  //         idcardNum: faker.string.numeric(16), // Contoh 16 digit ID card
  //         imgBase64: faker.image.dataUri(), // Contoh base64 image
  //         type: faker.helpers.arrayElement([1, 2, 3]),
  //         passtime: faker.date.recent().toISOString(),
  //         md5: faker.string.hexadecimal({ length: 32, casing: 'lower' }),
  //       },
  //     });
  //   }
  //   console.log('Created 10 fake visitors.');

  //   // --- Buat Data Attendance (Opsional, contoh) ---
  //   console.log('Creating fake attendances...');
  //   const devices = await prisma.device.findMany();
  //   const visitors = await prisma.visitor.findMany();

  //   if (devices.length > 0 && visitors.length > 0) {
  //     for (let i = 0; i < 20; i++) {
  //       const randomDevice = faker.helpers.arrayElement(devices);
  //       const randomVisitor = faker.helpers.arrayElement(visitors);

  //       await prisma.attendance.create({
  //         data: {
  //           visitorId: randomVisitor.id,
  //           deviceId: randomDevice.id,
  //           time: faker.date.recent(),
  //           type: faker.helpers.arrayElement(['face_0', 'face_1', 'card_0', 'face_and_card']),
  //           extra: { comment: faker.lorem.sentence() },
  //         },
  //       });
  //     }
  //     console.log('Created 20 fake attendances.');
  //   } else {
  //     console.log('Skipping attendance seeding as no devices or visitors found.');
  //   }

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
