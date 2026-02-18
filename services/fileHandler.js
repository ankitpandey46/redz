const multer = require('multer');
const path = require('path');

const uploadFile = (fileField, uploadDir) => {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
      },
    });
  
    const upload = multer({
      storage: storage,
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'));
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
    }).single(fileField); // Make sure the field name is passed here as 'file'
  
    return (req, res, next) => {
      upload(req, res, (err) => {
        if (err) {
          return res.status(400).send(err.message); // Handle error
        }
        next();
      });
    };
  };
  module.exports = uploadFile;
  