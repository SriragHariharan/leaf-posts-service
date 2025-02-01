import { createClient, RedisClientType } from 'redis';

class RedisHelper {
    private client: RedisClientType;

    constructor() {
        this.client = createClient({
            url: 'redis://localhost:6379'
        });

        this.client.on('error', (err) => {
            console.error('Redis error:', err);
        });

        this.client.on('connect', () => {
            console.log('Connected to Redis');
        });

        this.client.connect().catch((err) => {
            console.error('Failed to connect to Redis:', err);
        });
    }

    // Store data in Redis
    async set(key: string, value: string, expireInSeconds?: number): Promise<void> {
        await this.client.set(key, value);
        if (expireInSeconds) {
            await this.client.expire(key, expireInSeconds);
        }
    }

    // Retrieve data from Redis
    async get(key: string): Promise<string | null> {
        return await this.client.get(key);
    }

    // Delete a key from Redis
    async delete(key: string): Promise<void> {
        await this.client.del(key);
    }

    // Close the Redis connection
    async disconnect(): Promise<void> {
        await this.client.quit();
    }
}

export default new RedisHelper();