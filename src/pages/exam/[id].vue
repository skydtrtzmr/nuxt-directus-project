<!-- pages/exam/[id].vue -->
<template>
    <div>
        <h1>考试详情</h1>
        <p>考试ID: {{ submitted_exam_id }}</p>
        <!-- 显示考试的其他信息 -->

        <!-- 显示试卷详情 -->
        <div v-if="submittedPaper">
            <h2
                v-if="
                    submittedPaper.source_paper_prototype &&
                    typeof submittedPaper.source_paper_prototype !== 'string'
                "
            >
                试卷标题: {{ submittedPaper.source_paper_prototype.title }}
            </h2>
            <p
                v-if="
                    submittedPaper.source_paper_prototype &&
                    typeof submittedPaper.source_paper_prototype !== 'string'
                "
            >
                试卷总分:
                {{ submittedPaper.source_paper_prototype.total_point_value }}
            </p>
            <!-- <p v-if="submittedPaper.source_paper_prototype">状态: {{ submittedPaper.status }}</p> -->
        </div>

        <!-- 章节列表 -->
        <div v-if="submittedPaperChapters.length > 0">
            <h3>章节</h3>
            <ul>
                <li v-for="chapter in submittedPaperChapters" :key="chapter.id">
                    {{ chapter.title }} ({{ chapter.status }})
                </li>
            </ul>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import type { SubmittedExams, SubmittedPapers, SubmittedPaperChapters } from "~/types/directus_types";

// 如果当前用户未登录ortoken失效，则跳转到登录页面
definePageMeta({
    middleware: ["auth"],
});

const { getItemById } = useDirectusItems();

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
    }
};


// 页面加载时调用
onMounted(() => {
    fetchSubmittedExam();
});
</script>
