import AWS from 'aws-sdk';

// Configure AWS SDK
const s3 = new AWS.S3({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

export const uploadToS3 = async (imageBuffer: string, imageName: string, bucketName: string = process.env.S3_BUCKET_NAME!): Promise<string> => {
    if (!imageBuffer || !imageName || !bucketName) {
        throw new Error('Image buffer, name, and bucket name are required');
    }

    const buffer = Buffer.from(imageBuffer, 'base64');

    const params: AWS.S3.PutObjectRequest = {
        Bucket: bucketName,
        Key: imageName,
        Body: buffer,
        ContentType: 'image/jpeg',
    };

    try {
        // Upload the image to S3
        const data = await s3.upload(params).promise();

        // Return the URL of the uploaded image
        return data.Location;
    } catch (error) {
        console.error('Error uploading to S3:', error);
        throw new Error('An error occurred while uploading to S3');
    }
};


export const deleteFromS3 = async (imageName: string, bucketName: string = process.env.S3_BUCKET_NAME!): Promise<void> => {
    if (!imageName || !bucketName) {
        throw new Error('Image name and bucket name are required');
    }

    const params: AWS.S3.DeleteObjectRequest = {
        Bucket: bucketName,
        Key: imageName,
    };

    try {
        // Delete the image from S3
        await s3.deleteObject(params).promise();
        console.log(`Successfully deleted ${imageName} from ${bucketName}`);
    } catch (error) {
        console.error('Error deleting from S3:', error);
        throw new Error('An error occurred while deleting from S3');
    }
};
