<!-- components/QuestionDetail.vue -->
<!-- 题目详情页。这里是包含整个题目详情的页面，包括题目所属的章节、公共题干、题目内容、答题区、 -->
<template>
    <div class="question-detail card h-full overflow-hidden flex flex-col">
        <div class="question-header p-4 bg-surface-50 dark:bg-surface-700 border-b border-surface-200 dark:border-surface-600">
            <template v-if="selectedQuestion && selectedQuestion.questions_id">
                <div class="flex justify-between items-start">
                    <h3 class="text-xl font-semibold text-primary flex items-center">
                        <span class="mr-2 bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">
                            {{ selectedQuestion.sort_in_section || '?' }}
                        </span>
                        {{ selectedQuestion.questions_id.title || "试题" }}
                    </h3>
                    <Tag 
                        v-if="selectedQuestion.result && selectedQuestion.result.point_value"
                        :severity="getScoreSeverity(selectedQuestion)"
                    >
                        {{ getScoreDisplay(selectedQuestion) }}
                    </Tag>
                </div>
                <p v-if="selectedQuestion.questions_id.description" class="mt-3 text-surface-600 dark:text-surface-400">
                    {{ selectedQuestion.questions_id.description || "" }}
                </p>
            </template>
            <div v-else class="text-center p-4 text-surface-500">
                请选择一个题目开始答题
            </div>
        </div>
        
        <div class="question-content flex-1 overflow-auto p-2">
            <div class="flex flex-col lg:flex-row gap-4 h-full">
                <!-- 公共题干 -->
                <CommonQuestionContent
                    class="w-full lg:w-2/5 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg shadow-sm"
                    v-if="selectedQuestion && selectedQuestion.questions_id && selectedQuestion.questions_id.question_group"
                    :question="selectedQuestion.questions_id"
                />

                <Divider
                    layout="horizontal"
                    class="lg:hidden"
                    v-if="selectedQuestion && selectedQuestion.questions_id && selectedQuestion.questions_id.question_group"
                />
                
                <Divider
                    layout="vertical"
                    class="hidden lg:block"
                    v-if="selectedQuestion && selectedQuestion.questions_id && selectedQuestion.questions_id.question_group"
                />

                <!-- 题目内容和答题区 -->
                <div class="w-full lg:w-3/5 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg shadow-sm">
                    <!-- 使用QuestionContent组件 -->
                    <QuestionContent
                        v-if="selectedQuestion"
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
import CommonQuestionContent from "~/components/CommonQuestionContent.vue";
import QuestionContent from "~/components/QuestionContent.vue";

const props = defineProps<{
    selectedQuestion: any | null;
    exam_page_mode: string;
}>();

const emit = defineEmits(['navigate-question']);

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
