<template>
    <div>{{ submitted_exams }}</div>
    <div>
        <h1>考试列表</h1>
        <div class="exam-card-container">
            <div
                class="exam-card"
                v-for="exam in submitted_exams"
                :key="exam.id"
            >
                <h2 class="exam-name">{{ exam.name }}</h2>
                <p><strong>开始时间:</strong> {{ exam.start_time }}</p>
                <p><strong>结束时间:</strong> {{ exam.end_time }}</p>
                <button @click="joinExam(exam.id)" class="join-button">
                    参加考试
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const { getItems } = useDirectusItems();

/**
 * submitted_exams
 */
export interface SubmittedExams {
    actual_end_time?: string;
    actual_start_time?: string;
    date_created?: string;
    date_updated?: string;
    exam?: string;
    expected_end_time?: string;
    extra_time?: number;
    id: string;
    participation_status?: string;
    sort?: number;
    status: string;
    student?: string;
    submit_status?: string;
    user_created?: string;
    user_updated?: string;
    [property: string]: any;
}

const joinExam = (examId: string) => {
    console.log(`参加考试：${examId}`);
    // 你可以根据examId跳转到具体的考试页面
    // router.push(`/exam/${examId}`); // 如果你在项目中有路由
};

// const filters = { content: "testcontent", title: "Test1" };
const submitted_exams = await getItems<SubmittedExams>({
    collection: "submitted_exams",
	// params: {
    //     filter: filters,
	// },
});
</script>
