<template>
    <div
        class="exam-info p-4 mb-4 rounded-lg shadow-sm bg-surface-50 dark:bg-surface-800"
    >
        <div
            class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
            <div class="flex flex-col">
                <h2 class="text-xl font-semibold mb-2">
                    {{ getExamTitle() }}
                </h2>
                <div class="text-sm text-surface-600 dark:text-surface-400">
                    <span class="inline-flex items-center gap-2 mr-4">
                        <i class="pi pi-id-card"></i>
                        <span>考试ID: {{ practiceSession?.id }}</span>
                    </span>
                    <span
                        v-if="hasStudentInfo"
                        class="inline-flex items-center gap-2"
                    >
                        <i class="pi pi-user"></i>
                        <span>考生: {{ getStudentName() }}</span>
                    </span>
                    <div class="flex items-center">
                        <i class="pi pi-clock text-blue-500 mr-2"></i>
                        <span>时长: {{ formattedDuration }}</span>
                    </div>
                </div>
            </div>
            <Tag severity="info" class="text-sm px-3 py-2 rounded-full">
                {{ getExamDate() }}
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
import { computed } from "vue";

const props = defineProps<{
    practiceSession: PracticeSessions;
}>();

// 判断是否有学生信息
const hasStudentInfo = computed(() => {
    if (!props.practiceSession) return false;

    const esId = props.practiceSession.exercises_students_id;
    if (!esId) return false;

    // 判断是否为对象，并且有students_id属性
    if (typeof esId === "object" && "students_id" in esId) {
        const studentId = esId.students_id;
        return typeof studentId === "object" && studentId !== null;
    }

    return false;
});

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

// 格式化考试时长
const formattedDuration = computed(() => {
    // 查找考试时长相关属性
    const durationValue =
        (
            (props.practiceSession.exercises_students_id as ExercisesStudents)
                .exercises_id! as Exercises
        ).duration || 60; // 默认60分钟

    if (durationValue >= 60) {
        const hours = Math.floor(durationValue / 60);
        const minutes = durationValue % 60;
        return `${hours}小时${minutes > 0 ? ` ${minutes}分钟` : ""}`;
    } else {
        return `${durationValue}分钟`;
    }
});

// 获取考试日期
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

// 获取学生姓名
const getStudentName = () => {
    if (!hasStudentInfo.value) return "";

    const esId = props.practiceSession
        .exercises_students_id as ExercisesStudents;
    const student = esId.students_id as Students;

    return student.name || "";
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
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
}
</style>
