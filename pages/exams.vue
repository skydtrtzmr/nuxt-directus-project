<!-- Path -->
<template>
    <!-- <div>{{ submitted_exams }}</div> -->
    <div>
        <h2>考试列表</h2>
        <div class="exam-card-container">
            <Dialog
                v-model:visible="not_started_dialog_visible"
                modal
                header="提示"
                :style="{ width: '25rem' }"
            >
                <span class="text-surface-500 dark:text-surface-400 block mb-8"
                    >考试未开始！</span
                >
                <div class="flex justify-end gap-2">
                    <Button
                        type="button"
                        label="确定"
                        @click="not_started_dialog_visible = false"
                    ></Button>
                </div>
            </Dialog>
            <Dialog
                v-model:visible="have_ended_dialog_visible"
                modal
                header="提示"
                :style="{ width: '25rem' }"
            >
                <span class="text-surface-500 dark:text-surface-400 block mb-8"
                    >考试已结束！</span
                >
                <div class="flex justify-end gap-2">
                    <Button
                        type="button"
                        label="确定"
                        @click="have_ended_dialog_visible = false"
                    ></Button>
                </div>
            </Dialog>
            <div
                class="exam-card"
                v-for="submitted_exam in submitted_exams"
                :key="submitted_exam.id"
            >
                <div v-if="typeof submitted_exam.exam === 'object'">
                    <h3 class="exam-name">
                        {{ submitted_exam.exam.title }}
                    </h3>
                    <p>
                        <strong>开始时间:</strong>
                        {{
                            dayjs(submitted_exam.exam.start_time).format(
                                "YYYY-MM-DD HH:mm:ss"
                            )
                        }}
                    </p>
                    <p>
                        <strong>结束时间:</strong>
                        {{
                            dayjs(submitted_exam.exam.start_time).format(
                                "YYYY-MM-DD HH:mm:ss"
                            )
                        }}
                    </p>
                    <Tag
                        :value="getSubmitStatusName(submitted_exam)"
                        :severity="getSubmitStatus(submitted_exam)"
                    ></Tag>
                    <!-- 这里需要定义type，现在有报错 -->
                    <div
                        v-if="
                            getSubmitStatusName(submitted_exam) !==
                            '已交卷'
                        "
                    >
                        <Button
                            @click="joinExam(submitted_exam.id)"
                            class="join-button"
                        >
                            {{ getSubmitStatusAction(submitted_exam) }}
                        </Button>
                    </div>
                    <div v-else>
                        <Button
                            @click="joinExam(submitted_exam.id)"
                            class="join-button"
                            disabled
                        >
                            {{ getSubmitStatusAction(submitted_exam) }}
                        </Button>
                    </div>
                </div>
                <br />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import { useAuth } from "~~/stores/auth";
import type {
    SubmittedExams,
    SubmittedPapers,
    Exams,
} from "~~/types/directus_types";
const auth = useAuth();
const current_user = auth.user; // 获取当前用户
console.log("current_user:\n", current_user);

// 这两个控制能否参加考试的弹窗
const not_started_dialog_visible = ref(false);
const have_ended_dialog_visible = ref(false);

const { getItems, updateItem } = useDirectusItems();
// 如果当前用户未登录，或者token失效，则跳转到登录页面
definePageMeta({
    middleware: ["auth"],
});

if (!current_user) {
    const router = useRouter();
    router.push("/login");
}

// const { refreshTokens } = useDirectusToken();
// refreshTokens();
// 设置了refreshTokens之后，只要还继续访问这个页面，就会自动刷新token，
// 保证一直在用的用户的token是最新的，不会突然失效。

const updateSubmitStatus = async (submitted_exam: SubmittedExams) => {
    try {
        const newItem = { submit_status: "doing" };
        await updateItem<SubmittedExams>({
            collection: "submitted_exams",
            id: submitted_exam.id,
            item: newItem,
        });
    } catch (e) {}
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

const joinExam = (examId: string) => {
    // 首先判断考试时间
    console.log("当前时间：");
    console.log(dayjs(Date.now()));
    const now_time = dayjs(Date.now());

    const exam_info = submitted_exams.find((item) => item.id === examId)!;

    console.log("考试开始时间：");
    const exam_start_time = dayjs(exam_info.exam.start_time);
    console.log(dayjs(exam_info.exam.start_time));

    console.log("考试结束时间：");
    const exam_end_time = dayjs(exam_info.exam.end_time);
    console.log(dayjs(exam_info.exam.end_time));

    if (now_time.isBefore(exam_start_time)) {
        not_started_dialog_visible.value = true;
        return;
    }

    if (now_time.isAfter(exam_end_time)) {
        have_ended_dialog_visible.value = true;
        return;
    }
    
    console.log(`参加考试：${examId}`);
    // 参加考试之后，需要修改submit_status为doing。
    updateSubmitStatus(submitted_exams.find((item) => item.id === examId)!);
    // 你可以根据examId跳转到具体的考试页面
    // 这里的 router.push 必须是 this.$router.push 或者使用 composable useRouter()
    // 如果使用 useRouter，需要引入并使用
    const router = useRouter();
    router.push(`/exam/${examId}`);
    // 跳转到具体的考试页面，页面path的最后一项就是submitted_exams的id。
};

const getSubmitStatus = (submitted_exam: SubmittedExams) => {
    switch (submitted_exam.submit_status) {
        case "done":
            return "success";

        case "doing":
            return "warn";

        case "todo":
            return "danger";

        default:
            return null;
    }
};

const getSubmitStatusName = (submitted_exam: SubmittedExams) => {
    switch (submitted_exam.submit_status) {
        case "done":
            return "已交卷";

        case "doing":
            return "答题中";

        case "todo":
            return "未开始";

        default:
            return null;
    }
};

const getSubmitStatusAction = (submitted_exam: SubmittedExams) => {
    switch (submitted_exam.submit_status) {
        case "done":
            return "已交卷";

        case "doing":
            return "继续答题";

        case "todo":
            return "开始考试";

        default:
            return null;
    }
};

// console.log(submitted_exams);
</script>
