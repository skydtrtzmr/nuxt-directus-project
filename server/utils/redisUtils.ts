// server/utils/redisUtils.ts

// 这里存放的是操作redis的工具函数

import redis from "~~/server/lib/redis";

// TODO  我现在暂时直接把redis.ts复制过来了，让它每次都创建一个连接。
// 后面再优化一下，用连接池。

import Redis from "ioredis";

// 配置 ioredis 客户端
// const {
//     public: {
//         directus: { url },
//     },
//     private: { redisHost, redisPort },
// } = useRuntimeConfig();

// TODO
// https://www.jianshu.com/p/21b488c1ede5

// 读取缓存的Hash列表的指定id的项
export async function getHashListItemFromCache<T>(
    key: string, // 缓存的key
    id: string, // 要获取的项的id（其实是对应Hash列表的键）
    fetchFunction: () => Promise<any[]>, // 从数据库获取列表数据的方法
    ttl: number = 3600 // 缓存的过期时间，默认1小时
): Promise<T> {
    // https://blog.51cto.com/u_16213418/11828350

    // const redis = new Redis({
    //     // host: 'redis-container',  // 在Docker中使用的话，这里使用容器的名称
    //     host: redisHost || "127.0.0.1", // 在windows系统中直接使用的话，使用127.0.0.1
    //     // 所以为了兼容，这里要用环境变量。
    //     // 容器内部不能直接访问 127.0.0.1，因为 127.0.0.1 是指容器内部的本地网络地址
    //     port: redisPort || 6379,
    //     enableAutoPipelining: true, // 自动管道化，提高性能
    // });
    // console.log("在utils中，连接 Redis 成功，创建redis实例");
    let data = await redis.hget(key, id);

    if (data) {
        // 如果缓存命中，直接返回缓存数据
        console.log("cache hit", key, id);
        return JSON.parse(data);
    } else {
        console.log("cache not hit", key, id);
        // 如果缓存未命中，从数据库获取数据更新缓存，然后再返回数据
        await updateHashListCache(key, fetchFunction, ttl);
        let data = await redis.hget(key, id);
        return JSON.parse(data!);
    }
}

// 批量读取缓存的Hash列表的指定id列表的多个项
export async function getHashListItemsFromCache<T>(
    key: string, // 缓存的key
    ids: string[], // 要获取的项的id列表
    fetchFunction: () => Promise<any[]>, // 从数据库获取列表数据的方法
    ttl: number = 3600 // 缓存的过期时间，默认1小时
): Promise<T[]> {
    // 使用 Redis 的 HMGET 方法批量获取多个字段
    // 1. 获取缓存中的数据
    const cachedData = await redis.hmget(key, ...ids);

    // 2. 筛选出已命中的数据
    const hitData: string[] = cachedData.filter(
        (data) => data !== null && data !== undefined
    ) as string[];

    // 如果命中缓存的数据量与请求的 ID 列表的数量不同，则表示有些数据没有命中缓存
    if (hitData.length !== ids.length) {
        console.log(
            "cache not hit for some items, fetching from database",
            key,
            ids
        );

        // 3. 获取缓存未命中的数据并更新缓存
        await updateHashListCache(key, fetchFunction, ttl);
        // 注意这里不仅仅是更新redis中没有命中的项，还要更新redis中已经存在的项，因为可能有些项已经过期了

        // 4. 再次从缓存中获取数据，确保所有的项都有数据
        const updatedCachedData = await redis.hmget(key, ...ids);

        // 5. 返回最终的结果，解析数据
        return updatedCachedData.map((data) =>
            data ? JSON.parse(data) : null
        );
    } else {
        // 如果缓存命中所有请求项，直接返回数据
        console.log("cache hit", key, ids);
        return hitData.map((data) => JSON.parse(data));
    }
}

// TODO 下面是获取普通数值类型的缓存的函数，暂时注释掉，因为暂时不需要

// export async function getItemFromCache<T>(
//     key: string, // 缓存的key
//     fetchFunction: () => Promise<any[]>, // 从数据库获取列表数据的方法
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
// interface WithId {
//     id: string | number;  // id 可以是 string 或 number，视你的数据结构而定
// }

// 更新Hash列表缓存
export async function updateHashListCache(
    key: string,
    fetchFunction: () => Promise<any[]>, // 注意这里一定返回的是个数组，因为是 Hash 列表
    ttl: number = 3600
): Promise<void> {
    // https://blog.51cto.com/u_16213418/11828350

    // const redis = new Redis({
    //     // host: 'redis-container',  // 在Docker中使用的话，这里使用容器的名称
    //     host: redisHost || "127.0.0.1", // 在windows系统中直接使用的话，使用127.0.0.1
    //     // 所以为了兼容，这里要用环境变量。
    //     // 容器内部不能直接访问 127.0.0.1，因为 127.0.0.1 是指容器内部的本地网络地址
    //     port: redisPort || 6379,
    //     enableAutoPipelining: true, // 自动管道化，提高性能
    // });
    // console.log("在utils中，连接 Redis 成功，创建redis实例");
    const data = await fetchFunction();
    // console.log("update cache", key, data);

    // await redis.set(key, JSON.stringify(data), "EX", ttl); // 设置过期时间

    // 将每个章节对象存储为哈希字段，字段名为章节的id，值为章节对象
    for (const item of data) {
        // 假设每个章节对象有 `id` 字段
        await redis.hset(key, item.id.toString(), JSON.stringify(item));
    }
    redis.expire(key, ttl).then((didSetExpire) => {
        console.log("Key has an expiration time set:", didSetExpire);
    }); // 设置过期时间
    console.log("hset");
}
