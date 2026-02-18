const sharp = require('sharp');
const s3Uploader = require('./s3Uploader');
const path = require('path');

const uploadFiles = async (files, awspath) => {
    if (!files || files.length === 0) {
        throw new Error('No files uploaded');
    }

    const results = [];

    try {

        const uploadPromises = files.map(async (file) => {
            const fileExtension = path.extname(file.originalname);
            let thumbUrl;

            if (file.mimetype.startsWith('image/')) {
              
                const thumbBuffer = await sharp(file.buffer)
                    .resize(150, 150)
                    .toBuffer();

              
                const fileUrl = await s3Uploader.uploadFile(file.originalname, file.buffer, file.mimetype, awspath);

            
                const thumbFileName = `thumb/${file.originalname}`;
              
                thumbUrl = await s3Uploader.uploadFile(thumbFileName, thumbBuffer, file.mimetype, awspath);

                return {
                    fieldName: file.fieldname, 
                    fileName: file.originalname,
                    thumbUrl, 
                    extension: 'image',
                };
            } else if(file.mimetype.startsWith('video/')) {
               
                const thumbUrl = await s3Uploader.uploadFile(file.originalname, file.buffer, file.mimetype, awspath);
                return {
                    fieldName: file.fieldname, 
                    fileName: file.originalname,
                    thumbUrl, 
                    extension: 'video',
                };
            }else{
                const thumbUrl = await s3Uploader.uploadFile(file.originalname, file.buffer, file.mimetype, awspath);
                return {
                    fieldName: file.fieldname, 
                    fileName: file.originalname,
                    thumbUrl, 
                    extension: fileExtension,
                };
            }
        });

      
        const uploadResults = await Promise.all(uploadPromises);
        results.push(...uploadResults);

        return results;
    } catch (error) {
        console.error('Error uploading files:', error);
        throw new Error('Failed to upload files to S3');
    }
};

const deleteFiles = async (files) => {

    const results = [];

    for (const file of files) {
        try {
            if (file.extension_type === 'image') {
                const main_url = file.file_url.replace('/thumb/', '/');

                await s3Uploader.deleteFile(file.file_url);
                await s3Uploader.deleteFile(main_url);

             
                results.push({ file: file.file_url, status: 1 });
            } else {
          
                await s3Uploader.deleteFile(file.file_url);

                
                results.push({ file: file.file_url, status: 1 });
            }
        } catch (error) {
           
            results.push({ file: file.file_url, status: 0, error: error.message });
        }
    }

    return results; 
};

module.exports = { uploadFiles ,deleteFiles};
