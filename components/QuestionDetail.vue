<!-- components/QuestionDetail.vue -->
<!-- 题目详情页。这里是包含整个题目详情的页面，包括题目所属的章节、题目内容、答题区 -->
<template>
    <div class="question-detail card h-full flex flex-col">
        <div
            class="question-header p-5 bg-surface-50 dark:bg-surface-700 border-b border-surface-200 dark:border-surface-600"
        >
            <template v-if="selectedQuestion && selectedQuestion.questions_id">
                <div class="flex justify-between items-start">
                    <h3
                        class="text-xl font-semibold text-primary flex items-center"
                    >
                        <span
                            class="mr-3 bg-primary text-white rounded-full w-9 h-9 flex items-center justify-center text-sm shadow-sm"
                        >
                            {{ selectedQuestion.sort_in_section || "?" }}
                        </span>
                        <template v-if="isGroupMode">
                            {{
                                selectedQuestion.questionGroup
                                    ? selectedQuestion.questionGroup.title ||
                                      "题组"
                                    : "题组"
                            }}
                        </template>
                        <template v-else>
                            {{ selectedQuestion.questions_id.title || "试题" }}
                        </template>
                    </h3>
                    <div class="flex items-center gap-3">
                        <Button
                            v-if="!isGroupMode"
                            :icon="
                                isQuestionFlagged
                                    ? 'pi pi-flag-fill'
                                    : 'pi pi-flag'
                            "
                            :class="{ 'p-button-danger': isQuestionFlagged }"
                            class="p-button-rounded p-button-sm"
                            @click="toggleQuestionFlag"
                            :aria-label="
                                isQuestionFlagged ? '取消标记疑问' : '标记疑问'
                            "
                            v-tooltip.bottom="
                                isQuestionFlagged ? '取消标记疑问' : '标记疑问'
                            "
                        />
                        <Tag
                            v-if="
                                !isGroupMode &&
                                currentSingleQuestionResult &&
                                currentSingleQuestionResult.point_value !== null &&
                                currentSingleQuestionResult.point_value !== undefined
                            "
                            :severity="getScoreSeverity"
                            class="font-medium"
                        >
                            {{ getScoreDisplay }}
                        </Tag>
                    </div>
                </div>
                <p
                    v-if="
                        !isGroupMode &&
                        selectedQuestion.questions_id.description
                    "
                    class="mt-4 text-surface-600 dark:text-surface-400 bg-surface-100 dark:bg-surface-800 p-3 rounded-md"
                >
                    <span
                        v-html="
                            render(
                                selectedQuestion.questions_id.description || ''
                            )
                        "
                    ></span>
                </p>
            </template>
            <div v-else class="text-center p-5 text-surface-500">
                <i class="pi pi-book mr-2"></i>请选择一个题目开始答题
            </div>
        </div>

        <div class="question-content flex-1 overflow-hidden">
            <!-- 注意下面两个都要加上h-full，以确保正确继承父组件的高度，不然会高度太高，影响Scroll Panel。 -->
            <div class="p-4 h-full">
                <!-- 题目内容和答题区 -->
                <div
                    class="w-full p-5 bg-surface-50 dark:bg-surface-800 rounded-lg shadow-sm h-full"
                >
                    <!-- 题组模式 -->
                    <QuestionGroupContent
                        v-if="
                            isGroupMode &&
                            selectedQuestion &&
                            selectedQuestion.questionGroup
                        "
                        :questionGroup="selectedQuestion.questionGroup"
                        :practiceSessionId="practiceSessionId"
                        :questionResults="questionResults"
                        :exam_page_mode="exam_page_mode"
                        :groupQuestions="selectedQuestion.groupQuestions || []"
                        :renderMarkdown="render"
                    />

                    <!-- 单题模式 -->
                    <QuestionContent
                        v-else-if="selectedQuestion"
                        :selectedQuestion="selectedQuestion"
                        :exam_page_mode="exam_page_mode"
                        :renderMarkdown="render"
                        :groupMode="false"
                        :currentQuestionResult="currentSingleQuestionResult"
                    />
                </div>
            </div>
        </div>

        <div
            v-if="selectedQuestion && exam_page_mode !== 'review'"
            class="question-footer p-4 bg-surface-50 dark:bg-surface-700 border-t border-surface-200 dark:border-surface-600"
        >
            <div class="navigation-buttons flex justify-between">
                <Button
                    @click="navigateQuestion(-1)"
                    icon="pi pi-arrow-left"
                    label="上一题"
                    class="p-button-outlined p-button-sm"
                />
                <Button
                    @click="navigateQuestion(1)"
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    label="下一题"
                    class="p-button-sm"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { watch, computed, ref, onMounted } from "vue";
