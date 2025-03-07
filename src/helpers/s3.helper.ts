import AWS from 'aws-sdk';
import logger from './logger';

// Configure AWS SDK
const s3 = new AWS.S3({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

export const uploadToS3 = async (imageBuffer: string, imageName: string, bucketName: string = process.env.S3_BUCKET_NAME!): Promise<string> => {
    logger.debug(`Entering uploadToS3 method. Params: imageName=${imageName}, bucketName=${bucketName}`, { method: "uploadToS3", layer: "helper" });
    try {
        if (!imageBuffer || !imageName || !bucketName) {
            logger.error(`Missing required parameters. Image buffer, name, and bucket name are required.`, { layer: "helper" });
            throw new Error('Image buffer, name, and bucket name are required');
        }

        const buffer = Buffer.from(imageBuffer, 'base64');

        const params: AWS.S3.PutObjectRequest = {
            Bucket: bucketName,
            Key: imageName,
            Body: buffer,
            ContentType: 'image/jpeg',
        };

        logger.info(`Uploading image to S3. ImageName: ${imageName}, Bucket: ${bucketName}`, { layer: "helper" });
        const data = await s3.upload(params).promise();

        logger.info(`Successfully uploaded image to S3. ImageName: ${imageName}, Bucket: ${bucketName}`, { layer: "helper" });
        return data.Location;
    } catch (error) {
        logger.error(`Error uploading to S3`, { error, layer: "helper" });
        throw new Error('An error occurred while uploading to S3');
    } finally {
        logger.debug(`Exiting uploadToS3 method. Params: imageName=${imageName}, bucketName=${bucketName}`, { method: "uploadToS3", layer: "helper" });
    }
};

export const deleteFromS3 = async (imageName: string, bucketName: string = process.env.S3_BUCKET_NAME!): Promise<void> => {
    logger.debug(`Entering deleteFromS3 method. Params: imageName=${imageName}, bucketName=${bucketName}`, { method: "deleteFromS3", layer: "helper" });
    try {
        if (!imageName || !bucketName) {
            logger.error(`Missing required parameters. Image name and bucket name are required.`, { layer: "helper" });
            throw new Error('Image name and bucket name are required');
        }

        const params: AWS.S3.DeleteObjectRequest = {
            Bucket: bucketName,
            Key: imageName,
        };

        logger.info(`Deleting image from S3. ImageName: ${imageName}, Bucket: ${bucketName}`, { layer: "helper" });
        await s3.deleteObject(params).promise();

        logger.info(`Successfully deleted image from S3. ImageName: ${imageName}, Bucket: ${bucketName}`, { layer: "helper" });
    } catch (error) {
        logger.error(`Error deleting from S3`, { error, layer: "helper" });
        throw new Error('An error occurred while deleting from S3');
    } finally {
        logger.debug(`Exiting deleteFromS3 method. Params: imageName=${imageName}, bucketName=${bucketName}`, { method: "deleteFromS3", layer: "helper" });
    }
};