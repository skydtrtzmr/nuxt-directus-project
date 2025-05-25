import type { DirectusUsers } from "~~/types/directus_types";
// import Redis from "ioredis";
// import { set } from "zod";

import redis from "~~/server/lib/redis";

console.log("获取当前学生");

let usersArray: DirectusUsers[] = [];

// 在 Redis 中设置一个计数器并通过 Redis 的 INCR 命令来确保每次请求都会自动递增：
export default defineEventHandler(async (event) => {
    // [2025-05-08]直接pop出来。
    const user_email = await redis.lpop("student_user_email_list");
    console.log("user_email:", user_email);
    return user_email;
});

