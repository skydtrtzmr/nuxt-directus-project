<template>
    <div
        class="exam-info py-1 px-2 rounded-md shadow-sm bg-surface-50 dark:bg-surface-800"
    >
        <div class="flex items-center justify-between">
            <div class="overflow-hidden">
                <h2 class="text-base font-semibold flex items-center truncate">
                    <i class="pi pi-id-card text-primary mr-1 text-lg flex-shrink-0"></i>
                    <span class="truncate">{{ getExamTitle() }}</span>
                </h2>
                <div class="flex flex-wrap gap-1 text-xs text-surface-600 dark:text-surface-400">
                    <span class="inline-flex items-center">
                        <i class="pi pi-clock text-blue-500 mr-1"></i>
                        <span>{{ formattedDuration }}</span>
                    </span>
                </div>
            </div>
            <Tag severity="info" class="text-xs px-1 py-0 rounded-full flex-shrink-0">
                {{ getShortExamDate() }}
            </Tag>
        </div>
    </div>
</template>

<script setup lang="ts">
import type {
    PracticeSessions,
    ExercisesStudents,
    Students,
    Exercises,
} from "~~/types/directus_types";
import { computed, watchEffect, ref } from "vue";

const props = defineProps<{
    practiceSession: PracticeSessions;
}>();

// 使用ref存储计算结果，使其可以在数据加载后更新
const duration = ref("60分钟");

// 获取考试标题
const getExamTitle = () => {
    if (!props.practiceSession?.exercises_students_id) return "考试信息";

    const esId = props.practiceSession.exercises_students_id;
    if (typeof esId === "object" && "exercises_id" in esId) {
        const exerciseId = esId.exercises_id;
        if (
            typeof exerciseId === "object" &&
            exerciseId &&
            "title" in exerciseId
        ) {
            return exerciseId.title || "考试信息";
        }
    }

    return "考试信息";
};

// 使用watchEffect监听数据变化，计算考试时长
watchEffect(() => {
    try {
        // 检查属性链上的每个对象是否存在
        const exercisesStudents = props.practiceSession?.exercises_students_id;
        if (!exercisesStudents || typeof exercisesStudents !== "object") {
            duration.value = "60分钟"; // 默认值
            return;
        }

        const exercisesId = (exercisesStudents as ExercisesStudents)
            ?.exercises_id;
        if (!exercisesId || typeof exercisesId !== "object") {
            duration.value = "60分钟"; // 默认值
            return;
        }

        // 安全获取时长
        const durationValue = (exercisesId as Exercises)?.duration || 60; // 默认60分钟

        if (durationValue >= 60) {
            const hours = Math.floor(durationValue / 60);
            const minutes = durationValue % 60;
            duration.value = `${hours}小时${
                minutes > 0 ? ` ${minutes}分钟` : ""
            }`;
        } else {
            duration.value = `${durationValue}分钟`;
        }
    } catch (error) {
        console.error("计算考试时长时出错:", error);
        duration.value = "60分钟"; // 出错时返回默认值
    }
});

// 格式化考试时长
const formattedDuration = computed(() => duration.value);

// 获取考试日期（简短版本）
const getShortExamDate = () => {
    if (!props.practiceSession?.exercises_students_id) return "";

    const esId = props.practiceSession.exercises_students_id;
    if (typeof esId === "object" && "exercises_id" in esId) {
        const exerciseId = esId.exercises_id;
        if (
            typeof exerciseId === "object" &&
            exerciseId &&
            "created_at" in exerciseId
        ) {
            const date = new Date(exerciseId.created_at as string);
            return date.toLocaleDateString("zh-CN", {
                month: "numeric",
                day: "numeric",
            });
        }
    }

    return "";
};

// 获取考试日期（完整版本）
const getExamDate = () => {
    if (!props.practiceSession?.exercises_students_id) return "";

    const esId = props.practiceSession.exercises_students_id;
    if (typeof esId === "object" && "exercises_id" in esId) {
        const exerciseId = esId.exercises_id;
        if (
            typeof exerciseId === "object" &&
            exerciseId &&
            "created_at" in exerciseId
        ) {
            return formatDate(exerciseId.created_at as string);
        }
    }

    return "";
};


// 格式化日期
const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
};
</script>

<style scoped>
.exam-info {
    border: 1px solid var(--surface-border);
    transition: all 0.3s ease;
}

@media (hover: hover) {
    .exam-info:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
    }
}

@media screen and (max-width: 640px) {
    .exam-info {
        font-size: 0.75rem;
    }
    
    h2 {
        max-width: 200px;
    }
}
</style>
