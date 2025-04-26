<!-- pages/exam/[id].vue -->
<template>
    <div class="relative">
        <!-- 显示考试信息 -->
        <ExamInfo :practiceSession="practiceSession"></ExamInfo>
        <!-- 显示试卷详情 -->
        <template v-if="exam_page_mode !== 'review'">
            <div>
                <PaperInfo :submittedPaper="paper"></PaperInfo>
                <div class="absolute top-0 right-0">
                    <!-- 显示倒计时 -->
                    <ExamCountdown
                        :isClient="isClient"
                        :examEndTime="examEndTime"
                        :practiceSessionTime="practiceSessionTime"
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
                <div>试卷总分值：{{ paper.total_point_value }}</div>
                <div>当前总得分：{{ examScore }}</div>
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
                :submittedPaperSections="submittedPaperSections"
                :selectedQuestionResult="selectedQuestionResult"
                :selectQuestion="selectQuestion"
            ></QuestionList>

            <!-- 右侧：题目详情和答题区 -->
            <QuestionDetail
                :exam_page_mode="exam_page_mode"
                class="basis-4/5"
                :selectedQuestionResult="selectedQuestionResult"
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
    PracticeSessions,
    Papers,
    PaperSections,
    PaperSectionsQuestions,
    Questions,
    Exercises,
    QuestionResults
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
    // practice_session_id: string;
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

// 路由参数：practice_session 的 ID
const route = useRoute(); // 这里的useRoute是vue-router的useRoute方法，而非Nuxt的useRoute方法。
// const practice_session_id = route.params.id;
// 加入预处理参数：在路由守卫或组件加载时，无论是单个值还是数组，都统一解析为单个值。
const practice_session_id = Array.isArray(route.params.id)
    ? route.params.id[0]
    : route.params.id;

// 数据绑定
const practiceSession = ref<PracticeSessions>({} as PracticeSessions);
const paper = ref<Papers>({} as Papers);
const submittedPaperSections = ref<PaperSections[]>([]);
const selectedQuestionResult = ref<QuestionResults>({} as QuestionResults); // 当前选中的题目结果

const chapter_id_list = ref<string[]>([]); // 试卷的所有章节ID列表。
const question_id_list = ref<string[]>([]); // 试卷的所有题目ID列表。用来在redis中查询详情。

// 考试时间相关数据
const practiceSessionTime = ref<PracticeSessions>({} as PracticeSessions); // 考试时间信息
const examEndTime = ref<dayjs.Dayjs>({} as dayjs.Dayjs); // 考试结束时间
const countdown = ref(0); // 剩余时间
const formattedCountDown = ref("00:00:00"); // 倒计时
const countdownInterval = ref<any>(null); // 倒计时定时器
const actual_start_time = ref(""); // 实际开始时间
const duration = ref(0); // 考试时长
const extra_time = ref(0); // 考试时长补偿
const expected_end_time_str = ref(""); // 应交卷时间的字符串形式

// 考试分数（从practice_sessions中获取）
const examScore = ref<number | null>(null);

// 获取环境变量，确定是否运行测试
const {
    public: { isTest },
} = useRuntimeConfig();

// 获取提交的考试信息。先获取试卷，再获取试卷的章节。
const fetchSubmittedExam = async () => {
    const practiceSessionResponse:PracticeSessions = await getItemById<PracticeSessions>({
        collection: "practice_sessions",
        id: practice_session_id,
        params: {
            fields: [
                "id", 
                "exercises_students_id.exercises_id.paper", 
                // "title", 
                "exercises_students_id.students_id.name",
                "exercises_students_id.exercises_id.title",
                "score" // 获取考试分数
            ], // 获取考试的状态和关联的试卷
        },
    });
    if (practiceSessionResponse) {
        practiceSession.value = practiceSessionResponse;
        examScore.value = practiceSessionResponse.score || null; // 确保为null而不是undefined
        afterFetchSubmittedExam();
    }
};

