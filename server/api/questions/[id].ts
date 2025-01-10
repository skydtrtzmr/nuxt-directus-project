import { stringify } from "@primevue/core";
import { fetchAllPaginatedData } from "~/server/utils/directusUtils";

export default defineEventHandler(async (event) => {
    console.log("触发事件");

    // 获取 URL 中的 id 参数
    const id = getRouterParam(event, "id"); // 获取URL的路由参数：id 
    // 注意这里id已经是字符串了，可别再stringfy了，那样反而会给他加上多余的引号
    
    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "缺少id参数！Missing id parameter",
        });
    }

    const data = await getHashListItemFromCache(
        "questions", // 这是 Redis 中存储数据的键
        id, // 题目的 id
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
            }) // 获取章节数据的函数
    );
    console.log("data in redis: ", data);

    return data;
});
