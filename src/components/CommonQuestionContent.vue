<!-- components/CommonQuestionContent.vue -->
<!-- 这里是公共题干 -->
<template>
    <div>
        <p>公共题干</p>
        <h2>{{ questionTitle }}</h2>
        <p>{{ questionDescription }}</p>
    </div>
</template>

<script setup>
const props = defineProps({
    selectedSubmittedQuestion: Object,
});

const question_shared_stem = props.selectedSubmittedQuestion.question.shared_stem;


</script>
