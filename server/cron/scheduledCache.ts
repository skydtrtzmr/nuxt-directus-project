// server/cron/scheduledCache.ts

// 定期更新缓存

import { defineCronHandler } from "#nuxt/cron";
import { updateHashCache, updateListCache, setItemsToCache } from "~~/server/utils/redisUtils";
import directus_client from "~~/server/lib/directus";
import { readUsers, readItems } from "@directus/sdk";

// 概念性的、用于获取完整试卷数据的 fields 数组
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
  "paper_sections.questions.sort_in_section",
  "paper_sections.question_groups",
  // 章节中的问题 (通过 paper_sections_questions 关联)
  "paper_sections.questions.questions_id.stem",
  "paper_sections.questions.questions_id.type",
  "paper_sections.questions.questions_id.analysis",
  "paper_sections.questions.questions_id.q_mc_single.*",
  "paper_sections.questions.questions_id.q_mc_multi.*",
  "paper_sections.questions.questions_id.q_mc_binary.*",
  "paper_sections.questions.questions_id.q_mc_flexible.*",
  "paper_sections.questions.questions_id.question_group.id",
  "paper_sections.questions.questions_id.sort_in_group",
  "paper_sections.questions.questions_id.correct_ans_select_radio",
  "paper_sections.questions.questions_id.correct_ans_select_multiple_checkbox",
  // 章节中的题组 (通过 paper_sections_question_groups 关联)
  "paper_sections.question_groups.question_groups_id.id", // 这是 paper_sections_question_groups 中间表条目的ID
  "paper_sections.question_groups.question_groups_id.shared_stem",
  "paper_sections.question_groups.sort_in_section", // 题组在章节内的排序
];

export default defineCronHandler("everyMinute", async () => {

    // 设置试卷列表缓存（包含完整的试卷数据）
    setItemsToCache(
        "papers_full_data", // 新的缓存键
        async () =>
            await directus_client.request(
                readItems("papers", {
                    // filter: {
                    //     status: {
                    //         _eq: "已发布",
                    //     },
                    // },
                    fields: comprehensivePaperFields,
                    limit: -1, // 获取所有符合条件的试卷
                    // 如果需要对关联集合进行排序或过滤，可能需要使用 'deep' 参数，具体语法取决于 Directus SDK 版本
                    // deep: {
                    //   paper_sections: { _sort: ["sort_in_paper"] },
                    //   "paper_sections.questions": { _sort: ["sort_in_section"] }
                    // }
                })
            ),
        "id",
        60 // 缓存时间，例如1小时 (3600秒)
    );
});

// 已经在nuxt.config.ts中设置了`runOnInit: true`，就不再在函数中写`{ runOnInit: true }`了。
