<template>
    <div
        v-if="paper"
        class="paper-info py-1 px-2 bg-transparent"
    >
        <div class="flex items-center justify-between gap-2">
            <div class="flex-1 min-w-0">
                <div class="flex items-center justify-center">
                    <h3 class="paper-title text-base font-medium text-center">{{ paper.title }}</h3>
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

// console.log("paperinfo:", props.paper);

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

.paper-title {
    line-height: 1.3;
    word-break: break-word;
    hyphens: auto;
}

@media (hover: hover) {
    .paper-info:hover {
        transform: translateY(-1px);
    }
}

/* 移动端优化 */
@media screen and (max-width: 768px) {
    .paper-info {
        font-size: 0.875rem;
        padding: 0.375rem 0.5rem;
    }
    
    .paper-title {
        font-size: 0.875rem;
        line-height: 1.2;
    }
    
    /* 在移动端允许标题换行而不是截断 */
    .flex.items-center.justify-between {
        flex-direction: column;
        gap: 0.375rem;
        align-items: center;
    }
    
    .flex-1.min-w-0 {
        width: 100%;
    }
}

@media screen and (max-width: 640px) {
    .paper-info {
        font-size: 0.8rem;
    }
    
    .paper-title {
        font-size: 0.8rem;
        max-width: none; /* 移除最大宽度限制 */
    }
}

/* 超小屏幕 */
@media screen and (max-width: 480px) {
    .paper-title {
        font-size: 0.75rem;
    }
    
    .flex.gap-2 {
        gap: 0.25rem;
    }
    
    .flex.gap-2 span {
        font-size: 0.7rem;
    }
}
</style>
