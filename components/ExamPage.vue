<!-- pages/exam/[id].vue -->
<template>
    <div class="exam-page">
        <!-- 顶部信息栏 -->
        <ExamHeader
            :exam_page_mode="exam_page_mode"
            :practiceSession="practiceSession"
            :paper="paper"
            :isClient="isClient"
            :actual_start_time="actual_start_time"
            :examEndTime="examEndTime"
            :practiceSessionTime="practiceSessionTime"
            :formattedCountDown="formattedCountDown"
            :examScore="examScore"
            :studentData="{
                name: userData.name,
                student_number: userData.student_number,
                email: userData.email,
                className: userData.className
            }"
            @submit="manualSubmit"
        />

        <!-- 对话框区域 -->
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
                        label="取消"
                        severity="secondary"
                        @click="confirm_submit_dialog_visible = false"
                        class="mr-2"
                    ></Button>
                    <Button
                        type="button"
                        label="确定"
                        severity="danger"
                        @click="confirmSubmit()"
                    ></Button>
                </div>
            </Dialog>
        </template>

        <!-- 题目区域 - 使用固定高度布局 -->
        <div class="question-area">
            <!-- 左侧：题目列表 -->
            <QuestionList
                class="question-list-container"
                :class="{ 'collapsed': sidebarCollapsed }"
                :style="{ width: sidebarWidth + 'px' }"
                :exam_page_mode="exam_page_mode"
                :submittedPaperSections="submittedPaperSections"
                :selectedQuestion="selectedQuestion"
                :selectQuestion="selectQuestion"
                :questionResults="questionResults"
                :practiceSessionId="practice_session_id"
                @sidebar-toggle="handleSidebarToggle"
                @resize-sidebar="handleSidebarResize"
            ></QuestionList>

            <!-- 右侧：题目详情和答题区 -->
            <QuestionDetail
                class="question-detail-container"
                :class="{
                    'with-collapsed-sidebar': sidebarCollapsed,
                    'with-expanded-sidebar': !sidebarCollapsed,
                }"
                :exam_page_mode="exam_page_mode"
                :selectedQuestion="selectedQuestion"
                :practiceSessionId="practice_session_id"
                :questionResults="questionResults"
                @navigate-question="navigateToQuestion"
            ></QuestionDetail>
        </div>
    </div>
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import { ref, onMounted, watch, computed } from "vue";
import { useRoute } from "vue-router";
import utc from "dayjs/plugin/utc";
import type {
    PracticeSessions,
    Papers,
    PaperSections,
    PaperSectionsQuestions,
    Questions,
    Exercises,
    QuestionResults,
    Classes,
    PaperSectionsQuestionGroups,
    QuestionGroups,
} from "~~/types/directus_types";
import md5 from "md5";
import { useAuth } from "~~/stores/auth";

import { useGlobalStore } from "@/stores/examDone"; // 引入 Pinia store
import { useLoadingStateStore } from "@/stores/loadingState"; // 引入 Pinia store

const auth = useAuth();
const { user } = storeToRefs(auth); // 获取store里的user数据，用于根据邮箱设置延迟。
const email = ref(user.value?.email || "");



// 获取考试标题
const getExamTitle = () => {
    if (!practiceSession.value?.exercises_students_id) return "考试信息";

    const esId = practiceSession.value.exercises_students_id;
    if (typeof esId === "object" && "exercises_id" in esId) {
        const exerciseId = esId.exercises_id;
        if (
            typeof exerciseId === "object" &&
            exerciseId &&
            "title" in exerciseId
        ) {
            return exerciseId.title || "考试信息";
        }
    }

    return "考试信息";
};

const globalStore = useGlobalStore(); // 创建 Pinia store 实例

dayjs.extend(utc);

const ended_dialog_visible = ref(false);
const confirm_submit_dialog_visible = ref(false);
const sidebarCollapsed = ref(false); // 控制侧边栏收缩状态
const sidebarWidth = ref(300); // 侧边栏宽度，默认300px

const props = defineProps<{
    // practice_session_id: string;
    // 暂时不用拿参数，直接用vue-router自己获取。
    exam_page_mode: string; // 考试模式，practice、exam、review
}>();

