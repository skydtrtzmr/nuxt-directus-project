<!-- pages/exam/[id].vue -->
<template>
    <div class="relative">
        <!-- 显示考试信息 -->
        <ExamInfo :submittedExam="submittedExam"></ExamInfo>
        <!-- 显示试卷详情 -->
        <template v-if="exam_page_mode !== 'review'">
            <div>
                <PaperInfo :submittedPaper="submittedPaper"></PaperInfo>
                <div class="absolute top-0 right-0">
                    <!-- 显示倒计时 -->
                    <ExamCountdown
                        :isClient="isClient"
                        :examEndTime="examEndTime"
                        :submittedExamTime="submittedExamTime"
                        :formattedCountDown="formattedCountDown"
                    ></ExamCountdown>
                    <Button
                        icon="pi pi-save"
                        aria-label="Submit"
                        label="提交试卷"
                        @click="manualSubmit()"
                    />
                </div>
            </div>
        </template>
        <template v-else>
            <div class="absolute top-10 right-10">
                <div>试卷总分值：{{ submittedPaper.point_value }}</div>
                <div>当前总得分：{{ submittedPaper.score }}</div>
            </div>
        </template>
        <template v-if="exam_page_mode !== 'review'">
            <Dialog
                v-model:visible="ended_dialog_visible"
                modal
                header="提示"
                @hide="exitExam()"
                :style="{ width: '25rem' }"
            >
                <span class="text-surface-500 dark:text-surface-400 block mb-8"
                    >考试结束时间到，已自动提交试卷！</span
                >
                <div class="flex justify-end gap-2">
                    <Button
                        type="button"
                        label="确定"
                        @click="exitExam()"
                    ></Button>
                </div>
            </Dialog>
            <Dialog
                v-model:visible="confirm_submit_dialog_visible"
                modal
                header="警告"
                :style="{ width: '25rem' }"
            >
                <span class="text-surface-500 dark:text-surface-400 block mb-8"
                    >确认提交试卷吗？</span
                >
                <div class="flex justify-end gap-2">
                    <Button
                        type="button"
                        label="确定"
                        @click="confirmSubmit()"
                    ></Button>
                </div>
            </Dialog>
        </template>
        <div class="flex">
            <!-- 左侧：题目列表 -->
            <QuestionList
                class="basis-1/5 card"
                :exam_page_mode="exam_page_mode"
                :submittedPaperChapters="submittedPaperChapters"
                :selectedSubmittedQuestion="selectedSubmittedQuestion"
                :selectQuestion="selectQuestion"
            ></QuestionList>

            <!-- 右侧：题目详情和答题区 -->
            <QuestionDetail
                :exam_page_mode="exam_page_mode"
                class="basis-4/5"
                :selectedSubmittedQuestion="selectedSubmittedQuestion"
            ></QuestionDetail>
        </div>
    </div>
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import utc from "dayjs/plugin/utc";
import type {
    SubmittedExams,
    SubmittedPapers,
    SubmittedPaperChapters,
    SubmittedQuestions,
    Exams,
} from "~~/types/directus_types";
import md5 from "md5";
import { useAuth } from "~~/stores/auth";

import { useGlobalStore } from "@/stores/examDone"; // 引入 Pinia store
import { useLoadingStateStore } from "@/stores/loadingState"; // 引入 Pinia store

const auth = useAuth();
const { user } = storeToRefs(auth); // 获取store里的user数据，用于根据邮箱设置延迟。
const email = ref(user.value?.email || "");

const globalStore = useGlobalStore(); // 创建 Pinia store 实例

dayjs.extend(utc);

const ended_dialog_visible = ref(false);
const confirm_submit_dialog_visible = ref(false);

const props = defineProps<{
    // submitted_exam_id: string;
    // 暂时不用拿参数，直接用vue-router自己获取。
    exam_page_mode: string; // 考试模式，practice、exam、review
}>();

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

const { getItemById, getItems, updateItem } = useDirectusItems();

