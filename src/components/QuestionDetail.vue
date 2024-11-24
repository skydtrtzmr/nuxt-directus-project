<!-- components/QuestionDetail.vue -->
<!-- 题目详情页。这里是包含整个题目详情的页面，包括题目所属的章节、公共题干、题目内容、答题区、 -->
<template>
    <div class="main-content">
        <div v-if="selectedSubmittedQuestion">
            <h2>
                {{
                    selectedSubmittedQuestion.submitted_paper_chapter
                        .source_paper_prototype_chapter.title
                }}
            </h2>
            <p>
                {{
                    selectedSubmittedQuestion.submitted_paper_chapter
                        .source_paper_prototype_chapter.description
                }}
            </p>
            <hr />
            <h3>题目详情</h3>
            <div
                :class="{
                    'desktop-layout': isDesktop,
                    'mobile-layout': !isDesktop,
                }"
            >
                <!-- 电脑端：左侧是公共题干，右侧是题目内容 -->
                <div v-if="isDesktop" class="desktop-left">
                    <CommonQuestionContent
                        v-if="selectedSubmittedQuestion.question.question_group"
                        :selectedSubmittedQuestion="selectedSubmittedQuestion"
                    />
                </div>

                <!-- 竖线分割 -->
                <!-- TODO 这个竖线分割还没有生效…… -->
                <div v-if="isDesktop" class="desktop-divider"></div>

                <!-- 右侧：题目内容 -->
                <div v-if="isDesktop" class="desktop-right">
                    <QuestionContent
                        :selectedSubmittedQuestion="selectedSubmittedQuestion"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from "vue";
import CommonQuestionContent from "./CommonQuestionContent.vue";
import QuestionContent from "./QuestionContent.vue";
const props = defineProps({
    selectedSubmittedQuestion: Object | null,
});

const selectedAnswer = ref("");
const isDesktop = computed(() => window.innerWidth > 1024); // 根据屏幕大小判断是否为电脑端
</script>

<style scoped>
.desktop-layout {
    display: flex;
}

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
