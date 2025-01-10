// server/utils/redisUtils.ts

import redis from "~~/server/lib/redis";

// 读取缓存，若无则从数据库获取并更新缓存
export async function getFromCache<T>(
    key: string, // 缓存的key
    fetchFunction: () => Promise<T>, // 从数据库获取数据的方法
    ttl: number = 3600 // 缓存的过期时间，默认1小时
): Promise<T> {
    let data = await redis.get(key);

    if (data) {
        // 如果缓存命中，直接返回缓存数据
        return JSON.parse(data);
    } else {
        // 如果缓存未命中，从数据库获取数据更新缓存，然后再返回数据
        await updateCache(key, fetchFunction, ttl);
        let data = await redis.get(key);
        return JSON.parse(data!);
    }
}

// 更新缓存
export async function updateCache<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl: number = 3600
): Promise<void> {
    const data = await fetchFunction();
    console.log("update cache", key, data);
    
    await redis.set(key, JSON.stringify(data), "EX", ttl); // 设置过期时间
}