const handleSidebarToggle = (collapsed: boolean) => {
    sidebarCollapsed.value = collapsed;
};

// 处理侧边栏宽度调整
const handleSidebarResize = (width: number) => {
    sidebarWidth.value = width;
};

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
const selectedQuestion = ref({} as any); // 当前选中的题目结果

const chapter_id_list = ref<string[]>([]); // 试卷的所有章节ID列表。
const question_id_list = ref<string[]>([]); // 试卷的所有题目ID列表。用来在redis中查询详情。
const question_groups_id_list = ref<string[]>([]); // 试卷的所有题组ID列表
const questionResults = ref<QuestionResults[]>([]); // 所有题目的作答结果

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
    const practiceSessionResponse: PracticeSessions =
        await getItemById<PracticeSessions>({
            collection: "practice_sessions",
            id: practice_session_id,
            params: {
                fields: [
                    "id",
                    "exercises_students_id.exercises_id.paper",
                    // "title",
                    "exercises_students_id.students_id.name", // 学生姓名
                    "exercises_students_id.students_id.number", // 学号
                    "exercises_students_id.students_id.email", // 邮箱
                    "exercises_students_id.students_id.class.name", // 班级 TODO暂时没生效！
                    "exercises_students_id.exercises_id.title",
                    "exercises_students_id.exercises_id.duration",
                    "score", // 获取考试分数
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
                "expected_end_time",
                "exercises_students_id.exercises_id.duration", // 获取考试时长，直接在客户端进行计算
                "exercises_students_id.exercises_id.paper", // 获取考试试卷ID，客户端根据此ID获取试卷详情。
            ],
        },
    });

    if (practiceSessionTimeResponse) {
        practiceSessionTime.value = practiceSessionTimeResponse;
    }
};

const afterFetchSubmittedExam = () => {
    if (practiceSession.value.exercises_students_id) {
        // 获取试卷的详情
        const esId = practiceSession.value.exercises_students_id;
        if (
            typeof esId === "object" &&
            esId &&
            "exercises_id" in esId &&
            esId.exercises_id
        ) {
            const exercisesId = esId.exercises_id;
            if (typeof exercisesId === "object" && "paper" in exercisesId) {
                const paperId = exercisesId.paper as string;
                console.log("paperId", paperId);
                fetchSubmittedPaper(paperId);
            }
        }
    }
};

// 用户信息
const userData = computed(() => {
    const defaultData = {
        name: "考生",
        student_number: 0,
        email: "",
        className: "",
    };

    const esId = practiceSession.value?.exercises_students_id;
    if (!esId || typeof esId !== "object" || !("students_id" in esId)) {
        return defaultData;
    }

    const studentId = esId.students_id;
    if (!studentId || typeof studentId !== "object") {
        return defaultData;
    }

    return {
        name: studentId.name || "考生",
        student_number: studentId.number || 0,
        email: studentId.email || "",
        className: (studentId.class as Classes)?.name || "",
    };
});

