import { configDotenv } from "dotenv";
configDotenv();

export const ENV = {
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI, //mongodb://root:root@localhost:27019/EcoSnap?authSource=admin
  SESSION_SECRET: process.env.SESSION_SECRET,

  //GOOGLE AUTH
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,

  //REDIS
  REDIS_URL:process.env.REDIS_URL,
  REDIS_PORT:process.env.REDIS_PORT,

  //GEMINI
  GOOGLE_API_KEY:process.env.GOOGLE_API_KEY
};
