import { fetchAllPaginatedData } from "~/server/utils/directusUtils";
import { getHashItemsFromCache } from "~/server/utils/redisUtils";

export default defineEventHandler(async (event) => {
    console.log("触发question-groups/list事件");

    // 获取 URL 中的 ids 参数
    const body = await readBody(event); // 解析请求体
    const ids = body.ids; // 获取 ID 列表

    // 调用缓存查询方法
    const data = await getHashItemsFromCache(
        "question_groups", // Redis 中的 key
        ids, // 传入的 ID 列表
        () =>
            fetchAllPaginatedData({
                collection: "question_groups",
                fields: [
                    "id",
                    "title",
                    "shared_stem",
                    "questions.id",
                    "questions.title",
                    "questions.type",
                    "questions.stem",
                    "questions.sort_in_group",
                    // 单选题字段
                    "questions.q_mc_single.id",
                    "questions.q_mc_single.stem",
                    "questions.q_mc_single.option_a",
                    "questions.q_mc_single.option_b",
                    "questions.q_mc_single.option_c",
                    "questions.q_mc_single.option_d",
                    "questions.q_mc_single.option_e",
                    "questions.q_mc_single.option_f",
                    "questions.q_mc_single.correct_option",
                    // 多选题字段
                    "questions.q_mc_multi.id",
                    "questions.q_mc_multi.stem",
                    "questions.q_mc_multi.option_a",
                    "questions.q_mc_multi.option_b",
                    "questions.q_mc_multi.option_c",
                    "questions.q_mc_multi.option_d",
                    "questions.q_mc_multi.option_e",
                    "questions.q_mc_multi.option_f",
                    "questions.q_mc_multi.correct_options",
                    // 二元选择题字段
                    "questions.q_mc_binary.id",
                    "questions.q_mc_binary.stem",
                    "questions.q_mc_binary.option_a",
                    "questions.q_mc_binary.option_b",
                    "questions.q_mc_binary.correct_option",
                    // 灵活选择题字段
                    "questions.q_mc_flexible.id",
                    "questions.q_mc_flexible.stem",
                    "questions.q_mc_flexible.option_a",
                    "questions.q_mc_flexible.option_b",
                    "questions.q_mc_flexible.option_c",
                    "questions.q_mc_flexible.option_d",
                    "questions.q_mc_flexible.option_e",
                    "questions.q_mc_flexible.option_f",
                    "questions.q_mc_flexible.correct_options",
                ],
            }) // 从数据库获取数据的函数
    );

    return data;
});
