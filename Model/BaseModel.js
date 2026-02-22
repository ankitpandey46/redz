const { uploadFiles, deleteFiles } = require('../services/imageUploader');
const pool = require('../Utils/db');
const redis = require('../Utils/redis');
const { PrismaClient } = require("@prisma/client");

class BaseModel {
    static uploadFiles = uploadFiles;
    static deleteFiles = deleteFiles;
    static db = pool;
    static bucketFolder = "DEMO";
    static redis = redis;
    static prisma = new PrismaClient();
}

module.exports = BaseModel;