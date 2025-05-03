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
                    <Tag 
                        v-if="!isGroupMode && selectedQuestion.result && selectedQuestion.result.point_value"
                        :severity="getScoreSeverity(selectedQuestion)"
                    >
                        {{ getScoreDisplay(selectedQuestion) }}
                    </Tag>
                </div>
                <p v-if="!isGroupMode && selectedQuestion.questions_id.description" class="mt-3 text-surface-600 dark:text-surface-400">
                    {{ selectedQuestion.questions_id.description || "" }}
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
                    />
                    
                    <!-- 单题模式 -->
                    <QuestionContent
                        v-else-if="selectedQuestion"
                        :selectedQuestion="selectedQuestion"
                        :exam_page_mode="exam_page_mode"
                    />
                </div>
            </div>
        </div>
        
        <div v-if="selectedQuestion && exam_page_mode !== 'review'" class="question-footer p-3 bg-surface-50 dark:bg-surface-700 border-t border-surface-200 dark:border-surface-600 flex justify-between">
            <Button 
                @click="navigateQuestion(-1)"
                icon="pi pi-angle-left" 
                label="上一题" 
                outlined 
                class="p-button-sm"
            />
            <Button 
                @click="navigateQuestion(1)"
                icon="pi pi-angle-right" 
                iconPos="right"
                label="下一题" 
                outlined 
                class="p-button-sm"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { watch, computed } from "vue";
import QuestionContent from "~/components/QuestionContent.vue";
import QuestionGroupContent from "~/components/QuestionGroupContent.vue";
import type { QuestionResults } from "~/types/directus_types";

const props = defineProps<{
    selectedQuestion: any | null;
    exam_page_mode: string;
    practiceSessionId: string;
    questionResults: QuestionResults[];
}>();

const emit = defineEmits(['navigate-question']);

// 判断是否为题组模式
const isGroupMode = computed(() => {
    return props.selectedQuestion && 
           props.selectedQuestion.isGroupMode === true &&
           props.selectedQuestion.questionGroup !== undefined;
});

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
</style>
