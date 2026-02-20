const {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// 🔥 GET PRESIGNED URL
exports.getPresignedUrl = async (key) => {
  try {
    if (!key) return null;

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET,
      Key: key,
    });

    return await getSignedUrl(s3, command, { expiresIn: 3600 });
  } catch (error) {
    console.error("S3 PRESIGN ERROR:", error.message);
    return null; // 🔥 never crash
  }
};


// 🔥 DELETE FILE
exports.deleteFromS3 = async (key) => {
  try {
    if (!key) return;

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET,
      Key: key,
    });

    await s3.send(command);
  } catch (error) {
    console.error("S3 DELETE ERROR:", error);
  }
};
