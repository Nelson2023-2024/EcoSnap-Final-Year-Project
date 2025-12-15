import { PrismaClient } from "../generated/prisma/client.js";
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
export const prisma = new PrismaClient({
  adapter,
  log: ["query", "error", "info", "warn"],
});

// Test database connection
export async function testConnection() {
  try {
    const conn = await prisma.$queryRaw`SELECT * FROM users`;
    console.log(conn)
    if (conn)
      console.log("✅ Database connected and query executed successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  }
}
