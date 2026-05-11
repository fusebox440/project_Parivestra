const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const env = require('../config/env');
const logger = require('../utils/logger');

let s3Client;

function initR2Client() {
    if (s3Client) return s3Client;

    const accountId = env.CLOUDFLARE_R2_ACCOUNT_ID;
    const accessKeyId = env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretAccessKey = env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

    s3Client = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    });
    logger.info("Cloudflare R2 client initialized.");
    return s3Client;
}

async function uploadVideo(buffer, key, mimeType) {
    const client = initR2Client();
    const bucketName = env.CLOUDFLARE_R2_BUCKET_NAME;
    logger.info(`Starting video upload to R2. Key: ${key}`);

    try {
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
        });
        await client.send(command);
        const url = `https://${bucketName}.${env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;
        logger.info(`Successfully uploaded video to R2. URL: ${url}`);
        return { url, key };
    } catch (error) {
        logger.error(`Failed to upload video to R2. Key: ${key}. Error: ${error.message}`);
        throw new Error("Could not upload video file.");
    }
}

async function getPresignedUrl(key, expiresInSeconds = 3600) {
    const client = initR2Client();
    const bucketName = env.CLOUDFLARE_R2_BUCKET_NAME;
    logger.info(`Generating signed URL for key: ${key}`);

    try {
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
        });
        const url = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
        logger.info(`Successfully generated signed URL for key: ${key}`);
        return url;
    } catch (error) {
        logger.error(`Failed to generate signed URL for key: ${key}. Error: ${error.message}`);
        throw new Error("Could not generate signed URL.");
    }
}

async function deleteVideo(key) {
    const client = initR2Client();
    const bucketName = env.CLOUDFLARE_R2_BUCKET_NAME;
    logger.info(`Deleting video from R2. Key: ${key}`);

    try {
        const command = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: key,
        });
        await client.send(command);
        logger.info(`Successfully deleted video from R2. Key: ${key}`);
        return { success: true };
    } catch (error) {
        logger.error(`Failed to delete video from R2. Key: ${key}. Error: ${error.message}`);
        throw new Error("Could not delete video file.");
    }
}

module.exports = {
    initR2Client,
    uploadVideo,
    getPresignedUrl,
    deleteVideo,
};
