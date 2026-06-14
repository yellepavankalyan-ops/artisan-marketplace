import cloudinary from "./cloudinary.js";

export const uploadToCloudinary = async (filePath, folder = "handicraft") => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: "auto",
    });
    return result.secure_url;
  } catch (err) {
    throw new Error("Cloudinary upload failed: " + err.message);
  }
};