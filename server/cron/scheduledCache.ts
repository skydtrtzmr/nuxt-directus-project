// server/cron/scheduledCache.ts

// 定期更新缓存

import { defineCronHandler } from "#nuxt/cron";
import { updateHashCache, updateListCache } from "~~/server/utils/redisUtils";
import directus_client from "~~/server/lib/directus";
import { readUsers, readItems } from "@directus/sdk";

export default defineCronHandler("everyThirtyMinutes", async () => {
    
    // 获取所有学生用户
    updateHashCache(
        "student_users",
        async () =>
            await directus_client.request(
                readUsers({
                    fields: ["id,email"],
                    sort: "email",
                    filter: {
                        role: {
                            name: {
                                _eq: "学生",
                            },
                        },
                    },
                    limit: -1,
                })
            ),
        3600 // 1 hour
    );

    console.log("准备执行返回学生list");
    // 仅测试用：返回学生用户的list
    updateListCache(
        "student_user_email_list",
        async () =>
            await directus_client.request(
                readUsers({
                    fields: ["email"],
                    sort: "email",
                    filter: {
                        role: {
                            name: {
                                _eq: "学生",
                            },
                        },
                    },
                    limit: -1,
                })
            ),
        "email",
        3600
    );
});

// 已经在nuxt.config.ts中设置了`runOnInit: true`，就不再在函数中写`{ runOnInit: true }`了。
