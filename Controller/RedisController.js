const BaseController = require("./BaseController");
const { client: redisClient } = require("../Utils/redis");

class RedisController extends BaseController {
    static async clearRedis(req, res) {
        try {
            await redisClient.flushAll();
            return super.sendResponse(res, 200, "success", "All Redis cache cleared successfully");
        } catch (error) {
            console.error("Flush Redis error:", error);
            return super.sendResponse(res, 500, "error", error.message || "Internal Server Error");
        }
    }

    static async clearDriverRedis(req, res) {
        try {
            let keysDeleted = 0;
            const keys = [];
            for await (const key of redisClient.scanIterator({ MATCH: 'driver:*', COUNT: 100 })) {
                keys.push(key);
            }

            if (keys.length > 0) {
                await redisClient.unlink(keys);
                keysDeleted = keys.length;
            }

            // Also clear geo location key
            await redisClient.del('drivers:locations');

            return super.sendResponse(res, 200, "success", `Driver Redis data cleared. Keys deleted: ${keysDeleted}`);
        } catch (error) {
            console.error("Clear Driver Redis error:", error);
            return super.sendResponse(res, 500, "error", `Clear Driver Redis error: ${error.message}`);
        }
    }

    static async clearUserRedis(req, res) {
        try {
            let keysDeleted = 0;
            const keys = [];
            for await (const key of redisClient.scanIterator({ MATCH: 'user:*', COUNT: 100 })) {
                keys.push(key);
            }

            if (keys.length > 0) {
                await redisClient.unlink(keys);
                keysDeleted = keys.length;
            }

            return super.sendResponse(res, 200, "success", `User Redis data cleared. Keys deleted: ${keysDeleted}`);
        } catch (error) {
            console.error("Clear User Redis error:", error);
            return super.sendResponse(res, 500, "error", `Clear User Redis error: ${error.message}`);
        }
    }

    static async getAllRedisData(req, res) {
        try {
            const allData = {};
            let totalKeys = 0;

            for await (const key of redisClient.scanIterator({
                MATCH: '*',
                COUNT: 100
            })) {

                if (typeof key !== 'string') continue;

                totalKeys++;
                const type = await redisClient.type(key);
                let value = null;

                switch (type) {
                    case 'string':
                        value = await redisClient.get(key);
                        break;

                    case 'hash':
                        value = await redisClient.hGetAll(key);
                        break;

                    case 'zset':
                        value = await redisClient.zRange(key, 0, -1, {
                            WITHSCORES: true
                        });
                        break;

                    case 'list':
                        value = await redisClient.lRange(key, 0, -1);
                        break;

                    case 'set':
                        value = await redisClient.sMembers(key);
                        break;

                    default:
                        value = `Unsupported type: ${type}`;
                }

                allData[key] = { type, value };
            }

            return super.sendResponse(res, 200, "success", "All Redis data fetched", {
                totalKeys,
                data: allData
            });

        } catch (error) {
            return super.sendResponse(
                res,
                500,
                "error",
                error.message
            );
        }
    }
}

module.exports = RedisController;