import QuestionContent from "~/components/QuestionContent.vue";
import QuestionGroupContent from "~/components/QuestionGroupContent.vue";
import type { QuestionResults, PaperSectionsQuestions } from "~/types/directus_types";
// 移除 markdown-it 的直接导入
// import markdownit from "markdown-it";

// 导入并使用 useMarkdown composable
import { useMarkdown } from '~/composables/useMarkdown'; // 确保路径正确，Nuxt3一般会自动导入
const { render } = useMarkdown(); // 获取 render 函数

const props = defineProps<{
    selectedQuestion: any | null;
    exam_page_mode: string;
    practiceSessionId: string;
    questionResults: QuestionResults[];
}>();

// console.log("selectedQuestion in QuestionDetail", props.selectedQuestion.value);

const emit = defineEmits(["navigate-question"]);

// 辅助函数：根据 paper_sections_questions_id 从 questionResults 中查找结果
const getResultForCurrentQuestion = (questionInPaperId: number | undefined | null): QuestionResults | null => {
    if (!props.questionResults || questionInPaperId === undefined || questionInPaperId === null) {
        return null;
    }
    return props.questionResults.find(qr => {
        const qrId = typeof qr.question_in_paper_id === 'object' && qr.question_in_paper_id !== null 
                        ? qr.question_in_paper_id.id 
                        : qr.question_in_paper_id;
        return qrId === questionInPaperId;
    }) || null;
};

// 当前单题的答题结果 (如果非题组模式)
const currentSingleQuestionResult = computed<QuestionResults | null>(() => {
    if (isGroupMode.value || !props.selectedQuestion || !props.selectedQuestion.id) {
        return null;
    }
    // props.selectedQuestion.id 应该是 paper_sections_questions 的 id (number)
    return getResultForCurrentQuestion(props.selectedQuestion.id);
});

// 判断是否为题组模式
const isGroupMode = computed(() => {
    return (
        props.selectedQuestion &&
        props.selectedQuestion.isGroupMode === true &&
        props.selectedQuestion.questionGroup !== undefined
    );
});

// 判断当前题目是否被标记为有疑问
const isQuestionFlagged = computed(() => {
    if (isGroupMode.value || !currentSingleQuestionResult.value) return false;
    return currentSingleQuestionResult.value.is_flagged === true;
});

// 切换单题"疑问"标记状态
// 步骤：
//  1. 本地翻转 result.is_flagged，立即反馈 UI
//  2. 调用后端接口更新数据库
//  3. 用后端返回的 response.is_flagged 再次同步本地状态
const toggleQuestionFlag = async () => {
    if (isGroupMode.value || !currentSingleQuestionResult.value || !currentSingleQuestionResult.value.id) {
        console.warn("Cannot toggle flag: Not in single question mode or no result ID.");
        return;
    }

    const resultIdToUpdate = currentSingleQuestionResult.value.id;
    const currentFlagStatus = currentSingleQuestionResult.value.is_flagged;
    const updatedFlag = !currentFlagStatus;

    let resultIndex = -1; // 在 try 块外部声明，以便 catch 块可以访问

    try {
        // 乐观更新本地 questionResults 数组中对应项的 is_flagged 状态
        resultIndex = props.questionResults.findIndex(qr => qr.id === resultIdToUpdate); // 在 try 内部赋值
        if (resultIndex !== -1) {
            const updatedResult = { ...props.questionResults[resultIndex], is_flagged: updatedFlag };
            props.questionResults.splice(resultIndex, 1, updatedResult);
        } else {
            console.warn("Cannot find question result in local array to optimistically update flag.");
        }

        const { updateItem } = useDirectusItems();
        await updateItem<QuestionResults>({
            collection: "question_results",
            id: resultIdToUpdate,
            item: { is_flagged: updatedFlag },
        });
        console.log(`题目flag已更新为: ${updatedFlag}`);

    } catch (error) {
        console.error("更新题目flag状态失败:", error);
        // 如果API调用失败，回滚乐观更新
        if (resultIndex !== -1) { // 现在 resultIndex 在 catch 块中可见
            const originalResult = { ...props.questionResults[resultIndex], is_flagged: currentFlagStatus };
            props.questionResults.splice(resultIndex, 1, originalResult);       
        }
    }
};

