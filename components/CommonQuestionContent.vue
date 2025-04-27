<!-- components/CommonQuestionContent.vue -->
<!-- 这里是公共题干 -->
<template>
    <div class="card">
        <h4>公共题干</h4>
        <p>{{ (question.question_group! as QuestionGroups).shared_stem }}</p>
    </div>
</template>

<script setup lang="ts">
import type { Questions, QuestionGroups } from "~~/types/directus_types";

const props = defineProps<{
    question: Questions;
}>();
</script>

<style scoped></style>
