import { createDirectus, rest, readUsers } from "@directus/sdk";
import type { DirectusUsers } from "~~/types/directus_types";
import Redis from "ioredis";
import { set } from "zod";

const {
    public: {
        directus: { url },
    },
    private: { redisHost, redisPort },
} = useRuntimeConfig();

console.log("测试环境，自动脚本获取用户数据并存储到 Redis");

const redis = new Redis({
    // host: 'redis-container',  // 在Docker中使用的话，这里使用容器的名称
    host: redisHost || "127.0.0.1", // 在windows系统中直接使用的话，使用127.0.0.1
    // 所以为了兼容，这里要用环境变量。
    // 容器内部不能直接访问 127.0.0.1，因为 127.0.0.1 是指容器内部的本地网络地址
    port: redisPort || 6379,
});

console.log("redisHost:", redisHost);


console.log("连接 Redis 成功");

let usersArray: DirectusUsers[] = [];

// 在 Redis 中设置一个计数器并通过 Redis 的 INCR 命令来确保每次请求都会自动递增：
export default defineEventHandler(async (event) => {
    // 从 Redis 获取并递增 userIndex
    let userIndex = await redis.incr("user_index");
    
    // 如果是第一次请求，则获取用户数据并将用户数据存储到 Redis。之后的请求都直接从 Redis 中获取用户数据。
    async function setUsers() {
        let users: DirectusUsers[] = [];

        const directus_url = url || "http://127.0.0.1:8056";
        const directus_client = createDirectus(directus_url).with(rest());
        console.log("directus_url: ", directus_url);
        
        // TODO 这边要分页获取然后合并列表，因为一次请求只能获取 200 条数据
        const result_page1 = (await directus_client.request(
            readUsers({
                fields: ["id,email"],
                sort: "email",
                filter: {
                    role: {
                        _eq: "0fcfa6da-9e38-4d73-acf5-c5585c0770f8",
                    },
                },
                page: 1,
            })
        )) as DirectusUsers[];

        console.log("result_page1: ", result_page1);

        const result_page2 = (await directus_client.request(
            readUsers({
                fields: ["id,email"],
                sort: "email",
                filter: {
                    role: {
                        _eq: "0fcfa6da-9e38-4d73-acf5-c5585c0770f8",
                    },
                },
                page: 2,
            })
        )) as DirectusUsers[];

        console.log("result_page2: ", result_page2);

        const result_page3 = (await directus_client.request(
            readUsers({
                fields: ["id,email"],
                sort: "email",
                filter: {
                    role: {
                        _eq: "0fcfa6da-9e38-4d73-acf5-c5585c0770f8",
                    },
                },
                page: 3,
            })
        )) as DirectusUsers[];
        console.log("result_page3: ", result_page3);

        const result_page4 = (await directus_client.request(
            readUsers({
                fields: ["id,email"],
                sort: "email",
                filter: {
                    role: {
                        _eq: "0fcfa6da-9e38-4d73-acf5-c5585c0770f8",
                    },
                },
                page: 4,
            })
        )) as DirectusUsers[];
        console.log("result_page4: ", result_page4);

        const result = result_page1.concat(result_page2, result_page3, result_page4);

        console.log("users: ", result);
        users = result;

        // 将用户数据存储到 Redis（使用 JSON.stringify 进行序列化）
        redis.set("users", JSON.stringify(users));
    }

    const users = await redis.get("users");

    console.log("获取 users:", users);
    // 把redis中的数据转换成数组
    if (users && users.length > 0) {
        console.log("users is not null");
        
        usersArray = JSON.parse(users);
    } else {
        console.log("users is null, set users");
        
        await setUsers();
        const users = await redis.get("users");
        usersArray = JSON.parse(users!);
    }

    console.log("userIndex: ", userIndex);
    let currentUser = usersArray[userIndex - 1] as DirectusUsers;
    return currentUser;
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