const router = useRouter();

// 路由参数：submitted_exam 的 ID
const route = useRoute(); // 这里的useRoute是vue-router的useRoute方法，而非Nuxt的useRoute方法。
// const submitted_exam_id = route.params.id;
// 加入预处理参数：在路由守卫或组件加载时，无论是单个值还是数组，都统一解析为单个值。
const submitted_exam_id = Array.isArray(route.params.id)
    ? route.params.id[0]
    : route.params.id;

// 数据绑定
const submittedExam = ref<SubmittedExams>({} as SubmittedExams);
const submittedPaper = ref<SubmittedPapers>({} as SubmittedPapers);
const submittedPaperChapters = ref<SubmittedPaperChapters[]>([]);
// const submittedQuestions = ref<SubmittedQuestions[]>([]);
const selectedSubmittedQuestion = ref<SubmittedQuestions>(
    {} as SubmittedQuestions
); // 当前选中的题目

// 把考试时间相关数据和考试的其他数据分开，避免混淆。
const submittedExamTime = ref<SubmittedExams>({} as SubmittedExams); // 考试时间
// const selectedAnswer = ref(""); // 当前题目的答案

// 倒计时相关
// TODO 其实这里用的响应式有点多了，有些其实是应该用计算属性来优化的。
const examEndTime = ref<dayjs.Dayjs>({} as dayjs.Dayjs); // 考试结束时间（对于学生本人）
const countdown = ref(0); // 剩余时间
const formattedCountDown = ref("00:00:00"); // 倒计时
const countdownInterval = ref<any>(null); // 倒计时定时器
const actual_start_time = ref(""); // 从后端导出的时间是字符串类型。
const duration = ref(0); // 考试时长
const extra_time = ref(0); // 考试时长补偿
const expected_end_time = ref<Date>(); // 应交卷时间
const expected_end_time_str = ref(""); // 应交卷时间的字符串形式

// 获取环境变量，确定是否运行测试
const {
    public: { isTest },
} = useRuntimeConfig();

// 获取提交的考试信息。先获取试卷，再获取试卷的章节。
const fetchSubmittedExam = async () => {
    const submittedExamResponse = await getItemById<SubmittedExams>({
        collection: "submitted_exams",
        id: submitted_exam_id,
        params: {
            fields: ["id", "submitted_papers", "title", "student.name"], // 获取考试的状态和关联的试卷
        },
    });
    if (submittedExamResponse) {
        submittedExam.value = submittedExamResponse;
        afterFetchSubmittedExam();
    }
};

const fetchExamTimeData = async () => {
    const submittedExamTimeResponse = await getItemById<SubmittedExams>({
        collection: "submitted_exams",
        id: submitted_exam_id,
        params: {
            fields: [
                "id",
                "actual_start_time", // 获取考试开始时间，客户端根据此时间计算倒计时。
                "expected_end_time",
                "extra_time", // 考试时长补偿，客户端根据此时间计算倒计时。
                "duration", // 获取考试时长，直接在客户端进行计算。服务端自己计算自己的，跟客户端分开，避免客户端计算错误。
            ], // 获取考试的状态和关联的试卷
        },
    });

    // TODO 以后可以考虑不用这个submittedExamTime了。
    if (submittedExamTimeResponse) {
        submittedExamTime.value = submittedExamTimeResponse;
    }

    // 下面是初始版本，从服务器获取时间数据。

    // if (
    //     !submittedExamTime.value.expected_end_time ||
    //     submittedExamTime.value.expected_end_time === "1970-01-01T01:00:00.000Z"
    //     // 当你获得的时间为 1970-01-01T01:00:00.000Z 时，
    //     // 这通常表示你的时间值是 undefined 或 null，
    //     // 在 JavaScript 中被转换为一个“默认”的时间戳。
    // ) {
    //     console.log("考试结束时间无效，重新获取...");
    //     await delay(1000); // 等待一秒钟再重试
    //     await fetchExamTimeData(); // 递归调用
    // } else {
    //     console.log("考试结束时间有效，开始倒计时...");
    //     console.log("submittedExamTime.value.expected_end_time:");
    //     console.log(submittedExamTime.value.expected_end_time);

    //     // 如果有效，调用方法进行后续处理
    //     // afterFetchSubmittedExamTime();
    // }
};

