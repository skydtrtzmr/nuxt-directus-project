import { readUsers } from "@directus/sdk";
// 注意server里面不能直接用nuxt modules里的函数。
// 所以我没有用nuxt-directus，而是直接导入了sdk。
import directus_client from "~~/server/lib/directus";

import type { DirectusUsers } from "~~/types/directus_types";
// import Redis from "ioredis";
// import { set } from "zod";

import redis from "~~/server/lib/redis";

const {
    public: {
        directus: { url },
    },
    private: { redisHost, redisPort },
} = useRuntimeConfig();

console.log("获取当前学生");

let usersArray: DirectusUsers[] = [];

// 在 Redis 中设置一个计数器并通过 Redis 的 INCR 命令来确保每次请求都会自动递增：
export default defineEventHandler(async (event) => {
    // [2025-05-08]直接pop出来。
    const user_email = await redis.lpop("student_user_email_list");
    console.log("user_email:", user_email);
    return user_email;
});

// let userIndex = 0; // 计数器

// export default defineEventHandler((event) => {
//     userIndex += 1; // 计数器自增
//     console.log("userIndex: ", userIndex);
//     return userIndex; // 每次请求递增计数器并返回

// });

// 注意！
// 如果直接用的话，userIndex 是在内存中维护的，当你使用 PM2 启动多个实例时，每个实例都有自己的内存空间，
// 所以它们之间的 userIndex 是互相独立的。
// 因此，多instance时计数器的值会出错，因为每个实例的 userIndex 会独立增长，而不是全局共享。
// 所以需要使用 Redis 来共享计数器。
