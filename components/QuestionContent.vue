<!-- components/QuestionContent.vue -->
<!-- 在这里进行题型的判断，根据题型渲染不同的组件 -->
<template>
    <div v-if="selectedSubmittedQuestion.question_type === 'q_mc_single'">
        <QMcSingle :selectedSubmittedQuestion="selectedSubmittedQuestion" />
    </div>
    <div v-if="selectedSubmittedQuestion.question_type === 'q_mc_multi'">
        <QMcMulti :selectedSubmittedQuestion="selectedSubmittedQuestion" />
    </div>
    <div v-if="selectedSubmittedQuestion.question_type === 'q_mc_binary'">
        <QMcBinary :selectedSubmittedQuestion="selectedSubmittedQuestion" />
    </div>
    <div v-if="selectedSubmittedQuestion.question_type === 'q_mc_flexible'">
        <QMcFlexible :selectedSubmittedQuestion="selectedSubmittedQuestion" />
    </div>
</template>

<script setup lang="ts">
import type { SubmittedQuestions } from "~/types/directus_types.js";
import QMcSingle from "~/components/question_type/QMcSingle.vue";
import QMcMulti from "./question_type/QMcMulti.vue";
import QMcBinary from "./question_type/QMcBinary.vue";
import QMcFlexible from "./question_type/QMcFlexible.vue";
const props = defineProps<{
    selectedSubmittedQuestion: SubmittedQuestions;
}>();
</script>

<style scoped></style>
