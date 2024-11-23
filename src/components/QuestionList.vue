<!-- components/QuestionList.vue -->
<template>
    <div class="sidebar" v-if="submittedPaperChapters.length > 0">
        <h3>章节</h3>
        <ul>
            <li v-for="chapter in submittedPaperChapters" :key="chapter.id">
                <div
                    v-if="
                        chapter.source_paper_prototype_chapter &&
                        typeof chapter.source_paper_prototype_chapter ===
                            'object'
                    "
                >
                    {{ chapter.sort_in_paper }}、{{
                        chapter.source_paper_prototype_chapter.title
                    }}
                </div>
                <h4>{{ chapter.title }}</h4>
                <ul>
                    <!-- 1 章节下的题目列表，列表式 -->
                    <!-- <li
                            v-for="question in chapter.submitted_questions"
                            :key="question.id"
                        >
                            <button @click="selectQuestion(question)">
                                {{ question.sort_in_chapter }}
                            </button>
                        </li> -->
                    <!-- 2 章节下的题目列表，卡片式 -->
                    <div class="question-card-container">
                        <button
                            v-for="question in chapter.submitted_questions"
                            :key="question.id"
                            class="question-card"
                            @click="props.selectQuestion(question)"
                        >
                            {{ question.sort_in_chapter }}
                        </button>
                    </div>
                </ul>
                <br />
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { SubmittedPaperChapters, SubmittedQuestions } from "~/types/directus_types";

const props = defineProps<{
    submittedPaperChapters: SubmittedPaperChapters[];
    selectQuestion: (question: SubmittedQuestions) => void;
}>();

const isOpen = ref(false);

const toggle = () => {
    isOpen.value = !isOpen.value;
};


</script>

<style scoped>
.question-card-container {
    display: grid;
    grid-template-columns: repeat(5, 1fr); /* 5列布局 */
    gap: 10px; /* 卡片间距 */
    margin-top: 10px;
    margin-right: 10px;
    padding-left: 0%;
}

.question-card {
    background-color: #007bff;
    color: #fff;
    border: none;
    border-radius: 5px;
    padding: 10px;
    text-align: center;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.2s;
}

.question-card:hover {
    background-color: #0056b3;
}
/* .accordion { */
    /* 样式设置 */
/* } */
/* .accordion-header { */
    /* 样式设置 */
/* } */
/* .accordion-body { */
    /* 样式设置 */
/* } */
</style>
