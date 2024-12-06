<!-- components/CommonQuestionContent.vue -->
<!-- 这里是公共题干 -->
<template>
    <div class="card">
        <h4>公共题干</h4>
        <p>{{ selectedSubmittedQuestion.question.question_group.shared_stem }}</p>
    </div>
</template>

<script setup>
const props = defineProps({
    selectedSubmittedQuestion: Object,
});

</script>
