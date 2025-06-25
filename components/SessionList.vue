<template>
    <div>
        <div class="page-header">
            <h1 class="page-title">{{ pageTitle }}</h1>
            <p class="page-description">{{ pageDescription }}</p>
        </div>

        <div class="card exam-list-card">
            <Dialog
                v-model:visible="not_started_dialog_visible"
                modal
                header="提示"
                :style="{ width: '25rem' }"
                class="custom-dialog"
            >
                <div class="dialog-content">
                    <i class="pi pi-clock dialog-icon"></i>
                    <span class="dialog-message">未到考试开始时间！</span>
                </div>
                <div class="dialog-footer">
                    <Button
                        type="button"
                        label="确定"
                        @click="not_started_dialog_visible = false"
                        class="p-button-primary"
                    ></Button>
                </div>
            </Dialog>

            <Dialog
                v-model:visible="have_ended_dialog_visible"
                modal
                header="提示"
                :style="{ width: '25rem' }"
                class="custom-dialog"
            >
                <div class="dialog-content">
                    <i class="pi pi-exclamation-triangle dialog-icon"></i>
                    <span class="dialog-message">已过考试结束时间！</span>
                </div>
                <div class="dialog-footer">
                    <Button
                        type="button"
                        label="确定"
                        @click="have_ended_dialog_visible = false"
                        class="p-button-primary"
                    ></Button>
                </div>
            </Dialog>

            <!-- 新增：加载指示器 -->
            <div
                v-if="isLoading"
                class="session-list-loading"
            >
                <ProgressSpinner />
                <p>正在加载列表...</p>
            </div>

            <!-- 新增：错误状态 -->
            <div
                v-else-if="fetchError"
                class="error-state"
            >
                <i class="pi pi-wifi-off error-icon"></i>
                <h3>加载{{ sessionTypeText }}列表失败</h3>
                <p>{{ fetchError }}</p>
                <Button
                    @click="fetchPracticeSessions"
                    :label="'重试'"
                    icon="pi pi-refresh"
                    class="p-button-secondary"
                />
            </div>

            <DataView
                v-else
                :value="practice_sessions_ref"
                :layout="layout"
                dataKey="practice_sessions_ref.id"
                class="exam-data-view"
            >
                <template #header>
                    <div class="data-view-header">
                        <div class="view-options">
                            <span class="view-label">视图：</span>
                            <SelectButton
                                v-model="layout"
                                :options="options"
                                :allowEmpty="false"
                                class="view-selector"
                            >
                                <template #option="{ option }">
                                    <i
                                        :class="[
                                            option === 'list'
                                                ? 'pi pi-bars'
                                                : 'pi pi-table',
                                        ]"
                                    />
                                </template>
                            </SelectButton>
                        </div>
                    </div>
                </template>

                <template #list="slotProps">
                    <div class="exam-list-view">
                        <div
                            v-for="(item, index) in slotProps.items"
                            :key="index"
                            class="exam-item"
                        >
                            <div
                                class="exam-item-content"
                                :class="{
                                    'border-top': index !== 0,
                                }"
                            >
                                <div class="exam-status">
                                    <Tag
                                        :value="getSubmitStatusName(item)"
                                        :severity="getSubmitStatus(item)"
                                        class="status-tag"
                                    ></Tag>
                                </div>

                                <div class="exam-details">
                                    <div class="exam-info">
                                        <div class="exam-title">
                                            {{
                                                item.exercises_students_id__exercises_id__title
                                            }}
                                        </div>

                                        <div class="exam-time-info">
                                            <div class="time-item">
                                                <i class="pi pi-calendar"></i>
                                                <span>
                                                    <strong>开始：</strong>
                                                    {{
                                                        formatDateTime(
                                                            item.exercises_students_id__exercises_id__start_time
                                                        )
                                                    }}
                                                </span>
                                            </div>
                                            <div class="time-item">
                                                <i
                                                    class="pi pi-calendar-times"
                                                ></i>
                                                <span>
                                                    <strong>结束：</strong>
                                                    {{
                                                        formatDateTime(
                                                            item.exercises_students_id__exercises_id__end_time
                                                        )
                                                    }}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="exam-actions">
                                        <span class="exam-duration">
                                            <i class="pi pi-clock"></i>
                                            {{ sessionTypeText }}时长：
                                            <div>
                                                {{
                                                    item.exercises_students_id__exercises_id__duration
                                                }}分钟
                                            </div>
                                        </span>
                                        <div class="action-buttons">
                                            <Button
                                                @click="reviewSession(item.id)"
                                                icon="pi pi-info-circle"
                                                outlined
                                                class="p-button-info review-button"
                                                v-tooltip.top="'查看详情'"
                                            ></Button>
                                            <Button
                                                @click="joinSession(item.id)"
                                                class="join-button"
                                                :disabled="
                                                    getSubmitStatusName(item) ==
                                                    '已交卷'
                                                "
                                                :class="{
                                                    'p-button-success':
                                                        getSubmitStatusName(
                                                            item
                                                        ) == '未答题',
                                                }"
                                            >
                                                <i class="pi pi-play"></i>
                                                {{
                                                    getSubmitStatusAction(item)
                                                }}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>

                <template #grid="slotProps">
                    <div class="exam-grid-view">
                        <div
                            v-for="(item, index) in slotProps.items"
                            :key="index"
                            class="exam-card"
                            ref="gridItems"
                        >
                            <div class="exam-card-content">
                                <div class="exam-card-header">
                                    <div class="exam-card-title">
                                        {{
                                            item.exercises_students_id__exercises_id__title
                                        }}
                                    </div>
                                    <Tag
                                        :value="getSubmitStatusName(item)"
                                        :severity="getSubmitStatus(item)"
                                        class="status-tag"
                                    ></Tag>
                                </div>

                                <div class="exam-card-body">
                                    <div class="time-item">
                                        <i class="pi pi-calendar"></i>
                                        <div>
                                            <strong>开始时间：</strong>
                                            <div>
                                                {{
                                                    formatDateTime(
                                                        item.exercises_students_id__exercises_id__start_time
                                                    )
                                                }}
                                            </div>
                                        </div>
                                    </div>

                                    <div class="time-item">
                                        <i class="pi pi-calendar-times"></i>
                                        <div>
                                            <strong>结束时间：</strong>
                                            <div>
                                                {{
                                                    formatDateTime(
                                                        item.exercises_students_id__exercises_id__end_time
                                                    )
                                                }}
                                            </div>
                                        </div>
                                    </div>

                                    <div class="time-item">
                                        <i class="pi pi-clock"></i>
                                        <div>
                                            <strong
                                                >{{
                                                    sessionTypeText
                                                }}时长：</strong
                                            >
                                            <div>
                                                {{
                                                    item.exercises_students_id__exercises_id__duration
                                                }}分钟
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="exam-card-footer">
                                    <Button
                                        :key="item.id"
                                        @click="joinSession(item.id)"
                                        class="join-button"
                                        :disabled="
                                            getSubmitStatusName(item) ==
                                            '已交卷'
                                        "
                                        :class="{
                                            'p-button-success':
                                                getSubmitStatusName(item) ==
                                                '未答题',
                                        }"
                                    >
                                        <i class="pi pi-play"></i>
                                        {{ getSubmitStatusAction(item) }}
                                    </Button>
                                    <Button
                                        @click="reviewSession(item.id)"
                                        icon="pi pi-info-circle"
                                        outlined
                                        class="p-button-info review-button"
                                        v-tooltip.top="'查看详情'"
                                    ></Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>

                <template #empty>
                    <div class="empty-state">
                        <i class="pi pi-search empty-icon"></i>
                        <h3>暂无{{ sessionTypeText }}</h3>
                        <p>您当前没有可参加的{{ sessionTypeText }}</p>
                    </div>
                </template>
            </DataView>
        </div>
    </div>
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import { useAuth } from "~~/stores/auth";
import type {
    PracticeSessions,
    Exercises,
    ExercisesStudents,
} from "~~/types/directus_types";
import type { HintedString } from "@primevue/core";
import { number } from "zod";

