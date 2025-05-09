<!-- components/QuestionGroupContent.vue -->
<template>
    <div class="question-group-content">
        <!-- 自适应布局容器：电脑端左右布局，手机端上下布局 -->
        <div class="flex flex-col lg:flex-row gap-4 group-container">
            <!-- 公共题干区域 - 可收缩和拖拽调整宽度 -->

            <div
                v-if="questionGroup && questionGroup.shared_stem"
                class="shared-stem-container"
                :class="{
                    'lg:w-10': isStemCollapsed,
                    'h-auto': !isStemCollapsed || isMobile,
                    'h-10': isStemCollapsed && !isMobile,
                }"
                :style="!isStemCollapsed ? { width: stemWidth + 'px' } : {}"
            >
                <!-- 收缩按钮 - 电脑端展开和收缩都显示按钮 -->
                <div v-if="!isMobile" class="desktop-toggle-button-container">
                    <Button
                        :icon="
                            isStemCollapsed
                                ? 'pi pi-chevron-right'
                                : 'pi pi-chevron-left'
                        "
                        class="p-button-rounded p-button-text stem-toggle-btn"
                        @click="toggleStem"
                        :aria-label="
                            isStemCollapsed ? '展开公共题干' : '收起公共题干'
                        "
                    />
                </div>

                <!-- 收缩按钮 - 移动端显示上下按钮 -->
                <Button
                    v-if="isMobile"
                    :icon="
                        isStemCollapsed
                            ? 'pi pi-chevron-down'
                            : 'pi pi-chevron-up'
                    "
                    class="p-button-rounded p-button-text stem-toggle-btn-mobile"
                    @click="toggleStem"
                    :aria-label="
                        isStemCollapsed ? '展开公共题干' : '收起公共题干'
                    "
                />

                <!-- 公共题干内容区域 - 独立滚动 -->

                <div
                    v-if="!isStemCollapsed"
                    class="shared-stem-content p-3 bg-surface-100 dark:bg-surface-700 rounded-lg flex-1"
                >
                    <ScrollPanel
                        style="width: 100%; height: 100%"
                        :pt="{
                            wrapper: {
                                style: {
                                    'border-right':
                                        '10px solid red',
                                },
                            },
                            bary: 'hover:bg-primary-400 bg-primary-300 opacity-100',
                        }"
                    >
                        <div class="text-lg font-medium mb-2 stem-title">
                            题组题干：
                        </div>
                        <div class="stem-scroll-container">
                            <div
                                v-html="
                                    renderMarkdown(questionGroup.shared_stem)
                                "
                                class="markdown-content"
                            ></div>
                        </div>
                    </ScrollPanel>
                </div>

                <!-- 拖拽调整宽度的分隔线 -->
                <div
                    v-if="!isStemCollapsed && !isMobile"
                    class="stem-resizer"
                    @mousedown="startStemResize"
                ></div>
            </div>

            <!-- 题目列表区域 - 独立滚动 -->
            <div
                class="group-questions"
                :class="{
                    'lg:flex-1':
                        !questionGroup ||
                        !questionGroup.shared_stem ||
                        isStemCollapsed,
                }"
            >
                <ScrollPanel style="width: 100%" class="custom-scrollbar">
                    <div class="questions-scroll-container">
                        <div
                            v-if="groupQuestions.length > 0"
                            class="questions-content"
                        >
                            <template
                                v-for="(questionItem, index) in groupQuestions"
                                :key="questionItem.id"
                            >
                                <div
                                    class="question-item mb-4 border-l-4 pl-4"
                                    :class="
                                        getQuestionBorderClass(questionItem)
                                    "
                                >
                                    <div
                                        class="question-header flex justify-between items-center mb-2"
                                    >
                                        <h3 class="text-lg font-medium">
                                            （{{ index + 1 }}）<span class="text-sm font-normal text-gray-500 dark:text-gray-400 mr-1">[{{ getQuestionTypeLabel(questionItem.questions_id.type) }}]</span> {{
                                                questionItem.questions_id.title
                                            }}
                                        </h3>
                                        <div class="flex items-center gap-2">
                                            <Button
                                                :icon="
                                                    isQuestionFlagged(
                                                        questionItem
                                                    )
                                                        ? 'pi pi-flag-fill'
                                                        : 'pi pi-flag'
                                                "
                                                :class="{
                                                    'p-button-danger':
                                                        isQuestionFlagged(
                                                            questionItem
                                                        ),
                                                }"
                                                class="p-button-rounded p-button-sm p-button-text"
                                                @click="
                                                    toggleQuestionFlag(
                                                        questionItem
                                                    )
                                                "
                                                :aria-label="
                                                    isQuestionFlagged(
                                                        questionItem
                                                    )
                                                        ? '取消标记疑问'
                                                        : '标记疑问'
                                                "
                                                v-tooltip.bottom="
                                                    isQuestionFlagged(
                                                        questionItem
                                                    )
                                                        ? '取消标记疑问'
                                                        : '标记疑问'
                                                "
                                            />
                                        </div>
                                    </div>
                                    <QuestionContent
                                        :selectedQuestion="
                                            enhanceQuestionWithIndex(
                                                questionItem,
                                                index
                                            )
                                        "
                                        :exam_page_mode="exam_page_mode"
                                        :renderMarkdown="renderMarkdown"
                                        :groupMode="true"
                                    />
                                </div>
                            </template>
                        </div>
                        <div v-else class="text-center p-4 text-surface-500">
                            未找到题组内容
                        </div>
                    </div>
                </ScrollPanel>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import type {
    QuestionGroups,
    Questions,
    QuestionResults,
} from "~/types/directus_types";
import QuestionContent from "~/components/QuestionContent.vue";

