const multer = require("multer");
const { S3Client } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const sharp = require("sharp");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadToS3 = async (file) => {
  const optimized = await sharp(file.buffer)
    .resize({ width: 800 })
    .jpeg({ quality: 70 })
    .toBuffer();

  const key = `services/${Date.now()}.jpg`;

  const uploader = new Upload({
    client: s3,
    params: {
      Bucket: process.env.AWS_BUCKET,
      Key: key,
      Body: optimized,
      ContentType: "image/jpeg",
    },
  });

  await uploader.done();

  return key;
};

module.exports = { upload, uploadToS3 };
