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
                            {{ selectedQuestion.questionGroup?.title || "题组" }}
                        </template>
                        <template v-else>
                            {{ (selectedQuestion.questions_id as Questions)?.title || "试题" }}
                        </template>
                    </h3>
                    <div class="flex items-center gap-3">
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
                        :questionResults="props.questionResults"
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
                        :questionResults="props.questionResults"
                    />
                </div>
            </div>
        </div>

        <div
            v-if="selectedQuestion && exam_page_mode !== 'review'"
            class="question-footer p-4 bg-surface-50 dark:bg-surface-700 border-t border-surface-200 dark:border-surface-600"
        >
            <div class="navigation-buttons flex justify-between items-center">
                <Button
                    @click="navigateQuestion(-1)"
                    icon="pi pi-arrow-left"
                    label="上一题"
                    class="p-button-outlined p-button-sm"
                    :aria-label="isGroupMode ? '上一题组' : '上一题'"
                />
                <Button 
                    @click="handleUnifiedToggleFlag"
                    :icon="unifiedFlagIcon"
                    :label="unifiedFlagLabel"
                    class="p-button-sm p-button-warning" 
                    v-tooltip.top="unifiedFlagLabel"
                />
                <Button
                    @click="navigateQuestion(1)"
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    label="下一题"
                    class="p-button-sm"
                    :aria-label="isGroupMode ? '下一题组' : '下一题'"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { watch, computed, ref, onMounted } from "vue";
import QuestionContent from "~/components/QuestionContent.vue";
import QuestionGroupContent from "~/components/QuestionGroupContent.vue";
import type { QuestionResults, PaperSectionsQuestions, Questions } from "~/types/directus_types";
import { useMarkdown } from '~/composables/useMarkdown';
const { render } = useMarkdown();

const props = defineProps<{
    selectedQuestion: any | null;
    exam_page_mode: string;
    practiceSessionId: string;
    questionResults: QuestionResults[];
}>();

const emit = defineEmits(["navigate-question"]);

// Helper: Get result for a question by its PaperSectionsQuestions ID
const getResultByPsqId = (psqId: string | number | undefined | null): QuestionResults | null => {
    if (!props.questionResults || psqId === undefined || psqId === null) return null;
    const psqIdStr = String(psqId);
    return props.questionResults.find(qr => {
        const qrPsq = qr.question_in_paper_id;
        if (typeof qrPsq === 'object' && qrPsq !== null && 'id' in qrPsq) {
            return String(qrPsq.id) === psqIdStr;
        }
        return String(qrPsq) === psqIdStr;
    }) || null;
};

// Is current view in group mode?
const isGroupMode = computed(() => {
    return (
        props.selectedQuestion &&
        props.selectedQuestion.isGroupMode === true &&
        props.selectedQuestion.questionGroup !== undefined
    );
});

// For single question mode: the result of the currently selected single question
const currentSingleQuestionResult = computed<QuestionResults | null>(() => {
    if (isGroupMode.value || !props.selectedQuestion || !props.selectedQuestion.id) return null;
    return getResultByPsqId(props.selectedQuestion.id);
});

// --- Unified Flagging Logic --- 

// Is the current single question (if not group mode) flagged?
const isSingleQuestionFlagged = computed(() => {
    if (isGroupMode.value || !currentSingleQuestionResult.value) return false;
    return !!currentSingleQuestionResult.value.is_flagged;
});

// Are all sub-questions in the current group flagged?
const areAllSubQuestionsInGroupFlagged = computed(() => {
    if (!isGroupMode.value || !props.selectedQuestion || !props.selectedQuestion.groupQuestions || props.selectedQuestion.groupQuestions.length === 0) {
        return false; // Not in group mode or no sub-questions
    }
    return props.selectedQuestion.groupQuestions.every((subQuestion: PaperSectionsQuestions) => {
        const result = getResultByPsqId(subQuestion.id);
        return !!result?.is_flagged;
    });
});

// Unified flag icon for the bottom button
const unifiedFlagIcon = computed(() => {
    if (isGroupMode.value) {
        return areAllSubQuestionsInGroupFlagged.value ? 'pi pi-flag-fill' : 'pi pi-flag';
    }
    return isSingleQuestionFlagged.value ? 'pi pi-flag-fill' : 'pi pi-flag';
});

// Unified flag label for the bottom button
const unifiedFlagLabel = computed(() => {
    if (isGroupMode.value) {
        return areAllSubQuestionsInGroupFlagged.value ? '取消标记' : '标记本题';
    }
    return isSingleQuestionFlagged.value ? '取消标记' : '标记本题';
});