// 把获取时间数据后的操作也跟获取考试其他数据后的操作分开。
const afterFetchSubmittedExamTime = () => {
    actual_start_time.value = practiceSessionTime.value.actual_start_time!;

    // 从 exercises_students_id.exercises_id 获取考试时长
    const esId = practiceSessionTime.value.exercises_students_id;
    if (
        typeof esId === "object" &&
        esId &&
        "exercises_id" in esId &&
        esId.exercises_id
    ) {
        // 确保exercises_id是对象
        const exercisesId = esId.exercises_id;
        if (typeof exercisesId === "object" && "duration" in exercisesId) {
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
                "total_question_count",
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
const fetchSubmittedSectionsList = async (sections: PaperSections[]) => {
    console.log("fetchSubmittedSectionsList", sections);

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
                "question_mode", // 添加question_mode字段
                "total_question_points",
                "questions",
                "question_groups", // 添加question_groups字段
            ],
            sort: "sort_in_paper", // 排序方式
        },
    });

    // 获取所有题目的结果
    const questionResultsPromise = getItems<QuestionResults>({
        collection: "question_results",
        params: {
            filter: {
                practice_session_id: practice_session_id,
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
                "is_flagged",
            ],
        },
    });

    // 等待问题结果数据
    const questionResultsData = await questionResultsPromise;
    // 保存问题结果到全局变量
    questionResults.value = questionResultsData;

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
                    "paper_sections_id",
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

    // 获取所有章节中的题组信息（如果是题组模式）
    const questionGroupsPromises = sectionList.map(async (section) => {
        // 如果不是题组模式，返回空数组
        if (section.question_mode !== "group") {
            return [];
        }

        // 查询章节中的所有题组
        const sectionQuestionGroups =
            await getItems<PaperSectionsQuestionGroups>({
                collection: "paper_sections_question_groups",
                params: {
                    filter: { paper_sections_id: section.id },
                    fields: [
                        "id",
                        "sort_in_section",
                        "question_groups_id",
                        "paper_sections_id",
                    ],
                    sort: "sort_in_section",
                },
            });

        // 获取所有题组的ID列表
        const questionGroupIds = sectionQuestionGroups.map(
            (sectionQuestionGroup) => {
                return sectionQuestionGroup.question_groups_id as string;
            }
        );

        // 将这些ID添加到question_groups_id_list中
        question_groups_id_list.value =
            question_groups_id_list.value.concat(questionGroupIds);

        return sectionQuestionGroups;
    });

    // 等待所有问题和题组数据
    const questionsResponses = await Promise.all(questionsPromises);
    const questionGroupsResponses = await Promise.all(questionGroupsPromises);

    // 从Redis获取所有问题数据
    const questionIds = Array.from(new Set(question_id_list.value)); // 去重
    console.log("questionIds", questionIds);
    const questionsData = (await useFetch("/api/questions/list", {
        method: "POST",
        body: {
            ids: questionIds,
        },
    })) as any;

    console.log("questionsData", questionsData);

    // 获取所有题组数据
    const questionGroupIds = Array.from(new Set(question_groups_id_list.value)); // 去重
    let questionGroupsData: any[] = [];

    if (questionGroupIds.length > 0) {
        // 获取题组数据
        const questionGroupsResponse = await getItems<QuestionGroups>({
            collection: "question_groups",
            params: {
                filter: {
                    id: { _in: questionGroupIds },
                },
                fields: [
                    "id",
                    "title",
                    "shared_stem",
                    "questions.id",
                    "questions.title",
                    "questions.type",
                    "questions.stem",
                    "questions.sort_in_group",
                    // 单选题字段
                    "questions.q_mc_single.id",
                    "questions.q_mc_single.stem",
                    "questions.q_mc_single.option_a",
                    "questions.q_mc_single.option_b",
                    "questions.q_mc_single.option_c",
                    "questions.q_mc_single.option_d",
                    "questions.q_mc_single.option_e",
                    "questions.q_mc_single.option_f",
                    "questions.q_mc_single.correct_option",
                    // 多选题字段
                    "questions.q_mc_multi.id",
                    "questions.q_mc_multi.stem",
                    "questions.q_mc_multi.option_a",
                    "questions.q_mc_multi.option_b",
                    "questions.q_mc_multi.option_c",
                    "questions.q_mc_multi.option_d",
                    "questions.q_mc_multi.option_e",
                    "questions.q_mc_multi.option_f",
                    "questions.q_mc_multi.correct_options",
                    // 二元选择题字段
                    "questions.q_mc_binary.id",
                    "questions.q_mc_binary.stem",
                    "questions.q_mc_binary.option_a",
                    "questions.q_mc_binary.option_b",
                    "questions.q_mc_binary.correct_option",
                    // 灵活选择题字段
                    "questions.q_mc_flexible.id",
                    "questions.q_mc_flexible.stem",
                    "questions.q_mc_flexible.option_a",
                    "questions.q_mc_flexible.option_b",
                    "questions.q_mc_flexible.option_c",
                    "questions.q_mc_flexible.option_d",
                    "questions.q_mc_flexible.option_e",
                    "questions.q_mc_flexible.option_f",
                    "questions.q_mc_flexible.correct_options",
                ],
            },
        });

        questionGroupsData = questionGroupsResponse;
    }

    // 将问题数据与章节数据关联
    sectionList.forEach((section, index) => {
        // 处理普通问题
        const sectionQuestionsWithData = questionsResponses[index].map(
            (sectionQuestion) => {
                const questionId = sectionQuestion.questions_id as string;
                const questionData = questionsData.data.value.find(
                    (item: any) => item.id === questionId
                );

                // 查找该题目的提交结果
                const result = questionResults.value.find(
                    (result) =>
                        result.question_in_paper_id === sectionQuestion.id
                );

                return {
                    ...sectionQuestion,
                    questions_id: questionData || null,
                    result: result || null,
                };
            }
        );

        section.questions = sectionQuestionsWithData;

        // 处理题组问题（如果是题组模式）
        if (section.question_mode === "group") {
            const sectionQuestionGroupsWithData = questionGroupsResponses[
                index
            ].map((sectionQuestionGroup) => {
                const questionGroupId =
                    sectionQuestionGroup.question_groups_id as string;
                const questionGroupData = questionGroupsData.find(
                    (item: any) => item.id === questionGroupId
                );

                // 找出该章节中属于这个题组的所有题目
                if (questionGroupData) {
                    // 获取题组ID
                    const groupId = questionGroupData.id;

                    // 在section.questions中找出所有question_group等于该题组ID的题目
                    const groupQuestions = section.questions.filter(
                        (questionItem) => {
                            // 处理question_group可能是字符串或对象的情况
                            if (
                                !questionItem.questions_id ||
                                !questionItem.questions_id.question_group
                            ) {
                                return false;
                            }

                            const qGroup =
                                questionItem.questions_id.question_group;

                            if (typeof qGroup === "string") {
                                return qGroup === groupId;
                            } else if (
                                typeof qGroup === "object" &&
                                qGroup !== null
                            ) {
                                return qGroup.id === groupId;
                            }

                            return false;
                        }
                    );

                    // 将找到的题目IDs保存到题组数据中，方便后续渲染
                    return {
                        ...sectionQuestionGroup,
                        question_groups_id: questionGroupData || null,
                        group_question_ids: groupQuestions.map((q) => q.id),
                    };
                }

                return {
                    ...sectionQuestionGroup,
                    question_groups_id: questionGroupData || null,
                };
            });

            section.question_groups = sectionQuestionGroupsWithData;
        }
    });

    if (submittedSectionsResponse) {
        submittedPaperSections.value = sectionList;
        console.log(
            "submittedPaperSections.value:",
            submittedPaperSections.value
        );

        // 根据章节的question_mode判断是选择题目还是题组
        if (
            sectionList[0].question_mode === "group" &&
            sectionList[0].question_groups &&
            sectionList[0].question_groups.length > 0
        ) {
            const firstGroup = sectionList[0].question_groups[0];

            // 获取该题组包含的题目列表
            const groupQuestionIds = firstGroup.group_question_ids || [];
            const groupQuestions = sectionList[0].questions.filter((q) =>
                groupQuestionIds.includes(q.id)
            );

            // 题组模式下按sort_in_group字段排序题目
            const sortedGroupQuestions = [...groupQuestions].sort((a, b) => {
                // 优先使用sort_in_group排序
                const aSort = a.questions_id.sort_in_group ?? 999;
                const bSort = b.questions_id.sort_in_group ?? 999;

                // 如果sort_in_group相同或不存在，再使用sort_in_section作为备选
                if (aSort === bSort) {
                    return (a.sort_in_section || 0) - (b.sort_in_section || 0);
                }

                return aSort - bSort;
            });

            // 创建包含题组的enhancedQuestion对象
            const enhancedQuestion = {
                ...firstGroup,
                isGroupMode: true,
                questionGroup: firstGroup.question_groups_id,
                questions_id: { type: "group" }, // 保留一个虚拟的questions_id以兼容现有代码
                section_id: sectionList[0].id,
                paper_sections_id: sectionList[0].id,
                sort_in_section: firstGroup.sort_in_section,
                groupQuestions: sortedGroupQuestions, // 使用排序后的题目列表
            };
            selectedQuestion.value = enhancedQuestion;
        } else if (
            sectionList[0].questions &&
            sectionList[0].questions.length > 0
        ) {
            selectedQuestion.value = sectionList[0].questions[0];
        }
        console.log("selectedQuestion.value:", selectedQuestion.value);
    }
};

