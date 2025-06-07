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
import { useQuestionNavigation } from "@/composables/useQuestionNavigation";

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

const sidebarCollapsed = ref(false);
const sidebarWidth = ref(300);

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

// 提前调用 loadExamData
loadExamData(practice_session_id, props.exam_page_mode, selectedQuestion);

const {
    navBoundaryDialogVisible: nav_boundary_dialog_visible,
    navBoundaryMessage: nav_boundary_dialog_message,
    navigateToQuestion,
    handleQuestionGroupClick
} = useQuestionNavigation(submittedPaperSections, selectedQuestion);

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

    if (!practiceSession.value) return defaultData;

    console.log("practiceSession.value");
    console.log(practiceSession.value);
    
    return {
        name: practiceSession?.value["exercises_students_id__students_id__name"] || "考生",
        student_number: practiceSession.value["exercises_students_id__students_id__number"] || 0,
        email: practiceSession.value["exercises_students_id__students_id__email"] || "",
        className: (practiceSession.value["exercises_students_id__students_id__classes_id"] as Classes)?.name || "",
    };
});

const selectQuestion = (question: any) => {
    selectedQuestion.value = question;
};


const updateSubmitStatus = async (current_practice_session_id: string) => {
    try {
        const itemToUpdate = {
            actual_end_time: dayjs().toISOString(),
            submit_status: "done" as const, // TypeScript const assertion
        };
        
        const updatedFields = await $fetch(
            `${config.public.directus.url}/update-practice-session-info-endpoint/${current_practice_session_id}`,
            {
                method: 'PATCH',
                body: itemToUpdate,
                // query params for controlling response fields, if your endpoint supports it
                // params: {
                //   fields: 'id,actual_start_time,submit_status' 
                // }
            }
        );
        
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
    // 确保在客户端环境下并且计时器未启动时才执行
    if (isClient.value && !currentTimeInterval_local.value) {
        updateCurrentTime_local();
        currentTimeInterval_local.value = setInterval(
            updateCurrentTime_local,
            1000
        );
    }
};

// 监听 practiceSession 的变化，以便在数据加载完成后启动本地时间更新
watch(practiceSession, (currentPracticeSession) => {
    if (currentPracticeSession && currentPracticeSession.id && isClient.value && !currentTimeInterval_local.value) {
        // 仅当考试未完成或为复习模式时启动
        if (
            currentPracticeSession.submit_status !== "done" ||
            props.exam_page_mode === "review"
        ) {
            startCurrentTimeUpdate_local();
        }
    }
}, { deep: true });

onMounted(async () => {
    // loadExamData 已移至 setup 顶部

    await nextTick(); // 确保 DOM 更新完成
    isClient.value = true;

    // 在组件挂载后，如果 practiceSession 数据已存在 (可能由提前的 loadExamData 加载)
    // 并且满足条件，则尝试启动本地时间更新。
    // watch 会处理 practiceSession 数据在 isClient.value 变为 true 后才可用的情况。
    if (practiceSession.value && practiceSession.value.id && !currentTimeInterval_local.value) {
        if (
            practiceSession.value.submit_status !== "done" ||
            props.exam_page_mode === "review"
        ) {
            startCurrentTimeUpdate_local();
        }
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
