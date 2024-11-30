<!-- components/QuestionContent.vue -->
<!-- 在这里进行题型的判断，根据题型渲染不同的组件 -->
<template>
    <div
        v-if="
            typeof selectedSubmittedQuestion.question === 'object' &&
            selectedSubmittedQuestion.question_type === 'q_mc_single' &&
        "
    >
        <QMcSingle :selectedSubmittedQuestion="selectedSubmittedQuestion" />
    </div>
</template>

<script setup lang="ts">
import QMcSingle from "~/components/question_type/QMcSingle.vue";
import type { SubmittedQuestions } from "~/types/directus_types.js";
const props = defineProps<{
    selectedSubmittedQuestion: SubmittedQuestions;
}>();
</script>

<style scoped></style>