const fetchExamTimeData = async () => {
    const practiceSessionTimeResponse = await getItemById<PracticeSessions>({
        collection: "practice_sessions",
        id: practice_session_id,
        params: {
            fields: [
                "id",
                "actual_start_time", // 获取考试开始时间，客户端根据此时间计算倒计时。
                "actual_end_time",
                "extra_time", // 考试时长补偿，客户端根据此时间计算倒计时。
                "exercises_students_id.exercises_id.duration", // 获取考试时长，直接在客户端进行计算
            ],
        },
    });

    if (practiceSessionTimeResponse) {
        practiceSessionTime.value = practiceSessionTimeResponse;
    }
};

const afterFetchSubmittedExam = () => {
    if (
        practiceSession.value.exercises_students_id 
    ) {
        // 获取试卷的详情
        const esId = practiceSession.value.exercises_students_id;
        if (typeof esId === 'object' && esId && 'exercises_id' in esId && esId.exercises_id) {
            const exercisesId = esId.exercises_id;
            if (typeof exercisesId === 'object' && 'paper' in exercisesId) {
                const paperId = exercisesId.paper as string;
                console.log("paperId", paperId);
                fetchSubmittedPaper(paperId);
            }
        }
    }
};

// 把获取时间数据后的操作也跟获取考试其他数据后的操作分开。
const afterFetchSubmittedExamTime = () => {
    actual_start_time.value = practiceSessionTime.value.actual_start_time!;
    
    // 从 exercises_students_id.exercises_id 获取考试时长
    const esId = practiceSessionTime.value.exercises_students_id;
    if (typeof esId === 'object' && esId && 'exercises_id' in esId && esId.exercises_id) {
        // 确保exercises_id是对象
        const exercisesId = esId.exercises_id;
        if (typeof exercisesId === 'object' && 'duration' in exercisesId) {
            duration.value = exercisesId.duration as number;
        }
    }
    
    extra_time.value = practiceSessionTime.value.extra_time!;

    // 先根据实际开始作答时间和考试时长，计算应交卷时间
    // 由于expected_end_time不再作为直接字段，手动计算
    const endTimeDate = new Date(actual_start_time.value);
    endTimeDate.setMinutes(
        endTimeDate.getMinutes() + duration.value + extra_time.value
    );

    // 注意：Date对象在directus中能正常运算，但不能打印。
    expected_end_time_str.value = endTimeDate.toISOString();

    // 设置倒计时的结束时间
    examEndTime.value = dayjs(expected_end_time_str.value);
    // CAUTION: 这里dayjs里面的值如果是空的（例如undefined），就会返回当前时间。

    console.log("examEndTime:");
    console.log(examEndTime.value);

    startCountdown(examEndTime.value);
};

// 获取提交的试卷
const fetchSubmittedPaper = async (paperId: string) => {
    console.log("fetchSubmittedPaper", paperId);
    
    const paperResponse = await getItemById<Papers>({
        collection: "papers",
        id: paperId,
        params: {
            fields: [
                "title",
                "paper_sections",
                "total_point_value",
                // "score", // Papers可能没有score字段，需要从practice_sessions获取
            ],
        },
    });
    if (paperResponse) {
        paper.value = paperResponse;
        fetchSubmittedSectionsList(paperResponse.paper_sections);
    }
};