// 监听选中题目变化
// watch(
//     () => props.selectedQuestion,
//     (newQuestion) => {
//         console.log("QuestionDetail - 选中题目更新为:", newQuestion);
//     }
// );

// 导航到上一题或下一题
const navigateQuestion = (direction: number) => {
    emit("navigate-question", direction);
};

// 获取分数展示文本
const getScoreDisplay = computed(() => {
    if (isGroupMode.value || !currentSingleQuestionResult.value) return "";
    const score = currentSingleQuestionResult.value.score;
    const pointValue = currentSingleQuestionResult.value.point_value;
    if (score === undefined || score === null || pointValue === undefined || pointValue === null || pointValue === 0) {
        return ""; // 或者显示 "未评分" 等
    }
    return `${score}/${pointValue}分`;
});

// 获取分数标签样式
const getScoreSeverity = computed(() => {
    if (isGroupMode.value || !currentSingleQuestionResult.value) return "info";
    const score = currentSingleQuestionResult.value.score;
    const pointValue = currentSingleQuestionResult.value.point_value;
    if (score === undefined || score === null || pointValue === undefined || pointValue === null || pointValue === 0) {
        return "info";
    }
    const percentage = (score / pointValue) * 100;
    if (percentage >= 80) return "success";
    if (percentage >= 60) return "warning";
    return "danger";
});
</script>

<style scoped>
.question-detail {
    display: flex;
    flex-direction: column;
    height: 100%;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.question-header {
    flex-shrink: 0;
}

.question-content {
    flex: 1;
    overflow: hidden;
}

.custom-scrollbar {
    width: 100%;
    height: 100%;
    padding-right: 17px; /* 为滚动条预留空间 */
    box-sizing: content-box;
}

.question-footer {
    flex-shrink: 0;
}

@media screen and (max-width: 768px) {
    .question-detail {
        border-radius: 0;
    }
}

.question-header h3 {
    line-height: 1.4;
    letter-spacing: 0.01em;
}

.navigation-buttons {
    width: 100%;
    max-width: 300px;
    margin: 0 auto;
}

.navigation-buttons .p-button {
    min-width: 120px;
    padding: 0.5rem 1rem;
    border-radius: 2rem;
    font-weight: 500;
    transition: all 0.2s ease;
}

.navigation-buttons .p-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

/* Markdown样式 */
:deep(.markdown-content) h1,
:deep(.markdown-content) h2,
:deep(.markdown-content) h3,
:deep(.markdown-content) h4,
:deep(.markdown-content) h5,
:deep(.markdown-content) h6 {
    margin-top: 1.2em;
    margin-bottom: 0.8em;
    font-weight: bold;
    line-height: 1.4;
}

:deep(.markdown-content) h1 {
    font-size: 1.8em;
}

:deep(.markdown-content) h2 {
    font-size: 1.6em;
}

:deep(.markdown-content) h3 {
    font-size: 1.4em;
}

:deep(.markdown-content) p {
    margin-bottom: 1.2em;
    line-height: 1.6;
}

:deep(.markdown-content) ul,
:deep(.markdown-content) ol {
    padding-left: 2em;
    margin-bottom: 1.2em;
    line-height: 1.6;
}

:deep(.markdown-content) li {
    margin-bottom: 0.5em;
}

:deep(.markdown-content) code {
    background-color: rgba(0, 0, 0, 0.05);
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-family: monospace;
}

:deep(.markdown-content) pre {
    background-color: rgba(0, 0, 0, 0.05);
    padding: 1.2em;
    border-radius: 6px;
    overflow-x: auto;
    margin-bottom: 1.2em;
}

:deep(.markdown-content) blockquote {
    border-left: 4px solid #ddd;
    padding: 0.8em 1.2em;
    color: #666;
    margin: 1.2em 0;
    background-color: rgba(0, 0, 0, 0.02);
    border-radius: 0 6px 6px 0;
}

:deep(.markdown-content) img {
    max-width: 100%;
    border-radius: 4px;
    margin: 1em 0;
}

:deep(.markdown-content) table {
    border-collapse: collapse;
    width: 100%;
    margin: 1.2em 0;
    overflow: hidden;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

:deep(.markdown-content) th,
:deep(.markdown-content) td {
    border: 1px solid #ddd;
    padding: 10px 16px;
}

:deep(.markdown-content) th {
    background-color: rgba(0, 0, 0, 0.05);
    text-align: left;
    font-weight: 600;
}

:deep(.markdown-content) tr:nth-child(even) {
    background-color: rgba(0, 0, 0, 0.02);
}
</style>