// 修改选择题目的函数以适应新的数据结构
const selectQuestion = (question: any) => {
    // 注意：这里的question是一个混合了PaperSectionsQuestions和QuestionResults的数据。
    selectedQuestion.value = question;
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

    // 启动当前时间更新
    startCurrentTimeUpdate();

    const loadingStateStore = useLoadingStateStore();
    loadingStateStore.setComponentReady("examPage");
    // 记录全局状态：ExamPage 组件已经准备好，可以执行题目列表循环。

    // 如果有效，调用方法进行后续处理
    afterFetchSubmittedExamTime();

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
    if (currentTimeInterval.value) {
        clearInterval(currentTimeInterval.value);
    }
    // if (pollingInterval) {
    //     clearInterval(pollingInterval);
    // }
});

// 当前时间
const currentTime = ref("");
const currentTimeInterval = ref<any>(null);

// 格式化日期时间（包含日期和时间）
const formatDateTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return "未设置";
    return dayjs(dateTimeStr).format("MM-DD HH:mm");
};

// 格式化日期时间（包含日期、时间和秒）
const formatDateTimeWithSeconds = (dateTimeStr: string) => {
    if (!dateTimeStr) return "未设置";
    return dayjs(dateTimeStr).format("MM-DD HH:mm:ss");
};