const afterFetchSubmittedExam = () => {
    if (
        submittedExam.value.submitted_papers &&
        submittedExam.value.submitted_papers.length > 0
    ) {
        // 获取第一个试卷的详情。
        // TODO 以后可能要支持多个试卷，这里只取第一个试卷。
        const paperId = submittedExam.value.submitted_papers[0];
        // 注意，如果要定义paperId的话，看好本次请求是深入到哪一层嵌套了。
        console.log("paperId", paperId);
        fetchSubmittedPaper(paperId);
    }
};

// 把获取时间数据后的操作也跟获取考试其他数据后的操作分开。
const afterFetchSubmittedExamTime = () => {
    actual_start_time.value = submittedExamTime.value.actual_start_time!;
    duration.value = submittedExamTime.value.duration!;
    extra_time.value = submittedExamTime.value.extra_time!;

    // 先根据实际开始作答时间和考试时长，计算应交卷时间
    expected_end_time.value = new Date(actual_start_time.value);
    expected_end_time.value.setMinutes(
        expected_end_time.value.getMinutes() + duration.value + extra_time.value
    );

    // 注意：Date对象在directus中能正常运算，但不能打印。
    expected_end_time_str.value = expected_end_time.value.toISOString();

    // 设置倒计时的结束时间
    examEndTime.value = dayjs(expected_end_time_str.value);
    // CAUTION: 这里dayjs里面的值如果是空的（例如undefined），就会返回当前时间。

    console.log("examEndTime:");
    console.log(examEndTime.value);

    startCountdown(examEndTime.value);
};

// 获取提交的试卷
const fetchSubmittedPaper = async (paperId: string) => {
    const paperResponse = await getItemById<SubmittedPapers>({
        collection: "submitted_papers",
        id: paperId,
        params: {
            fields: [
                "title",
                "submitted_paper_chapters",
                "point_value",
                "score",
            ],
        },
    });
    if (paperResponse) {
        submittedPaper.value = paperResponse;
        fetchSubmittedChapterList(paperResponse.submitted_paper_chapters);
    }
};

// 获取提交的试卷的章节

// 把一次性获取所有章节及其关联的题目信息改成分批获取，避免一次性请求太多数据。
const fetchSubmittedChapterList = async (
    chapters: SubmittedPaperChapters[]
) => {
    // 1. 首先获取章节的基本信息
    const chaptersResponse = await getItems<SubmittedPaperChapters>({
        collection: "submitted_paper_chapters",
        params: {
            filter: {
                id: { _in: chapters }, // 获取章节ID列表
            },
            fields: [
                "id",
                "sort_in_paper",
                "title",
                // 你还可以根据需要添加更多字段
            ],
            sort: "sort_in_paper", // 排序方式
        },
    });

    // 2. 获取章节数据
    const chapterList = chaptersResponse;

    // 3. 根据章节ID分批加载题目数据
    const questionsPromises = chapterList.map((chapter) => {
        return getItems<SubmittedQuestions>({
            collection: "submitted_questions",
            params: {
                filter: { submitted_paper_chapter: chapter.id },
                fields: [
                    "id",
                    "sort_in_chapter",
                    "option_number",
                    "question_type",
                    "point_value",
                    "score",
                    "submitted_ans_q_mc_single",
                    "submitted_ans_q_mc_multi",
                    "submitted_ans_q_mc_binary",
                    "submitted_ans_q_mc_flexible",
                    "question.q_mc_single.*",
                    "question.q_mc_multi.*",
                    "question.q_mc_binary.*",
                    "question.q_mc_flexible.*",
                    "question.question_group.*",
                    "submitted_paper_chapter.source_paper_prototype_chapter.id",
                    "submitted_paper_chapter.title",
                    "submitted_paper_chapter.source_paper_prototype_chapter.description",
                ],
                sort: "sort_in_chapter",
            },
        });
    });

    // 4. 等待所有请求完成
    const questionsResponses = await Promise.all(questionsPromises);

    console.log("questionsResponses:", questionsResponses);

    // 5. 合并题目数据到章节数据中
    chapterList.forEach((chapter, index) => {
        chapter.submitted_questions = questionsResponses[index]; // 将题目数据嵌入章节对象
    });

    console.log("chapterList:", chapterList);

    // 6. 返回合并后的章节列表
    if (chaptersResponse) {
        submittedPaperChapters.value = chapterList;
        console.log(
            "submittedPaperChapters.value:",
            submittedPaperChapters.value
        );
        // 默认选择第一个题目
        selectedSubmittedQuestion.value = chapterList[0].submitted_questions[0];
        console.log(
            "selectedSubmittedQuestion.value:",
            selectedSubmittedQuestion.value
        );
    }
};

