<!-- components/QuestionDetail.vue -->
<!-- 题目详情页。这里是包含整个题目详情的页面，包括题目所属的章节、公共题干、题目内容、答题区、 -->
<template>
    <div class="main-content">
        <div v-if="selectedSubmittedQuestion" class="h-full">
            <h3 class="m-4 red-text">
                {{
                    selectedSubmittedQuestion.submitted_paper_chapter
                        .source_paper_prototype_chapter.title
                }}
            </h3>
            <p>
                {{
                    selectedSubmittedQuestion.submitted_paper_chapter
                        .source_paper_prototype_chapter.description
                }}
            </p>
            <Divider />
            <br />
            <div class="flex flex-row gap-4 h-full">
                <!-- 公共题干 -->
                <CommonQuestionContent
                    class="basis-2/5 h-full"
                    v-if="selectedSubmittedQuestion.question.question_group"
                    :selectedSubmittedQuestion="selectedSubmittedQuestion"
                />

                <Divider
                    layout="vertical"
                    v-if="selectedSubmittedQuestion.question.question_group"
                />

                <!-- 题目内容 -->
                <QuestionContent
                    class="basis-3/5 h-full"
                    :selectedSubmittedQuestion="selectedSubmittedQuestion"
                    :disableAnswer="disableAnswer"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import CommonQuestionContent from "~/components/CommonQuestionContent.vue";
import QuestionContent from "~/components/QuestionContent.vue";

const props = defineProps<{
    selectedSubmittedQuestion: object | null;
    exam_page_mode: string;
}>();

</script>

<style scoped>
.desktop-left {
    flex: 1;
    /* padding-right: 20px;  */
}

.desktop-right {
    flex: 2;
}

.desktop-left,
.desktop-right {
    vertical-align: top;
    padding: 10px;
}

.desktop-divider {
    width: 10px; /* 设置竖线的宽度 */
    background-color: #1d1a1a; /* 设置竖线的颜色 */
    height: 100%; /* 使竖线充满整个高度 */
}

.mobile-layout {
    display: block;
}

.mobile-layout .desktop-left,
.mobile-layout .desktop-right {
    width: 100%;
}
</style>
