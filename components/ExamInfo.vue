<template>
    <!-- <h2>考试详情</h2> -->

    <p>考试ID: {{ submittedExam?.id }}</p>
    <p>考试名称：{{ submittedExam?.title }}</p>
    <p
        v-if="
            submittedExam &&
            submittedExam.student &&
            typeof submittedExam.student == 'object'
        "
    >
        <!-- NOTE：注意这里必须直接从submittedExam.student获取，而不能获取登录的用户信息。
            因为考试详情页面并非只有考生本人才能查看，教师也可以查看。 -->
        当前考生：{{ submittedExam?.student.name }}
    </p>
</template>

<script setup lang="ts">
import type { PracticeSessions } from "~~/types/directus_types";
defineProps<{
    submittedExam: PracticeSessions;
}>();
</script>

<style scoped></style>
