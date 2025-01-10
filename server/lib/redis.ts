// server/lib/redis.ts
import Redis from 'ioredis';

// 配置 ioredis 客户端
const {
    public: {
        directus: { url },
    },
    private: { redisHost, redisPort },
} = useRuntimeConfig();

console.log("连接 Redis 成功，创建redis实例");

const redis = new Redis({
    // host: 'redis-container',  // 在Docker中使用的话，这里使用容器的名称
    host: redisHost || "127.0.0.1", // 在windows系统中直接使用的话，使用127.0.0.1
    // 所以为了兼容，这里要用环境变量。
    // 容器内部不能直接访问 127.0.0.1，因为 127.0.0.1 是指容器内部的本地网络地址
    port: redisPort || 6379,
    enableAutoPipelining: true, // 自动管道化，提高性能
});

export default redis;