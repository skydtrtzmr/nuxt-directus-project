<!-- pages/exam/[id].vue -->
<template>
    <ExamPage :mode="exam_page_mode"/>
</template>

<script setup lang="ts">
// 如果当前用户未登录或者token失效，则跳转到登录页面
definePageMeta({
    middleware: ["auth"],
    layout: "empty", // 考试时全屏显示，不需要侧边栏和顶部导航栏
});

const exam_page_mode = ref("review"); // 考试模式，practice表示练习模式，exam表示考试模式

// 虽然可以在这里获取路由参数传给ExamPage，但是暂时直接让ExamPage自己获取也能用，先不改了。

// // 路由参数：submitted_exam 的 ID
// const route = useRoute();
// // const submitted_exam_id = route.params.id;
// // 加入预处理参数：在路由守卫或组件加载时，无论是单个值还是数组，都统一解析为单个值。
// const submitted_exam_id = Array.isArray(route.params.id)
//     ? route.params.id[0]
//     : route.params.id;
</script>

<style scoped></style>
