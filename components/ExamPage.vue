<!-- pages/exam/[id].vue -->
<template>
    <div class="exam-page">
        <!-- 顶部信息栏 -->
        <ExamHeader
            :exam_page_mode="exam_page_mode"
            :practiceSession="practiceSession"
            :paper="paper"
            :isClient="isClient"
            :actual_start_time="formattedActualStartTime"
            :examEndTime="formattedExamEndTime"
            :practiceSessionTime="practiceSessionTime"
            :formattedCountDown="formattedCountdown"
            :examScore="examScore"
            :studentData="{
                name: userData.name,
                student_number: userData.student_number,
                email: userData.email,
                className: userData.className,
            }"
            @submit="manualSubmit"
        />

        <!-- 对话框区域 -->
        <template v-if="exam_page_mode !== 'review'">
            <!-- 用于 "您已交卷，即将退出考试！" 的统一对话框 -->
            <Dialog
                v-model:visible="final_submission_dialog_visible"
                modal
                header="提示"
                @hide="exitExam()"
                :style="{ width: '25rem' }"
            >
                <span class="text-surface-500 dark:text-surface-400 block mb-8"
                    >您已交卷，即将退出考试！</span
                >
                <div class="flex justify-end gap-2">
                    <Button
                        type="button"
                        label="确定"
                        @click="exitExam()"
                    ></Button>
                </div>
            </Dialog>

            <!-- 手动提交确认对话框 -->
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
                        label="取消交卷"
                        severity="secondary"
                        @click="confirm_submit_dialog_visible = false"
                        class="mr-2"
                    ></Button>
                    <Button
                        type="button"
                        label="确定交卷"
                        severity="danger"
                        @click="confirmSubmit()"
                    ></Button>
                </div>
            </Dialog>

            <!-- 导航边界提示对话框 -->
            <Dialog
                v-model:visible="nav_boundary_dialog_visible"
                modal
                header="提示"
                :style="{ width: '25rem' }"
            >
                <span
                    class="text-surface-500 dark:text-surface-400 block mb-8"
                    >{{ nav_boundary_dialog_message }}</span
                >
                <div class="flex justify-end gap-2">
                    <Button
                        type="button"
                        label="确定"
                        @click="nav_boundary_dialog_visible = false"
                    ></Button>
                </div>
            </Dialog>
        </template>

        <!-- 题目区域 - 使用固定高度布局 -->
        <div class="question-area">
            <!-- 左侧：题目列表 -->
            <QuestionList
                class="question-list-container"
                :class="{ collapsed: sidebarCollapsed }"
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
import { ref, onMounted, watch, computed, nextTick } from "vue";
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
import { toRaw } from "vue";
import { useLoadingStateStore } from "@/stores/loadingState";
import { useExamTimer } from "@/composables/useExamTimer";

const { data: paperResponse1, error } = await useFetch<Papers>(
    `/api/papers/full/c360fcd9-8f0d-48c2-8287-996792da4958`
);
console.log("paperResponse1", paperResponse1.value);

dayjs.extend(utc);

const props = defineProps<{
    exam_page_mode: string;
}>();

const {
    isTimeUp,
    formattedCountdown,
    formattedActualStartTime,
    formattedExamEndTime,
    initializeTimer,
} = useExamTimer();

const final_submission_dialog_visible = ref(false);
const confirm_submit_dialog_visible = ref(false);
const nav_boundary_dialog_visible = ref(false);
const nav_boundary_dialog_message = ref("");

const sidebarCollapsed = ref(false);
const sidebarWidth = ref(300);

const { getItemById, getItems, updateItem } = useDirectusItems();

// 路由参数：practice_session 的 ID
const route = useRoute(); // 这里的useRoute是vue-router的useRoute方法，而非Nuxt的useRoute方法。

// 加入预处理参数：在路由守卫或组件加载时，无论是单个值还是数组，都统一解析为单个值。
const practice_session_id = Array.isArray(route.params.id)
    ? route.params.id[0]
    : route.params.id;

