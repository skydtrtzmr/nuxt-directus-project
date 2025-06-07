// server/cron/scheduledUpdateCache.ts

// 定期更新缓存

import { defineCronHandler } from "#nuxt/cron";
// import { updateHashCache, updateListCache } from "~~/server/utils/redisUtils";
// import directus_client from "~~/server/lib/directus";
// import { readUsers, readItems } from "@directus/sdk";
// import { fetchAllPaginatedData } from "../utils/directusUtils";

// TODO 目前为了方便开发，在directus中把所有权限都开放了，所以现在发起请求的时候不需要带token。
// 后续需要把权限控制好，只允许有权限的用户访问。

// 注意！每次请求只能返回100条数据，所以如果题目数量多于100，需要分批请求。

export default defineCronHandler("everyThirtyMinutes", async () => {
    // do action
    console.log("Scheduled Update Cache");

    console.log("准备执行返回学生list");
    // 仅测试用：返回学生用户的list
    // updateListCache(
    //     "student_user_email_list",
    //     async () =>
    //         await directus_client.request(
    //             readUsers({
    //                 fields: ["email"],
    //                 sort: "email",
    //                 filter: {
    //                     role: {
    //                         name: {
    //                             _eq: "学生",
    //                         },
    //                     },
    //                 },
    //                 limit: -1,
    //             })
    //         ),
    //     "email",
    //     3600
    // );

    console.log("schedule update cache end");
    // [2025-06-08] 目前彻底把跟redis的交互从nuxt摘除了，一切从directus走。
});

// 已经在nuxt.config.ts中设置了`runOnInit: true`，就不再在函数中写`{ runOnInit: true }`了。
