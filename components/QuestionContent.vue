<!-- components/QuestionContent.vue -->
<!-- 在这里进行题型的判断，根据题型渲染不同的组件 -->
<template>
    <div class="question-container">
        <template v-if="selectedQuestion && selectedQuestion.questions_id">
            <div class="question-type-tag-container mb-3">
                <span 
                    class="question-type-tag text-sm font-medium"
                    :class="getQuestionTypeTagClass(selectedQuestion.questions_id.type)"
                >
                    {{ getQuestionTypeLabel(selectedQuestion.questions_id.type) }}
                </span>
            </div>
            <!-- 显示公共题干（如果有） -->
            <div v-if="hasSharedStem" class="shared-stem mb-6 p-4 bg-surface-100 dark:bg-surface-700 rounded-lg shadow-sm">
                <div class="text-lg font-medium mb-3">公共题干</div>
                <div v-html="renderMarkdown(sharedStemContent)" class="markdown-content"></div>
            </div>
            
            <!-- 选择题 -->
            <template v-if="selectedQuestion.questions_id.type">
                <QMcBase
                    :questionData="selectedQuestion"
                    :exam_page_mode="exam_page_mode"
                    :renderMarkdown="renderMarkdown"
                    :questionType="selectedQuestion.questions_id.type"
                />
            </template>
            
            <!-- 未知题型情况 -->
            <template v-else>
                <div class="unknown-question-type">
                    <p class="text-red-500">未知题型: {{ selectedQuestion.questions_id.type }}</p>
                    <pre class="bg-gray-100 p-4 rounded mt-2">{{ selectedQuestion.questions_id }}</pre>
                </div>
            </template>
        </template>
        <template v-else>
            <div class="text-center p-6 text-surface-500 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <i class="pi pi-spin pi-spinner mr-2" style="font-size: 1.5rem"></i>
                正在加载题目数据...
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import type { QuestionResults, QuestionGroups } from "~/types/directus_types";
import QMcSingle from "~/components/question_type/QMcSingle.vue";
import QMcMulti from "~/components/question_type/QMcMulti.vue";
import QMcBinary from "~/components/question_type/QMcBinary.vue";
import QMcFlexible from "~/components/question_type/QMcFlexible.vue";
import QMcBase from "~/components/question_type/QMcBase.vue";

const props = defineProps<{
    selectedQuestion: any | null;
    exam_page_mode: string;
    renderMarkdown: (content: string) => string;
    groupMode: boolean;
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

// Helper function to get question type tag class
const getQuestionTypeTagClass = (type: string): string => {
    switch (type) {
        case "q_mc_single":
            return "tag-blue";
        case "q_mc_multi":
            return "tag-green";
        case "q_mc_binary":
            return "tag-orange";
        case "q_mc_flexible":
            return "tag-purple";
        default:
            return "tag-gray";
    }
};

// 监听props.selectedQuestion的变化，便于调试
// watch(() => props.selectedQuestion, (newVal) => {
//     console.log("selectedQuestion in QuestionContent changed:", newVal);
// }, { immediate: true, deep: true });

// 判断是否有公共题干需要显示
const hasSharedStem = computed(() => {
    // 严格检查 selectedQuestion 是否存在
    if (!props.selectedQuestion) return false;

    // 如果groupMode为true，则已经另外显示了题组题干，这里不需要再显示公共题干
    if (props.groupMode) {
        return false;
    }
    
    // 检查题目是否关联了题组
    if (props.selectedQuestion.questions_id.question_group) {
        return !!(props.selectedQuestion.questions_id.question_group.shared_stem);
    }
    return false;
});

// 获取公共题干内容
const sharedStemContent = computed(() => {
    if (!props.selectedQuestion) return '';
    if (!hasSharedStem.value) return '';
    
    // 从questionGroup获取
    if (props.selectedQuestion.questions_id.question_group && props.selectedQuestion.questions_id.question_group.shared_stem) {
        return props.selectedQuestion.questions_id.question_group.shared_stem;
    }
    
    // 从question_group获取（适应不同的API响应结构）
    if (props.selectedQuestion.questions_id.question_group && 
        typeof props.selectedQuestion.questions_id.question_group === 'object' && 
        props.selectedQuestion.questions_id.question_group.shared_stem) {
        return props.selectedQuestion.questions_id.question_group.shared_stem;
    }
    
    return '';
});
</script>

<style scoped>
.question-container {
    width: 100%;
}

.unknown-question-type {
    border: 2px dashed #ff5252;
    padding: 16px;
    border-radius: 8px;
    margin-top: 20px;
    background-color: rgba(255, 82, 82, 0.05);
}

/* 题型标签通用样式 */
.question-type-tag {
    display: inline-block;
    padding: 0.25rem 0.75rem; /* 稍微增大一点内边距，使其更像标签 */
    border-radius: 0.375rem; /* PrimeVue的 rounded-md */
    color: white;
    font-size: 0.875rem; /* text-sm */
    line-height: 1.25rem;
}

/* 不同题型的颜色 */
.tag-blue {
    background-color: var(--p-blue-500); /* PrimeVue Blue */
}
.tag-green {
    background-color: var(--p-green-500); /* PrimeVue Green */
}
.tag-orange {
    background-color: var(--p-orange-500); /* PrimeVue Orange */
}
.tag-purple {
    background-color: var(--p-purple-500); /* PrimeVue Purple */
}
.tag-gray {
    background-color: var(--p-surface-400); /* PrimeVue Surface/Gray */
}

/* 题干和选项的通用样式 */
:deep(.question-stem) {
    margin-bottom: 2rem;
    padding: 1rem;
    background-color: rgba(var(--surface-50), 0.8);
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

:deep(.options-container) {
    margin-top: 1.5rem;
}

:deep(.option-item) {
    margin-bottom: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    transition: all 0.2s ease;
    border: 1px solid var(--surface-200);
}

:deep(.option-item:hover) {
    background-color: var(--surface-100);
}

:deep(.option-item.selected) {
    border-color: var(--primary-color);
    background-color: rgba(var(--primary-color-rgb), 0.05);
}

/* 优化图片在滚动容器中的显示 */
:deep(.markdown-content img) {
    max-width: 100%;
    height: auto;
}

/* 确保表格在有限宽度内正确显示 */
:deep(.markdown-content table) {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    display: block;
}

/* 优化代码块在滚动容器中的显示 */
:deep(.markdown-content pre) {
    overflow-x: auto;
    max-width: 100%;
}

/* 响应式布局调整 */
@media screen and (max-width: 768px) {
    .question-container {
        padding: 0;
    }
    
    :deep(.question-stem) {
        padding: 0.75rem;
    }
    
    :deep(.option-item) {
        padding: 0.5rem 0.75rem;
    }
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

:deep(.markdown-content) blockquote {
    border-left: 4px solid #ddd;
    padding: 0.8em 1.2em;
    color: #666;
    margin: 1.2em 0;
    background-color: rgba(0, 0, 0, 0.02);
    border-radius: 0 6px 6px 0;
}
</style> 