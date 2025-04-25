<!-- components/CommonQuestionContent.vue -->
<!-- 这里是公共题干 -->
<template>
    <div class="card">
        <h4>公共题干</h4>
        <p>{{ questionData.question_group.shared_stem }}</p>
    </div>
</template>

<script setup lang="ts">
import type { Questions } from "~~/types/directus_types";

const props = defineProps<{
    questionData: Questions;
}>();
</script>

<style scoped></style>
