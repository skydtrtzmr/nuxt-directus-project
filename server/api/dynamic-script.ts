import Redis from "ioredis";
// import axios from "axios";
import type { DirectusUsers } from "~~/types/directus_types";
import { createDirectus, rest, readUsers } from "@directus/sdk";

const {
    public: {
        directus: { url },
    },
    private: { redisHost, redisPort },
} = useRuntimeConfig();

// Client with REST support
const directus_client = createDirectus(url).with(rest());

let users: DirectusUsers[] = [];

async function fetchUsers() {
    const result = (await directus_client.request(
        readUsers({
            fields: ["id,email"],
            sort: "email",
            filter: { role: { _eq: "0fcfa6da-9e38-4d73-acf5-c5585c0770f8" } },
        })
    )) as DirectusUsers[];
    console.log("users: ", result);
    users = result;
}

fetchUsers();

// Axios用了会报错，暂时不用
// const axios_instance = axios.create({
//     baseURL: url,
// });

// console.log("baseURL: ", url);

// async function fetchUsers() {
//     const response = await axios_instance.get(
//         // `/users?fields=id,email&sort=email&filter[role][_eq]=0fcfa6da-9e38-4d73-acf5-c5585c0770f8`
//         `/users`,
//         {
//             params: {
//                 fields: "id,email",
//                 sort: "email",
//                 filter: {
//                     role: {
//                         _eq: "0fcfa6da-9e38-4d73-acf5-c5585c0770f8",
//                     },
//                 },
//             },
//         }
//     );
//     users = response.data.data;
// }

// fetchUsers();

const redis = new Redis({
    // host: 'redis-container',  // 在Docker中使用的话，这里使用容器的名称
    host: redisHost || "127.0.0.1", // 在windows系统中直接使用的话，使用127.0.0.1
    // 所以为了兼容，这里要用环境变量。
    // 容器内部不能直接访问 127.0.0.1，因为 127.0.0.1 是指容器内部的本地网络地址
    port: redisPort || 6379,
});

console.log("连接 Redis 成功");


// 在 Redis 中设置一个计数器并通过 Redis 的 INCR 命令来确保每次请求都会自动递增：
export default defineEventHandler(async (event) => {
    // 从 Redis 获取并递增 userIndex
    let userIndex = await redis.incr("user_index");
    console.log("userIndex: ", userIndex);
    let currentUser = users[userIndex - 1] as DirectusUsers;
    return currentUser;
});
// redis的incr命令会在key不存在时，自动创建key并设置值为1，然后递增key的值，返回递增后的值。

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
