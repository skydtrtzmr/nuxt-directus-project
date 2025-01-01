import { Redis } from "ioredis";

export default defineNuxtPlugin(() => {
    console.log("redis.server.ts plugin");
    

    // 创建 Redis 客户端实例
    // const redisClient = new Redis({
    //     host: process.env.REDIS_HOST || "localhost",
    //     port: Number(process.env.REDIS_PORT) || 6379,
    //     password: process.env.REDIS_PASSWORD || "",
    // });

    // // 测试连接
    // redisClient
    //     .ping()
    //     .then(() => {
    //         console.log("Redis 连接成功");
    //     })
    //     .catch((err) => {
    //         console.error("Redis 连接失败:", err);
    //     });

    // // 将 Redis 客户端注入到 Nuxt 应用
    // return {
    //     provide: {
    //         redis: redisClient,
    //     },
    // };
});
