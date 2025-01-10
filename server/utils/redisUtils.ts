// server/utils/redisUtils.ts

import redis from "~~/server/lib/redis";

// 读取缓存，若无则从数据库获取并更新缓存
// export async function getFromCache<T>(
//     key: string, // 缓存的key
//     fetchFunction: () => Promise<T>, // 从数据库获取数据的方法
//     ttl: number = 3600 // 缓存的过期时间，默认1小时
// ): Promise<T> {
//     let data = await redis.get(key);

//     if (data) {
//         // 如果缓存命中，直接返回缓存数据
//         return JSON.parse(data);
//     } else {
//         // 如果缓存未命中，从数据库获取数据更新缓存，然后再返回数据
//         await updateCache(key, fetchFunction, ttl);
//         let data = await redis.get(key);
//         return JSON.parse(data!);
//     }
// }

// 定义一个基础的接口，确保所有传入的数据对象都有 `id` 字段
interface WithId {
    id: string | number;  // id 可以是 string 或 number，视你的数据结构而定
}

// 更新Hash列表缓存
export async function updateHashListCache(
    key: string,
    fetchFunction: () => Promise<any[]>,
    ttl: number = 3600
): Promise<void> {
    const data = await fetchFunction() ;
    console.log("update cache", key, data);
    
    // await redis.set(key, JSON.stringify(data), "EX", ttl); // 设置过期时间

    // 将每个章节对象存储为哈希字段，字段名为章节的id，值为章节对象
    for (const item of data) {
        // 假设每个章节对象有 `id` 字段
        await redis.hset(key, item.id.toString(), JSON.stringify(item));
    }
    console.log('hset');
    
    // await redis.hset(key, 'field', 'value');
}
