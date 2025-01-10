// server/cron/scheduledUpdateCache.ts

// 定期更新缓存

import { defineCronHandler } from "#nuxt/cron";
import { updateHashListCache } from "~~/server/utils/redisUtils";
import directus_client from "~~/server/lib/directus";
import { readUsers, readItems } from "@directus/sdk";
import { fetchAllPaginatedData } from "../utils/directusUtils";

// TODO 目前为了方便开发，在directus中把所有权限都开放了，所以现在发起请求的时候不需要带token。
// 后续需要把权限控制好，只允许有权限的用户访问。

// 注意！每次请求只能返回100条数据，所以如果题目数量多于100，需要分批请求。

export default defineCronHandler("everyThirtyMinutes", () => {
    // do action
    console.log("Scheduled Update Cache");
    updateHashListCache(
        "paper_prototype_chapters",
        () =>
            fetchAllPaginatedData({
                collection: "paper_prototype_chapters",
                fields: ["id", "title", "description"],
            }),
        3600 // 1 hour
    );
    // TODO 暂时题目比较少，所以可以一次性把所有数据都存入redis缓存，
    // 后续如果题目多了，必须只把热点数据存入redis缓存。

    updateHashListCache(
        "questions",
        () =>
            fetchAllPaginatedData({
                collection: "questions",
                fields: [
                    "id",
                    "q_mc_single.*",
                    "q_mc_multi.*",
                    "q_mc_binary.*",
                    "q_mc_flexible.*",
                    "question_group.*",
                ],
            }),
        3600 // 1 hour
    );

    // 上面的写法是把整个列表存为一个值。接下来改成每个列表的每一个对象存为一个值。
    // 这样可以避免列表过长、每次get redis数据量过大的问题。
});

// 已经在nuxt.config.ts中设置了`runOnInit: true`，就不再在函数中写`{ runOnInit: true }`了。
