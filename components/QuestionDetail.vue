<!-- components/QuestionDetail.vue -->
<!-- 题目详情页。这里是包含整个题目详情的页面，包括题目所属的章节、题目内容、答题区 -->
<template>
    <div class="question-detail card h-full overflow-hidden flex flex-col">
        <div class="question-header p-4 bg-surface-50 dark:bg-surface-700 border-b border-surface-200 dark:border-surface-600">
            <template v-if="selectedQuestion && selectedQuestion.questions_id">
                <div class="flex justify-between items-start">
                    <h3 class="text-xl font-semibold text-primary flex items-center">
                        <span class="mr-2 bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">
                            {{ selectedQuestion.sort_in_section || '?' }}
                        </span>
                        <template v-if="isGroupMode">
                            {{ selectedQuestion.questionGroup ? selectedQuestion.questionGroup.title || "题组" : "题组" }}
                        </template>
                        <template v-else>
                            {{ selectedQuestion.questions_id.title || "试题" }}
                        </template>
                    </h3>
                    <div class="flex items-center gap-2">
                        <Button
                            v-if="!isGroupMode"
                            :icon="isQuestionFlagged ? 'pi pi-flag-fill' : 'pi pi-flag'"
                            :class="{ 'p-button-danger': isQuestionFlagged }"
                            class="p-button-rounded p-button-sm"
                            @click="toggleQuestionFlag"
                            :aria-label="isQuestionFlagged ? '取消标记疑问' : '标记疑问'"
                            v-tooltip.bottom="isQuestionFlagged ? '取消标记疑问' : '标记疑问'"
                        />
                        <Tag 
                            v-if="!isGroupMode && selectedQuestion.result && selectedQuestion.result.point_value"
                            :severity="getScoreSeverity(selectedQuestion)"
                        >
                            {{ getScoreDisplay(selectedQuestion) }}
                        </Tag>
                    </div>
                </div>
                <p v-if="!isGroupMode && selectedQuestion.questions_id.description" class="mt-3 text-surface-600 dark:text-surface-400">
                    <span v-html="renderMarkdown(selectedQuestion.questions_id.description || '')"></span>
                </p>
            </template>
            <div v-else class="text-center p-4 text-surface-500">
                请选择一个题目开始答题
            </div>
        </div>
        
        <div class="question-content flex-1 overflow-auto p-2">
            <div class="h-full">
                <!-- 题目内容和答题区 -->
                <div class="w-full p-4 bg-surface-50 dark:bg-surface-800 rounded-lg shadow-sm">
                    <!-- 题组模式 -->
                    <QuestionGroupContent
                        v-if="isGroupMode && selectedQuestion && selectedQuestion.questionGroup"
                        :questionGroup="selectedQuestion.questionGroup"
                        :practiceSessionId="practiceSessionId"
                        :questionResults="questionResults"
                        :exam_page_mode="exam_page_mode"
                        :groupQuestions="selectedQuestion.groupQuestions || []"
                        :renderMarkdown="renderMarkdown"
                    />
                    
                    <!-- 单题模式 -->
                    <QuestionContent
                        v-else-if="selectedQuestion"
                        :selectedQuestion="selectedQuestion"
                        :exam_page_mode="exam_page_mode"
                        :renderMarkdown="renderMarkdown"
                    />
                </div>
            </div>
        </div>
        
        <div v-if="selectedQuestion && exam_page_mode !== 'review'" class="question-footer p-3 bg-surface-50 dark:bg-surface-700 border-t border-surface-200 dark:border-surface-600 flex justify-between">
            <div class="navigation-buttons flex justify-between mt-4">
                <Button
                    @click="navigateQuestion(-1)"
                    icon="pi pi-arrow-left"
                    label="上一题"
                    class="p-button-outlined"
                />
                <Button
                    @click="navigateQuestion(1)"
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    label="下一题"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { watch, computed, ref, onMounted } from "vue";
import QuestionContent from "~/components/QuestionContent.vue";
import QuestionGroupContent from "~/components/QuestionGroupContent.vue";
import type { QuestionResults } from "~/types/directus_types";
// @ts-ignore
import markdownit from 'markdown-it';

// 创建markdown-it实例
const md = markdownit({
    html: true,
    breaks: true,
    linkify: true
});

// 渲染markdown内容为HTML
const renderMarkdown = (content: string) => {
    if (!content) return '';
    return md.render(content);
};

const props = defineProps<{
    selectedQuestion: any | null;
    exam_page_mode: string;
    practiceSessionId: string;
    questionResults: QuestionResults[];
}>();

console.log("selectedQuestion in QuestionDetail", props.selectedQuestion.value);

const emit = defineEmits(['navigate-question']);