// 格式化时间（仅显示时间）
const formatTimeOnly = (timeStr: string) => {
    if (!timeStr) return "";
    return timeStr.split(" ")[1] || timeStr; // 如果有空格，取空格后面的部分（时间部分）
};

// 更新当前时间
const updateCurrentTime = () => {
    currentTime.value = dayjs().format("MM-DD HH:mm:ss");
};

// 开始更新当前时间
const startCurrentTimeUpdate = () => {
    updateCurrentTime(); // 立即执行一次
    currentTimeInterval.value = setInterval(updateCurrentTime, 1000);
};

// 获取全部题目列表（扁平化）
const allQuestions = computed(() => {
    const questions: any[] = [];
    submittedPaperSections.value.forEach((section) => {
        if (section.questions && Array.isArray(section.questions)) {
            questions.push(...section.questions);
        }
    });
    return questions.sort((a, b) => {
        // 按章节顺序和题目顺序排序
        const sectionIndexA = submittedPaperSections.value.findIndex(
            (s) => s.id === a.paper_sections_id
        );
        const sectionIndexB = submittedPaperSections.value.findIndex(
            (s) => s.id === b.paper_sections_id
        );

        if (sectionIndexA !== sectionIndexB) {
            return sectionIndexA - sectionIndexB;
        }

        return a.sort_in_section - b.sort_in_section;
    });
});

// 导航到上一题或下一题
const navigateToQuestion = (direction: number) => {
    if (!selectedQuestion.value) return;

    // 获取当前选中题目的信息
    const currentQuestion = selectedQuestion.value;
    console.log("当前题目:", currentQuestion);

    // 获取当前章节ID
    let currentSectionId;
    if (typeof currentQuestion.section_id === "string") {
        currentSectionId = currentQuestion.section_id;
    } else if (typeof currentQuestion.paper_sections_id === "string") {
        currentSectionId = currentQuestion.paper_sections_id;
    } else if (
        currentQuestion.paper_sections_id &&
        typeof currentQuestion.paper_sections_id === "object"
    ) {
        currentSectionId = currentQuestion.paper_sections_id.id;
    } else {
        console.error("无法确定题目所属章节", currentQuestion);
        return;
    }

    // 查找当前章节
    const currentSection = submittedPaperSections.value.find(
        (section) => section.id === currentSectionId
    );
    if (!currentSection) {
        console.error("找不到当前题目所属章节");
        return;
    }

    // 判断当前章节的题目模式
    const isGroupMode = currentSection.question_mode === "group";

    // 按照sort_in_paper排序的章节列表
    const sortedSections = [...submittedPaperSections.value].sort(
        (a, b) => (a.sort_in_paper || 0) - (b.sort_in_paper || 0)
    );

    // 获取当前章节在排序后列表中的索引
    const currentSectionIndex = sortedSections.findIndex(
        (section) => section.id === currentSectionId
    );

    if (isGroupMode) {
        // 题组模式导航
        navigateInGroupMode(
            currentSection,
            sortedSections,
            currentSectionIndex,
            currentQuestion,
            direction
        );
    } else {
        // 单题模式导航
        navigateInSingleMode(
            currentSection,
            sortedSections,
            currentSectionIndex,
            currentQuestion,
            direction
        );
    }
};

