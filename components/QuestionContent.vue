<!-- components/QuestionContent.vue -->
<!-- 在这里进行题型的判断，根据题型渲染不同的组件 -->
<template>
    <div class="question-container">
        <template v-if="selectedQuestion && selectedQuestion.questions_id">
            <!-- 题型标签区域 -->
            <div class="question-type-section">
                <div class="question-type-wrapper">
                    <div class="question-type-icon">
                        <i :class="getQuestionTypeIcon(selectedQuestion.questions_id.type)"></i>
                    </div>
                    <div class="question-type-info">
                        <span class="question-type-label">{{ getQuestionTypeLabel(selectedQuestion.questions_id.type) }}</span>
                        <span class="question-type-description">{{ getQuestionTypeDescription(selectedQuestion.questions_id.type) }}</span>
                    </div>
                </div>
                <div 
                    class="question-type-badge"
                    :class="getQuestionTypeTagClass(selectedQuestion.questions_id.type)"
                >
                    {{ getQuestionTypeLabel(selectedQuestion.questions_id.type) }}
                </div>
            </div>

            <!-- 公共题干显示区域 -->
            <div v-if="hasSharedStem" class="shared-stem-section">
                <div class="shared-stem-header">
                    <div class="shared-stem-icon">
                        <i class="pi pi-file-text"></i>
                    </div>
                    <h3 class="shared-stem-title">公共题干</h3>
                </div>
                <div class="shared-stem-content">
                    <div v-html="renderMarkdown(sharedStemContent)" class="markdown-content"></div>
                </div>
            </div>
            
            <!-- 题目内容区域 -->
            <div class="question-main-content">
                <template v-if="selectedQuestion.questions_id.type">
                    <QMcBase
                        :questionData="selectedQuestion"
                        :exam_page_mode="exam_page_mode"
                        :renderMarkdown="renderMarkdown"
                        :questionType="selectedQuestion.questions_id.type"
                        :currentQuestionResult="currentQuestionResult"
                        :questionResults="props.questionResults"
                    />
                </template>
                
                <!-- 未知题型情况 -->
                <template v-else>
                    <div class="unknown-question-type">
                        <div class="unknown-type-icon">
                            <i class="pi pi-exclamation-triangle"></i>
                        </div>
                        <div class="unknown-type-content">
                            <h4 class="unknown-type-title">未知题型</h4>
                            <p class="unknown-type-message">无法识别的题型: {{ selectedQuestion.questions_id.type }}</p>
                            <details class="unknown-type-details">
                                <summary>查看题目数据</summary>
                                <pre class="unknown-type-data">{{ selectedQuestion.questions_id }}</pre>
                            </details>
                        </div>
                    </div>
                </template>
            </div>
        </template>
        <template v-else>
            <div class="loading-state">
                <div class="loading-animation">
                    <div class="loading-spinner">
                        <i class="pi pi-spin pi-spinner"></i>
                    </div>
                    <div class="loading-content">
                        <h3 class="loading-title">正在加载题目</h3>
                        <p class="loading-description">请稍候，正在获取题目数据...</p>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import QMcBase from "~/components/question_type/QMcBase.vue";
import type { QuestionResults } from "~/types/directus_types";

const props = defineProps<{
    selectedQuestion: any | null;
    exam_page_mode: string;
    renderMarkdown: (content: string) => string;
    groupMode: boolean;
    currentQuestionResult: QuestionResults | null;
    questionResults: QuestionResults[];
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

// Helper function to get question type description
const getQuestionTypeDescription = (type: string): string => {
    switch (type) {
        case "q_mc_single":
            return "从多个选项中选择一个正确答案";
        case "q_mc_multi":
            return "从多个选项中选择多个正确答案";
        case "q_mc_binary":
            return "判断题目陈述的正确性";
        case "q_mc_flexible":
            return "选择一个或多个正确答案";
        default:
            return "题型信息不可用";
    }
};

// Helper function to get question type icon
const getQuestionTypeIcon = (type: string): string => {
    switch (type) {
        case "q_mc_single":
            return "pi pi-circle";
        case "q_mc_multi":
            return "pi pi-stop";
        case "q_mc_binary":
            return "pi pi-question-circle";
        case "q_mc_flexible":
            return "pi pi-th-large";
        default:
            return "pi pi-question";
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
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
}

/* 题型标签区域 */
.question-type-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
}

.question-type-wrapper {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.question-type-icon {
    width: 36px;
    height: 36px;
    background: var(--p-primary-500);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1rem;
    flex-shrink: 0;
}

.question-type-info {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
}

.question-type-label {
    font-size: 1rem;
    font-weight: 600;
    color: #333;
}

.question-type-description {
    font-size: 0.75rem;
    color: #666;
}

.question-type-badge {
    padding: 0.375rem 0.75rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
    color: white;
}

/* 题型标签颜色 */
.tag-blue {
    background: var(--p-blue-500);
}
.tag-green {
    background: var(--p-green-500);
}
.tag-orange {
    background: var(--p-orange-500);
}
.tag-purple {
    background: var(--p-purple-500);
}
.tag-gray {
    background: #666;
}

/* 公共题干区域 */
.shared-stem-section {
    background: white;
    border: 1px solid #f0c674;
    border-radius: 4px;
    overflow: hidden;
}

.shared-stem-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: #fffbf0;
    border-bottom: 1px solid #f0c674;
}

.shared-stem-icon {
    width: 28px;
    height: 28px;
    background: #f0c674;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 0.875rem;
    flex-shrink: 0;
}

.shared-stem-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #8b6914;
    margin: 0;
}

