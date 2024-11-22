<!-- Path -->
<template>
    <!-- <div>{{ submitted_exams }}</div> -->
    <div>
        <h1>考试列表</h1>
        <div class="exam-card-container">
            <div
                class="exam-card"
                v-for="submitted_exam in submitted_exams"
                :key="submitted_exam.id"
            >
                <h2
                    class="exam-name"
                    v-if="typeof submitted_exam.exam !== 'string'"
                >
                    {{ submitted_exam.exam.title }}
                </h2>
                <p v-if="typeof submitted_exam.exam !== 'string'">
                    <strong>开始时间:</strong>
                    {{ dayjs(submitted_exam.exam.start_time).format("YYYY-MM-DD HH:mm:ss") }}
                </p>
                <p v-if="typeof submitted_exam.exam !== 'string'">
                    <strong>结束时间:</strong>
                    {{ dayjs(submitted_exam.exam.start_time).format("YYYY-MM-DD HH:mm:ss") }}
                </p>
                <button
                    @click="joinExam(submitted_exam.id)"
                    class="join-button"
                >
                    参加考试
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import { useAuth } from "@/stores/auth";
import type { SubmittedExams, SubmittedPapers, Exams } from "@/types/directus";
const auth = useAuth();
const current_user = auth.user; // 获取当前用户
console.log(current_user);

// 如果当前用户未登录ortoken失效，则跳转到登录页面
definePageMeta({
    middleware: ["auth"],
});

if (!current_user) {
    const router = useRouter();
    router.push("/login");
}

const { refreshTokens } = useDirectusToken();
refreshTokens();
// 设置了refreshTokens之后，只要还继续访问这个页面，就会自动刷新token，
// 保证一直在用的用户的token是最新的，不会突然失效。

const { getItems } = useDirectusItems();

const joinExam = (examId: string) => {
    console.log(`参加考试：${examId}`);
    // 你可以根据examId跳转到具体的考试页面
    // 这里的 router.push 必须是 this.$router.push 或者使用 composable useRouter()
    // 如果使用 useRouter，需要引入并使用
    const router = useRouter();
    router.push(`/exam/${examId}`);
    // 跳转到具体的考试页面，页面path的最后一项就是submitted_exams的id。
};

// const filters = { content: "testcontent", title: "Test1" };
const submitted_exams = await getItems<SubmittedExams>({
    collection: "submitted_exams",
    params: {
        fields: [
            "id",
            "exam.*",
            "extra_time",
            "actual_end_time",
            "actual_start_time",
            "participation_status",
            "submit_status",
            "student.*", // 要获得学生的详细信息，因为directus_user在student中。
        ],
        // 笔记：注意看，嵌套的字段（例如student.directus_user）要做筛选的话像下面这样。
        filter: {
            student: {
                directus_user: current_user!.id,
            },
        },
        // 注意！别弄混了，directus中student.id和directus_user.id不一样。
    },
});

console.log(submitted_exams);
</script>