// 单题模式下的导航
const navigateInSingleMode = (
    currentSection: PaperSections,
    sortedSections: PaperSections[],
    currentSectionIndex: number,
    currentQuestion: any,
    direction: number
) => {
    // 获取当前题目在章节中的排序号
    const currentSortInSection = currentQuestion.sort_in_section;

    // 确保章节的题目按sort_in_section排序
    const sortedSectionQuestions = [...currentSection.questions].sort(
        (a, b) => (a.sort_in_section || 0) - (b.sort_in_section || 0)
    );

    if (direction === 1) {
        // 下一题
        // 在当前章节中查找下一题
        const nextQuestionIndex = sortedSectionQuestions.findIndex(
            (q) => q.sort_in_section > currentSortInSection
        );
        if (nextQuestionIndex !== -1) {
            console.log(
                "找到章节内下一题",
                sortedSectionQuestions[nextQuestionIndex]
            );
            return selectQuestion(sortedSectionQuestions[nextQuestionIndex]);
        }

        // 如果当前是章节的最后一题，且有下一章节，则跳转到下一章节的第一题
        if (currentSectionIndex < sortedSections.length - 1) {
            const nextSection = sortedSections[currentSectionIndex + 1];

            // 根据下一章节的模式决定跳转到题目或题组
            if (
                nextSection.question_mode === "group" &&
                nextSection.question_groups &&
                nextSection.question_groups.length > 0
            ) {
                // 跳转到下一章节的第一个题组
                const sortedGroups = [...nextSection.question_groups].sort(
                    (a, b) =>
                        (a.sort_in_section || 0) - (b.sort_in_section || 0)
                );
                if (sortedGroups.length > 0) {
                    const firstGroup = sortedGroups[0];
                    return handleQuestionGroupClick(firstGroup, nextSection);
                }
            } else if (
                nextSection.questions &&
                nextSection.questions.length > 0
            ) {
                // 跳转到下一章节的第一题
                const sortedNextQuestions = [...nextSection.questions].sort(
                    (a, b) =>
                        (a.sort_in_section || 0) - (b.sort_in_section || 0)
                );
                if (sortedNextQuestions.length > 0) {
                    console.log(
                        "跳转到下一章节的第一题",
                        sortedNextQuestions[0]
                    );
                    return selectQuestion(sortedNextQuestions[0]);
                }
            }
        }
    } else if (direction === -1) {
        // 上一题
        // 在当前章节中从后往前查找上一题
        const prevQuestions = sortedSectionQuestions.filter(
            (q) => q.sort_in_section < currentSortInSection
        );
        if (prevQuestions.length > 0) {
            const prevQuestion = prevQuestions[prevQuestions.length - 1];
            console.log("找到章节内上一题", prevQuestion);
            return selectQuestion(prevQuestion);
        }

        // 如果当前是章节的第一题，且有上一章节，则跳转到上一章节的最后一题/题组
        if (currentSectionIndex > 0) {
            const prevSection = sortedSections[currentSectionIndex - 1];

            // 根据上一章节的模式决定跳转到题目或题组
            if (
                prevSection.question_mode === "group" &&
                prevSection.question_groups &&
                prevSection.question_groups.length > 0
            ) {
                // 跳转到上一章节的最后一个题组
                const sortedGroups = [...prevSection.question_groups].sort(
                    (a, b) =>
                        (a.sort_in_section || 0) - (b.sort_in_section || 0)
                );
                if (sortedGroups.length > 0) {
                    const lastGroup = sortedGroups[sortedGroups.length - 1];
                    return handleQuestionGroupClick(lastGroup, prevSection);
                }
            } else if (
                prevSection.questions &&
                prevSection.questions.length > 0
            ) {
                // 跳转到上一章节的最后一题
                const sortedPrevQuestions = [...prevSection.questions].sort(
                    (a, b) =>
                        (a.sort_in_section || 0) - (b.sort_in_section || 0)
                );
                if (sortedPrevQuestions.length > 0) {
                    const lastQuestion =
                        sortedPrevQuestions[sortedPrevQuestions.length - 1];
                    console.log("跳转到上一章节的最后一题", lastQuestion);
                    return selectQuestion(lastQuestion);
                }
            }
        }
    }
};

