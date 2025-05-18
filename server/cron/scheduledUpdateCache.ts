// server/cron/scheduledUpdateCache.ts

// 定期更新缓存

import { defineCronHandler } from "#nuxt/cron";
import { updateHashCache, updateListCache } from "~~/server/utils/redisUtils";
import directus_client from "~~/server/lib/directus";
import { readUsers, readItems } from "@directus/sdk";
import { fetchAllPaginatedData } from "../utils/directusUtils";

// TODO 目前为了方便开发，在directus中把所有权限都开放了，所以现在发起请求的时候不需要带token。
// 后续需要把权限控制好，只允许有权限的用户访问。

// 注意！每次请求只能返回100条数据，所以如果题目数量多于100，需要分批请求。

export default defineCronHandler("everyThirtyMinutes", async () => {
    // do action
    console.log("Scheduled Update Cache");
    // updateHashCache(
    //     "paper_prototype_chapters",
    //     () =>
    //         fetchAllPaginatedData({
    //             collection: "paper_prototype_chapters",
    //             fields: ["id", "title", "description"],
    //         }),
    //     3600 // 1 hour
    // );
    // TODO 暂时题目比较少，所以可以一次性把所有数据都存入redis缓存，
    // 后续如果题目多了，必须只把热点数据存入redis缓存。

    updateHashCache(
        "paper_sections",
        () =>
            fetchAllPaginatedData({
                collection: "paper_sections",
                fields: [
                    "id",
                    "paper_id",
                    "sort_in_paper",
                    "title",
                    "description",
                    "points_per_question",
                    "question_type",
                    "question_mode",
                    "total_question_points",
                    "questions",
                    "question_groups",
                ],
            }),
        3600 // 1 hour
    );

    updateHashCache(
        "paper_sections_questions",
        () =>
            fetchAllPaginatedData({
                collection: "paper_sections_questions",
                fields: [
                    "id",
                    "paper_sections_id",
                    "questions_id",
                    "sort_in_section",
                ],
            }),
        3600 // 1 hour
    );

    updateHashCache(
        "questions",
        () =>
            fetchAllPaginatedData({
                collection: "questions",
                fields: [
                    "id",
                    "stem",
                    "type",
                    "analysis",
                    "q_mc_single.*",
                    "q_mc_multi.*",
                    "q_mc_binary.*",
                    "q_mc_flexible.*",
                    "question_group.*",
                    "sort_in_group",
                    "correct_ans_select_radio",
                    "correct_ans_select_multiple_checkbox",
                ],
            }),
        3600 // 1 hour
    );

    updateHashCache(
        "question_groups",
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
            }),
        3600 // 1 hour
    );

    // 上面的写法是把整个列表存为一个值。接下来改成每个列表的每一个对象存为一个值。
    // 这样可以避免列表过长、每次get redis数据量过大的问题。

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
