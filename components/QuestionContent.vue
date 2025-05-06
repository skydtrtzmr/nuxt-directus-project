<!-- components/QuestionContent.vue -->
<!-- 在这里进行题型的判断，根据题型渲染不同的组件 -->
<template>
    <div>
        <template v-if="selectedQuestion && selectedQuestion.questions_id">
            <!-- 显示公共题干（如果有） -->
            <div v-if="hasSharedStem" class="mb-4 p-3 bg-surface-100 dark:bg-surface-700 rounded-lg">
                <div class="text-lg font-medium mb-2">公共题干</div>
                    <div
                        v-html="renderMarkdown(questionGroup.shared_stem)"
                        class="markdown-content"
                    ></div>
            </div>
            
            <!-- 单选题 -->
            <template v-if="selectedQuestion.questions_id.type === 'q_mc_single'">
                <QMcSingle 
                    :questionData="selectedQuestion" 
                    :exam_page_mode="exam_page_mode"
                    :renderMarkdown="renderMarkdown" 
                />
            </template>
            
            <!-- 多选题 -->
            <template v-else-if="selectedQuestion.questions_id.type === 'q_mc_multi'">
                <QMcMulti 
                    :questionData="selectedQuestion" 
                    :exam_page_mode="exam_page_mode"
                    :renderMarkdown="renderMarkdown" 
                />
            </template>
            
            <!-- 判断题 (二元选择) -->
            <template v-else-if="selectedQuestion.questions_id.type === 'q_mc_binary'">
                <QMcBinary 
                    :questionData="selectedQuestion" 
                    :exam_page_mode="exam_page_mode"
                    :renderMarkdown="renderMarkdown" 
                />
            </template>
            
            <!-- 灵活选择题 -->
            <template v-else-if="selectedQuestion.questions_id.type === 'q_mc_flexible'">
                <QMcFlexible 
                    :questionData="selectedQuestion" 
                    :exam_page_mode="exam_page_mode"
                    :renderMarkdown="renderMarkdown" 
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
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { QuestionResults, QuestionGroups } from "~/types/directus_types";
import QMcSingle from "~/components/question_type/QMcSingle.vue";
import QMcMulti from "~/components/question_type/QMcMulti.vue";
import QMcBinary from "~/components/question_type/QMcBinary.vue";
import QMcFlexible from "~/components/question_type/QMcFlexible.vue";

const props = defineProps<{
    questionGroup: QuestionGroups | null;
    selectedQuestion: any | null;
    exam_page_mode: string;
    renderMarkdown: (content: string) => string;
}>();

// 判断是否有公共题干需要显示
const hasSharedStem = computed(() => {
    // 检查题目是否属于题组并且有公共题干
    if (props.questionGroup) {
        // 如果question_group是对象并且有shared_stem属性
        if (typeof props.selectedQuestion.question_group === 'object' && 
            props.selectedQuestion.question_group !== null && 
            props.selectedQuestion.question_group.shared_stem) {
            return true;
        }
    }
    return false;
});

// 获取公共题干内容
const sharedStemContent = computed(() => {
    if (!hasSharedStem.value) return '';
    
    // 从题目的question_group对象中获取shared_stem
    if (typeof props.selectedQuestion.question_group === 'object' && 
        props.selectedQuestion.question_group !== null) {
        return props.selectedQuestion.question_group.shared_stem || '';
    }
    
    return '';
});
</script>

<style scoped>
.unknown-question-type {
    border: 2px dashed #ff5252;
    padding: 16px;
    border-radius: 8px;
    margin-top: 20px;
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