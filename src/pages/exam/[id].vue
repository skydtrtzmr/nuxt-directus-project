<!-- pages/exam/[id].vue -->
<!-- 这里的id就是submitted_exam的id -->
<template>
    <div>
        <h1>考试详情</h1>
        <p>考试ID: {{ submitted_exam_id }}</p>
        <!-- 此处可以根据 examId 显示具体的考试信息 -->
    </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import { ref, onMounted } from "vue";
import type { SubmittedExams } from "~/types/directus";
const { getItemById } = useDirectusItems();

const route = useRoute();

// 路由参数：submitted_exam 的 ID
// const submitted_exam_id = route.params.id;
// 加入预处理参数：在路由守卫或组件加载时，无论是单个值还是数组，都统一解析为单个值。
const submitted_exam_id = Array.isArray(route.params.id)
    ? route.params.id[0]
    : route.params.id;

const paperDetail = ref(null); // 存储考试详情

const submitted_paper_id = ref("");

const fetchSubmittedExam = async () => {
    const response: SubmittedExams = await getItemById({
        collection: "submitted_exams",
        id: submitted_exam_id,
        params: {
            fields: ["submitted_papers"],
        },
    });
    console.log(response);
    if (response && response.submitted_papers && response.submitted_papers.length > 0) {
        // 获取 submitted_papers[0] 的 ID
        const submittedPaperId = response.submitted_papers[0].id;
    }
};

// 页面加载时调用
onMounted(() => {
    fetchSubmittedExam();
});
</script>
