/* Used to compress the quality of image to 70% of the original quality */

import sharp from 'sharp';

const compressImage = async (imageBuffer: Buffer): Promise<string> => {
    if (!imageBuffer) {
        throw new Error('No image provided');
    }

    // Reduce the quality of the image without resizing
    const compressedImageBuffer = await sharp(imageBuffer)
        .jpeg({ quality: 70 })
        .toBuffer();

    // Return the compressed image as a base64 string
    return compressedImageBuffer.toString('base64');
};

export default compressImage;