const props = defineProps({
    mode: {
        type: String,
        required: true,
        validator: (value: string) => ["exam", "practice"].includes(value),
    },
});

type flatPracticeSession_type = {
    id: string;
    title: string | null;
    extra_time: number;
    actual_end_time: string | null;
    actual_start_time: string | null;
    submit_status: string;
    score: number;
    expected_end_time: string | null;
    exercises_students_id__exercises_id__title: string | null;
    exercises_students_id__exercises_id__mode: string | null;
    exercises_students_id__exercises_id__start_time: string | null;
    exercises_students_id__exercises_id__end_time: string | null;
    exercises_students_id__exercises_id__duration: number | null;
    exercises_students_id__exercises_id__paper: string | null;
    exercises_students_id__students_id__directus_user: string | null;
    exercises_students_id__students_id__name: string | null;
    exercises_students_id__students_id__number: number;
    exercises_students_id__students_id__email: string | null;
    exercises_students_id__students_id__class: string | null;
};

const config = useRuntimeConfig();

// console.log("props.mode:", props.mode);

// 根据模式设置页面标题和其他文本
const pageTitle = computed(() =>
    props.mode === "exam" ? "考试中心" : "练习中心"
);
const pageDescription = computed(() =>
    props.mode === "exam"
        ? "这里列出了您可以参加的所有考试"
        : "这里列出了您可以进行的所有练习"
);
const sessionTypeText = computed(() =>
    props.mode === "exam" ? "考试" : "练习"
);

