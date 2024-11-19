<template>
    <button @click="() => createItems">Create items</button>
</template>

<script setup lang="ts">
const { createItems } = useDirectusItems();

interface Question {
    id?: number;
    title: string;
}

const newQuestions: Question[] = [
    { title: "Banana" },
    { title: "Vue.js Handbook"}
];

await createItems<Question>({
    collection: "questions",
    items: newQuestions
});
</script>