const props = defineProps<{
    questionGroup: QuestionGroups | null;
    practiceSessionId: string;
    questionResults: QuestionResults[];
    exam_page_mode: string;
    groupQuestions?: any[]; // 接收从父组件传递的题组内题目列表
    renderMarkdown: (content: string) => string;
}>();

// Helper function to get question type label
const getQuestionTypeLabel = (type: string): string => {
    switch (type) {
        case "q_mc_single":
            return "单选题";
        case "q_mc_multi":
            return "多选题";
        case "q_mc_binary":
            return "判断题";
        case "q_mc_flexible":
            return "不定项选择题";
        default:
            return "未知题型";
    }
};

console.log("questionGroup in QuestionGroupContent", props.questionGroup);

const emit = defineEmits(["flag-question"]);

// 控制公共题干区域的收缩状态
const isStemCollapsed = ref(false);
const isMobile = ref(false);
const stemWidth = ref(300); // 题干宽度，默认300px

// 拖拽调整宽度相关变量
const startX = ref(0);
const startWidth = ref(0);
const minStemWidth = 100; // 最小宽度
const maxStemWidth = 600; // 最大宽度

// 收缩/展开公共题干
const toggleStem = () => {
    isStemCollapsed.value = !isStemCollapsed.value;
};

// 开始拖拽调整题干宽度
const startStemResize = (event: MouseEvent) => {
    startX.value = event.clientX;
    // 获取当前容器的宽度
    const element = event.target as HTMLElement;
    const container = element.closest(".shared-stem-container") as HTMLElement;
    startWidth.value = container.offsetWidth;

    // 添加移动和松开鼠标的事件监听
    document.addEventListener("mousemove", resizingStem);
    document.addEventListener("mouseup", stopStemResize);

    // 添加防止选择文本的样式
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
};

// 拖拽调整题干宽度过程
const resizingStem = (event: MouseEvent) => {
    const dx = event.clientX - startX.value;
    let newWidth = startWidth.value + dx;

    // 限制调整范围
    if (newWidth < minStemWidth) newWidth = minStemWidth;
    if (newWidth > maxStemWidth) newWidth = maxStemWidth;

    // 更新题干宽度
    stemWidth.value = newWidth;
};

// 停止拖拽调整题干宽度
const stopStemResize = () => {
    document.removeEventListener("mousemove", resizingStem);
    document.removeEventListener("mouseup", stopStemResize);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
};

// 判断题目是否被标记为有疑问
const isQuestionFlagged = (question: any) => {
    if (!question || !question.result) return false;
    return question.result.is_flagged === true;
};

// 标记或取消标记题目
const toggleQuestionFlag = async (question: any) => {
    if (!question || !question.result || !question.result.id) return;

    // 先更新本地状态，提供即时反馈
    const updatedFlag = !isQuestionFlagged(question);
    question.result.is_flagged = updatedFlag;

    try {
        // 直接提交到数据库
        const { updateItem } = useDirectusItems();

        const submitted_flag = {
            is_flagged: updatedFlag,
        };

        const response = await updateItem({
            collection: "question_results",
            id: question.result.id,
            item: submitted_flag,
        });

        console.log(
            `题目已${updatedFlag ? "标记" : "取消标记"}为疑问:`,
            response
        );
    } catch (error) {
        // 如果提交失败，恢复原状态
        question.result.is_flagged = !updatedFlag;
        console.error("更新标记状态时出错:", error);
    }
};

// 检测设备类型
onMounted(() => {
    // 检查是否为移动设备
    const checkMobile = () => {
        isMobile.value = window.innerWidth < 768;
    };

    // 初始检查
    checkMobile();

    // 监听窗口大小变化
    window.addEventListener("resize", checkMobile);

    // 组件卸载时移除事件监听
    onUnmounted(() => {
        window.removeEventListener("resize", checkMobile);
    });
});

/**
 * 获取题组内的题目列表并按照正确的顺序排序
 * 在题组模式下，优先按照题目的sort_in_group字段排序，而非sort_in_section
 */
