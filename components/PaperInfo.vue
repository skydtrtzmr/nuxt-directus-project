<template>
    <div v-if="paper">
        <h3>{{ paper.title }}</h3>
        <p>试卷总分: {{ paper.total_point_value }}</p>
    </div>
</template>

<script setup lang="ts">
import type { Papers } from "~~/types/directus_types";


const props = defineProps<{
    paper: Papers;
}>();

console.log("paperinfo:", props.paper);

</script>

<style scoped></style>
