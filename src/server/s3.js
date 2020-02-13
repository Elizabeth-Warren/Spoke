import AWS from "aws-sdk";

const params = {
  signatureVersion: "v4",
  params: {
    Bucket: process.env.AWS_S3_BUCKET_NAME
  }
};

if (process.env.S3_ENDPOINT) {
  params.endpoint = process.env.S3_ENDPOINT;
  params.s3ForcePathStyle = true;
}

export default new AWS.S3(params);
