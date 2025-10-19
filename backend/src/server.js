import express from "express";
import { ENV } from "./config/env.config.js";
import { connectToMongoDBWithRetry } from "./config/db.config.js";

const app = express();

app.use(express.json())

app.get("/api/health", async (req,res) => {
  console.log("Object1")
  res.status(200).json({status: "ok",message:"Health"})
})


app.listen(ENV.PORT, () => {
  console.log(`Server running on http://localhost:${ENV.PORT}`);
  connectToMongoDBWithRetry()
});

