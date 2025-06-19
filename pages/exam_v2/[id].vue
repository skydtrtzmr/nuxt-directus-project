<template>
    <ExamPageV2 exam_page_mode="exam" />
</template>

<script setup lang="ts">
import ExamPageV2 from '~/components/v2/ExamPageV2.vue';

definePageMeta({
    // middleware: ["auth"],
    layout: "empty", // 考试时全屏显示，不需要侧边栏和顶部导航栏
});
</script> 