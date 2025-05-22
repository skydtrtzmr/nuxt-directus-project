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
import { ref, onMounted, watch, computed, nextTick, onUnmounted } from "vue";
import { useRoute, useRouter }
    from "vue-router";
import utc from "dayjs/plugin/utc";
import type {
    PracticeSessions,
    Papers,
    PaperSections,
    PaperSectionsQuestions,
    Questions,
    QuestionResults,
    Classes,
    PaperSectionsQuestionGroups,
    QuestionGroups,
} from "~~/types/directus_types";
import { useAuth } from "~~/stores/auth";

import { useLoadingStateStore } from "@/stores/loadingState";
import { useExamTimer } from "@/composables/useExamTimer";

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
    startCountdown,
} = useExamTimer();

const { getItemById, getItems, updateItem } = useDirectusItems();
const route = useRoute();
const router = useRouter();

const practice_session_id = Array.isArray(route.params.id)
    ? route.params.id[0]
    : route.params.id;

// Dialog and UI state refs
const final_submission_dialog_visible = ref(false);
const confirm_submit_dialog_visible = ref(false);
const nav_boundary_dialog_visible = ref(false);
const nav_boundary_dialog_message = ref("");
const sidebarCollapsed = ref(false);
const sidebarWidth = ref(300);
const isClient = ref(false);

// Core data refs
const practiceSession = ref<PracticeSessions>({} as PracticeSessions);
const paper = ref<Papers>({} as Papers);
const submittedPaperSections = ref<PaperSections[]>([]);
const selectedQuestion = ref<any>({});
const questionResults = ref<QuestionResults[]>([]);
const examScore = ref<number | null>(null);
const practiceSessionTime = ref<PracticeSessions>({} as PracticeSessions);

