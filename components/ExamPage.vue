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
const paper = ref<Papers>({} as Papers);
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

            let paperId: string | null = null;
            const esId = practiceSession.value.exercises_students_id;
            if (
                typeof esId === "object" &&
                esId &&
                "exercises_id" in esId &&
                esId.exercises_id &&
                typeof esId.exercises_id === "object" &&
                "paper" in esId.exercises_id
            ) {
                paperId = esId.exercises_id.paper as string;
            }

            if (!paperId) {
                console.error("ExamPage: 未能从考试会话中获取 paperId。");
                return;
            }

            await fetchAndProcessFullPaperData(paperId);

            const actualStartISO = practiceSessionTime.value.actual_start_time;
            let durationMins = 0;
            let extraMins = 0;

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

            if (actualStartISO) {
                initializeTimer(actualStartISO, durationMins, extraMins);
            } else {
                console.error(
                    "ExamPage: 无法初始化计时器 - actual_start_time 缺失或无效。",
                    "actualStartISO was:", actualStartISO
                );
            }
        } else {
            console.error("ExamPage: 获取考试会话失败，无法初始化计时器。");
        }
    } catch (error) {
        console.error("ExamPage: fetchSubmittedExam 中发生错误:", error);
    }
};

const fetchAndProcessFullPaperData = async (paperId: string) => {
    try {
        const fullPaperData = (await $fetch(`/api/papers/full/${paperId}`)) as Papers;

        if (fullPaperData) {
            paper.value = fullPaperData;

            if (Array.isArray(fullPaperData.paper_sections)) {
                const sortedSections = [...fullPaperData.paper_sections].sort(
                    (a, b) => (a.sort_in_paper || 0) - (b.sort_in_paper || 0)
                );
                
                sortedSections.forEach(section => {
                    if (section.questions && Array.isArray(section.questions)) {
                        section.questions.sort((a:any, b:any) => (a.sort_in_section || 0) - (b.sort_in_section || 0));
                    }
                    if (section.question_groups && Array.isArray(section.question_groups)) {
                        section.question_groups.sort((a:any, b:any) => (a.sort_in_section || 0) - (b.sort_in_section || 0));
                    }
                });
                submittedPaperSections.value = sortedSections;

                const questionResultsData = await getItems<QuestionResults>({
                    collection: "question_results",
                    params: {
                        filter: {
                            practice_session_id: practice_session_id,
                        },
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
                questionResults.value = questionResultsData;

                submittedPaperSections.value.forEach(section => {
                    if (section.questions && Array.isArray(section.questions)) {
                        section.questions.forEach((sq: any) => { 
                            const result = questionResults.value.find(
                                (r) => r.question_in_paper_id === sq.id 
                            );
                            sq.result = result || null; 
                        });
                    }
                });

                if (submittedPaperSections.value.length > 0) {
                    const firstSection = submittedPaperSections.value[0];
                    if (
                        firstSection.question_mode === "group" &&
                        firstSection.question_groups &&
                        firstSection.question_groups.length > 0
                    ) {
                        const firstGroup = firstSection.question_groups[0] as any;

                        const groupQuestions = (firstSection.questions as any[]).filter(qItem => {
                            if (!qItem.questions_id || !qItem.questions_id.question_group) return false;
                            const qItemGroupId = qItem.questions_id.question_group.id;
                            const currentGroupId = firstGroup.question_groups_id.id;
                            return qItemGroupId === currentGroupId;
                        });

                        const sortedGroupQuestions = [...groupQuestions].sort((a, b) => {
                            const aSort = a.questions_id.sort_in_group ?? 999;
                            const bSort = b.questions_id.sort_in_group ?? 999;
                            if (aSort === bSort) return (a.sort_in_section || 0) - (b.sort_in_section || 0);
                            return aSort - bSort;
                        });
                        
                        sortedGroupQuestions.forEach(q => q.paper_sections_id = firstSection.id);

                        selectedQuestion.value = {
                            ...firstGroup, 
                            isGroupMode: true,
                            questionGroup: firstGroup.question_groups_id, 
                            questions_id: { type: "group" }, 
                            section_id: firstSection.id,
                            paper_sections_id: firstSection.id,
                            groupQuestions: sortedGroupQuestions,
                        };

                    } else if (firstSection.questions && firstSection.questions.length > 0) {
                        const initialQuestion = firstSection.questions[0] as any;
                        initialQuestion.paper_sections_id = firstSection.id;
                        selectQuestion(initialQuestion);
                    }
                }
            } else {
                console.error("ExamPage: 从缓存获取的试卷数据缺少 paper_sections 数组。");
                submittedPaperSections.value = [];
            }
        } else {
            console.error("ExamPage: 获取完整试卷数据失败。");
        }
    } catch (error) {
        console.error("ExamPage: fetchAndProcessFullPaperData 中发生错误:", error);
    }
};

const selectQuestion = (question: any) => {
    if (question && !question.paper_sections_id && question.section_id) {
        question.paper_sections_id = question.section_id;
    } else if (question && !question.paper_sections_id && selectedQuestion.value && selectedQuestion.value.paper_sections_id && !question.isGroupMode) {
        const currentSection = submittedPaperSections.value.find(s => s.questions && s.questions.some((q:any) => q.id === question.id));
        if (currentSection) {
            question.paper_sections_id = currentSection.id;
        }
    }
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
    await fetchSubmittedExam();

    await nextTick();
    isClient.value = true;

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
    if (!selectedQuestion.value || Object.keys(selectedQuestion.value).length === 0) {
        console.warn("NavigateToQuestion: selectedQuestion 为空，无法导航。");
        return;
    }
    const currentQuestion = selectedQuestion.value;

    let currentSectionId: string | undefined = currentQuestion.paper_sections_id || currentQuestion.section_id;

    if (!currentSectionId) {
        if (currentQuestion.questions_id && currentQuestion.questions_id.paper_sections_id) {
             currentSectionId = typeof currentQuestion.questions_id.paper_sections_id === 'object'
                ? currentQuestion.questions_id.paper_sections_id.id
                : currentQuestion.questions_id.paper_sections_id;
        } else {
             console.error("NavigateToQuestion: 无法确定当前题目/题组的 section_id。", currentQuestion);
             return;
        }
    }
    
    const currentSection = submittedPaperSections.value.find(
        (s) => s.id === currentSectionId
    );

    if (!currentSection) {
        console.error("NavigateToQuestion: 未找到当前章节，ID:", currentSectionId, "SelectedQ:", currentQuestion);
        return;
    }
    
    const isOperatingInGroupMode = currentQuestion.isGroupMode;
    const sortedSections = submittedPaperSections.value;

    const currentSectionIndex = sortedSections.findIndex(
        (s) => s.id === currentSectionId
    );

    if (isOperatingInGroupMode) {
        navigateInGroupMode(
            currentSection,
            sortedSections,
            currentSectionIndex,
            currentQuestion,
            direction
        );
    } else {
        navigateInSingleMode(
            currentSection,
            sortedSections,
            currentSectionIndex,
            currentQuestion,
            direction
        );
    }
};

const navigateInSingleMode = (
    currentSection: PaperSections,
    sortedSections: PaperSections[],
    currentSectionIndex: number,
    currentQuestion: any,
    direction: number
) => {
    const sortedSectionQuestions = currentSection.questions as any[];
    if (!sortedSectionQuestions || sortedSectionQuestions.length === 0) return;

    const currentQuestionSort = currentQuestion.sort_in_section;
    let nextQuestion;

    if (direction === 1) {
        const currentIndexInSection = sortedSectionQuestions.findIndex(q => q.id === currentQuestion.id);

        if (currentIndexInSection !== -1 && currentIndexInSection < sortedSectionQuestions.length - 1) {
            nextQuestion = sortedSectionQuestions[currentIndexInSection + 1];
        } else {
            if (currentSectionIndex < sortedSections.length - 1) {
                const nextSection = sortedSections[currentSectionIndex + 1];
                if (nextSection.question_mode === "group" && nextSection.question_groups && nextSection.question_groups.length > 0) {
                    return handleQuestionGroupClick(nextSection.question_groups[0] as any, nextSection);
                } else if (nextSection.questions && nextSection.questions.length > 0) {
                    nextQuestion = nextSection.questions[0] as any;
                }
            } else {
                nav_boundary_dialog_message.value = "当前已经是最后一题！";
                nav_boundary_dialog_visible.value = true;
                return;
            }
        }
    } else if (direction === -1) {
        const currentIndexInSection = sortedSectionQuestions.findIndex(q => q.id === currentQuestion.id);

        if (currentIndexInSection !== -1 && currentIndexInSection > 0) {
            nextQuestion = sortedSectionQuestions[currentIndexInSection - 1];
        } else {
            if (currentSectionIndex > 0) {
                const prevSection = sortedSections[currentSectionIndex - 1];
                if (prevSection.question_mode === "group" && prevSection.question_groups && prevSection.question_groups.length > 0) {
                    return handleQuestionGroupClick(prevSection.question_groups[prevSection.question_groups.length - 1] as any, prevSection);
                } else if (prevSection.questions && prevSection.questions.length > 0) {
                    nextQuestion = prevSection.questions[prevSection.questions.length - 1] as any;
                }
            } else {
                nav_boundary_dialog_message.value = "当前已经是第一题！";
                nav_boundary_dialog_visible.value = true;
                return;
            }
        }
    }

    if (nextQuestion) {
        if (!nextQuestion.paper_sections_id) {
             const sectionOfNextQ = sortedSections.find(s => s.questions && s.questions.some((q:any) => q.id === nextQuestion.id));
             if (sectionOfNextQ) nextQuestion.paper_sections_id = sectionOfNextQ.id;
        }
        selectQuestion(nextQuestion);
    }
};

const navigateInGroupMode = (
    currentSection: PaperSections,
    sortedSections: PaperSections[],
    currentSectionIndex: number,
    currentSelectedGroup: any,
    direction: number
) => {
    const sortedGroupsInSection = currentSection.question_groups as any[];
    if (!sortedGroupsInSection || sortedGroupsInSection.length === 0) return;

    const currentGroupId = currentSelectedGroup.question_groups_id.id;
    const currentIndexInSection = sortedGroupsInSection.findIndex(g => g.question_groups_id.id === currentGroupId);

    let nextGroupToSelect: any;
    let sectionForNextGroup: PaperSections = currentSection;

    if (direction === 1) {
        if (currentIndexInSection !== -1 && currentIndexInSection < sortedGroupsInSection.length - 1) {
            nextGroupToSelect = sortedGroupsInSection[currentIndexInSection + 1];
        } else {
            if (currentSectionIndex < sortedSections.length - 1) {
                const nextSectionCandidate = sortedSections[currentSectionIndex + 1];
                sectionForNextGroup = nextSectionCandidate;
                if (nextSectionCandidate.question_mode === "group" && nextSectionCandidate.question_groups && nextSectionCandidate.question_groups.length > 0) {
                    nextGroupToSelect = nextSectionCandidate.question_groups[0];
                } else if (nextSectionCandidate.questions && nextSectionCandidate.questions.length > 0) {
                    const firstSingleQ = nextSectionCandidate.questions[0] as any;
                    firstSingleQ.paper_sections_id = nextSectionCandidate.id;
                    return selectQuestion(firstSingleQ); 
                }
            } else {
                nav_boundary_dialog_message.value = "当前已经是最后一题！";
                nav_boundary_dialog_visible.value = true;
                return;
            }
        }
    } else if (direction === -1) {
        if (currentIndexInSection !== -1 && currentIndexInSection > 0) {
            nextGroupToSelect = sortedGroupsInSection[currentIndexInSection - 1];
        } else {
            if (currentSectionIndex > 0) {
                const prevSectionCandidate = sortedSections[currentSectionIndex - 1];
                sectionForNextGroup = prevSectionCandidate;
                if (prevSectionCandidate.question_mode === "group" && prevSectionCandidate.question_groups && prevSectionCandidate.question_groups.length > 0) {
                    nextGroupToSelect = prevSectionCandidate.question_groups[prevSectionCandidate.question_groups.length - 1];
                } else if (prevSectionCandidate.questions && prevSectionCandidate.questions.length > 0) {
                    const lastSingleQ = prevSectionCandidate.questions[prevSectionCandidate.questions.length - 1] as any;
                    lastSingleQ.paper_sections_id = prevSectionCandidate.id;
                    return selectQuestion(lastSingleQ);
                }
            } else {
                nav_boundary_dialog_message.value = "当前已经是第一题！";
                nav_boundary_dialog_visible.value = true;
                return;
            }
        }
    }

    if (nextGroupToSelect) {
        handleQuestionGroupClick(nextGroupToSelect, sectionForNextGroup);
    }
};

const handleQuestionGroupClick = async (groupFromSectionList: any, section: PaperSections) => {
    if (!groupFromSectionList || !groupFromSectionList.question_groups_id) {
        console.error("handleQuestionGroupClick: 无效的 group 或 group.question_groups_id", groupFromSectionList);
        return;
    }
    
    const actualQuestionGroupObject = groupFromSectionList.question_groups_id;

    const groupQuestions = (section.questions as any[]).filter(qItem => {
        if (!qItem.questions_id || !qItem.questions_id.question_group) return false;
        const qItemGroupId = qItem.questions_id.question_group.id;
        return qItemGroupId === actualQuestionGroupObject.id;
    });

    const sortedGroupQuestions = [...groupQuestions].sort((a, b) => {
        const aSort = a.questions_id.sort_in_group ?? 999;
        const bSort = b.questions_id.sort_in_group ?? 999;
        if (aSort === bSort) {
            return (a.sort_in_section || 0) - (b.sort_in_section || 0);
        }
        return aSort - bSort;
    });
    
    sortedGroupQuestions.forEach(q => q.paper_sections_id = section.id);

    const enhancedQuestion = {
        ...groupFromSectionList,
        isGroupMode: true,
        questionGroup: actualQuestionGroupObject,
        questions_id: { type: "group" }, 
        section_id: section.id,
        paper_sections_id: section.id,
        groupQuestions: sortedGroupQuestions, 
    };
    selectQuestion(enhancedQuestion);
};

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
