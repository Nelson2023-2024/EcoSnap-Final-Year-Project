import  cloudinary  from "../config/cloudinary.config.js";

export const uploadToCloudinary = async (file, folder = "waste_reports") => {
  // Convert buffer → Base64
  const base64Image = `data:${file.mimetype};base64,${file.buffer.toString(
    "base64"
  )}`;

  // Upload directly
  const uploadResponse = await cloudinary.uploader.upload(base64Image, {
    folder,
    resource_type: "image",
    transformation: [
      { width: 1200, crop: "limit" },
      { quality: "auto" },
      { fetch_format: "auto" },
    ],
  });

  return uploadResponse.secure_url;
};
