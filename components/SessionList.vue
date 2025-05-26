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

            <DataView
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
                                                item.exercises_students_id
                                                    .exercises_id.title
                                            }}
                                        </div>

                                        <div class="exam-time-info">
                                            <div class="time-item">
                                                <i class="pi pi-calendar"></i>
                                                <span>
                                                    <strong>开始：</strong>
                                                    {{
                                                        formatDateTime(
                                                            item
                                                                .exercises_students_id
                                                                .exercises_id
                                                                .start_time
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
                                                            item
                                                                .exercises_students_id
                                                                .exercises_id
                                                                .end_time
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
                                                    item.exercises_students_id
                                                        .exercises_id.duration
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
                                            item.exercises_students_id
                                                .exercises_id.title
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
                                                        item
                                                            .exercises_students_id
                                                            .exercises_id
                                                            .start_time
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
                                                        item
                                                            .exercises_students_id
                                                            .exercises_id
                                                            .end_time
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
                                                    item.exercises_students_id
                                                        .exercises_id.duration
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

const props = defineProps({
    mode: {
        type: String,
        required: true,
        validator: (value: string) => ["exam", "practice"].includes(value),
    },
});

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
const practice_sessions_ref = ref<PracticeSessions[]>([]);
const auth = useAuth();
const current_user = auth.user; // 获取当前用户

// 这两个控制能否参加考试的弹窗
const not_started_dialog_visible = ref(false);
const have_ended_dialog_visible = ref(false);

const { getItems, updateItem } = useDirectusItems();

const layout = ref<"grid" | "list" | undefined>("grid"); // 默认显示为网格
const options = ref(["list", "grid"]);

const fetchPracticeSessions = async () => {
    const practice_sessions = await getItems<PracticeSessions>({
        collection: "practice_sessions",
        params: {
            fields: [
                "id",
                "title",
                "exercises_students_id.exercises_id.title",
                "exercises_students_id.exercises_id.mode",
                "exercises_students_id.exercises_id.start_time",
                "exercises_students_id.exercises_id.end_time",
                "exercises_students_id.exercises_id.duration",
                "extra_time",
                "actual_end_time",
                "actual_start_time",
                "submit_status",
                "exercises_students_id.students_id.directus_user",
            ],
            filter: {
                _and: [
                    {
                        exercises_students_id: {
                            students_id: {
                                directus_user: {
                                    _eq: current_user!.id,
                                },
                            },
                        },
                    },
                    {
                        exercises_students_id: {
                            exercises_id: {
                                mode: {
                                    _eq: props.mode,
                                },
                            },
                        },
                    },
                ],
            },
        },
    });
    practice_sessions_ref.value = practice_sessions;
};

const updateSubmitStatus = async (practice_session: PracticeSessions) => {
    try {
        const newItem = { submit_status: "doing" };
        await updateItem<PracticeSessions>({
            collection: "practice_sessions",
            id: practice_session.id,
            item: newItem,
        });
    } catch (e) {}
};

const submitActualStartTime = async (practice_session: PracticeSessions) => {
    try {
        let nowData = dayjs();
        const newItem = { actual_start_time: nowData };
        await updateItem<PracticeSessions>({
            collection: "practice_sessions",
            id: practice_session.id,
            item: newItem,
        });
    } catch (e) {}
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 格式化日期时间
const formatDateTime = (dateTime: any) => {
    return dayjs(dateTime).format("YYYY-MM-DD HH:mm");
};

const joinSession = async (sessionId: string) => {
    // 首先判断考试/练习时间
    // console.log("当前时间：");
    // console.log(dayjs(Date.now()));
    const now_time = dayjs(Date.now());

    const session_info: PracticeSessions = practice_sessions_ref.value.find(
        (item) => item.id === sessionId
    )!;

    // 注意因为session可能是字符串或对象，要用"as"来断言类型
    // console.log("开始时间：");
    const session_start_time = dayjs(
        (
            (session_info.exercises_students_id! as ExercisesStudents)
                .exercises_id as Exercises
        ).start_time
    );
    // console.log(session_start_time);

    // console.log("结束时间：");
    const session_end_time = dayjs(
        (
            (session_info.exercises_students_id! as ExercisesStudents)
                .exercises_id as Exercises
        ).end_time
    );
    // console.log(
    //     dayjs(
    //         (
    //             (session_info.exercises_students_id! as ExercisesStudents)
    //                 .exercises_id as Exercises
    //         ).end_time
    //     )
    // );

    if (now_time.isBefore(session_start_time)) {
        not_started_dialog_visible.value = true;
        // console.log("未到开始时间！");

        return;
    }

    if (now_time.isAfter(session_end_time)) {
        have_ended_dialog_visible.value = true;
        // console.log("已过结束时间！");

        return;
    }

    // console.log(`参加${sessionTypeText.value}：${sessionId}`);
    // 参加考试/练习之后，需要修改submit_status为doing。
    updateSubmitStatus(
        practice_sessions_ref.value.find((item) => item.id === sessionId)!
    );

    // 只有第一次才记录实际开始时间，以后就不再记录了。
    if (session_info.actual_start_time === null) {
        submitActualStartTime(
            practice_sessions_ref.value.find((item) => item.id === sessionId)!
        );
    }
    // CAUTION: 注意
    // 在更新"实际开始时间"后，要等后台directus根据它和"时长"计算出"实际结束时间"，
    // 并更新到数据库中，此时页面去获取信息才能确保后续endTime不是null。
    // 解决方法：要在加载Page时确保expected_end_time字段不为空。

    // 跳转到具体的页面
    router.push(`/exam/${sessionId}`);
    // 跳转到具体的页面，页面path的最后一项就是practice_sessions的id。
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

// 获取环境变量，确定是否运行测试

onMounted(async () => {
    await fetchPracticeSessions(); // 注意要await！确保PracticeSessions.value已经被赋值
});
</script>

<style scoped>
.page-header {
    margin-bottom: 1.5rem;
    padding-top: 0.5rem; /* 减少顶部留白 */
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
</style>
