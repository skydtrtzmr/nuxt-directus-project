<template>
  <div>
    <h3>题干</h3>
    <p>{{ question.question }}</p>
    <div v-if="question.option_number">
      <!-- Render options for multiple-choice questions -->
      <div v-for="option in question.options" :key="option">
        <input type="radio" :value="option" v-model="selectedAnswer" /> {{ option }}
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  question: Object,
  selectedAnswer: String,
});
</script>
