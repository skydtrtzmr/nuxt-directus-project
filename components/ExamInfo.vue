<template>
    <div class="exam-info py-1 px-2 bg-transparent">
        <div class="flex items-center justify-between h-full">
            <div
                class="overflow-hidden flex-1 text-center flex items-center justify-center pt-2"
            >
                <h2
                    class="text-lg font-semibold flex items-center justify-center truncate"
                >
                    <!-- <i class="pi pi-id-card text-primary mr-1 text-lg flex-shrink-0"></i> -->
                    <span class="truncate">{{ getExamTitle() }}</span>
                </h2>
            </div>
            <div class="flex items-center gap-2">
                <span
                    class="inline-flex items-center text-xs text-surface-600 dark:text-surface-400"
                >
                    <i class="pi pi-clock text-blue-500 mr-1"></i>
                    <span>{{ formattedDuration }}</span>
                </span>
                <!-- <Tag severity="info" class="text-xs px-1 py-0 rounded-full flex-shrink-0">
                    {{ getShortExamDate() }}
                </Tag> -->
            </div>
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
    // practiceSession: PracticeSessions;
    practiceSession: any;
    // [2025-06-03] 目前这个不是标准结构，而是被我扁平化处理的。
    // TODO 以后这个估计要大改，改成exam考试和practice练习各自独立。
}>();

// 使用ref存储计算结果，使其可以在数据加载后更新
const duration = ref("60分钟");

// 获取考试标题
const getExamTitle = () => {
    if (
        !props.practiceSession ||
        props.practiceSession === null ||
        props.practiceSession === undefined
    )
        return "考试信息";

    return props.practiceSession["exercises_students_id-exercises_id-title"];
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

        // console.log("durationValue", durationValue);

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
    transition: all 0.3s ease;
}

@media (hover: hover) {
    .exam-info:hover {
        transform: translateY(-1px);
    }
}

@media screen and (max-width: 640px) {
    .exam-info {
        font-size: 0.75rem;
    }

    h2 {
        max-width: 200px;
        font-size: 0.875rem !important;
    }
}
</style>
