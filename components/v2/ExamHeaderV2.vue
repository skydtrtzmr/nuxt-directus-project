<!-- components/v2/ExamHeaderV2.vue -->
<template>
    <header class="exam-header-v2">
        <div class="header-content">
            <!-- 左侧：考试标题 -->
            <div class="header-left">
                <h1 class="exam-title">{{ examTitle }}</h1>
            </div>

            <!-- 中间：倒计时 -->
            <div class="header-center">
                <div v-if="exam_page_mode !== 'review'" class="countdown-timer">
                    <i class="pi pi-clock" />
                    <span>{{ formattedCountDown }}</span>
                </div>
                <div v-else class="review-score">
                    <span>总分: {{ paper.total_point_value }}</span>
                    <span class="text-emerald-400">得分: {{ examScore }}</span>
                </div>
            </div>

            <!-- 右侧：用户信息和操作 -->
            <div class="header-right">
                <div class="user-info">
                    <i class="pi pi-user" />
                    <span>{{ studentData.name }}</span>
                </div>
                <Button
                    v-if="exam_page_mode !== 'review'"
                    label="交卷"
                    icon="pi pi-send"
                    severity="danger"
                    @click="onSubmit"
                    size="small"
                />
            </div>
        </div>
    </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PracticeSessions, Papers } from "~~/types/directus_types";

const props = defineProps<{
    exam_page_mode: string;
    practiceSession: any;
    paper: Papers;
    formattedCountDown: string;
    examScore?: number | null;
    studentData: {
        name: string;
        student_number: number;
    };
}>();

const emit = defineEmits<{
    (e: 'submit'): void;
}>();

const examTitle = computed(() => {
    return props.practiceSession?.["exercises_students_id__exercises_id__title"] || "在线考试";
});

const onSubmit = () => {
    emit('submit');
};
</script>

<style scoped>
.exam-header-v2 {
    padding: 0 1.5rem;
    height: 60px;
    background-color: var(--surface-card);
    border-bottom: 1px solid var(--surface-border);
    display: flex;
    align-items: center;
    flex-shrink: 0;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}

.header-left, .header-center, .header-right {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.exam-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.countdown-timer {
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--primary-color);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background-color: var(--surface-hover);
    border-radius: var(--border-radius);
}

.review-score {
    display: flex;
    gap: 1rem;
    font-size: 1rem;
    font-weight: 500;
}

.user-info {
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

@media screen and (max-width: 768px) {
    .exam-header-v2 {
        height: auto;
        padding: 0.75rem;
    }
    .header-content {
        flex-direction: column;
        gap: 0.75rem;
    }
    .header-left, .header-center, .header-right {
        width: 100%;
        justify-content: space-between;
    }
    .exam-title {
        font-size: 1rem;
    }
}
</style> 