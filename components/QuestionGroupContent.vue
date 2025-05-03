<!-- components/QuestionGroupContent.vue -->
<template>
  <div class="question-group-content">
    <!-- 自适应布局容器：电脑端左右布局，手机端上下布局 -->
    <div class="flex flex-col lg:flex-row gap-4">
      <!-- 公共题干区域 - 可收缩 -->
      <div 
        v-if="questionGroup && questionGroup.shared_stem" 
        class="shared-stem-container"
        :class="{
          'lg:w-1/3': !isStemCollapsed,
          'lg:w-10': isStemCollapsed,
          'h-auto': !isStemCollapsed || isMobile,
          'h-10': isStemCollapsed && !isMobile
        }"
      >
        <!-- 收缩按钮 - 桌面端显示左右按钮 -->
        <Button
          :icon="isStemCollapsed ? 'pi pi-chevron-right' : 'pi pi-chevron-left'"
          class="p-button-rounded p-button-text stem-toggle-btn hidden lg:block"
          @click="toggleStem"
          :aria-label="isStemCollapsed ? '展开公共题干' : '收起公共题干'"
        />
        
        <!-- 收缩按钮 - 移动端显示上下按钮 -->
        <Button
          :icon="isStemCollapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up'"
          class="p-button-rounded p-button-text stem-toggle-btn-mobile lg:hidden"
          @click="toggleStem"
          :aria-label="isStemCollapsed ? '展开公共题干' : '收起公共题干'"
        />
        
        <!-- 公共题干内容区域 -->
        <div 
          class="shared-stem-content p-3 bg-surface-100 dark:bg-surface-700 rounded-lg"
          :class="{'hidden': isStemCollapsed}"
        >
          <div class="text-lg font-medium mb-2">公共题干</div>
          <div v-html="questionGroup.shared_stem"></div>
        </div>
      </div>
      
      <!-- 题目列表区域 -->
      <div 
        class="group-questions"
        :class="{
          'lg:w-2/3': questionGroup && questionGroup.shared_stem && !isStemCollapsed,
          'lg:flex-1': !questionGroup || !questionGroup.shared_stem || isStemCollapsed
        }"
      >
        <div v-if="groupQuestions.length > 0">
          <template v-for="(questionItem, index) in groupQuestions" :key="questionItem.id">
            <div class="question-item mb-4 border-l-4 pl-4" :class="getQuestionBorderClass(questionItem)">
              <div class="question-header flex justify-between items-center mb-2">
                <h3 class="text-lg font-medium">{{ questionItem.questions_id.title }}</h3>
                <div class="flex items-center gap-2">
                  <Button
                    :icon="isQuestionFlagged(questionItem) ? 'pi pi-flag-fill' : 'pi pi-flag'"
                    :class="{ 'p-button-danger': isQuestionFlagged(questionItem) }"
                    class="p-button-rounded p-button-sm p-button-text"
                    @click="toggleQuestionFlag(questionItem)"
                    :aria-label="isQuestionFlagged(questionItem) ? '取消标记疑问' : '标记疑问'"
                    v-tooltip.bottom="isQuestionFlagged(questionItem) ? '取消标记疑问' : '标记疑问'"
                  />
                  <div class="score-label" :class="getQuestionScoreSeverity(questionItem)">
                    {{ getQuestionScoreDisplay(questionItem) }}
                  </div>
                </div>
              </div>
              <QuestionContent 
                :selectedQuestion="enhanceQuestionWithIndex(questionItem, index)" 
                :exam_page_mode="exam_page_mode"
              />
            </div>
          </template>
        </div>
        <div v-else class="text-center p-4 text-surface-500">
          未找到题组内容
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import type { QuestionGroups, Questions, QuestionResults } from '~/types/directus_types';
import QuestionContent from '~/components/QuestionContent.vue';

const props = defineProps<{
  questionGroup: QuestionGroups | null;
  practiceSessionId: string;
  questionResults: QuestionResults[];
  exam_page_mode: string;
  groupQuestions?: any[]; // 接收从父组件传递的题组内题目列表
}>();

const emit = defineEmits(['flag-question']);

// 控制公共题干区域的收缩状态
const isStemCollapsed = ref(false);
const isMobile = ref(false);

// 收缩/展开公共题干
const toggleStem = () => {
  isStemCollapsed.value = !isStemCollapsed.value;
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
      is_flagged: updatedFlag
    };
    
    const response = await updateItem({
      collection: "question_results",
      id: question.result.id,
      item: submitted_flag,
    });
    
    console.log(`题目已${updatedFlag ? '标记' : '取消标记'}为疑问:`, response);
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
  window.addEventListener('resize', checkMobile);
  
  // 组件卸载时移除事件监听
  onUnmounted(() => {
    window.removeEventListener('resize', checkMobile);
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

/* 公共题干容器样式 */
.shared-stem-container {
  position: relative;
  transition: all 0.3s ease;
  background-color: var(--surface-50);
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* 收缩按钮样式 - 桌面端 */
.stem-toggle-btn {
  position: absolute;
  right: -15px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  background-color: var(--surface-card);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 收缩按钮样式 - 移动端 */
.stem-toggle-btn-mobile {
  position: absolute;
  right: 10px;
  top: 0;
  z-index: 10;
  background-color: var(--surface-card);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 题目内容区域样式 */
.group-questions {
  transition: all 0.3s ease;
}

.question-item {
  transition: background-color 0.2s;
}

:deep(.p-tag) {
  font-size: 0.8rem;
}

/* 确保题目内容区域相互隔离，防止DOM事件冒泡导致的选项混淆 */
:deep(.group-question-item) {
  isolation: isolate;
}

@media (prefers-color-scheme: dark) {
  .shared-stem-container {
    background-color: var(--surface-800);
  }
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .shared-stem-container {
    margin-bottom: 15px;
  }
  
  .stem-toggle-btn-mobile {
    top: 5px;
  }
}
</style> 