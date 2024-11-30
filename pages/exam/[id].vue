<!-- pages/exam/[id].vue -->
<template>
    <div>
        <!-- <h2>考试详情</h2> -->
        <p>考试ID: {{ submitted_exam_id }}</p>
        <!-- 显示考试的其他信息 -->

        <!-- 显示试卷详情 -->
        <PaperInfo :submittedPaper="submittedPaper"></PaperInfo>

        <div class="flex">
            <!-- 左侧：题目列表 -->
            <QuestionList
                class="basis-1/5"
                :submittedPaperChapters="submittedPaperChapters"
                :selectQuestion="selectQuestion"
            ></QuestionList>

            <!-- 右侧：题目详情和答题区 -->
            <QuestionDetail
                class="basis-4/5"
                :selectedSubmittedQuestion="selectedSubmittedQuestion"
            ></QuestionDetail>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import type {
    SubmittedExams,
    SubmittedPapers,
    SubmittedPaperChapters,
    SubmittedQuestions,
} from "~~/types/directus_types";

// const { refreshTokens } = useDirectusToken();

// // 刷新 token，确保仍然有效
// const newToken = refreshTokens();
// // 返回一个DirectusAuthResponse，与login返回的结构一致
// // {
// //     user: DirectusUser;
// //     access_token: string;
// //     expires: number;
// //     refresh_token: string;
// // }
// console.log("触发refreshTokens()。");

// console.log("newToken:", newToken);

// 如果当前用户未登录或者token失效，则跳转到登录页面
definePageMeta({
    middleware: ["auth"],
    layout: "empty" // 考试时全屏显示，不需要侧边栏和顶部导航栏
});

const { getItemById, getItems } = useDirectusItems();

// 路由参数：submitted_exam 的 ID
const route = useRoute();
// const submitted_exam_id = route.params.id;
// 加入预处理参数：在路由守卫或组件加载时，无论是单个值还是数组，都统一解析为单个值。
const submitted_exam_id = Array.isArray(route.params.id)
    ? route.params.id[0]
    : route.params.id;

// 数据绑定
const submittedExam = ref<SubmittedExams | null>(null);
const submittedPaper = ref<SubmittedPapers | null>(null);
const submittedPaperChapters = ref<SubmittedPaperChapters[]>([]);
// const submittedQuestions = ref<SubmittedQuestions[]>([]);
const selectedSubmittedQuestion = ref<SubmittedQuestions | null>(null); // 当前选中的题目
// const selectedAnswer = ref(""); // 当前题目的答案

// 获取提交的考试信息。先获取试卷，再获取试卷的章节。
const fetchSubmittedExam = async () => {
    const submittedExamResponse = await getItemById<SubmittedExams>({
        collection: "submitted_exams",
        id: submitted_exam_id,
        params: {
            fields: ["submitted_papers"], // 获取考试的状态和关联的试卷
        },
    });
    if (submittedExamResponse) {
        submittedExam.value = submittedExamResponse;
        if (
            submittedExamResponse.submitted_papers &&
            submittedExamResponse.submitted_papers.length > 0
        ) {
            // 获取第一个试卷的详情。
            // TODO 以后可能要支持多个试卷，这里只取第一个试卷。
            const paperId = submittedExamResponse.submitted_papers[0];
            // 注意，如果要定义paperId的话，看好本次请求是深入到哪一层嵌套了。
            console.log("paperId", paperId);
            fetchSubmittedPaper(paperId);
        }
    }
};

// 获取提交的试卷
const fetchSubmittedPaper = async (paperId: string) => {
    const paperResponse = await getItemById<SubmittedPapers>({
        collection: "submitted_papers",
        id: paperId,
        params: {
            fields: [
                "source_paper_prototype.title",
                "source_paper_prototype.total_point_value",
                "submitted_paper_chapters",
            ],
        },
    });
    if (paperResponse) {
        submittedPaper.value = paperResponse;
        fetchSubmittedChapterList(paperResponse.submitted_paper_chapters);
    }
};

// 获取提交的试卷的章节
// 一次性获取所有章节及其关联的题目信息
const fetchSubmittedChapterList = async (
    chapters: SubmittedPaperChapters[]
) => {
    const chaptersResponse = await getItems<SubmittedPaperChapters>({
        collection: "submitted_paper_chapters",
        params: {
            filter: {
                id: { _in: chapters },
            },
            fields: [
                "id",
                "sort_in_paper",
                "title",
                "source_paper_prototype_chapter.title",
                "submitted_questions.id",
                "submitted_questions.sort_in_chapter",
                "submitted_questions.option_number",
                "submitted_questions.question_type",
                "submitted_questions.submitted_ans_q_mc_single",
                "submitted_questions.submitted_ans_q_mc_multi",
                "submitted_questions.submitted_ans_q_mc_binary",
                "submitted_questions.submitted_ans_q_mc_flexible",
                "submitted_questions.question.q_mc_single.*",
                "submitted_questions.question.q_mc_multi.*",
                "submitted_questions.question.q_mc_binary.*",
                "submitted_questions.question.q_mc_flexible.*",
                "submitted_questions.submitted_paper_chapter.source_paper_prototype_chapter",
                "submitted_questions.submitted_paper_chapter.source_paper_prototype_chapter.id",
                "submitted_questions.submitted_paper_chapter.source_paper_prototype_chapter.title",
                "submitted_questions.submitted_paper_chapter.source_paper_prototype_chapter.description",
            ],
            sort: "sort_in_paper",
        },
    });
    if (chaptersResponse) {
        submittedPaperChapters.value = chaptersResponse;
        // 默认选择第一个题目
        selectedSubmittedQuestion.value =
            chaptersResponse[0].submitted_questions[0];
    }
};

// 获取题目数据
// 注意，需要按照题目在章节中的顺序排序
// const fetchSubmittedQuestionList = async (chapters: SubmittedPaperChapters[]) => {
//     const questionIds = chapters.flatMap(
//         (chapter) => chapter.submitted_questions
//     );
//     const questionsResponse = await getItems<SubmittedQuestions>({
//         collection: "submitted_questions",
//         params: {
//             filter: {
//                 id: { _in: questionIds },
//             },
//             fields: ["id", "question", "option_number", "score"],
//         },
//     });
//     submittedQuestions.value = questionsResponse;
// };

// NOTE：不再使用专门的题目列表，而是直接从章节中获取题目列表。因为我的题目和章节信息是高度关联的，所以直接从章节中获取题目列表更合理。

// 选择一个题目
const selectQuestion = (question: SubmittedQuestions) => {
    selectedSubmittedQuestion.value = question;
    // selectedAnswer.value = ""; // 清空答案
};

// 页面加载时调用
onMounted(() => {
    fetchSubmittedExam();
});
</script>

<style scoped>
.sidebar {
    width: 260px;
    /* 固定宽度 */
    float: left;
    padding: 15px;
    border-right: 2px solid #ddd;
    margin: 20px;
}
</style>
