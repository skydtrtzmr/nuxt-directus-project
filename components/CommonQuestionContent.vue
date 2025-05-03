<!-- components/CommonQuestionContent.vue -->
<template>
    <div class="common-question-content">
        <!-- 单题模式下的公共题干 -->
        <div v-if="question && question.question_group">
            <div class="text-lg font-medium mb-2">公共题干</div>
            <div v-if="groupSharedStem" v-html="groupSharedStem" class="stem-content"></div>
        </div>
        
        <!-- 题组模式下的公共题干 -->
        <div v-else-if="questionGroup && questionGroup.shared_stem">
            <div class="text-lg font-medium mb-2">公共题干</div>
            <div v-html="questionGroup.shared_stem" class="stem-content"></div>
        </div>
        
        <!-- 如果没有公共题干 -->
        <div v-else class="text-center text-surface-500">
            无公共题干
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Questions, QuestionGroups } from "~/types/directus_types";

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
</script>

<style scoped>
.common-question-content {
    height: 100%;
    overflow-y: auto;
}

.stem-content {
    white-space: pre-wrap;
}
</style>
