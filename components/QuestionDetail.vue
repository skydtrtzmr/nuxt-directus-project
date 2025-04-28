<!-- components/QuestionDetail.vue -->
<!-- 题目详情页。这里是包含整个题目详情的页面，包括题目所属的章节、公共题干、题目内容、答题区、 -->
<template>
    <div class="main-content h-full">
        <div class="h-full">
            <template v-if="selectedQuestion && selectedQuestion.questions_id">
                <h3 class="m-4 text-primary">
                    {{ selectedQuestion.questions_id.title || "试题" }}
                </h3>
                <p>
                    {{ selectedQuestion.questions_id.description || "" }}
                </p>
            </template>
            <Divider />
            <br />
            <div class="flex flex-col lg:flex-row gap-4 h-full">
                <!-- 公共题干 -->
                <CommonQuestionContent
                    class="w-full lg:w-2/5 h-full p-4 bg-surface-50 dark:bg-surface-800 rounded-lg shadow-sm"
                    v-if="selectedQuestion && selectedQuestion.questions_id && selectedQuestion.questions_id.question_group"
                    :question="selectedQuestion.questions_id"
                />

                <Divider
                    layout="horizontal"
                    class="lg:hidden"
                    v-if="selectedQuestion && selectedQuestion.questions_id && selectedQuestion.questions_id.question_group"
                />
                
                <Divider
                    layout="vertical"
                    class="hidden lg:block"
                    v-if="selectedQuestion && selectedQuestion.questions_id && selectedQuestion.questions_id.question_group"
                />

                <!-- 题目内容和答题区 -->
                <div class="w-full lg:w-3/5 h-full p-4 bg-surface-50 dark:bg-surface-800 rounded-lg shadow-sm">
                    <!-- 使用QuestionContent组件 -->
                    <QuestionContent
                        v-if="selectedQuestion"
                        :selectedQuestion="selectedQuestion"
                        :exam_page_mode="exam_page_mode"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { watch } from "vue";
import CommonQuestionContent from "~/components/CommonQuestionContent.vue";
import QuestionContent from "~/components/QuestionContent.vue";

const props = defineProps<{
    selectedQuestion: any | null;
    exam_page_mode: string;
}>();

// 监听选中题目变化
watch(
    () => props.selectedQuestion,
    (newQuestion) => {
        console.log("QuestionDetail - 选中题目更新为:", newQuestion);
    }
);
</script>

<style scoped>
.main-content {
    padding: 20px;
    border-radius: 8px;
    transition: all 0.3s ease;
}

@media screen and (max-width: 768px) {
    .main-content {
        padding: 10px;
    }
}
</style>
