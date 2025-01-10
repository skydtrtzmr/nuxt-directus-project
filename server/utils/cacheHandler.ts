// server/utils/cacheHandler.ts

// 2类责任分离：
// 缓存读取：负责从 Redis 获取数据，如果 Redis 中没有数据，再从数据库读取数据，并将结果缓存到 Redis。
// 缓存更新：不关心 Redis 是否有数据，直接从数据库获取最新数据并更新缓存，适用于手动强制更新和定期更新等场景。

import Redis from 'ioredis';

const {
    public: {
        directus: { url },
    },
    private: { redisHost, redisPort },
} = useRuntimeConfig();

console.log("cacheHandler");

const redis = new Redis({
    // host: 'redis-container',  // 在Docker中使用的话，这里使用容器的名称
    host: redisHost || "127.0.0.1", // 在windows系统中直接使用的话，使用127.0.0.1
    // 所以为了兼容，这里要用环境变量。
    // 容器内部不能直接访问 127.0.0.1，因为 127.0.0.1 是指容器内部的本地网络地址
    port: redisPort || 6379,
});

