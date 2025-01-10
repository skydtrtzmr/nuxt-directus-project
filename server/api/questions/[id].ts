import { stringify } from "@primevue/core";

const fetchQuestionsFromDirectus = async () => {};

export default defineEventHandler(async (event) => {
    // 获取 URL 中的 id 参数
    const { id } = getQuery(event); // 获取URL的查询参数：id
    const question_id = stringify(id); // 将 id 转为字符串，以便作为 Redis 的键值
    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "Missing id parameter",
        });
    }

    // const data = await getHashListItemFromCache(
    //     "questions", // 这是 Redis 中存储数据的键
    //     question_id, // 章节的 id
    //     fetchQuestionsFromDirectus // 获取章节数据的函数
    // );
});