// Fetch initial data using useAsyncData for SSR
const { data: examInitialData, pending: examDataPending, error: examDataError } = await useAsyncData(
    `exam-data-${practice_session_id}`,
    async () => {
        if (!practice_session_id) {
            console.error("ExamPage: practice_session_id is missing.");
            throw createError({ statusCode: 400, statusMessage: 'Practice Session ID is required' });
        }

        // 1. Fetch PracticeSession details
        const psResponse = await getItemById<PracticeSessions>({
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

        if (!psResponse) {
            console.error(`ExamPage: Failed to fetch practice session for ID: ${practice_session_id}`);
            throw createError({ statusCode: 404, statusMessage: 'Practice Session Not Found' });
        }

        // Extract paper_id
        let paperId: string | undefined;
        const esId = psResponse.exercises_students_id;
        if (typeof esId === "object" && esId && "exercises_id" in esId && esId.exercises_id) {
            const exercisesId = esId.exercises_id;
            if (typeof exercisesId === "object" && exercisesId.paper && typeof exercisesId.paper === 'string') {
                paperId = exercisesId.paper;
            }
        }

        if (!paperId) {
            console.error(`ExamPage: Paper ID not found in practice session: ${practice_session_id}`);
            throw createError({ statusCode: 404, statusMessage: 'Paper ID not found in practice session' });
        }

        // 2. Fetch Full Paper Data using the new API
        const fullPaperData = await $fetch(`/api/papers/full/${paperId}`);
        if (!fullPaperData) {
            console.error(`ExamPage: Failed to fetch full paper data for paper ID: ${paperId}`);
            throw createError({ statusCode: 404, statusMessage: 'Paper Data Not Found' });
        }

        // 3. Fetch QuestionResults
        const qResultsData = await getItems<QuestionResults>({
            collection: "question_results",
            params: {
                filter: { practice_session_id: practice_session_id },
                fields: [
                    "id",
                    "practice_session_id",
                    "question_in_paper_id",
                    "question_type",
                    "point_value",
                    "score",
                    "submit_ans_select_radio",
                    "submit_ans_select_multiple_checkbox",
                    "is_flagged",
                ],
            },
        });

        return {
            practiceSession: psResponse,
            fullPaperData: fullPaperData as Papers & { paper_sections: PaperSections[] },
            questionResults: qResultsData,
        };
    }
);

// Watch for data changes from useAsyncData and update component state
watch(examInitialData, (newData) => {
    const loadingStateStore = useLoadingStateStore();
    if (examDataPending.value) return;

    if (newData && !examDataError.value) {
        practiceSession.value = newData.practiceSession;
        practiceSessionTime.value = newData.practiceSession;
        examScore.value = Number(newData.practiceSession.score) || null;

        if (newData.practiceSession.submit_status === "done" && props.exam_page_mode !== "review") {
            final_submission_dialog_visible.value = true;
            if (!loadingStateStore.checkComponentReady("examPage")) {
                loadingStateStore.setComponentReady("examPage");
            }
            return;
        }

        paper.value = newData.fullPaperData;
        
        let processedSections = JSON.parse(JSON.stringify(newData.fullPaperData.paper_sections || [])) as PaperSections[];

        processedSections.sort((a, b) => (a.sort_in_paper || 0) - (b.sort_in_paper || 0));

        processedSections.forEach((section: any) => {
            if (section.questions && Array.isArray(section.questions)) {
                section.questions.sort((a: any, b: any) => (a.sort_in_section || 0) - (b.sort_in_section || 0));
            } else {
                section.questions = [];
            }

            if (section.question_mode === 'group') {
                if (section.question_groups && Array.isArray(section.question_groups)) {
                    section.question_groups.sort((a: any, b: any) => (a.sort_in_section || 0) - (b.sort_in_section || 0));
                    section.question_groups.forEach((group: any) => {
                        const actualGroupId = group.question_groups_id?.id;
                        if (actualGroupId) {
                            group.group_question_ids = section.questions
                                .filter((qItem: any) => qItem.questions_id?.question_group?.id === actualGroupId && qItem.id)
                                .map((qItem: any) => qItem.id);
                        } else {
                            group.group_question_ids = [];
                        }
                    });
                } else {
                    section.question_groups = [];
                }
            }
        });
        submittedPaperSections.value = processedSections as PaperSections[];

        questionResults.value = newData.questionResults;

        if (submittedPaperSections.value.length > 0) {
            const firstSection = submittedPaperSections.value[0];
            if (firstSection.question_mode === "group" && firstSection.question_groups && firstSection.question_groups.length > 0) {
                const firstGroup = firstSection.question_groups[0];
                const questionGroupData = firstGroup.question_groups_id as QuestionGroups; 
                const groupQuestionPsqIds = (firstGroup as any).group_question_ids || [];

                const groupQuestions = firstSection.questions.filter(q => groupQuestionPsqIds.includes((q as any).id));

                const sortedGroupQuestions = [...groupQuestions].sort((a, b) => {
                    const aData = (a as PaperSectionsQuestions).questions_id as Questions;
                    const bData = (b as PaperSectionsQuestions).questions_id as Questions;
                    const aSort = aData?.sort_in_group ?? 999;
                    const bSort = bData?.sort_in_group ?? 999;
                    if (aSort === bSort) return ((a as PaperSectionsQuestions).sort_in_section || 0) - ((b as PaperSectionsQuestions).sort_in_section || 0);
                    return aSort - bSort;
                });
                
                selectedQuestion.value = {
                    ...(firstGroup as any),
                    isGroupMode: true,
                    questionGroup: questionGroupData,
                    questions_id: { type: "group" },
                    section_id: firstSection.id,
                    paper_sections_id: firstSection.id,
                    groupQuestions: sortedGroupQuestions,
                };
            } else if (firstSection.questions && firstSection.questions.length > 0) {
                selectedQuestion.value = firstSection.questions[0];
            } else {
                selectedQuestion.value = {};
            }
        } else {
            selectedQuestion.value = {};
        }

        const actualStartISO = newData.practiceSession.actual_start_time;
        let durationMins = 0;
        let extraMins = 0;
        const esIdTimer = newData.practiceSession.exercises_students_id;
        if (esIdTimer && typeof esIdTimer === "object" && esIdTimer.exercises_id && typeof esIdTimer.exercises_id === "object" && typeof (esIdTimer.exercises_id as any).duration === "number") {
            durationMins = (esIdTimer.exercises_id as any).duration;
        }
        if (typeof newData.practiceSession.extra_time === "number") {
            extraMins = newData.practiceSession.extra_time;
        }

        if (actualStartISO) {
            initializeTimer(actualStartISO, durationMins, extraMins);
            
            if (process.client && (newData.practiceSession.submit_status !== "done" || props.exam_page_mode === "review")) {
                 startCountdown();
            }
        } else {
            console.error("ExamPage: Timer init failed - actual_start_time missing.", actualStartISO);
        }
        
        if (isClient.value && (newData.practiceSession.submit_status !== "done" || props.exam_page_mode === "review")) {
            startCurrentTimeUpdate_local();
        }
        
        if (!loadingStateStore.checkComponentReady("examPage")) {
            loadingStateStore.setComponentReady("examPage");
        }

    } else if (examDataError.value) {
        console.error("ExamPage: Error fetching initial exam data:", examDataError.value);
        if (!loadingStateStore.checkComponentReady("examPage")) {
             loadingStateStore.setComponentReady("examPage");
        }
    }
}, { immediate: true });

// User info computed property
const userData = computed(() => {
    const defaultData = { name: "考生", student_number: 0, email: "", className: "" };
    const esId = practiceSession.value?.exercises_students_id;
    if (!esId || typeof esId !== "object" || !("students_id" in esId)) return defaultData;
    const studentId = esId.students_id;
    if (!studentId || typeof studentId !== "object") return defaultData;
    return {
        name: studentId.name || "考生",
        student_number: studentId.number || 0,
        email: studentId.email || "",
        className: ((studentId.class as unknown) as Classes)?.name || "",
    };
});

// Sidebar handling
const handleSidebarToggle = (collapsed: boolean) => {
    sidebarCollapsed.value = collapsed;
};
const handleSidebarResize = (width: number) => {
    sidebarWidth.value = width;
};

// Question selection
const selectQuestion = (question: any) => {
    selectedQuestion.value = question;
};

// Exam submission logic
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
    if (practiceSession.value.submit_status === "done" && props.exam_page_mode !== "review") {
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
    await router.push(`/exams`);
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

// Local time display
const currentTime_display_local = ref("");
const currentTimeInterval_local = ref<any>(null);
const updateCurrentTime_local = () => {
    currentTime_display_local.value = dayjs().format("MM-DD HH:mm:ss");
};
const startCurrentTimeUpdate_local = () => {
    if (process.client && !currentTimeInterval_local.value) {
        updateCurrentTime_local();
        currentTimeInterval_local.value = setInterval(updateCurrentTime_local, 1000);
    }
};
const stopCurrentTimeUpdate_local = () => {
    if (currentTimeInterval_local.value) {
        clearInterval(currentTimeInterval_local.value);
        currentTimeInterval_local.value = null;
    }
};

onMounted(async () => {
    await nextTick();
    isClient.value = true;

    if (examInitialData.value && examInitialData.value.practiceSession &&
        (examInitialData.value.practiceSession.submit_status !== "done" || props.exam_page_mode === "review")) {
        startCountdown();
    }

    if (examInitialData.value && examInitialData.value.practiceSession &&
        (examInitialData.value.practiceSession.submit_status !== "done" || props.exam_page_mode === "review")) {
        startCurrentTimeUpdate_local();
    }
});

onUnmounted(() => {
    stopCurrentTimeUpdate_local();
});

// Navigation logic for questions
const navigateToQuestion = (direction: number) => {
    if (!selectedQuestion.value || !selectedQuestion.value.id) return;
    
    const currentQuestion = selectedQuestion.value;
    let currentSectionId: string | undefined;

    if (typeof currentQuestion.section_id === "string") {
        currentSectionId = currentQuestion.section_id;
    } else if (typeof currentQuestion.paper_sections_id === "string") {
        currentSectionId = currentQuestion.paper_sections_id;
    } else if (currentQuestion.paper_sections_id && typeof currentQuestion.paper_sections_id === "object" && (currentQuestion.paper_sections_id as any).id) {
        currentSectionId = (currentQuestion.paper_sections_id as any).id;
    } else if (currentQuestion.isGroupMode && currentQuestion.section_id) {
         currentSectionId = currentQuestion.section_id;
    } else {
        console.warn("Could not determine current section ID for navigation", currentQuestion);
        return;
    }

    const currentSection = submittedPaperSections.value.find(s => s.id === currentSectionId);
    if (!currentSection) {
        console.warn("Current section not found for navigation", currentSectionId);
        return;
    }

    const isGroupMode = currentSection.question_mode === "group";
    const sortedSections = submittedPaperSections.value;
    const currentSectionIndex = sortedSections.findIndex(s => s.id === currentSectionId);

    if (isGroupMode) {
        navigateInGroupMode(currentSection, sortedSections, currentSectionIndex, currentQuestion, direction);
    } else {
        navigateInSingleMode(currentSection, sortedSections, currentSectionIndex, currentQuestion, direction);
    }
};

const navigateInSingleMode = (
    currentSection: PaperSections,
    sortedSections: PaperSections[],
    currentSectionIndex: number,
    currentQuestion: any,
    direction: number
) => {
    const currentSortInSection = currentQuestion.sort_in_section;
    const sortedSectionQuestions = (currentSection.questions as PaperSectionsQuestions[]) || []; 

    if (direction === 1) {
        const nextQuestionInSection = sortedSectionQuestions.find(q => (q.sort_in_section || 0) > (currentSortInSection || 0));
        if (nextQuestionInSection) {
            return selectQuestion(nextQuestionInSection);
        }
        if (currentSectionIndex < sortedSections.length - 1) {
            const nextSection = sortedSections[currentSectionIndex + 1];
            if (nextSection.question_mode === "group" && nextSection.question_groups && nextSection.question_groups.length > 0) {
                return handleQuestionGroupClick(nextSection.question_groups[0], nextSection);
            } else if (nextSection.questions && nextSection.questions.length > 0) {
                return selectQuestion(nextSection.questions[0]);
            }
        } else {
            nav_boundary_dialog_message.value = "当前已经是最后一题！";
            nav_boundary_dialog_visible.value = true;
        }
    } else if (direction === -1) {
        const prevQuestionsInSection = sortedSectionQuestions.filter(q => (q.sort_in_section || 0) < (currentSortInSection || 0));
        if (prevQuestionsInSection.length > 0) {
            return selectQuestion(prevQuestionsInSection[prevQuestionsInSection.length - 1]);
        }
        if (currentSectionIndex > 0) {
            const prevSection = sortedSections[currentSectionIndex - 1];
            if (prevSection.question_mode === "group" && prevSection.question_groups && prevSection.question_groups.length > 0) {
                return handleQuestionGroupClick(prevSection.question_groups[prevSection.question_groups.length - 1], prevSection);
            } else if (prevSection.questions && prevSection.questions.length > 0) {
                return selectQuestion(prevSection.questions[prevSection.questions.length - 1]);
            }
        } else {
            nav_boundary_dialog_message.value = "当前已经是第一题！";
            nav_boundary_dialog_visible.value = true;
        }
    }
};

const navigateInGroupMode = (
    currentSection: PaperSections,
    sortedSections: PaperSections[],
    currentSectionIndex: number,
    currentQuestionGroupDisplay: any,
    direction: number
) => {
    if (!currentSection.question_groups || currentSection.question_groups.length === 0) return;
    
    const sortedGroupsInCurrentSection = currentSection.question_groups as PaperSectionsQuestionGroups[];
    
    const currentGroupId = currentQuestionGroupDisplay.id; 
    const currentGroupIndexInSorted = sortedGroupsInCurrentSection.findIndex(g => (g as any).id === currentGroupId);

    if (currentGroupIndexInSorted === -1) {
        console.warn("Current group not found in section for navigation", currentGroupId);
        return;
    }

    if (direction === 1) {
        if (currentGroupIndexInSorted < sortedGroupsInCurrentSection.length - 1) {
            return handleQuestionGroupClick(sortedGroupsInCurrentSection[currentGroupIndexInSorted + 1], currentSection);
        }
        if (currentSectionIndex < sortedSections.length - 1) {
            const nextSection = sortedSections[currentSectionIndex + 1];
            if (nextSection.question_mode === "group" && nextSection.question_groups && nextSection.question_groups.length > 0) {
                 return handleQuestionGroupClick(nextSection.question_groups[0], nextSection);
            } else if (nextSection.questions && nextSection.questions.length > 0) {
                 return selectQuestion(nextSection.questions[0]);
            }
        } else {
            nav_boundary_dialog_message.value = "当前已经是最后一题！";
            nav_boundary_dialog_visible.value = true;
        }
    } else if (direction === -1) {
        if (currentGroupIndexInSorted > 0) {
            return handleQuestionGroupClick(sortedGroupsInCurrentSection[currentGroupIndexInSorted - 1], currentSection);
        }
        if (currentSectionIndex > 0) {
            const prevSection = sortedSections[currentSectionIndex - 1];
            if (prevSection.question_mode === "group" && prevSection.question_groups && prevSection.question_groups.length > 0) {
                 return handleQuestionGroupClick(prevSection.question_groups[prevSection.question_groups.length - 1], prevSection);
            } else if (prevSection.questions && prevSection.questions.length > 0) {
                 return selectQuestion(prevSection.questions[prevSection.questions.length - 1]);
            }
        } else {
            nav_boundary_dialog_message.value = "当前已经是第一题！";
            nav_boundary_dialog_visible.value = true;
        }
    }
};

const handleQuestionGroupClick = (
    groupPsqgItem: PaperSectionsQuestionGroups,
    section: PaperSections
) => {
    if (!groupPsqgItem || !groupPsqgItem.question_groups_id) return;
    
    const questionGroupData = groupPsqgItem.question_groups_id as QuestionGroups;
    const groupQuestionPsqIds = (groupPsqgItem as any).group_question_ids || [];

    const groupQuestions = (section.questions as PaperSectionsQuestions[]).filter(q => groupQuestionPsqIds.includes((q as any).id));

    const sortedGroupQuestions = [...groupQuestions].sort((a, b) => {
        const aData = (a as PaperSectionsQuestions).questions_id as Questions;
        const bData = (b as PaperSectionsQuestions).questions_id as Questions;
        const aSort = aData?.sort_in_group ?? 999;
        const bSort = bData?.sort_in_group ?? 999;
        if (aSort === bSort) return ((a as PaperSectionsQuestions).sort_in_section || 0) - ((b as PaperSectionsQuestions).sort_in_section || 0);
        return aSort - bSort;
    });

    const enhancedQuestion = {
        ...(groupPsqgItem as any),
        isGroupMode: true,
        questionGroup: questionGroupData,
        questions_id: { type: "group" },
        section_id: section.id,
        paper_sections_id: section.id,
        groupQuestions: sortedGroupQuestions,
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
    height: calc(100vh - 120px);
}

.question-list-container {
    height: 100%;
    transition: width 0.3s ease;
    overflow: hidden;
}

.question-list-container.collapsed {
    width: 40px !important;
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

:deep(.p-scrollpanel) {
    padding-right: 17px;
    box-sizing: content-box;
}

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
