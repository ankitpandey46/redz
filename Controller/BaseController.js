const { uploadFiles ,deleteFiles} = require('../services/imageUploader');
const pool = require('../Utils/db');

class BaseController {
    static uploadFiles = uploadFiles; 
    static deleteFiles = deleteFiles; 
    static db = pool;
    static bucketFolder="DEMO";  
}

module.exports = BaseController;