// 题组模式下的导航
const navigateInGroupMode = (
    currentSection: PaperSections,
    sortedSections: PaperSections[],
    currentSectionIndex: number,
    currentQuestion: any,
    direction: number
) => {
    // 确保章节的题组按sort_in_section排序
    if (
        !currentSection.question_groups ||
        currentSection.question_groups.length === 0
    ) {
        console.error("当前章节没有题组");
        return;
    }

    const sortedGroups = [...currentSection.question_groups].sort(
        (a, b) => (a.sort_in_section || 0) - (b.sort_in_section || 0)
    );

    // 获取当前题组在章节中的索引
    let currentGroupIndex = -1;

    // 根据当前题目的信息判断当前题组
    if (currentQuestion.isGroupMode && currentQuestion.questionGroup) {
        // 如果是题组模式，直接获取题组ID
        const currentGroupId =
            typeof currentQuestion.questionGroup === "string"
                ? currentQuestion.questionGroup
                : currentQuestion.questionGroup.id;

        currentGroupIndex = sortedGroups.findIndex((group) => {
            const groupId =
                typeof group.question_groups_id === "string"
                    ? group.question_groups_id
                    : group.question_groups_id.id;
            return groupId === currentGroupId;
        });
    }

    if (currentGroupIndex === -1) {
        console.error("在章节中找不到当前题组");
        return;
    }

    if (direction === 1) {
        // 下一题组
        if (currentGroupIndex < sortedGroups.length - 1) {
            // 跳转到当前章节的下一个题组
            const nextGroup = sortedGroups[currentGroupIndex + 1];
            return handleQuestionGroupClick(nextGroup, currentSection);
        } else if (currentSectionIndex < sortedSections.length - 1) {
            // 跳转到下一章节的第一个题目/题组
            const nextSection = sortedSections[currentSectionIndex + 1];

            if (
                nextSection.question_mode === "group" &&
                nextSection.question_groups &&
                nextSection.question_groups.length > 0
            ) {
                // 跳转到下一章节的第一个题组
                const sortedNextGroups = [...nextSection.question_groups].sort(
                    (a, b) =>
                        (a.sort_in_section || 0) - (b.sort_in_section || 0)
                );
                if (sortedNextGroups.length > 0) {
                    return handleQuestionGroupClick(
                        sortedNextGroups[0],
                        nextSection
                    );
                }
            } else if (
                nextSection.questions &&
                nextSection.questions.length > 0
            ) {
                // 跳转到下一章节的第一个题目
                const sortedNextQuestions = [...nextSection.questions].sort(
                    (a, b) =>
                        (a.sort_in_section || 0) - (b.sort_in_section || 0)
                );
                if (sortedNextQuestions.length > 0) {
                    return selectQuestion(sortedNextQuestions[0]);
                }
            }
        }
    } else if (direction === -1) {
        // 上一题组
        if (currentGroupIndex > 0) {
            // 跳转到当前章节的上一个题组
            const prevGroup = sortedGroups[currentGroupIndex - 1];
            return handleQuestionGroupClick(prevGroup, currentSection);
        } else if (currentSectionIndex > 0) {
            // 跳转到上一章节的最后一个题目/题组
            const prevSection = sortedSections[currentSectionIndex - 1];

            if (
                prevSection.question_mode === "group" &&
                prevSection.question_groups &&
                prevSection.question_groups.length > 0
            ) {
                // 跳转到上一章节的最后一个题组
                const sortedPrevGroups = [...prevSection.question_groups].sort(
                    (a, b) =>
                        (a.sort_in_section || 0) - (b.sort_in_section || 0)
                );
                if (sortedPrevGroups.length > 0) {
                    return handleQuestionGroupClick(
                        sortedPrevGroups[sortedPrevGroups.length - 1],
                        prevSection
                    );
                }
            } else if (
                prevSection.questions &&
                prevSection.questions.length > 0
            ) {
                // 跳转到上一章节的最后一个题目
                const sortedPrevQuestions = [...prevSection.questions].sort(
                    (a, b) =>
                        (a.sort_in_section || 0) - (b.sort_in_section || 0)
                );
                if (sortedPrevQuestions.length > 0) {
                    return selectQuestion(
                        sortedPrevQuestions[sortedPrevQuestions.length - 1]
                    );
                }
            }
        }
    }
};