// 如果使用 useRouter，需要引入并使用
const router = useRouter();

const gridItems = ref([]);
// const practice_sessions_ref = ref<PracticeSessions[]>([]);
const practice_sessions_ref = ref<flatPracticeSession_type[]>([]);
// 注意这里practice_sessions的相关数据被我扁平化处理了，所以不能用已有的type。
// 以后考虑专门写个type给它。
const auth = useAuth();
const current_user = auth.user; // 获取当前用户

// 这两个控制能否参加考试的弹窗
const not_started_dialog_visible = ref(false);
const have_ended_dialog_visible = ref(false);

const layout = ref<"grid" | "list" | undefined>("grid"); // 默认显示为网格
const options = ref(["list", "grid"]);

// state
const isLoading = ref(true); // 新增：加载状态
const fetchError = ref<string | null>(null); // 新增：用于跟踪和显示获取数据时的错误

const fetchPracticeSessions = async () => {
    isLoading.value = true;
    fetchError.value = null; // 重置错误状态
    const maxRetries = 8;
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            if (!current_user?.id) {
                console.error("用户未登录，无法获取会话列表。");
                practice_sessions_ref.value = [];
                isLoading.value = false; // 结束加载
                return;
            }
            const user_ps: any = await $fetch(
                `/fetch-user-ps-cache-endpoint/by-user/${current_user.id}`,
                {
                    baseURL: config.public.directus.url,
                }
            );
            const practice_session_id_list: string[] =
                user_ps["practiceSessionIds"];

            if (
                !practice_session_id_list ||
                practice_session_id_list.length === 0
            ) {
                practice_sessions_ref.value = [];
                isLoading.value = false; // 结束加载
                return;
            }

            const practice_sessions: Record<string, flatPracticeSession_type> =
                await $fetch(`/fetch-practice-session-info-endpoint/batch`, {
                    baseURL: config.public.directus.url,
                    method: "POST",
                    body: {
                        practice_session_ids: practice_session_id_list,
                    },
                });
            const practiceSessionListOrdered: Array<flatPracticeSession_type> =
                practice_session_id_list
                    .map((id) => {
                        return practice_sessions[id] || null; // 如果映射中没有某个id（例如请求了但未返回），则设为null
                    })
                    .filter((ps): ps is flatPracticeSession_type => ps !== null); // 过滤掉null的项

            console.log("practiceSessionListOrdered:");
            console.log(practiceSessionListOrdered);

            practice_sessions_ref.value = practiceSessionListOrdered;
            isLoading.value = false; // 成功，结束加载
            return; // 成功获取，退出循环
        } catch (error) {
            attempt++;
            console.error(`获取会话列表第 ${attempt} 次尝试失败:`, error);

            if (attempt >= maxRetries) {
                fetchError.value = "无法连接到服务器，请检查您的网络。";
                practice_sessions_ref.value = []; // 清空列表
                break; // 退出循环
            }
            // Exponential backoff
            const delayTime = Math.pow(2, attempt - 1) * 1000;
            console.log(`将在 ${delayTime / 1000}s 后重试...`);
            await delay(delayTime);
        }
    }
    isLoading.value = false; // 所有重试失败后，结束加载
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 格式化日期时间
const formatDateTime = (dateTime: any) => {
    return dayjs(dateTime).format("YYYY-MM-DD HH:mm");
};