// Unified toggle flag function for the bottom button
const handleUnifiedToggleFlag = async () => {
    if (props.exam_page_mode === 'review') return;
    const { updateItem } = useDirectusItems();

    if (!isGroupMode.value) {
        // --- Single Question Mode --- 
        if (!currentSingleQuestionResult.value || !currentSingleQuestionResult.value.id) {
            console.warn("Cannot toggle flag: No current single question result or result ID.");
            return;
        }
        const resultIdToUpdate = currentSingleQuestionResult.value.id;
        const currentFlagStatus = !!currentSingleQuestionResult.value.is_flagged;
        const newFlagStatus = !currentFlagStatus;
        const resultIndex = props.questionResults.findIndex(qr => qr.id === resultIdToUpdate);
        let originalResultData: QuestionResults | null = null;

        if (resultIndex !== -1) {
            originalResultData = JSON.parse(JSON.stringify(props.questionResults[resultIndex]));
            props.questionResults[resultIndex].is_flagged = newFlagStatus;
        } else {
            console.warn("Cannot find single question result in local array to optimistically update flag.");
        }
        try {
            await updateItem<QuestionResults>({
                collection: "question_results",
                id: resultIdToUpdate,
                item: { is_flagged: newFlagStatus },
            });
            console.log(`单题 (Result ID: ${resultIdToUpdate}) 标记状态已更新为: ${newFlagStatus}`);
        } catch (error) {
            console.error(`更新单题 (Result ID: ${resultIdToUpdate}) 标记状态失败:`, error);
            if (resultIndex !== -1 && originalResultData) {
                props.questionResults.splice(resultIndex, 1, originalResultData);
            }
        }
    } else {
        // --- Group Mode --- 
        if (!props.selectedQuestion || !props.selectedQuestion.groupQuestions || props.selectedQuestion.groupQuestions.length === 0) {
            console.warn("Cannot toggle group flag: No group questions available.");
            return;
        }

        const targetFlagStatus = !areAllSubQuestionsInGroupFlagged.value;
        const subQuestions = props.selectedQuestion.groupQuestions as PaperSectionsQuestions[];
        const updatesToProcess: {resultId: string, psqId: string | number, originalResult: QuestionResults | null, newStatus: boolean, resultIndex: number}[] = [];

        for (const subQuestion of subQuestions) {
            const result = getResultByPsqId(subQuestion.id);
            if (result && result.id) {
                const resultIndex = props.questionResults.findIndex(qr => qr.id === result.id);
                if (resultIndex !== -1) {
                    updatesToProcess.push({
                        resultId: result.id,
                        psqId: subQuestion.id,
                        originalResult: JSON.parse(JSON.stringify(props.questionResults[resultIndex])),
                        newStatus: targetFlagStatus,
                        resultIndex: resultIndex
                    });
                    // Optimistic update for this sub-question
                    props.questionResults[resultIndex].is_flagged = targetFlagStatus;
                }
            } else {
                console.warn(`No result found for sub-question ${subQuestion.id} in group, cannot toggle flag.`);
            }
        }

        if (updatesToProcess.length === 0) {
            console.warn("No valid sub-question results found to toggle flag for the group.");
            return;
        }

        try {
            // Sequentially update all sub-questions. 
            // Consider Promise.all for parallel updates if backend handles it well and order doesn't matter.
            for (const update of updatesToProcess) {
                await updateItem<QuestionResults>({
                    collection: "question_results",
                    id: update.resultId,
                    item: { is_flagged: update.newStatus },
                });
                console.log(`题组内小题 (PSQ ID: ${update.psqId}, Result ID: ${update.resultId}) 标记状态已更新为: ${update.newStatus}`);
            }
            console.log(`题组标记操作完成，目标状态: ${targetFlagStatus}`);
        } catch (error) {
            console.error("更新题组内某个小题标记状态时失败:", error);
            // Rollback all processed optimistic updates for this group on any error
            for (const update of updatesToProcess) {
                 // Check if originalResult is not null before using it for splice.
                if (update.originalResult && props.questionResults[update.resultIndex]?.id === update.resultId) {
                    props.questionResults.splice(update.resultIndex, 1, update.originalResult);
                }
            }
            alert("标记题组时发生错误，部分或全部标记可能未成功，已尝试回滚。");
        }
    }
};

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
    min-width: auto; /* Allow button to shrink with icon only */
    padding: 0.75rem 1rem; /* Adjust padding as needed */
}

/* Add some margin to the central flag button if needed */
.navigation-buttons .p-button-warning {
    margin-left: 0.5rem;
    margin-right: 0.5rem;
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
