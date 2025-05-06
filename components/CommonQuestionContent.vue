<!-- components/CommonQuestionContent.vue -->
<template>
    <div class="common-question-content">
        <!-- 单题模式下的公共题干 -->
        <div v-if="question && question.question_group">
            <div class="text-lg font-medium mb-2">测试公共题干</div>
            <div v-if="groupSharedStem" v-html="renderMarkdown(groupSharedStem)" class="stem-content"></div>
        </div>
        
        <!-- 题组模式下的公共题干 -->
        <div v-else-if="questionGroup && questionGroup.shared_stem">
            <div class="text-lg font-medium mb-2">测试公共题干</div>
            <div v-html="renderMarkdown(questionGroup.shared_stem)" class="stem-content"></div>
        </div>
        
        <!-- 如果没有公共题干 -->
        <div v-else class="text-center text-surface-500">
            测试无公共题干
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Questions, QuestionGroups } from "~/types/directus_types";

// 使用require导入markdown-it避开类型检查问题
const MarkdownIt = require('markdown-it');

// 创建markdown-it实例
const md = new MarkdownIt({
    html: true,
    breaks: true,
    linkify: true
});

const props = defineProps<{
    question?: Questions | null;
    questionGroup?: QuestionGroups | null;
}>();

// 获取题目所属题组的shared_stem，处理question_group可能是string的情况
const groupSharedStem = computed(() => {
    if (!props.question || !props.question.question_group) return null;
    
    // 如果question_group是对象，直接获取shared_stem
    if (typeof props.question.question_group === 'object' && props.question.question_group !== null) {
        return props.question.question_group.shared_stem;
    }
    
    // 如果question_group是字符串ID，无法获取shared_stem
    return null;
});

// 渲染markdown内容为HTML
const renderMarkdown = (content: string) => {
    if (!content) return '';
    return md.render(content);
};
</script>

<style scoped>
.common-question-content {
    height: 100%;
    overflow-y: auto;
}

.stem-content {
    white-space: pre-wrap;
}

/* 添加一些markdown样式 */
.stem-content :deep(h1),
.stem-content :deep(h2),
.stem-content :deep(h3),
.stem-content :deep(h4),
.stem-content :deep(h5),
.stem-content :deep(h6) {
    margin-top: 1em;
    margin-bottom: 0.5em;
    font-weight: bold;
}

.stem-content :deep(p) {
    margin-bottom: 1em;
}

.stem-content :deep(ul),
.stem-content :deep(ol) {
    padding-left: 2em;
    margin-bottom: 1em;
}

.stem-content :deep(code) {
    background-color: rgba(0, 0, 0, 0.05);
    padding: 0.2em 0.4em;
    border-radius: 3px;
}

.stem-content :deep(pre) {
    background-color: rgba(0, 0, 0, 0.05);
    padding: 1em;
    border-radius: 5px;
    overflow-x: auto;
    margin-bottom: 1em;
}

.stem-content :deep(blockquote) {
    border-left: 4px solid #ddd;
    padding-left: 1em;
    color: #666;
    margin-bottom: 1em;
}

.stem-content :deep(img) {
    max-width: 100%;
}

.stem-content :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin-bottom: 1em;
}

.stem-content :deep(th),
.stem-content :deep(td) {
    border: 1px solid #ddd;
    padding: 8px;
}

.stem-content :deep(th) {
    background-color: rgba(0, 0, 0, 0.05);
}
</style>
