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
import { useAuth } from "~~/stores/auth";

import { useLoadingStateStore } from "@/stores/loadingState";
import { useExamTimer } from "@/composables/useExamTimer";
import { useExamData } from "@/composables/useExamData";

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

// 使用 useExamData Composable
const {
    practiceSession,
    paper,
    submittedPaperSections,
    questionResults,
    examScore,
    practiceSessionTime,
    loadExamData,
    timerInitParams,
    shouldShowFinalSubmissionDialog,
} = useExamData();

// selectedQuestion 仍然在 ExamPage.vue 中管理，但其初始值将由 loadExamData 设置
const selectedQuestion = ref({} as any);

const handleSidebarToggle = (collapsed: boolean) => {
    sidebarCollapsed.value = collapsed;
};

const handleSidebarResize = (width: number) => {
    sidebarWidth.value = width;
};

// 监听从 useExamData 返回的 timerInitParams
watch(timerInitParams, (params) => {
    if (params && params.actualStartISO) {
        console.log(
            "ExamPage: Attempting to initialize timer with (from composable):",
            params
        );
        initializeTimer(params.actualStartISO, params.durationMins, params.extraMins);
        console.log("ExamPage: Timer initialization called via composable.");
    } else if (params === null && practiceSession.value.actual_start_time) {
        // 可能是数据加载完成但没有新的计时器参数（例如，已经是完成状态）
        // 确保这种情况下计时器不会意外启动
        console.log("ExamPage: timerInitParams is null, but practiceSession has actual_start_time. Check logic.");
    } else if (timerInitParams.value === null && !practiceSession.value.actual_start_time) {
         console.error(
            "ExamPage: 无法初始化计时器 - actual_start_time 缺失或无效 (from composable watch).",
             "timerInitParams was:", params,
             "practiceSession.value.actual_start_time was:", practiceSession.value.actual_start_time
         );
    }
}, { immediate: false }); // immediate: false, 因为我们希望在 loadExamData 完成后才初始化

// 监听从 useExamData 返回的 shouldShowFinalSubmissionDialog
watch(shouldShowFinalSubmissionDialog, (showDialog) => {
    if (showDialog) {
        final_submission_dialog_visible.value = true;
        const loadingStateStore = useLoadingStateStore();
        if (!loadingStateStore.checkComponentReady("examPage")) {
            loadingStateStore.setComponentReady("examPage");
        }
    }
});

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
    await loadExamData(practice_session_id, props.exam_page_mode, selectedQuestion);

    await nextTick();
    isClient.value = true;

    // 仅当考试未完成时（即 loadExamData 没有提前返回），才启动本地时间更新
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
        const aSort = a.questions_id?.sort_in_group ?? 999;
        const bSort = b.questions_id?.sort_in_group ?? 999;

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