// 数据绑定
const practiceSession = ref<PracticeSessions>({} as PracticeSessions);
// const paper = ref<Papers>({} as Papers);
const paper = ref<any>({} as any);
const submittedPaperSections = ref<PaperSections[]>([]);
const selectedQuestion = ref({} as any);
const questionResults = ref<QuestionResults[]>([]);
const examScore = ref<number | null>(null);
const practiceSessionTime = ref<PracticeSessions>({} as PracticeSessions);

const handleSidebarToggle = (collapsed: boolean) => {
    sidebarCollapsed.value = collapsed;
};

const handleSidebarResize = (width: number) => {
    sidebarWidth.value = width;
};

const fetchSubmittedExam = async () => {
    try {
        const practiceSessionResponse: PracticeSessions =
            await getItemById<PracticeSessions>({
                collection: "practice_sessions",
                id: practice_session_id,
                params: {
                    fields: [
                        "id",
                        "exercises_students_id.exercises_id.paper",
                        "exercises_students_id.students_id.name",
                        "exercises_students_id.students_id.number",
                        "exercises_students_id.students_id.email",
                        "exercises_students_id.students_id.class.name",
                        "exercises_students_id.exercises_id.title",
                        "exercises_students_id.exercises_id.duration",
                        "score",
                        "actual_start_time",
                        "actual_end_time",
                        "extra_time",
                        "expected_end_time",
                        "submit_status",
                    ],
                },
            });

        if (practiceSessionResponse) {
            practiceSession.value = practiceSessionResponse;
            practiceSessionTime.value = practiceSessionResponse;
            examScore.value = Number(practiceSessionResponse.score) || null;

            if (
                practiceSession.value.submit_status === "done" &&
                props.exam_page_mode !== "review"
            ) {
                final_submission_dialog_visible.value = true;
                const loadingStateStore = useLoadingStateStore();
                loadingStateStore.setComponentReady("examPage");
                return;
            }

            afterFetchSubmittedExamContent();

            const actualStartISO = practiceSessionTime.value.actual_start_time;
            let durationMins = 0;
            let extraMins = 0;

            const esId = practiceSessionTime.value.exercises_students_id;
            if (
                esId &&
                typeof esId === "object" &&
                esId.exercises_id &&
                typeof esId.exercises_id === "object" &&
                typeof esId.exercises_id.duration === "number"
            ) {
                durationMins = esId.exercises_id.duration;
            }
            if (typeof practiceSessionTime.value.extra_time === "number") {
                extraMins = practiceSessionTime.value.extra_time;
            }

            console.log("ExamPage: Attempting to initialize timer with:", {
                actualStartISO,
                durationMins,
                extraMins,
            });

            if (actualStartISO) {
                initializeTimer(actualStartISO, durationMins, extraMins);
                console.log("ExamPage: Timer initialization called.");
            } else {
                console.error(
                    "ExamPage: 无法初始化计时器 - actual_start_time 缺失或无效。",
                    "actualStartISO was:",
                    actualStartISO
                );
            }
        } else {
            console.error("ExamPage: 获取考试会话失败，无法初始化计时器。");
        }
    } catch (error) {
        console.error("ExamPage: fetchSubmittedExam 中发生错误:", error);
    }
};

