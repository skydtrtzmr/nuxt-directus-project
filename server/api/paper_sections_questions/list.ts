import { fetchAllPaginatedData } from "~/server/utils/directusUtils";
import { getHashItemsFromCache } from "~/server/utils/redisUtils";

export default defineEventHandler(async (event) => {
    console.log("触发paper_sections_questions/list事件");

    // 获取 URL 中的 ids 参数
    const body = await readBody(event); // 解析请求体
    const ids = body.ids; // 获取 ID 列表

    // 调用缓存查询方法
    // 根据id列表，查询这些id对应项的详细数据
    // TODO 我觉得这个函数可以再封装一下……
    const data = await getHashItemsFromCache(
        "paper_sections_questions", // Redis 中的 key
        ids, // 传入的 ID 列表
        () =>
            fetchAllPaginatedData({
                collection: "paper_sections_questions",
                fields: [
                    "id",
                    "sort_in_section",
                    "questions_id",
                    "paper_sections_id",
                ],
                // sort: "sort_in_paper", // 排序方式
            }) // 从数据库获取数据的函数
    );

    return data;
});
