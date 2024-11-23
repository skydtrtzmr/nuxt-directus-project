<!-- components/QuestionCard.vue -->
<template>
    <div class="question-card" @click="handleClick">
        <h4>{{ question.title }}</h4>
        <p>{{ question.description }}</p>
    </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
    question: {
        type: Object,
        required: true
    }
});

const emit = defineEmits();

const handleClick = () => {
    emit('click', props.question);
};
</script>

<style scoped>
.question-card {
    border: 1px solid #ccc;
    padding: 10px;
    margin: 5px 0;
    cursor: pointer;
}
.question-card:hover {
    background-color: #f0f0f0;
}
</style>