// 获取题目数据
// 注意，需要按照题目在章节中的顺序排序

// NOTE：不再使用专门的题目列表，而是直接从章节中获取题目列表。因为我的题目和章节信息是高度关联的，所以直接从章节中获取题目列表更合理。

// 选择一个题目
const selectQuestion = (question: SubmittedQuestions) => {
    selectedSubmittedQuestion.value = question;
    // selectedAnswer.value = ""; // 清空答案
};

// 直接传id
const submitActualEndTime = async (examId: string) => {
    try {
        let nowData = dayjs();
        const newItem = { actual_end_time: nowData };
        await updateItem<SubmittedExams>({
            collection: "submitted_exams",
            id: examId,
            item: newItem,
        });
    } catch (e) {}
};

// 这个和考试列表里面不太一样，直接传个id就行
const updateSubmitStatus = async (submitted_exam_id: string) => {
    try {
        const newItem = { submit_status: "done" };
        await updateItem<SubmittedExams>({
            collection: "submitted_exams",
            id: submitted_exam_id,
            item: newItem,
        });
    } catch (e) {}
};

// 注意这个函数只表示给后台发送对应数据，并不涉及弹出框等交互。
const submitExam = async (examId: string) => {
    submitActualEndTime(examId);
    updateSubmitStatus(examId);
    // const router = useRouter();
    // router.push(`/exams`);
};

const manualSubmit = () => {
    confirm_submit_dialog_visible.value = true;
};

// 倒计时更新函数
const startCountdown = (endTime: dayjs.Dayjs) => {
    const updateInterval = () => {
        const now = dayjs.utc(new Date());
        const remainingTime = endTime.diff(now);
        if (remainingTime <= 0) {
            // clearInterval(interval); 不要直接写在里面。
            stopCountdown();
            countdown.value = 0;
            formattedCountDown.value = "00:00:00";
            // 执行倒计时结束后的操作，比如提交考试
            handleTimeOut();
        } else {
            countdown.value = remainingTime;
            formattedCountDown.value = dayjs
                .utc(remainingTime)
                // 注意，我的数据库里面记录的是带时区的时间戳，在这里也得加上utc不然时间会多8个小时。
                .format("HH:mm:ss");
        }
    };
    updateInterval(); // 立即执行一次
    const interval = setInterval(updateInterval, 1000);

    countdownInterval.value = interval; // 保存定时器引用，方便清除

    // 在组件销毁时清除定时器
    onUnmounted(() => {
        clearInterval(interval);
    });
};

const stopCountdown = () => {
    if (countdownInterval.value) {
        clearInterval(countdownInterval.value); // 清除倒计时定时器
        countdownInterval.value = null; // 重置定时器引用
    }
};

