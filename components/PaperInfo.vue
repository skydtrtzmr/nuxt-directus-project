<template>
    <div
        v-if="paper"
        class="paper-info py-1 px-2 bg-transparent"
    >
        <div class="flex items-center justify-between">
            <div class="flex-1 text-center flex items-center justify-center">
                <div class="flex items-center overflow-hidden">
                    <!-- <i class="pi pi-file-pdf text-primary mr-1 text-lg flex-shrink-0"></i> -->
                    <h3 class="text-base font-medium truncate">{{ paper.title }}</h3>
                </div>
            </div>
            
            <div class="flex gap-2 text-xs text-surface-600 dark:text-surface-400 flex-shrink-0">
                <div class="flex items-center">
                    <i class="pi pi-star-fill text-yellow-500 mr-1"></i>
                    <span>{{ paper.total_point_value }}分</span>
                </div>
                <div class="flex items-center">
                    <i class="pi pi-list text-primary mr-1"></i>
                    <span>{{ paper.total_question_count }}题</span>
                </div>
                <!-- <Tag severity="info" class="text-xs px-1 py-0 rounded-full">
                    {{ formatCurrentDate() }}
                </Tag> -->
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

// 格式化当前日期 (简短版本)
const formatShortDate = () => {
    const date = new Date();
    return date.toLocaleDateString("zh-CN", {
        month: "numeric",
        day: "numeric",
    });
};

// 完整日期 (需要时可使用)
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
    transition: all 0.3s ease;
}

@media (hover: hover) {
    .paper-info:hover {
        transform: translateY(-1px);
    }
}

@media screen and (max-width: 640px) {
    .paper-info {
        font-size: 0.75rem;
    }
    
    h3 {
        max-width: 150px;
    }
}
</style>
