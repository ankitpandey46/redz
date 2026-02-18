require('dotenv').config();
const AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

class S3Uploader {
    constructor(bucketName) {
        this.bucketName = bucketName;
    }

    async uploadFile(fileName, fileData, fileType ,awspath) {
        const params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: `${awspath}/${fileName}`,
            Body: fileData,
            ContentType: fileType,
        };
        console.log(process.env.AWS_S3_BUCKET_NAME)
        return new Promise((resolve, reject) => {
            s3.upload(params, (err, data) => {
                if (err) {
                    console.error('Error uploading to S3:', err);
                    reject(err);
                } else {                                                                                                                              
                    resolve(data.Location);
                }
            });
        });
    }
    

    async deleteFile(fileUrl) {

        try {
            const urlParts = new URL(fileUrl);
            const encodedPath = urlParts.pathname.substring(1);
            const key = decodeURIComponent(encodedPath); 
    
            const params = {
                Bucket: this.bucketName,
                Key: key,
            };
    
    
            const data = await s3.deleteObject(params).promise(); 
            return params; 
        } catch (error) {
            return null;
        }
    }
}

module.exports = new S3Uploader(process.env.AWS_S3_BUCKET_NAME);