const handleTimeOut = () => {
    // 在这里可以添加倒计时结束后的操作，例如自动提交试卷
    console.log("时间结束！自动提交考试试卷。");
    ended_dialog_visible.value = true;
    submitExam(submitted_exam_id); // 调用提交试卷的函数
};

const exitExam = () => {
    ended_dialog_visible.value = false;
    router.push(`/exams`);
};

// 这个仅用于手动提交时，确认提交。
const confirmSubmit = () => {
    submitExam(submitted_exam_id); // 调用提交试卷的函数
    exitExam();
};

// let pollingInterval: NodeJS.Timeout | undefined = undefined; // 轮询考试状态
// TODO 暂时不用轮询，好像有点问题

const isClient = ref(false); // 记录当前是否是客户端渲染（用来确保时间显示正确）

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 页面加载时调用
onMounted(async () => {
    // 基于email生成延迟时间

    function generateDelayFromEmail(email: string) {
        // 使用md5算法生成email的哈希值
        const hash = md5(email);

        // 将哈希值转换为整数
        const numericValue = parseInt(hash.substring(0, 8), 16); // 取哈希的前8位并转为16进制数字

        // 控制延迟范围，可以在500ms - 2000ms之间
        const minDelay = 500; // 最小延迟500ms
        const maxDelay = 3000; // 最大延迟3000ms

        // 将哈希值映射到延迟范围
        const delay = minDelay + (numericValue % (maxDelay - minDelay));
        return delay;
    }

    const delayTime = generateDelayFromEmail(email.value); // 根据学生ID计算延迟时间
    console.log(`延迟加载考试数据 ${email.value}: ${delayTime}ms`);

    await fetchSubmittedExam(); // 注意一定要加await，否则会导致后面的代码先执行。
    await fetchExamTimeData(); //
    await nextTick(); // 等待组件渲染完成
    isClient.value = true; // 标记当前是客户端渲染（组件已经挂载）


    const loadingStateStore = useLoadingStateStore();
    loadingStateStore.setComponentReady("examPage");
    // 记录全局状态：ExamPage 组件已经准备好，可以执行题目列表循环。

    // 如果有效，调用方法进行后续处理
    afterFetchSubmittedExamTime();
    // 这个就暂时不放在fetchExamTimeData里了，因为它需要在组件渲染完成后开始计算，这样才能确保实际开始时间是渲染完成的时间。

    console.log("submittedExamTime.value.expected_end_time：");
    console.log(submittedExamTime.value.expected_end_time);

    // 目前加上poll会有问题，暂时不用。

    // 定时请求数据，每隔 30 秒请求一次
    // pollingInterval = setInterval(() => {
    //     fetchSubmittedExam();
    //     console.log("polling...");
    // }, 30000); // 30秒，您可以根据需要调整这个时间间隔

    if (isTest && props.exam_page_mode !== "review") {
        // 监测到全局 store 的 isAllDone 状态变为 true 时，自动提交试卷。
        watch(
            () => globalStore.isAllDone,
            async (newVal) => {
                if (newVal === true) {
                    console.log("所有题目已做完，准备提交...");
                    await delay(1000); // 添加延迟，模拟等待一段时间
                    manualSubmit();
                    await delay(1000);
                    globalStore.setAllDone(false); // 重置全局 store 的 isAllDone 状态
                    confirm_submit_dialog_visible.value = false; // 关闭确认提交对话框
                    await delay(1000);
                    confirmSubmit();
                }
            }
        );
    }
});

// 组件卸载时清除定时器
onUnmounted(() => {
    if (countdownInterval.value) {
        clearInterval(countdownInterval.value);
    }
    // if (pollingInterval) {
    //     clearInterval(pollingInterval);
    // }
});
// TODO 这段可能重复了
</script>

<style scoped>
.countdown {
    font-size: 1rem;
    font-weight: bold;
    color: red;
}

.sidebar {
    width: 260px;
    /* 固定宽度 */
    float: left;
    padding: 15px;
    border-right: 2px solid #ddd;
    margin: 20px;
}
</style>