const afterFetchSubmittedExamContent = () => {
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

const fetchSubmittedPaper = async (paperId: string) => {
    console.log("Paper ID:", paperId);

    const { data: paperResponse, error } = await useFetch<Papers>(
        `/api/papers/full/${paperId}`
    );

    console.log("paperResponse", paperResponse.value);

    console.log("deep", paperResponse.value?.paper_sections[0].questions);

    // 注意：
    // Nuxt3的useFetch返回的data是深层响应式对象，当嵌套数据结构中存在循环引用或特殊对象（如Date）时，直接控制台输出可能显示代理对象，而实际数据需要通过toRaw()获取原始数据。

    if (paperResponse.value && typeof paperResponse.value === "object") {
        paper.value = toRaw(paperResponse.value);
        const rawPaper = toRaw(paperResponse.value);
        console.log("rawPaper", rawPaper);
        console.log(rawPaper.paper_sections[0].questions);
        console.log(paper.value.paper_sections[0].questions);
    }


    const submittedSectionsResponse = toRaw(paper.value)
        .paper_sections as PaperSections[];

    console.log("submittedSectionsResponse", submittedSectionsResponse);
    console.log("submittedSectionsResponse[0].questions", submittedSectionsResponse[0].questions);
    // 到这里为止，题目列表都还是在的。
    

    // 新增：对获取到的章节进行排序
    submittedSectionsResponse.sort(
        (a, b) => (a.sort_in_paper || 0) - (b.sort_in_paper || 0)
    );

    console.log("submittedSectionsResponse[0].questions 2", submittedSectionsResponse[0].questions);
    // 到这里为止，题目列表都还是在的。

    const questionResultsData = await getItems<QuestionResults>({
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
    questionResults.value = questionResultsData;

    const chapter_id_list_local = ref<string[]>([]);
    const question_id_list_local = ref<string[]>([]);
    const question_groups_id_list_local = ref<string[]>([]);

    const allSectionIds = submittedSectionsResponse.map((section) => section.id);
    let allSectionQuestions: PaperSectionsQuestions[] = [];
    const paper_sections_question_ids = submittedSectionsResponse.flatMap((s) => s.questions);
    const paper_section_question_group_ids = submittedSectionsResponse.flatMap(
        (s) => s.question_groups
    );

    if (allSectionIds.length > 0) {
        allSectionQuestions =
            paper_sections_question_ids as PaperSectionsQuestions[];
        console.log("allSectionQuestions", allSectionQuestions);

        const allQuestionIds = allSectionQuestions.map(
            (sq) => sq.questions_id as string
        );
        question_id_list_local.value = Array.from(
            new Set(question_id_list_local.value.concat(allQuestionIds))
        );
    }

    let allSectionQuestionGroups: PaperSectionsQuestionGroups[] = [];
    if (allSectionIds.length > 0) {
        // 仅当存在题组模式的章节时才查询
        const groupModeSectionIds = submittedSectionsResponse
            .filter((section) => section.question_mode === "group")
            .map((section) => section.id);

        if (groupModeSectionIds.length > 0) {
            allSectionQuestionGroups = paper_section_question_group_ids;
            // 将所有题组ID添加到 question_groups_id_list 中
            const allGroupIds = allSectionQuestionGroups.map(
                (sgq) => sgq.question_groups_id as string
            );
            question_groups_id_list_local.value = Array.from(
                new Set(question_groups_id_list_local.value.concat(allGroupIds))
            );
        }
    }

    const questionsData = paper_sections_question_ids as Questions[];

    let questionGroupsData: QuestionGroups[] = [];
    if (question_groups_id_list_local.value.length > 0) {
        questionGroupsData =
            paper_section_question_group_ids as QuestionGroups[];
    }

    console.log("submittedSectionsResponse[0].questions 2.5", submittedSectionsResponse[0].questions);
    // 到这里还在。
    // 接下来，处理完之后，题目列表就空了。

    const submittedSectionsResponse_local = toRaw(submittedSectionsResponse);
    console.log("submittedSectionsResponse_local0q", submittedSectionsResponse_local[0].questions);
    
    // [2025-05-22] 注意，嵌套结构中section内的questions其实是在这里重新排序、生成的。
    // submittedSectionsResponse_local.forEach((section) => {
    //     console.log("section", section);
    //     console.log("section.question", section.questions);
    //     // 这会儿question还在。
    //     console.log("allSectionQuestions", allSectionQuestions);
        
    //     const currentSectionQuestions = allSectionQuestions
    //         .filter((sq) => sq.paper_sections_id === section.id)
    //         .sort(
    //             (a, b) => (a.sort_in_section || 0) - (b.sort_in_section || 0)
    //         );
    //     console.log("currentSectionQuestions", currentSectionQuestions);
        
    //     console.log("questionData", questionsData);
        
    //     const sectionQuestionsWithData = currentSectionQuestions.map((sq) => {
    //         const questionData = questionsData.find(
    //             (item) => item.id === (sq.questions_id as string)
    //         );
    //         const result = questionResults.value.find(
    //             (r) => r.question_in_paper_id === sq.id
    //         );
    //         return {
    //             ...sq,
    //             questions_id: questionData || null,
    //             result: result || null,
    //         };
    //     });
    //     section.questions = sectionQuestionsWithData;

    //     if (section.question_mode === "group") {
    //         const currentSectionGroups = allSectionQuestionGroups
    //             .filter((sgq) => sgq.paper_sections_id === section.id)
    //             .sort(
    //                 (a, b) =>
    //                     (a.sort_in_section || 0) - (b.sort_in_section || 0)
    //             );
    //         const sectionQuestionGroupsWithData = currentSectionGroups.map(
    //             (sgq) => {
    //                 const questionGroupData = questionGroupsData.find(
    //                     (item) => item.id === (sgq.question_groups_id as string)
    //                 );
    //                 if (questionGroupData) {
    //                     const groupQuestions = section.questions.filter(
    //                         (qItem) => {
    //                             if (
    //                                 !qItem.questions_id ||
    //                                 !qItem.questions_id.question_group
    //                             )
    //                                 return false;
    //                             const qGroup =
    //                                 qItem.questions_id.question_group;
    //                             return (
    //                                 (typeof qGroup === "string"
    //                                     ? qGroup
    //                                     : qGroup.id) === questionGroupData.id
    //                             );
    //                         }
    //                     );
    //                     return {
    //                         ...sgq,
    //                         question_groups_id: questionGroupData || null,
    //                         group_question_ids: groupQuestions.map((q) => q.id),
    //                     };
    //                 }
    //                 return {
    //                     ...sgq,
    //                     question_groups_id: questionGroupData || null,
    //                 };
    //             }
    //         );
    //         section.question_groups = sectionQuestionGroupsWithData;
    //     }
    // });

    console.log("submittedSectionsResponse_local0q2", submittedSectionsResponse_local[0].questions);
    console.log("submittedSectionsResponse[0].questions 3", submittedSectionsResponse[0].questions);
    // 到这里就空了。
    console.log("submittedSectionsResponse", submittedSectionsResponse);
    console.log("submittedSectionsResponse_local", submittedSectionsResponse_local);
    

    submittedPaperSections.value = toRaw(submittedSectionsResponse_local);

    if (submittedSectionsResponse.length > 0) {
        if (
            submittedSectionsResponse[0].question_mode === "group" &&
            submittedSectionsResponse[0].question_groups &&
            submittedSectionsResponse[0].question_groups.length > 0
        ) {
            const firstGroup = submittedSectionsResponse[0].question_groups[0];
            const groupQuestionIds = firstGroup.group_question_ids || [];
            const groupQuestions = submittedSectionsResponse[0].questions.filter((q) =>
                groupQuestionIds.includes(q.id)
            );
            const sortedGroupQuestions = [...groupQuestions].sort((a, b) => {
                const aSort = a.questions_id.sort_in_group ?? 999;
                const bSort = b.questions_id.sort_in_group ?? 999;
                if (aSort === bSort)
                    return (a.sort_in_section || 0) - (b.sort_in_section || 0);
                return aSort - bSort;
            });
            selectedQuestion.value = {
                ...firstGroup,
                isGroupMode: true,
                questionGroup: firstGroup.question_groups_id,
                questions_id: { type: "group" },
                section_id: submittedSectionsResponse[0].id,
                paper_sections_id: submittedSectionsResponse[0].id,
                sort_in_section: firstGroup.sort_in_section,
                groupQuestions: sortedGroupQuestions,
            };
            console.log("selectedQuestion1", selectedQuestion.value);
            
        } else if (
            submittedSectionsResponse[0].questions &&
            submittedSectionsResponse[0].questions.length > 0
        ) {
            selectedQuestion.value = submittedSectionsResponse[0].questions[0];
            console.log("selectedQuestion2", selectedQuestion.value);
        }
    }
};

const selectQuestion = (question: any) => {
    selectedQuestion.value = question;
};

const submitActualEndTime = async (examId: string) => {
    try {
        await updateItem<PracticeSessions>({
            collection: "practice_sessions",
            id: examId,
            item: { actual_end_time: dayjs().toISOString() },
        });
    } catch (e) {
        console.error("提交实际结束时间失败:", e);
    }
};

const updateSubmitStatus = async (current_practice_session_id: string) => {
    try {
        await updateItem<PracticeSessions>({
            collection: "practice_sessions",
            id: current_practice_session_id,
            item: { submit_status: "done" },
        });
    } catch (e) {
        console.error("更新提交状态失败:", e);
    }
};

const submitExam = async (examId_to_submit: string) => {
    if (
        practiceSession.value.submit_status === "done" &&
        props.exam_page_mode !== "review"
    ) {
        console.log("考试已提交，或为复习模式，跳过重复提交。");
        return;
    }
    await submitActualEndTime(examId_to_submit);
    await updateSubmitStatus(examId_to_submit);
    if (practiceSession.value) {
        practiceSession.value.submit_status = "done";
    }
};

const manualSubmit = () => {
    confirm_submit_dialog_visible.value = true;
};

const exitExam = async () => {
    final_submission_dialog_visible.value = false;
    confirm_submit_dialog_visible.value = false;
    await navigateTo(`/exams`);
};

const confirmSubmit = async () => {
    if (props.exam_page_mode === "review") return;
    confirm_submit_dialog_visible.value = false;
    await submitExam(practice_session_id);
    final_submission_dialog_visible.value = true;
};

watch(isTimeUp, async (newIsTimeUp) => {
    if (newIsTimeUp && props.exam_page_mode !== "review") {
        if (!final_submission_dialog_visible.value) {
            if (practiceSession.value.submit_status !== "done") {
                await submitExam(practice_session_id);
            }
            final_submission_dialog_visible.value = true;
        }
    }
});

const isClient = ref(false);

const currentTime_display_local = ref("");
const currentTimeInterval_local = ref<any>(null);

const updateCurrentTime_local = () => {
    currentTime_display_local.value = dayjs().format("MM-DD HH:mm:ss");
};
const startCurrentTimeUpdate_local = () => {
    if (isClient.value) {
        updateCurrentTime_local();
        currentTimeInterval_local.value = setInterval(
            updateCurrentTime_local,
            1000
        );
    }
};

onMounted(async () => {
    await fetchSubmittedExam(); // fetchSubmittedExam 内部会处理已提交的情况

    await nextTick();
    isClient.value = true;

    // 仅当考试未完成时（即 fetchSubmittedExam 没有提前返回），才启动本地时间更新
    if (
        practiceSession.value.submit_status !== "done" ||
        props.exam_page_mode === "review"
    ) {
        startCurrentTimeUpdate_local();
    }

    const loadingStateStore = useLoadingStateStore();
    if (!loadingStateStore.checkComponentReady("examPage")) {
        loadingStateStore.setComponentReady("examPage");
    }
});

onUnmounted(() => {
    if (currentTimeInterval_local.value) {
        clearInterval(currentTimeInterval_local.value);
        currentTimeInterval_local.value = null;
    }
});

const navigateToQuestion = (direction: number) => {
    if (!selectedQuestion.value) return;
    const currentQuestion = selectedQuestion.value;
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
        return;
    }

    const currentSection = submittedPaperSections.value.find(
        (s) => s.id === currentSectionId
    );
    if (!currentSection) return;

    // 判断当前章节的题目模式
    const isGroupMode = currentSection.question_mode === "group";
    const sortedSections = [...submittedPaperSections.value].sort(
        (a, b) => (a.sort_in_paper || 0) - (b.sort_in_paper || 0)
    );
    const currentSectionIndex = sortedSections.findIndex(
        (s) => s.id === currentSectionId
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
        const nextQuestionIndex = sortedSectionQuestions.findIndex(
            (q) => q.sort_in_section > currentSortInSection
        );
        if (nextQuestionIndex !== -1) {
            return selectQuestion(sortedSectionQuestions[nextQuestionIndex]);
        }

        // 如果当前是章节的最后一题
        if (currentSectionIndex < sortedSections.length - 1) {
            // 且有下一章节，则跳转到下一章节的第一题/题组
            const nextSection = sortedSections[currentSectionIndex + 1];
            if (
                nextSection.question_mode === "group" &&
                nextSection.question_groups &&
                nextSection.question_groups.length > 0
            ) {
                const sortedGroups = [...nextSection.question_groups].sort(
                    (a, b) =>
                        (a.sort_in_section || 0) - (b.sort_in_section || 0)
                );
                if (sortedGroups.length > 0)
                    return handleQuestionGroupClick(
                        sortedGroups[0],
                        nextSection
                    );
            } else if (
                nextSection.questions &&
                nextSection.questions.length > 0
            ) {
                const sortedNextQuestions = [...nextSection.questions].sort(
                    (a, b) =>
                        (a.sort_in_section || 0) - (b.sort_in_section || 0)
                );
                if (sortedNextQuestions.length > 0)
                    return selectQuestion(sortedNextQuestions[0]);
            }
        } else {
            nav_boundary_dialog_message.value = "当前已经是最后一题！";
            nav_boundary_dialog_visible.value = true;
            return;
        }
    } else if (direction === -1) {
        const prevQuestions = sortedSectionQuestions.filter(
            (q) => q.sort_in_section < currentSortInSection
        );
        if (prevQuestions.length > 0) {
            return selectQuestion(prevQuestions[prevQuestions.length - 1]);
        }
        if (currentSectionIndex > 0) {
            const prevSection = sortedSections[currentSectionIndex - 1];
            if (
                prevSection.question_mode === "group" &&
                prevSection.question_groups &&
                prevSection.question_groups.length > 0
            ) {
                const sortedGroups = [...prevSection.question_groups].sort(
                    (a, b) =>
                        (a.sort_in_section || 0) - (b.sort_in_section || 0)
                );
                if (sortedGroups.length > 0)
                    return handleQuestionGroupClick(
                        sortedGroups[sortedGroups.length - 1],
                        prevSection
                    );
            } else if (
                prevSection.questions &&
                prevSection.questions.length > 0
            ) {
                const sortedPrevQuestions = [...prevSection.questions].sort(
                    (a, b) =>
                        (a.sort_in_section || 0) - (b.sort_in_section || 0)
                );
                if (sortedPrevQuestions.length > 0)
                    return selectQuestion(
                        sortedPrevQuestions[sortedPrevQuestions.length - 1]
                    );
            }
        } else {
            nav_boundary_dialog_message.value = "当前已经是第一题！";
            nav_boundary_dialog_visible.value = true;
            return;
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
    if (
        !currentSection.question_groups ||
        currentSection.question_groups.length === 0
    )
        return;
    const sortedGroups = [...currentSection.question_groups].sort(
        (a, b) => (a.sort_in_section || 0) - (b.sort_in_section || 0)
    );
    let currentGroupIndex = -1;
    if (currentQuestion.isGroupMode && currentQuestion.questionGroup) {
        const currentGroupId =
            typeof currentQuestion.questionGroup === "string"
                ? currentQuestion.questionGroup
                : currentQuestion.questionGroup.id;
        currentGroupIndex = sortedGroups.findIndex(
            (group) =>
                (typeof group.question_groups_id === "string"
                    ? group.question_groups_id
                    : group.question_groups_id.id) === currentGroupId
        );
    }
    if (currentGroupIndex === -1) return;

    if (direction === 1) {
        // 下一题组
        if (currentGroupIndex < sortedGroups.length - 1) {
            return handleQuestionGroupClick(
                sortedGroups[currentGroupIndex + 1],
                currentSection
            );
        } else if (currentSectionIndex < sortedSections.length - 1) {
            // 当前章节的最后一个题组，跳转到下一章节的第一个题目/题组
            const nextSection = sortedSections[currentSectionIndex + 1];
            if (
                nextSection.question_mode === "group" &&
                nextSection.question_groups &&
                nextSection.question_groups.length > 0
            ) {
                const sortedNextGroups = [...nextSection.question_groups].sort(
                    (a, b) =>
                        (a.sort_in_section || 0) - (b.sort_in_section || 0)
                );
                if (sortedNextGroups.length > 0)
                    return handleQuestionGroupClick(
                        sortedNextGroups[0],
                        nextSection
                    );
            } else if (
                nextSection.questions &&
                nextSection.questions.length > 0
            ) {
                const sortedNextQuestions = [...nextSection.questions].sort(
                    (a, b) =>
                        (a.sort_in_section || 0) - (b.sort_in_section || 0)
                );
                if (sortedNextQuestions.length > 0)
                    return selectQuestion(sortedNextQuestions[0]);
            }
        } else {
            // 当前是最后一个题组且是最后一个章节
            nav_boundary_dialog_message.value = "当前已经是最后一题！";
            nav_boundary_dialog_visible.value = true;
            return;
        }
    } else if (direction === -1) {
        if (currentGroupIndex > 0) {
            return handleQuestionGroupClick(
                sortedGroups[currentGroupIndex - 1],
                currentSection
            );
        } else if (currentSectionIndex > 0) {
            // 当前章节的第一个题组，跳转到上一章节的最后一个题目/题组
            const prevSection = sortedSections[currentSectionIndex - 1];
            if (
                prevSection.question_mode === "group" &&
                prevSection.question_groups &&
                prevSection.question_groups.length > 0
            ) {
                const sortedPrevGroups = [...prevSection.question_groups].sort(
                    (a, b) =>
                        (a.sort_in_section || 0) - (b.sort_in_section || 0)
                );
                if (sortedPrevGroups.length > 0)
                    return handleQuestionGroupClick(
                        sortedPrevGroups[sortedPrevGroups.length - 1],
                        prevSection
                    );
            } else if (
                prevSection.questions &&
                prevSection.questions.length > 0
            ) {
                const sortedPrevQuestions = [...prevSection.questions].sort(
                    (a, b) =>
                        (a.sort_in_section || 0) - (b.sort_in_section || 0)
                );
                if (sortedPrevQuestions.length > 0)
                    return selectQuestion(
                        sortedPrevQuestions[sortedPrevQuestions.length - 1]
                    );
            }
        } else {
            nav_boundary_dialog_message.value = "当前已经是第一题！";
            nav_boundary_dialog_visible.value = true;
            return;
        }
    }
};

/**
 * 处理题组点击事件
 * 在题组模式下，点击题组时查找并加载该题组内的所有题目
 */
const handleQuestionGroupClick = async (group: any, section: PaperSections) => {
    if (!group || !group.question_groups_id) return;
    const questionGroup =
        typeof group.question_groups_id === "object"
            ? group.question_groups_id
            : null;

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
    selectQuestion(enhancedQuestion);
};

// 在组合式API中创建关联关系
const useQuestionResults = () => {
    // 创建响应式映射关系
    const questionResultMap = computed(() => 
        new Map(
            questionResults.value.map(r => [r.question_in_paper_id, r])
        )
    );

    // 获取题目关联结果的方法
    // 注意，因为QuestionResults中的question_in_paper_id类型为number，
    // 所以这里需要传入number类型的参数。
    const getResultForQuestion = (questionId: number) => 
        questionResultMap.value.get(questionId) || null;

    return { getResultForQuestion };
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
