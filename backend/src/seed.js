// seed.js

import { prisma, testConnection } from "./config/prisma.config.js";

async function main() {
  testConnection();
  console.log("Seeding database...");
  

  // Create a new user
  const user = await prisma.user.create({
    data: {
      user_firstName: "Alice",
      user_lastName: "Smith",
      user_fullName: "Alice Smith",
      user_email: "alice@example.com",
      user_username: "alice",
      user_phoneNumber: "1234567890",
      user_password: null, // since using Google OAuth
      user_profileImage: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
      user_googleID: null,
      user_authProvider: "local",
      user_points: 0,
      user_role: "user",
      // Example: create a TeamMember relation (optional)
      // user_assignedTeams: {
      //   create: [
      //     { team: { connect: { team_id: "some-existing-team-id" } } },
      //   ],
      // },
    },
  });

  console.log("Created user:", user);

  // Fetch all users
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
