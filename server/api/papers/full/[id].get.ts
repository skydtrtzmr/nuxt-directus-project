import { setItemsToCache, getItemFromCache } from "~~/server/utils/redisUtils";
import directus_client from "~~/server/lib/directus";
import { readUsers, readItems } from "@directus/sdk";
import { Papers } from "~~/types/directus_types";

const comprehensivePaperFields = [
    "id",
    "title",
    "description",
    "total_point_value",
    "total_question_count",
    // 关联的试卷章节 (paper_sections)
    "paper_sections.id",
    "paper_sections.paper_id",
    "paper_sections.sort_in_paper",
    "paper_sections.title",
    "paper_sections.description",
    "paper_sections.points_per_question",
    "paper_sections.question_type",
    "paper_sections.question_mode",
    "paper_sections.total_question_points",
    "paper_sections.questions",
    "paper_sections.questions.id",
    "paper_sections.questions.sort_in_section",
    "paper_sections.questions.paper_sections_id",
    // 章节中的问题 (通过 paper_sections_questions 关联)
    "paper_sections.questions.questions_id.id",
    "paper_sections.questions.questions_id.stem",
    "paper_sections.questions.questions_id.type",
    "paper_sections.questions.questions_id.analysis",
    "paper_sections.questions.questions_id.q_mc_single.*",
    "paper_sections.questions.questions_id.q_mc_multi.*",
    "paper_sections.questions.questions_id.q_mc_binary.*",
    "paper_sections.questions.questions_id.q_mc_flexible.*",
    "paper_sections.questions.questions_id.question_group.id",
    "paper_sections.questions.questions_id.question_group.shared_stem",
    "paper_sections.questions.questions_id.sort_in_group",
    "paper_sections.questions.questions_id.correct_ans_select_radio",
    "paper_sections.questions.questions_id.correct_ans_select_multiple_checkbox",
    // "paper_sections.questions.paper_sections_id",
    // 章节中的题组 (通过 paper_sections_question_groups 关联)
    "paper_sections.question_groups",
    "paper_sections.question_groups.id",
    "paper_sections.question_groups.question_groups_id.id", // 这是 question_groups 集合中项的 ID
    "paper_sections.question_groups.question_groups_id.questions.id",
    "paper_sections.question_groups.question_groups_id.shared_stem",
    // 题组中的问题（这边可以优化 TODO）
    "paper_sections.question_groups.question_groups_id.questions.id",
    "paper_sections.question_groups.question_groups_id.questions.stem",
    "paper_sections.question_groups.question_groups_id.questions.type",
    "paper_sections.question_groups.question_groups_id.questions.analysis",
    "paper_sections.question_groups.question_groups_id.questions.q_mc_single.*",
    "paper_sections.question_groups.question_groups_id.questions.q_mc_multi.*",
    "paper_sections.question_groups.question_groups_id.questions.q_mc_binary.*",
    "paper_sections.question_groups.question_groups_id.questions.q_mc_flexible.*",
    "paper_sections.question_groups.question_groups_id.questions.question_group.id",
    "paper_sections.question_groups.question_groups_id.questions.sort_in_group",
    "paper_sections.question_groups.question_groups_id.questions.correct_ans_select_radio",
    "paper_sections.question_groups.question_groups_id.questions.correct_ans_select_multiple_checkbox",
    "paper_sections.question_groups.sort_in_section", // 题组在章节内的排序
    "paper_sections.question_groups.paper_sections_id",
    // "paper_sections.question_groups.group_question_ids"
];

export default defineEventHandler(async (event) => {
    // 获取 URL 中的 id 参数
    const id = getRouterParam(event, "id"); // 获取URL的路由参数：id
    // 注意这里id已经是字符串了，可别再stringfy了，那样反而会给他加上多余的引号

    const data: Papers = await getItemFromCache(
        `papers_full_data`,
        id!,
        async () =>
            await directus_client.request(
                readItems("papers", {
                    fields: comprehensivePaperFields,
                    limit: -1, // 获取所有符合条件的试卷
                    // 如果需要对关联集合进行排序或过滤，可能需要使用 'deep' 参数，具体语法取决于 Directus SDK 版本
                    // deep: {
                    //   paper_sections: { _sort: ["sort_in_paper"] },
                    //   "paper_sections.questions": { _sort: ["sort_in_section"] }
                    // }
                })
            ),
        60
    );

    return data;
});
