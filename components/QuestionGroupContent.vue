<!-- components/QuestionGroupContent.vue -->
<template>
  <div class="question-group-content">
    <div v-if="groupQuestions.length > 0">
      <!-- 题组公共题干 -->
      <div class="shared-stem mb-4" v-if="questionGroup && questionGroup.shared_stem">
        <div class="text-lg font-medium mb-2">公共题干</div>
        <div class="p-3 bg-surface-100 dark:bg-surface-700 rounded-lg" v-html="questionGroup.shared_stem"></div>
      </div>
      
      <!-- 题组内的题目列表 -->
      <div class="group-questions">
        <div 
          v-for="(questionItem, index) in groupQuestions" 
          :key="questionItem.id"
          class="group-question-item mb-6 p-4 border border-surface-200 dark:border-surface-600 rounded-lg"
        >
          <!-- 题目标题和编号 -->
          <div class="flex justify-between items-center mb-3">
            <h4 class="text-lg font-medium flex items-center">
              <span class="mr-2 bg-primary-100 text-primary rounded-full w-7 h-7 flex items-center justify-center text-sm">
                {{ index + 1 }}
              </span>
              {{ questionItem.questions_id.title || "小题" }}
            </h4>
            
            <!-- 分数标签 -->
            <Tag v-if="questionItem.result && questionItem.result.point_value"
              :severity="getQuestionScoreSeverity(questionItem)">
              {{ getQuestionScoreDisplay(questionItem) }}
            </Tag>
          </div>
          
          <!-- 题目内容和答题区 -->
          <div>
            <!-- 使用QuestionContent组件渲染单个题目 -->
            <QuestionContent
              :selectedQuestion="questionItem"
              :exam_page_mode="exam_page_mode"
            />
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-center p-4 text-surface-500">
      未找到题组内容
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { QuestionGroups, Questions, QuestionResults } from '~/types/directus_types';
import QuestionContent from '~/components/QuestionContent.vue';

const props = defineProps<{
  questionGroup: QuestionGroups | null;
  practiceSessionId: string;
  questionResults: QuestionResults[];
  exam_page_mode: string;
  groupQuestions?: any[]; // 新增属性接收从父组件传递的题组内题目列表
}>();

// 获取题组内的题目列表
const groupQuestions = computed(() => {
  if (props.groupQuestions && props.groupQuestions.length > 0) {
    // 如果父组件传递了题组内题目列表，优先使用
    return props.groupQuestions.sort((a, b) => {
      // 如果有sort_in_section属性，按此排序
      if (a.sort_in_section !== undefined && b.sort_in_section !== undefined) {
        return a.sort_in_section - b.sort_in_section;
      }
      
      // 否则尝试获取题目中的sort_in_group属性
      const aSort = a.questions_id?.sort_in_group || 0;
      const bSort = b.questions_id?.sort_in_group || 0;
      return aSort - bSort;
    });
  }
  
  return [];
});

// 获取题目得分展示
const getQuestionScoreDisplay = (question: any) => {
  if (!question.result) return '';
  
  const score = question.result.score;
  const pointValue = question.result.point_value;
  
  if (score === undefined || score === null || pointValue === undefined || pointValue === null) {
    return '';
  }
  
  return `${score}/${pointValue}分`;
};

// 获取题目分数标签样式
const getQuestionScoreSeverity = (question: any) => {
  if (!question.result) return 'info';
  
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
.question-group-content {
  height: 100%;
  overflow-y: auto;
}

.group-question-item {
  background-color: var(--surface-50);
}

.group-question-item:hover {
  background-color: var(--surface-100);
}

:deep(.p-tag) {
  font-size: 0.8rem;
}

@media (prefers-color-scheme: dark) {
  .group-question-item {
    background-color: var(--surface-800);
  }
  
  .group-question-item:hover {
    background-color: var(--surface-700);
  }
}
</style> 