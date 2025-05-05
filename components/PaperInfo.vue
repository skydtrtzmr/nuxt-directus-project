<template>
    <div
        v-if="paper"
        class="paper-info rounded-lg bg-surface-50 dark:bg-surface-800 p-4"
    >
        <div class="flex flex-col sm:flex-row justify-between gap-3">
            <div>
                <h3 class="text-xl font-semibold mb-2 flex items-center">
                    <i class="pi pi-file-pdf text-primary mr-2"></i>
                    {{ paper.title }}
                </h3>
                <div
                    class="flex flex-wrap items-center text-surface-600 dark:text-surface-400 gap-3"
                >
                    <div class="flex items-center">
                        <i class="pi pi-star-fill text-yellow-500 mr-2"></i>
                        <span>试卷总分: {{ paper.total_point_value }}</span>
                    </div>
                    <div class="flex items-center">
                        <i class="pi pi-list text-primary mr-2"></i>
                        <span>总题数: {{ paper.total_question_count }}</span>
                    </div>
                </div>
            </div>
            <div class="paper-actions mt-2 sm:mt-0">
                <div class="flex items-center justify-end">
                    <Tag severity="info" class="text-sm px-3 py-2 rounded-full">
                        <template #icon>
                            <i class="pi pi-calendar mr-1"></i>
                        </template>
                        {{ formatCurrentDate() }}
                    </Tag>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Courses, Papers } from "~~/types/directus_types";
import { computed } from "vue";

const props = defineProps<{
    paper: Papers;
}>();

console.log("paperinfo:", props.paper);

// 格式化当前日期
const formatCurrentDate = () => {
    const date = new Date();
    return date.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
};
</script>

<style scoped>
.paper-info {
    border: 1px solid var(--surface-border);
    transition: all 0.3s ease;
}

@media (hover: hover) {
    .paper-info:hover {
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
    }
}
</style>