// 获取试卷的章节，修改为使用paper_sections
const fetchSubmittedSectionsList = async (
    sections: PaperSections[]
) => {
    // 获取章节的基本信息
    const submittedSectionsResponse = await getItems<PaperSections>({
        collection: "paper_sections",
        params: {
            filter: {
                id: { _in: sections }, // 获取章节ID列表
            },
            fields: [
                "id",
                "sort_in_paper",
                "title",
                "question_type",
                "total_question_points",
                "questions"
            ],
            sort: "sort_in_paper", // 排序方式
        },
    });

    // 获取所有题目的结果
    const questionResultsPromise = getItems<QuestionResults>({
        collection: "question_results",
        params: {
            filter: {
                practice_session_id: practice_session_id
            },
            fields: [
                "id",
                "practice_session_id",
                "question_in_paper_id", // 指向paper_sections_questions
                "question_type",
                "point_value",
                "score",
                "submit_ans_select_radio",
                "submit_ans_select_multiple_checkbox",
            ],
        },
    });

    // 等待问题结果数据
    const questionResults = await questionResultsPromise;
    
    // 处理章节和题目数据
    const sectionList = submittedSectionsResponse;
    
    // 获取所有章节中的题目信息
    const questionsPromises = sectionList.map(async (section) => {
        // 查询章节中的所有问题
        const sectionQuestions = await getItems<PaperSectionsQuestions>({
            collection: "paper_sections_questions",
            params: {
                filter: { paper_sections_id: section.id },
                fields: [
                    "id",
                    "sort_in_section",
                    "questions_id",
                ],
                sort: "sort_in_section",
            },
        });

        // 获取所有问题的ID列表
        const questionIds = sectionQuestions.map((sectionQuestion) => {
            return sectionQuestion.questions_id as string;
        });

        // 将这些ID添加到question_id_list中以在Redis中查询
        question_id_list.value = question_id_list.value.concat(questionIds);

        return sectionQuestions;
    });

    // 等待所有问题数据
    const questionsResponses = await Promise.all(questionsPromises);

    // 从Redis获取所有问题数据
    const questionIds = Array.from(new Set(question_id_list.value)); // 去重
    const questionsData = (await useFetch("/api/questions/list", {
        method: "POST",
        body: {
            ids: questionIds,
        },
    })) as any;

    // 将问题数据与章节数据关联
    sectionList.forEach((section, index) => {
        const sectionQuestionsWithData = questionsResponses[index].map((sectionQuestion) => {
            const questionId = sectionQuestion.questions_id as string;
            const questionData = questionsData.data.value.find(
                (item: any) => item.id === questionId
            );
            
            // 查找该题目的提交结果
            const result = questionResults.find(
                result => result.question_in_paper_id === sectionQuestion.id
            );
            
            return {
                ...sectionQuestion,
                questions_id: questionData || null,
                result: result || null,
            };
        });
        
        section.questions = sectionQuestionsWithData;
    });

    if (submittedSectionsResponse) {
        submittedPaperSections.value = sectionList;
        console.log("submittedPaperSections.value:", submittedPaperSections.value);
        
        // 默认选择第一个题目的结果
        if (sectionList[0]?.questions?.[0]?.result) {
            selectedQuestionResult.value = sectionList[0].questions[0].result;
            console.log("selectedQuestionResult.value:", selectedQuestionResult.value);
        }
    }
};

// 修改选择题目的函数以适应新的数据结构
const selectQuestion = (questionResult: QuestionResults) => {
    selectedQuestionResult.value = questionResult;
};

// 直接传id
const submitActualEndTime = async (examId: string) => {
    try {
        let nowData = dayjs();
        const newItem = { actual_end_time: nowData };
        await updateItem<PracticeSessions>({
            collection: "practice_sessions",
            id: examId,
            item: newItem,
        });
    } catch (e) {}
};

// 这个和考试列表里面不太一样，直接传个id就行
const updateSubmitStatus = async (practice_session_id: string) => {
    try {
        const newItem = { submit_status: "done" };
        await updateItem<PracticeSessions>({
            collection: "practice_sessions",
            id: practice_session_id,
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
    submitExam(practice_session_id); // 调用提交试卷的函数
};

const exitExam = () => {
    ended_dialog_visible.value = false;
    router.push(`/exams`);
};

// 这个仅用于手动提交时，确认提交。
const confirmSubmit = () => {
    submitExam(practice_session_id); // 调用提交试卷的函数
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

    console.log("practiceSessionTime.value.expected_end_time：");
    console.log(practiceSessionTime.value.expected_end_time);

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
