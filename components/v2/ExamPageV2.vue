<template>
    <div class="exam-page-v2">
        <!-- 顶部信息栏 -->
        <ExamHeaderV2
            :exam_page_mode="exam_page_mode"
            :practiceSession="practiceSession"
            :paper="paper"
            :formattedCountDown="formattedCountdown"
            :studentData="{
                name: userData.name,
                student_number: userData.student_number,
            }"
            @submit="manualSubmit"
        />

        <!-- 题目区域 -->
        <div v-if="isLoading" class="loading-container">
            <ProgressSpinner />
            <p>正在加载试卷，请稍候...</p>
        </div>
        <div v-else class="main-content">
            <!-- 左侧：题目列表 -->
            <QuestionListV2
                class="question-list-panel"
                :submittedPaperSections="submittedPaperSections"
                :selectedQuestion="selectedQuestion"
                :selectQuestion="selectQuestion"
                :questionResults="questionResults"
            />

            <!-- 右侧：题目详情和答题区 -->
            <div class="question-detail-panel">
                 <QuestionDetailV2
                    :exam_page_mode="exam_page_mode"
                    :selectedQuestion="selectedQuestion"
                    :practiceSessionId="practice_session_id"
                    :questionResults="questionResults"
                    @navigate-question="navigateToQuestion"
                />
            </div>
        </div>

        <!-- 对话框区域 -->
        <template v-if="exam_page_mode !== 'review'">
            <Dialog v-model:visible="final_submission_dialog_visible" modal header="提示" @hide="exitExam()" :style="{ width: '25rem' }">
                <span class="text-surface-500 dark:text-surface-400 block mb-8">您已交卷，即将退出考试！</span>
                <div class="flex justify-end gap-2">
                    <Button type="button" label="确定" @click="exitExam()"></Button>
                </div>
            </Dialog>

            <Dialog v-model:visible="confirm_submit_dialog_visible" modal header="警告" :style="{ width: '25rem' }">
                <span class="text-surface-500 dark:text-surface-400 block mb-8">确认提交试卷吗？</span>
                <div class="flex justify-end gap-2">
                    <Button type="button" label="取消交卷" severity="secondary" @click="confirm_submit_dialog_visible = false" class="mr-2"></Button>
                    <Button type="button" label="确定交卷" severity="danger" @click="confirmSubmit()"></Button>
                </div>
            </Dialog>

            <Dialog v-model:visible="nav_boundary_dialog_visible" modal header="提示" :style="{ width: '25rem' }">
                <span class="text-surface-500 dark:text-surface-400 block mb-8">{{ nav_boundary_dialog_message }}</span>
                <div class="flex justify-end gap-2">
                    <Button type="button" label="确定" @click="nav_boundary_dialog_visible = false"></Button>
                </div>
            </Dialog>
        </template>
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
import { useQuestionNavigation } from "@/composables/useQuestionNavigation";

// V2 Components
import ExamHeaderV2 from '@/components/v2/ExamHeaderV2.vue';
import QuestionListV2 from '@/components/v2/QuestionListV2.vue';
import QuestionDetailV2 from '@/components/v2/QuestionDetailV2.vue';


const config = useRuntimeConfig();

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

// 路由参数：practice_session 的 ID
const route = useRoute();

// 统一解析 practice_session_id
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
    isLoading,
} = useExamData();

// selectedQuestion 仍然在 ExamPage.vue 中管理
const selectedQuestion = ref({} as any);

// 提前调用 loadExamData
loadExamData(practice_session_id, props.exam_page_mode, selectedQuestion);

const {
    navBoundaryDialogVisible: nav_boundary_dialog_visible,
    navBoundaryMessage: nav_boundary_dialog_message,
    navigateToQuestion,
    handleQuestionGroupClick
} = useQuestionNavigation(submittedPaperSections, selectedQuestion);


// 监听从 useExamData 返回的 timerInitParams
watch(timerInitParams, (params) => {
    if (params && params.actualStartISO) {
        initializeTimer(params.actualStartISO, params.durationMins, params.extraMins);
    }
}, { immediate: false });

// 监听交卷对话框状态
watch(shouldShowFinalSubmissionDialog, (showDialog) => {
    if (showDialog) {
        final_submission_dialog_visible.value = true;
    }
});

// 用户信息
const userData = computed(() => {
    const defaultData = {
        name: "考生",
        student_number: 0,
    };

    if (!practiceSession.value) return defaultData;
    
    return {
        name: practiceSession?.value["exercises_students_id__students_id__name"] || "考生",
        student_number: practiceSession.value["exercises_students_id__students_id__number"] || 0,
    };
});

const selectQuestion = (question: any) => {
    selectedQuestion.value = question;
};

const updateSubmitStatus = async (current_practice_session_id: string) => {
    try {
        const itemToUpdate = {
            actual_end_time: dayjs().toISOString(),
            submit_status: "done" as const,
        };
        await $fetch(
            `${config.public.directus.url}/update-practice-session-info-endpoint/${current_practice_session_id}`,
            { method: 'PATCH', body: itemToUpdate }
        );
    } catch (e) {
        console.error("更新提交状态失败:", e);
    }
};

const submitExam = async (examId_to_submit: string) => {
    if (practiceSession.value.submit_status === "done" && props.exam_page_mode !== "review") {
        return;
    }
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
        if (!final_submission_dialog_visible.value && practiceSession.value.submit_status !== "done") {
            await submitExam(practice_session_id);
            final_submission_dialog_visible.value = true;
        }
    }
});

onMounted(() => {
    const loadingStateStore = useLoadingStateStore();
    if (!loadingStateStore.checkComponentReady("examPageV2")) {
        loadingStateStore.setComponentReady("examPageV2");
    }
});

</script>

<style scoped>
.exam-page-v2 {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    background-color: var(--surface-ground);
    color: var(--text-color);
}

.loading-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    flex: 1;
}

.loading-container p {
    margin-top: 1rem;
    font-size: 1.2rem;
}

.main-content {
    display: flex;
    flex: 1;
    overflow: hidden;
    padding: 1rem;
    gap: 1rem;
}

.question-list-panel {
    width: 320px;
    min-width: 280px;
    max-width: 450px;
    resize: horizontal;
    overflow: auto;
    height: 100%;
    background-color: var(--surface-card);
    border-radius: var(--border-radius);
    border: 1px solid var(--surface-border);
}

.question-detail-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--surface-card);
    border-radius: var(--border-radius);
    border: 1px solid var(--surface-border);
    overflow: hidden;
}

@media screen and (max-width: 768px) {
    .main-content {
        flex-direction: column;
        padding: 0.5rem;
        gap: 0.5rem;
    }
    .question-list-panel {
        width: 100%;
        max-width: 100%;
        height: 40vh;
        resize: none;
    }
    .question-detail-panel {
        height: 60vh;
    }
}
</style> 