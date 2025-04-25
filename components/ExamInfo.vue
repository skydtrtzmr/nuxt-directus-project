<template>
    <!-- <h2>考试详情</h2> -->

    <p>考试ID: {{ submittedExam?.id }}</p>
    <p>考试名称：{{ submittedExam?.title }}</p>
    <p
        v-if="hasStudentInfo"
    >
        <!-- 从exercises_students_id.students_id获取学生信息 -->
        当前考生：{{ getStudentName() }}
    </p>
</template>

<script setup lang="ts">
import type { PracticeSessions, ExercisesStudents, Students } from "~~/types/directus_types";
import { computed } from 'vue';

const props = defineProps<{
    submittedExam: PracticeSessions;
}>();

// 判断是否有学生信息
const hasStudentInfo = computed(() => {
    if (!props.submittedExam) return false;
    
    const esId = props.submittedExam.exercises_students_id;
    if (!esId) return false;
    
    // 判断是否为对象，并且有students_id属性
    if (typeof esId === 'object' && 'students_id' in esId) {
        const studentId = esId.students_id;
        return typeof studentId === 'object' && studentId !== null;
    }
    
    return false;
});

// 获取学生姓名
const getStudentName = () => {
    if (!hasStudentInfo.value) return '';
    
    const esId = props.submittedExam.exercises_students_id as ExercisesStudents;
    const student = esId.students_id as Students;
    
    return student.name || '';
};
</script>

<style scoped></style>
