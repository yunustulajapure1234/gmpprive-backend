const { 
  S3Client, 
  GetObjectCommand, 
  DeleteObjectCommand 
} = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/* =========================
   GET PRESIGNED URL
========================= */
const getPresignedUrl = async (key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET,
      Key: key,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    return url;
  } catch (err) {
    console.error("Presigned URL Error:", err);
    return null;
  }
};

/* =========================
   DELETE FROM S3
========================= */
const deleteFromS3 = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET,
      Key: key,
    });

    await s3.send(command);
  } catch (err) {
    console.error("Delete S3 Error:", err);
  }
};

module.exports = { getPresignedUrl, deleteFromS3 };