// 判断是否为题组模式
const isGroupMode = computed(() => {
    return props.selectedQuestion && 
           props.selectedQuestion.isGroupMode === true &&
           props.selectedQuestion.questionGroup !== undefined;
});

// 判断当前题目是否被标记为有疑问
const isQuestionFlagged = computed(() => {
    if (!props.selectedQuestion || !props.selectedQuestion.result) return false;
    return props.selectedQuestion.result.is_flagged === true;
});

// 切换单题"疑问"标记状态
// 步骤：
//  1. 本地翻转 result.is_flagged，立即反馈 UI
//  2. 调用后端接口更新数据库
//  3. 用后端返回的 response.is_flagged 再次同步本地状态
const toggleQuestionFlag = async () => {
    if (!props.selectedQuestion || !props.selectedQuestion.result || !props.selectedQuestion.result.id) return;
    
    try {
        // 先更新本地状态，提供即时反馈
        const updatedFlag = !isQuestionFlagged.value;
        if (props.selectedQuestion && props.selectedQuestion.result) {
            props.selectedQuestion.result.is_flagged = updatedFlag;
        }
        
        // 然后提交到数据库
        const { updateItem } = useDirectusItems();
        
        const submitted_flag = {
            is_flagged: updatedFlag
        };
        
        const response = await updateItem({
            collection: "question_results",
            id: props.selectedQuestion.result.id,
            item: submitted_flag,
        });
        
        console.log(`题目已${updatedFlag ? '标记' : '取消标记'}为疑问:`, response);
    } catch (error) {
        // 如果提交失败，恢复原状态
        if (props.selectedQuestion && props.selectedQuestion.result) {
            props.selectedQuestion.result.is_flagged = !props.selectedQuestion.result.is_flagged;
        }
        console.error("更新标记状态时出错:", error);
    }
};

// 监听选中题目变化
watch(
    () => props.selectedQuestion,
    (newQuestion) => {
        console.log("QuestionDetail - 选中题目更新为:", newQuestion);
    }
);

// 导航到上一题或下一题
const navigateQuestion = (direction: number) => {
    emit('navigate-question', direction);
};

// 获取分数展示文本
const getScoreDisplay = (question: any) => {
    if (!question || !question.result) return '';
    
    const score = question.result.score;
    const pointValue = question.result.point_value;
    
    if (score === undefined || score === null || pointValue === undefined || pointValue === null) {
        return '';
    }
    
    return `${score}/${pointValue}分`;
};

// 获取分数标签样式
const getScoreSeverity = (question: any) => {
    if (!question || !question.result) return 'info';
    
    const score = question.result.score;
    const pointValue = question.result.point_value;
    
    if (score === undefined || score === null || pointValue === undefined || pointValue === null) {
        return 'info';
    }
    
    const percentage = (score / pointValue) * 100;
    
    if (percentage >= 80) {
        return 'success';
    } else if (percentage >= 60) {
        return 'warning';
    } else {
        return 'danger';
    }
};
</script>

<style scoped>
.question-detail {
    border-radius: 8px;
    transition: all 0.3s ease;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

@media screen and (max-width: 768px) {
    .question-detail {
        border-radius: 8px;
        margin-bottom: 60px;
    }
}

/* Markdown样式 */
:deep(.markdown-content) h1,
:deep(.markdown-content) h2,
:deep(.markdown-content) h3,
:deep(.markdown-content) h4,
:deep(.markdown-content) h5,
:deep(.markdown-content) h6 {
    margin-top: 1em;
    margin-bottom: 0.5em;
    font-weight: bold;
}

:deep(.markdown-content) p {
    margin-bottom: 1em;
}

:deep(.markdown-content) ul,
:deep(.markdown-content) ol {
    padding-left: 2em;
    margin-bottom: 1em;
}

:deep(.markdown-content) code {
    background-color: rgba(0, 0, 0, 0.05);
    padding: 0.2em 0.4em;
    border-radius: 3px;
}

:deep(.markdown-content) pre {
    background-color: rgba(0, 0, 0, 0.05);
    padding: 1em;
    border-radius: 5px;
    overflow-x: auto;
    margin-bottom: 1em;
}

:deep(.markdown-content) blockquote {
    border-left: 4px solid #ddd;
    padding-left: 1em;
    color: #666;
    margin-bottom: 1em;
}

:deep(.markdown-content) img {
    max-width: 100%;
}

:deep(.markdown-content) table {
    border-collapse: collapse;
    width: 100%;
    margin-bottom: 1em;
}

:deep(.markdown-content) th,
:deep(.markdown-content) td {
    border: 1px solid #ddd;
    padding: 8px;
}

:deep(.markdown-content) th {
    background-color: rgba(0, 0, 0, 0.05);
}
</style>