const joinSession = (sessionId: string) => {
    const now_time = dayjs();
    const session_info = practice_sessions_ref.value.find(
        (item) => item.id === sessionId
    );
    console.log("session_info:", session_info);

    if (!session_info) {
        console.error("[SessionList] Session not found with id:", sessionId);
        return;
    }

    const session_start_time = dayjs(
        session_info["exercises_students_id__exercises_id__start_time"]
    );
    const session_end_time = dayjs(
        session_info["exercises_students_id__exercises_id__end_time"]
    );

    //  仅对考试模式检查严格时间，练习模式可以更灵活
    if (props.mode === "exam") {
        if (now_time.isBefore(session_start_time)) {
            not_started_dialog_visible.value = true;
            return;
        }

        if (now_time.isAfter(session_end_time)) {
            have_ended_dialog_visible.value = true;
            return;
        }
    }

    // 直接导航，不再进行状态更新
    router.push(`/exam/${sessionId}`);
};

const reviewSession = (sessionId: string) => {
    router.push(`/review/${sessionId}`);
};

const getSubmitStatus = (
    practice_session: PracticeSessions
):
    | HintedString<
          "secondary" | "success" | "info" | "warn" | "danger" | "contrast"
      >
    | undefined => {
    switch (practice_session.submit_status) {
        case "done":
            return "success";

        case "doing":
            return "warn";

        case "todo":
            return "danger";

        default:
            return "info";
    }
};

const getSubmitStatusName = (practice_session: PracticeSessions) => {
    switch (practice_session.submit_status) {
        case "done":
            return "已交卷";

        case "doing":
            return "答题中";

        case "todo":
            return "未答题";

        default:
            return null;
    }
};

const getSubmitStatusAction = (practice_session: PracticeSessions) => {
    switch (practice_session.submit_status) {
        case "done":
            return "答题完成";

        case "doing":
            return "继续答题";

        case "todo":
            return "开始答题";

        default:
            return null;
    }
};

onMounted(() => {
    fetchPracticeSessions();
});
</script>

<style scoped>
.page-header {
    margin-bottom: 2rem;
    padding: 1rem;
    background-color: var(--surface-a);
    border-radius: var(--border-radius);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-title {
    font-size: 1.75rem;
    font-weight: 600;
    color: #2a4b8d;
    margin: 0 0 0.5rem 0;
}

.page-description {
    color: #666;
    margin: 0;
}

.exam-list-card {
    background-color: transparent;
    box-shadow: none;
    border: none;
    padding: 0;
}

/* DataView容器样式 */
.exam-data-view {
    margin: 0.5rem 0 1rem 0; /* 减少顶部间距 */
}

.exam-data-view :deep(.p-dataview-content) {
    padding: 1.5rem;
    background-color: var(--surface-0);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border: 1px solid var(--surface-300);
}

.data-view-header {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 1rem;
    background-color: #ffffff; /* 替换 var(--surface-0) */
    padding: 1rem 1.5rem;
    border-radius: 8px 8px 0 0;
    border: 1px solid #e5e7eb; /* 替换 var(--surface-200) */
    border-bottom: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.view-options {
    display: flex;
    align-items: center;
}

.view-label {
    margin-right: 0.5rem;
    color: #666;
}

.view-selector :deep(.p-selectbutton) {
    border-radius: 4px;
    overflow: hidden;
}

/* 列表视图样式 */
.exam-list-view {
    display: flex;
    flex-direction: column;
    gap: 1.25rem; /* 增加列表项之间的间距 */
}

.exam-item {
    margin-bottom: 0; /* 移除底部外边距，因为已经有gap了 */
}

.exam-item-content {
    display: flex;
    flex-direction: column;
    background-color: #f9fafb; /* 替换 var(--surface-50) */
    border-radius: 8px;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
    padding: 1.5rem;
    transition: transform 0.2s, box-shadow 0.2s;
    border: 1px solid #e5e7eb; /* 替换 var(--surface-200) */
}

.exam-item-content:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
    background-color: #ffffff; /* 纯白背景，增强悬停效果 */
    border-color: var(--primary-color-lighter, #c7d8f7);
}

.border-top {
    border-top: 1px solid #f0f0f0;
}

.exam-status {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 0.75rem;
}

.status-tag {
    font-weight: 500;
}

.exam-details {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

@media (min-width: 768px) {
    .exam-details {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }
}

.exam-info {
    flex: 1;
}

.exam-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #333;
    margin-bottom: 1rem;
}

.exam-time-info {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

@media (min-width: 640px) {
    .exam-time-info {
        flex-direction: row;
        gap: 1.5rem;
    }
}

.time-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #666;
}

.time-item i {
    color: var(--primary-color);
}

.exam-actions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.exam-duration {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    color: #555;
}

.action-buttons {
    display: flex;
    gap: 0.75rem;
}

.join-button,
.review-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.join-button {
    flex: 1;
}

/* 网格视图样式 */
.exam-grid-view {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    padding: 0.5rem;
}

.exam-card {
    height: 100%;
}

.exam-card-content {
    background-color: #f9fafb; /* 替换 var(--surface-50) */
    border-radius: 8px;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
    padding: 1.5rem;
    height: 100%;
    display: flex;
    flex-direction: column;
    transition: transform 0.2s, box-shadow 0.2s;
    border: 1px solid #e5e7eb; /* 替换 var(--surface-200) */
}

.exam-card-content:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    background-color: #ffffff; /* 纯白背景，增强悬停效果 */
    border-color: var(--primary-color-lighter, #c7d8f7);
}

.exam-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.25rem;
}

.exam-card-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #333;
    flex: 1;
    margin-right: 1rem;
}

