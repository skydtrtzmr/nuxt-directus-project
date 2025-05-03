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
      <div class="group-questions mt-4">
        <template v-for="(questionItem, index) in groupQuestions" :key="questionItem.id">
          <div class="question-item mb-4 border-l-4 pl-4" :class="getQuestionBorderClass(questionItem)">
            <div class="question-header flex justify-between items-center mb-2">
              <h3 class="text-lg font-medium">{{ questionItem.questions_id.title }}</h3>
              <div class="score-label" :class="getQuestionScoreSeverity(questionItem)">
                {{ getQuestionScoreDisplay(questionItem) }}
              </div>
            </div>
            <QuestionContent 
              :selectedQuestion="enhanceQuestionWithIndex(questionItem, index)" 
              :exam_page_mode="exam_page_mode"
            />
          </div>
        </template>
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
  groupQuestions?: any[]; // 接收从父组件传递的题组内题目列表
}>();

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
  if (!question.result) return 'border-gray-300';
  
  // 如果题目已作答，根据答案正确性决定颜色
  if (question.result.submit_ans_select_radio || 
      (question.result.submit_ans_select_multiple_checkbox && 
       question.result.submit_ans_select_multiple_checkbox.length > 0) ||
      question.result.submit_ans_text) {
    return question.result.score >= question.result.point_value ? 
      'border-green-500' : 'border-red-500';
  }
  
  // 未作答
  return 'border-gray-300';
};

/**
 * 为题目对象添加组内索引，确保在题组模式下正确标识每个题目
 * 这对于解决题组内多个题目选项ID冲突问题非常重要
 */
const enhanceQuestionWithIndex = (question: any, index: number) => {
  return {
    ...question,
    groupQuestionIndex: index // 添加组内索引，用于生成唯一ID
  };
};

/**
 * 获取题目得分展示文本
 */
const getQuestionScoreDisplay = (question: any) => {
  if (!question.result) return '';
  
  const score = question.result.score;
  const pointValue = question.result.point_value;
  
  if (score === undefined || score === null || pointValue === undefined || pointValue === null) {
    return '';
  }
  
  return `${score}/${pointValue}分`;
};

/**
 * 获取题目分数标签样式，根据得分比例显示不同的颜色
 */
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

/* 确保题目内容区域相互隔离，防止DOM事件冒泡导致的选项混淆 */
:deep(.group-question-item) {
  isolation: isolate;
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