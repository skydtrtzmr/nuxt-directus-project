<!-- components/QuestionContent.vue -->
<!-- 在这里进行题型的判断，根据题型渲染不同的组件 -->
<template>
    <div class="question-container">
        <template v-if="selectedQuestion && selectedQuestion.questions_id">
            <!-- 题型标签区域 -->
            <div class="question-type-section">
                <div class="question-type-wrapper">
                    <!-- <div class="question-type-icon">
                        <i :class="getQuestionTypeIcon(selectedQuestion.questions_id.type)"></i>
                    </div> -->
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
    gap: 1.5rem;
}

/* 题型标签区域 */
.question-type-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.5rem;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border: 2px solid var(--p-surface-200);
    border-radius: 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.question-type-wrapper {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.question-type-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, var(--p-primary-500), var(--p-primary-600));
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.25rem;
    box-shadow: 0 4px 12px rgba(var(--p-primary-500-rgb), 0.3);
}

.question-type-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.question-type-label {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--p-surface-800);
}

.question-type-description {
    font-size: 0.875rem;
    color: var(--p-surface-500);
}

.question-type-badge {
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 600;
    color: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 题型标签颜色 */
.tag-blue {
    background: linear-gradient(135deg, var(--p-blue-500), var(--p-blue-600));
}
.tag-green {
    background: linear-gradient(135deg, var(--p-green-500), var(--p-green-600));
}
.tag-orange {
    background: linear-gradient(135deg, var(--p-orange-500), var(--p-orange-600));
}
.tag-purple {
    background: linear-gradient(135deg, var(--p-purple-500), var(--p-purple-600));
}
.tag-gray {
    background: linear-gradient(135deg, var(--p-surface-400), var(--p-surface-500));
}

/* 公共题干区域 */
.shared-stem-section {
    background: white;
    border: 2px solid var(--p-amber-200);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.shared-stem-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    background: linear-gradient(135deg, var(--p-amber-50), var(--p-amber-100));
    border-bottom: 1px solid var(--p-amber-200);
}

.shared-stem-icon {
    width: 40px;
    height: 40px;
    background: var(--p-amber-500);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.125rem;
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}

.shared-stem-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--p-amber-800);
    margin: 0;
}

.shared-stem-content {
    padding: 1.5rem;
    background: white;
}

/* 题目主要内容区域 */
.question-main-content {
    background: white;
    border: 2px solid var(--p-surface-200);
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    min-height: 200px;
}

/* 未知题型样式 */
.unknown-question-type {
    display: flex;
    gap: 1.5rem;
    padding: 2rem;
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    border: 2px solid var(--p-red-300);
    border-radius: 16px;
    box-shadow: 0 4px 16px rgba(239, 68, 68, 0.15);
}

.unknown-type-icon {
    width: 60px;
    height: 60px;
    background: var(--p-red-500);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.5rem;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.unknown-type-content {
    flex: 1;
}

.unknown-type-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--p-red-700);
    margin: 0 0 0.5rem 0;
}

.unknown-type-message {
    color: var(--p-red-600);
    margin: 0 0 1rem 0;
    line-height: 1.6;
}

.unknown-type-details {
    margin-top: 1rem;
}

.unknown-type-details summary {
    cursor: pointer;
    font-weight: 500;
    color: var(--p-red-700);
    padding: 0.5rem 0;
}

.unknown-type-data {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid var(--p-red-300);
    border-radius: 8px;
    padding: 1rem;
    margin-top: 0.5rem;
    overflow-x: auto;
    font-size: 0.875rem;
    color: var(--p-red-800);
}

/* 加载状态 */
.loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border: 2px solid var(--p-surface-200);
    border-radius: 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.loading-animation {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    text-align: center;
}

.loading-spinner {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, var(--p-primary-500), var(--p-primary-600));
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.5rem;
    box-shadow: 0 4px 16px rgba(var(--p-primary-500-rgb), 0.3);
    animation: pulse 2s infinite;
}

.loading-content {
    max-width: 300px;
}

.loading-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--p-surface-800);
    margin: 0 0 0.5rem 0;
}

.loading-description {
    color: var(--p-surface-500);
    margin: 0;
    line-height: 1.6;
}

@keyframes pulse {
    0%, 100% {
        transform: scale(1);
        opacity: 1;
    }
    50% {
        transform: scale(1.05);
        opacity: 0.8;
    }
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
    .question-container {
        gap: 1rem;
    }
    
    .question-type-section {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
    }
    
    .question-type-wrapper {
        flex-direction: column;
        text-align: center;
    }
    
    .shared-stem-header {
        flex-direction: column;
        text-align: center;
        gap: 0.75rem;
    }
    
    .unknown-question-type {
        flex-direction: column;
        text-align: center;
    }
    
    .unknown-type-icon {
        align-self: center;
    }
}

/* Markdown 内容样式优化 */
:deep(.markdown-content) {
    line-height: 1.7;
    color: var(--p-surface-700);
}

:deep(.markdown-content) h1,
:deep(.markdown-content) h2,
:deep(.markdown-content) h3,
:deep(.markdown-content) h4,
:deep(.markdown-content) h5,
:deep(.markdown-content) h6 {
    margin-top: 1.5em;
    margin-bottom: 0.75em;
    font-weight: 600;
    color: var(--p-surface-800);
    line-height: 1.4;
}

:deep(.markdown-content) h1 {
    font-size: 1.875rem;
}

:deep(.markdown-content) h2 {
    font-size: 1.5rem;
}

:deep(.markdown-content) h3 {
    font-size: 1.25rem;
}

:deep(.markdown-content) p {
    margin-bottom: 1.2em;
    line-height: 1.7;
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
    background: var(--p-surface-100);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-family: 'JetBrains Mono', 'Consolas', monospace;
    color: var(--p-surface-800);
    font-size: 0.875em;
}

:deep(.markdown-content) pre {
    background: var(--p-surface-50);
    padding: 1.5rem;
    border-radius: 12px;
    overflow-x: auto;
    margin: 1.5rem 0;
    border: 1px solid var(--p-surface-200);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

:deep(.markdown-content) blockquote {
    border-left: 4px solid var(--p-primary-400);
    padding: 1rem 1.5rem;
    background: var(--p-primary-50);
    margin: 1.5rem 0;
    border-radius: 0 12px 12px 0;
    color: var(--p-surface-700);
    position: relative;
}

:deep(.markdown-content) blockquote::before {
    content: '"';
    position: absolute;
    top: -0.5rem;
    left: 1rem;
    font-size: 2rem;
    color: var(--p-primary-400);
    font-weight: bold;
}

:deep(.markdown-content) img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 1.5rem 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

:deep(.markdown-content) table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    background: white;
}

:deep(.markdown-content) th,
:deep(.markdown-content) td {
    padding: 1rem 1.25rem;
    border: 1px solid var(--p-surface-200);
    text-align: left;
}

:deep(.markdown-content) th {
    background: linear-gradient(135deg, var(--p-surface-100), var(--p-surface-150));
    font-weight: 600;
    color: var(--p-surface-800);
}

:deep(.markdown-content) tr:nth-child(even) td {
    background: var(--p-surface-50);
}

:deep(.markdown-content) tr:hover td {
    background: var(--p-primary-50);
    transition: background-color 0.2s ease;
}
</style> 