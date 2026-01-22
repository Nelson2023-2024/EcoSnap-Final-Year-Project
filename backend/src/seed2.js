// seed.js

import { prisma, testConnection } from "./config/prisma.config.js";

async function main() {
  testConnection();
  console.log("Seeding database...");
    const allUsers = await prisma.user.findMany();
  console.log("All users:", JSON.stringify(allUsers, null, 2));
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seeding finished.");
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
