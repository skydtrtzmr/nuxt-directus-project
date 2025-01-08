<template>
    <div v-if="submittedPaper">
        <div
            v-if="
                submittedPaper.source_paper_prototype &&
                typeof submittedPaper.source_paper_prototype === 'object'
            "
        >
            <h3>{{ submittedPaper.title }}</h3>
            <p>
                试卷总分:
                {{ submittedPaper.point_value }}
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { SubmittedPapers } from "~~/types/directus_types";

const props = defineProps<{
    submittedPaper: SubmittedPapers | null;
}>();
</script>

<style scoped></style>
