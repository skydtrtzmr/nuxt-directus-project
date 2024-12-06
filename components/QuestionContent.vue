<!-- components/QuestionContent.vue -->
<!-- 在这里进行题型的判断，根据题型渲染不同的组件 -->
<template>
    <div v-if="selectedSubmittedQuestion.question_type === 'q_mc_single'">
        <QMcSingle
            :selectedSubmittedQuestion="selectedSubmittedQuestion"
            :showResult="false"
        />
    </div>
    <div v-if="selectedSubmittedQuestion.question_type === 'q_mc_multi'">
        <QMcMulti
            :selectedSubmittedQuestion="selectedSubmittedQuestion"
            :showResult="false"
        />
    </div>
    <div v-if="selectedSubmittedQuestion.question_type === 'q_mc_binary'">
        <QMcBinary
            :selectedSubmittedQuestion="selectedSubmittedQuestion"
            :showResult="false"
        />
    </div>
    <div v-if="selectedSubmittedQuestion.question_type === 'q_mc_flexible'">
        <QMcFlexible
            :selectedSubmittedQuestion="selectedSubmittedQuestion"
            :showResult="false"
        />
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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Only for testing
// 以下仅供测试用，每次切换题目时，做题。
watch(() => props.selectedSubmittedQuestion, async () => {
    await delay(1000);
    console.log("selectedSubmittedQuestion changed");
    console.log(props.selectedSubmittedQuestion);
    
    
})
</script>

<style scoped></style>