const groupQuestions = computed(() => {
    if (props.groupQuestions && props.groupQuestions.length > 0) {
        // 如果父组件传递了题组内题目列表，优先使用
        return [...props.groupQuestions].sort((a, b) => {
            // 题组模式下，优先使用sort_in_group字段排序
            const aSort = a.questions_id?.sort_in_group ?? 999;
            const bSort = b.questions_id?.sort_in_group ?? 999;

            // 如果sort_in_group相同或不存在，再使用sort_in_section作为备选
            if (aSort === bSort) {
                return (a.sort_in_section || 0) - (b.sort_in_section || 0);
            }

            return aSort - bSort;
        });
    }

    return [];
});

/**
 * 获取题目边框类样式，基于题目的完成状态
 * 用于直观显示题目是否已作答及结果正确性
 */
const getQuestionBorderClass = (question: any) => {
    if (!question.result) return "border-gray-300";

    // 如果题目已作答，根据答案正确性决定颜色
    if (
        question.result.submit_ans_select_radio ||
        (question.result.submit_ans_select_multiple_checkbox &&
            question.result.submit_ans_select_multiple_checkbox.length > 0) ||
        question.result.submit_ans_text
    ) {
        return question.result.score >= question.result.point_value
            ? "border-green-500"
            : "border-red-500";
    }

    // 未作答
    return "border-gray-300";
};

/**
 * 为题目对象添加组内索引，确保在题组模式下正确标识每个题目
 * 这对于解决题组内多个题目选项ID冲突问题非常重要
 */
const enhanceQuestionWithIndex = (question: any, index: number) => {
    return {
        ...question,
        groupQuestionIndex: index, // 添加组内索引，用于生成唯一ID
    };
};

/**
 * 获取题目得分展示文本
 */
const getQuestionScoreDisplay = (question: any) => {
    if (!question.result) return "";

    const score = question.result.score;
    const pointValue = question.result.point_value;

    if (
        score === undefined ||
        score === null ||
        pointValue === undefined ||
        pointValue === null
    ) {
        return "";
    }

    return `${score}/${pointValue}分`;
};

/**
 * 获取题目分数标签样式，根据得分比例显示不同的颜色
 */
const getQuestionScoreSeverity = (question: any) => {
    if (!question.result) return "info";

    const score = question.result.score;
    const pointValue = question.result.point_value;

    if (
        score === undefined ||
        score === null ||
        pointValue === undefined ||
        pointValue === null
    ) {
        return "info";
    }

    const percentage = (score / pointValue) * 100;

    if (percentage >= 80) {
        return "success";
    } else if (percentage >= 60) {
        return "warning";
    } else {
        return "danger";
    }
};
</script>

<style scoped>
.question-group-content {
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.group-container {
    height: 100%;
    overflow: hidden;
    display: flex;
}

.shared-stem-container {
    position: relative;
    overflow: hidden;
    background-color: var(--surface-50);
    border-radius: 8px;
    transition: width 0.3s ease;
    border: 1px solid var(--surface-200);
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
}

.shared-stem-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: 100%;
}

.stem-title {
    flex-shrink: 0;
}

.stem-scroll-container {
    flex: 1;
    padding-right: 8px;
}

.desktop-toggle-button-container {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    z-index: 5;
}

.stem-toggle-btn,
.stem-toggle-btn-mobile {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stem-toggle-btn-mobile {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    z-index: 5;
}

.group-questions {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--surface-50);
    border-radius: 8px;
    border: 1px solid var(--surface-200);
    min-height: 0;
}

.questions-scroll-container {
    padding: 1rem;
    padding-right: 8px;
}

.questions-content {
    width: 100%;
}

.question-item {
    position: relative;
    border-radius: 4px;
    transition: background-color 0.2s ease;
}

.custom-scrollbar {
    width: 100%;
    height: 100%;
}

/* 拖动调整宽度的拖动条 */
.stem-resizer {
    position: absolute;
    right: 0;
    top: 0;
    height: 100%;
    width: 5px;
    background-color: transparent;
    cursor: col-resize;
    z-index: 10;
}

.stem-resizer:hover {
    background-color: var(--primary-200);
}

.stem-resizer:active {
    background-color: var(--primary-300);
}

/* 媒体查询适配移动设备 */
@media screen and (max-width: 768px) {
    .shared-stem-container {
        width: 100% !important;
        margin-bottom: 1rem;
        max-height: 40vh;
    }

    .group-questions {
        width: 100% !important;
        max-height: 60vh;
    }

    .stem-resizer {
        display: none; /* 移动设备上不显示拖动条 */
    }

    .stem-scroll-container,
    .questions-scroll-container {
        max-height: 100%;
    }
}

/* 适应滚动容器 */
:deep(.markdown-content img) {
    max-width: 100%;
    height: auto;
}

/* 题目标记样式 */
:deep(.p-button.p-button-danger.p-button-text) {
    color: rgb(237, 19, 19); /* 使用红色保持一致性 */
}

:deep(.p-button.p-button-danger.p-button-text:hover) {
    background: rgba(237, 19, 19, 0.1);
    color: rgb(200, 0, 0);
}
</style>
