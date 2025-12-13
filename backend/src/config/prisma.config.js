import { PrismaClient } from "../generated/prisma/client.js";
import "dotenv/config";
import { PrismaPg } from '@prisma/adapter-pg'
const connectionString = `${process.env.DATABASE_URL}`


const adapter = new PrismaPg({ connectionString })
export const prisma = new PrismaClient({ adapter, log:["query","error","info","warn"] })


// Test database connection
export async function testConnection() {
  try {
    await prisma.$connect();
    console.log("✅ Database connection established successfully!");
  } catch (error) {
    console.error("❌ Failed to connect to the database:", error);
  }
}