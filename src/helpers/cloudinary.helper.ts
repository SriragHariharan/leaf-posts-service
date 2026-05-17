import { v2 as cloudinary } from 'cloudinary';
import logger from './logger';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (imageBuffer: string, publicId: string): Promise<string> => {
    logger.debug(`Entering uploadToCloudinary method. Params: publicId=${publicId}`, { method: "uploadToCloudinary", layer: "helper" });
    try {
        if (!imageBuffer || !publicId) {
            logger.error(`Missing required parameters. Image buffer and public ID are required.`, { layer: "helper" });
            throw new Error('Image buffer and public ID are required');
        }

        logger.info(`Uploading image to Cloudinary. PublicId: ${publicId}`, { layer: "helper" });
        const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${imageBuffer}`, {
            public_id: publicId,
            overwrite: true,
            resource_type: 'image',
        });

        logger.info(`Successfully uploaded image to Cloudinary. PublicId: ${publicId}`, { layer: "helper" });
        return result.secure_url;
    } catch (error) {
        logger.error(`Error uploading to Cloudinary`, { error, layer: "helper" });
        throw new Error('An error occurred while uploading to Cloudinary');
    } finally {
        logger.debug(`Exiting uploadToCloudinary method. Params: publicId=${publicId}`, { method: "uploadToCloudinary", layer: "helper" });
    }
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
    logger.debug(`Entering deleteFromCloudinary method. Params: publicId=${publicId}`, { method: "deleteFromCloudinary", layer: "helper" });
    try {
        if (!publicId) {
            logger.error(`Missing required parameters. Public ID is required.`, { layer: "helper" });
            throw new Error('Public ID is required');
        }

        logger.info(`Deleting image from Cloudinary. PublicId: ${publicId}`, { layer: "helper" });
        await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });

        logger.info(`Successfully deleted image from Cloudinary. PublicId: ${publicId}`, { layer: "helper" });
    } catch (error) {
        logger.error(`Error deleting from Cloudinary`, { error, layer: "helper" });
        throw new Error('An error occurred while deleting from Cloudinary');
    } finally {
        logger.debug(`Exiting deleteFromCloudinary method. Params: publicId=${publicId}`, { method: "deleteFromCloudinary", layer: "helper" });
    }
};
