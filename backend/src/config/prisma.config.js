import { PrismaClient } from "../generated/prisma/client.js";
import "dotenv/config";
import { PrismaPg } from '@prisma/adapter-pg'
const connectionString = `${process.env.DATABASE_URL}`


const adapter = new PrismaPg({ connectionString })
export const prisma = new PrismaClient({ adapter, log:["query","error","info","warn"] })


// Test database connection
export async function testConnection() {
  try {
    console.log(await prisma.$connect())
    await prisma.$connect();
    if (await prisma.$connect()){
      console.log("Connected Successfully")
    }
    else{
      console.error("Failed to connect to the database:");  
    }
  } catch (error) {
    console.error("Failed to connect to the database:", error);
  }
}