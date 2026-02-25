const express = require('express');
const router = express.Router();
const RedisController = require('../Controller/RedisController');

router.get('/clear-all', RedisController.clearRedis);
router.get('/clear-driver', RedisController.clearDriverRedis);
router.get('/clear-user', RedisController.clearUserRedis);
router.get('/get-all', RedisController.getAllRedisData);

module.exports = router;