/**
 * 处理题组点击事件
 * 在题组模式下，点击题组时查找并加载该题组内的所有题目
 */
const handleQuestionGroupClick = async (group: any, section: PaperSections) => {
    if (!group || !group.question_groups_id) return;

    // 获取题组ID
    const groupId =
        typeof group.question_groups_id === "string"
            ? group.question_groups_id
            : group.question_groups_id.id;

    // 查找题组详情
    let questionGroup: QuestionGroups | null = null;
    if (typeof group.question_groups_id === "object") {
        questionGroup = group.question_groups_id;
    } else {
        // 此处应该使用题组ID查询题组详情
        console.log("需要查询题组详情:", groupId);
    }

    // 获取该题组包含的题目列表
    const groupQuestionIds = group.group_question_ids || [];
    const groupQuestions = section.questions.filter((q) =>
        groupQuestionIds.includes(q.id)
    );

    // 题组模式下按sort_in_group字段排序题目
    const sortedGroupQuestions = [...groupQuestions].sort((a, b) => {
        // 优先使用sort_in_group排序
        const aSort = a.questions_id.sort_in_group ?? 999;
        const bSort = b.questions_id.sort_in_group ?? 999;

        // 如果sort_in_group相同或不存在，再使用sort_in_section作为备选
        if (aSort === bSort) {
            return (a.sort_in_section || 0) - (b.sort_in_section || 0);
        }

        return aSort - bSort;
    });

    // 创建包含题组的question对象
    const enhancedQuestion = {
        ...group,
        isGroupMode: true,
        questionGroup: questionGroup,
        questions_id: { type: "group" }, // 保留一个虚拟的questions_id以兼容现有代码
        section_id: section.id,
        paper_sections_id: section.id,
        sort_in_section: group.sort_in_section,
        groupQuestions: sortedGroupQuestions, // 使用排序后的题目列表
    };

    // 调用选择方法
    selectQuestion(enhancedQuestion);
};
</script>

<style scoped>
.exam-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
}

.question-area {
    display: flex;
    flex: 1;
    overflow: hidden;
    position: relative;
    height: calc(100vh - 120px); /* 减去头部高度 */
}

.question-list-container {
    height: 100%;
    transition: width 0.3s ease;
    overflow: hidden;
}

.question-list-container.collapsed {
    width: 40px !important; /* 确保收缩状态下有足够空间显示展开按钮 */
    min-width: 40px !important;
}

.question-detail-container {
    flex: 1;
    transition: all 0.3s ease;
    padding-left: 1rem;
    height: 100%;
    overflow: hidden;
}

.question-detail-container.with-collapsed-sidebar {
    margin-left: 0;
}

.question-detail-container.with-expanded-sidebar {
    margin-left: 0.5rem;
}

/* 确保滚动条不会导致布局抖动 */
:deep(.p-scrollpanel) {
    padding-right: 17px; /* 为滚动条预留空间 */
    box-sizing: content-box;
}

/* 适配移动设备 */
@media screen and (max-width: 768px) {
    .question-area {
        flex-direction: column;
        height: calc(100vh - 80px);
    }

    .question-list-container {
        width: 100% !important;
        height: auto;
        max-height: 30vh;
    }

    .question-list-container.collapsed {
        max-height: 10px !important;
        height: 10px !important;
    }

    .question-detail-container {
        width: 100%;
        margin-left: 0 !important;
        padding-left: 0;
        height: 70vh;
    }
}
</style>
