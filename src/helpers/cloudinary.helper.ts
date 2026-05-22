import { v2 as cloudinary } from "cloudinary";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (
  imageBuffer: string,
  publicId: string,
): Promise<string> => {
  try {
    if (!imageBuffer || !publicId) {
      throw new Error("Image buffer and public ID are required");
    }
    const result = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${imageBuffer}`,
      {
        public_id: publicId,
        overwrite: true,
        resource_type: "image",
      },
    );
    return result.secure_url;
  } catch (error) {
    throw new Error("An error occurred while uploading to Cloudinary");
  }
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    if (!publicId) {
      throw new Error("Public ID is required");
    }
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (error) {
    throw new Error("An error occurred while deleting from Cloudinary");
  }
};
