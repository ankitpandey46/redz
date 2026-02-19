const redis = require('redis');

const client = redis.createClient({
    socket: {
        host: '127.0.0.1',
        port: 6379
    }
});

client.on('error', (err) => console.log('Redis Client Error:', err));

(async () => {
    try {
        if (!client.isOpen) {
            await client.connect();
            console.log('Connected to Redis');
        }
    } catch (err) {
        console.error('Could not connect to Redis:', err);
    }
})();

module.exports = { client };
