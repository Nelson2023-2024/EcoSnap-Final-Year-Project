import { PutObjectCommand } from "@aws-sdk/client-s3";
import { ENV } from "../config/env.config.js";
import { v4 as uuidv4 } from "uuid";
import { s3 } from "../config/s3.config.js";

export const uploadToS3 = async (
  fileBuffer,
  originalName,
  mimeType,
  folder = ENV.S3BUCKET_FOLDER_NAME
) => {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const uniqueId = uuidv4();
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `${folder}/${timestamp}-${uniqueId}-${sanitizedName}`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: ENV.S3BUCKETNAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    //   ACL: "public-read", // Uncomment if you want public access
    });

    await s3.send(command);

    // Generate file URL
    const fileURL = `https://${ENV.S3BUCKETNAME}.s3.${ENV.AWS_REGION}.amazonaws.com/${key}`;

    return { key, fileURL };
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};
