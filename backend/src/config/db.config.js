import mongoose from "mongoose";
import { ENV } from "./env.config.js";

export const connectToMongoDBWithRetry = async () => {
  try {
    const conn = await mongoose.connect(ENV.MONGO_URI);
    console.log(
      `Connection to mongoDB established successfully`,
      conn.connection.host
    );
  } catch (error) {
    console.log(`Error connecting to MongoDB`, error.message);
    setTimeout(connectToMongoDBWithRetry, 5000);
  }
};
