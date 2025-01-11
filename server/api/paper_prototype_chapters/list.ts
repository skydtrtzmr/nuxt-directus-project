import { fetchAllPaginatedData } from "~/server/utils/directusUtils";
import { getHashListItemsFromCache } from "~/server/utils/redisUtils";

export default defineEventHandler(async (event) => {
    console.log("触发paper_prototype_chapters/list事件");

    // 获取 URL 中的 ids 参数
    const body = await readBody(event); // 解析请求体
    const ids = body.ids; // 获取 ID 列表

    // 调用缓存查询方法
    const data = await getHashListItemsFromCache(
        "paper_prototype_chapters", // Redis 中的 key
        ids, // 传入的 ID 列表
        () =>
            fetchAllPaginatedData({
                collection: "paper_prototype_chapters",
                fields: [
                    "id",
                    "q_mc_single.*",
                    "q_mc_multi.*",
                    "q_mc_binary.*",
                    "q_mc_flexible.*",
                    "question_group.*",
                ],
            }) // 从数据库获取数据的函数
    );

    return data;
});
