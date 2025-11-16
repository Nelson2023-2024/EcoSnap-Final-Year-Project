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
  REDIS_URL: process.env.REDIS_URL,
  REDIS_PORT: process.env.REDIS_PORT,

  //GEMINI
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,

  //FRONTEND_URL
  FRONTEND_URL: process.env.FRONTEND_URL,

  //AWS CONFIG
  S3BUCKETNAME: process.env.S3BUCKETNAME,
  S3BUCKET_FOLDER_NAME: process.env.S3BUCKET_FOLDER_NAME,
  AWS_REGION: process.env.AWS_REGION,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,

  //Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};