.exam-card-body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex: 1;
}

.exam-card-footer {
    display: flex;
    gap: 0.75rem;
    margin-top: auto;
}

.exam-card-footer .join-button {
    flex: 1;
}

/* 空状态 */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 0;
    color: #888;
    text-align: center;
}

.empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: #ddd;
}

.empty-state h3 {
    font-size: 1.25rem;
    margin: 0 0 0.5rem 0;
    color: #555;
}

.empty-state p {
    margin: 0;
}

/* 新增: 错误状态样式 */
.error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 0;
    text-align: center;
    color: var(--text-color-secondary);
    background-color: var(--surface-ground);
    border-radius: var(--border-radius);
}

.error-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: var(--yellow-500);
}

.error-state h3 {
    font-size: 1.25rem;
    margin: 0 0 0.5rem 0;
    color: var(--text-color);
}

.error-state p {
    margin: 0 0 1.5rem 0;
}

/* 深色模式适配 */
:deep(.dark-mode) .exam-item-content,
:deep(.dark-mode) .exam-card-content {
    background-color: #374151; /* 替换 var(--surface-700) */
    border-color: #4b5563; /* 替换 var(--surface-600) */
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
}

:deep(.dark-mode) .exam-item-content:hover,
:deep(.dark-mode) .exam-card-content:hover {
    background-color: #4b5563; /* 替换 var(--surface-600) */
    border-color: var(--primary-300, #90caf9);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

:deep(.dark-mode) .page-title {
    color: #ffffff; /* 替换 var(--surface-0) */
}

:deep(.dark-mode) .page-description {
    color: #e5e7eb; /* 替换 var(--surface-200) */
}

:deep(.dark-mode) .exam-title,
:deep(.dark-mode) .exam-card-title {
    color: #ffffff; /* 替换 var(--surface-0) */
}

:deep(.dark-mode) .time-item,
:deep(.dark-mode) .exam-duration {
    color: #e5e7eb; /* 替换 var(--surface-200) */
}

:deep(.dark-mode) .border-top {
    border-color: #374151; /* 替换 var(--surface-700) */
}

.custom-dialog .dialog-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem 0;
}

.dialog-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: var(--primary-color);
}

.dialog-message {
    font-size: 1.1rem;
    text-align: center;
    color: #333;
}

.dialog-footer {
    display: flex;
    justify-content: center;
    padding-top: 1rem;
}

.session-list-loading {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 300px; /* 确保加载动画有足够空间 */
    text-align: center;
}
.session-list-loading p {
    margin-top: 1rem;
    font-size: 1.2rem;
    color: var(--text-color-secondary);
}
</style>