.shared-stem-content {
    padding: 1rem;
    background: white;
}

/* 题目主要内容区域 */
.question-main-content {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 1rem;
    min-height: 200px;
}

/* 未知题型样式 */
.unknown-question-type {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: #fef2f2;
    border: 1px solid #f87171;
    border-radius: 4px;
}

.unknown-type-icon {
    width: 40px;
    height: 40px;
    background: #ef4444;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.125rem;
    flex-shrink: 0;
}

.unknown-type-content {
    flex: 1;
}

.unknown-type-title {
    font-size: 1rem;
    font-weight: 600;
    color: #dc2626;
    margin: 0 0 0.25rem 0;
}

.unknown-type-message {
    color: #dc2626;
    margin: 0 0 0.75rem 0;
    line-height: 1.5;
    font-size: 0.875rem;
}

.unknown-type-details {
    margin-top: 0.75rem;
}

.unknown-type-details summary {
    cursor: pointer;
    font-weight: 500;
    color: #dc2626;
    padding: 0.25rem 0;
    font-size: 0.875rem;
}

.unknown-type-data {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid #f87171;
    border-radius: 4px;
    padding: 0.75rem;
    margin-top: 0.375rem;
    overflow-x: auto;
    font-size: 0.75rem;
    color: #dc2626;
}

/* 加载状态 */
.loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    background: #f5f5f5;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
}

.loading-animation {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    text-align: center;
}

.loading-spinner {
    width: 40px;
    height: 40px;
    background: var(--p-primary-500);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.125rem;
}

.loading-content {
    max-width: 300px;
}

.loading-title {
    font-size: 1rem;
    font-weight: 600;
    color: #333;
    margin: 0 0 0.25rem 0;
}

.loading-description {
    color: #666;
    margin: 0;
    line-height: 1.5;
    font-size: 0.875rem;
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
    .question-container {
        gap: 0.75rem;
        padding: 0.75rem;
    }
    
    .question-type-section {
        flex-direction: column;
        gap: 0.75rem;
        text-align: center;
        padding: 0.75rem;
    }
    
    .question-type-wrapper {
        flex-direction: column;
        text-align: center;
        gap: 0.5rem;
    }
    
    .shared-stem-header {
        flex-direction: column;
        text-align: center;
        gap: 0.5rem;
        padding: 0.75rem;
    }
    
    .unknown-question-type {
        flex-direction: column;
        text-align: center;
        gap: 0.75rem;
    }
    
    .unknown-type-icon {
        align-self: center;
    }
}

/* Markdown 内容样式优化 */
:deep(.markdown-content) {
    line-height: 1.6;
    color: #333;
}

:deep(.markdown-content) h1,
:deep(.markdown-content) h2,
:deep(.markdown-content) h3,
:deep(.markdown-content) h4,
:deep(.markdown-content) h5,
:deep(.markdown-content) h6 {
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    font-weight: 600;
    color: #333;
    line-height: 1.3;
}

:deep(.markdown-content) h1 {
    font-size: 1.5rem;
}

:deep(.markdown-content) h2 {
    font-size: 1.25rem;
}

:deep(.markdown-content) h3 {
    font-size: 1.125rem;
}

:deep(.markdown-content) p {
    margin-bottom: 1em;
    line-height: 1.6;
}

:deep(.markdown-content) ul,
:deep(.markdown-content) ol {
    padding-left: 1.5em;
    margin-bottom: 1em;
    line-height: 1.5;
}

:deep(.markdown-content) li {
    margin-bottom: 0.25em;
}

:deep(.markdown-content) code {
    background: #f5f5f5;
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
    font-family: 'JetBrains Mono', 'Consolas', monospace;
    color: #333;
    font-size: 0.875em;
}

:deep(.markdown-content) pre {
    background: #f5f5f5;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    margin: 1rem 0;
    border: 1px solid #e0e0e0;
}

:deep(.markdown-content) blockquote {
    border-left: 3px solid var(--p-primary-500);
    padding: 0.75rem 1rem;
    background: #f8f9fa;
    margin: 1rem 0;
    border-radius: 0 4px 4px 0;
    color: #333;
}

:deep(.markdown-content) img {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 1rem 0;
}

:deep(.markdown-content) table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
    border-radius: 4px;
    overflow: hidden;
    background: white;
    border: 1px solid #e0e0e0;
}

:deep(.markdown-content) th,
:deep(.markdown-content) td {
    padding: 0.75rem;
    border: 1px solid #e0e0e0;
    text-align: left;
}

:deep(.markdown-content) th {
    background: #f5f5f5;
    font-weight: 600;
    color: #333;
}

:deep(.markdown-content) tr:nth-child(even) td {
    background: #fafafa;
}

:deep(.markdown-content) tr:hover td {
    background: #f0f8ff;
    transition: background-color 0.2s ease;
}
</style> 