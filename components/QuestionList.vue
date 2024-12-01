<!-- components/QuestionList.vue -->
<template>
    <div class="sidebar" v-if="submittedPaperChapters.length > 0">
        <h5>题目列表</h5>
        <ul>
            <li v-for="chapter in submittedPaperChapters" :key="chapter.id">
                <div
                    v-if="
                        chapter.source_paper_prototype_chapter &&
                        typeof chapter.source_paper_prototype_chapter ===
                            'object'
                    "
                >
                    {{ chapter.source_paper_prototype_chapter.title }}
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
                        <Button
                            v-for="question in chapter.submitted_questions"
                            :key="question.id"
                            :severity="getQuestionSeverity(question)"
                            class="question-card"
                            :class="{
                                selected:
                                    selectedSubmittedQuestion &&
                                    selectedSubmittedQuestion.id ===
                                        question.id,
                            }"
                            @click="handleQuestionClick(question)"
                        >
                            {{ question.sort_in_chapter }}
                        </Button>
                    </div>
                </ul>
                <br />
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type {
    SubmittedPaperChapters,
    SubmittedQuestions,
} from "~~/types/directus_types";

const props = defineProps<{
    submittedPaperChapters: SubmittedPaperChapters[];
    selectQuestion: (question: SubmittedQuestions) => void;
}>();

const selectedSubmittedQuestion = ref<SubmittedQuestions | null>(
    // props.submittedPaperChapters[0].submitted_questions[0]
    null
);

// 当前选中题目
// console.log(
//     "props.submittedPaperChapters[0].submitted_questions[0]",
//     props.submittedPaperChapters[0].submitted_questions[0]
// );

const handleQuestionClick = (question: SubmittedQuestions) => {
    console.log("handleQuestionClick", question);
    selectedSubmittedQuestion.value = question; // 更新选中题目
    props.selectQuestion(question); // 调用父组件传递的选择方法
};

const getQuestionSeverity = (question: SubmittedQuestions) => {
    if (
        question.submitted_ans_q_mc_single ||
        (question.submitted_ans_q_mc_multi && question.submitted_ans_q_mc_multi.length > 0) ||
        question.submitted_ans_q_mc_binary ||
        (question.submitted_ans_q_mc_flexible && question.submitted_ans_q_mc_flexible.length > 0)
        // 多选题、不定项选择题必须选了选项（数组长度大于0）才算做已提交；
        // 因为这种题做完之后对应的submitted_ans就会从null变成[]或[null]，所以要加上这个判断
    ) {
        return "success";
    } else {
        return "warning";
    }
};
</script>

<style scoped>
ul {
    list-style: none;
    padding-inline-start: 10px;
    /* 不要缩进太多！ */
}

.question-card-container {
    display: grid;
    grid-template-columns: repeat(5, 1fr); /* 5列布局 */
    gap: 10px; /* 卡片间距 */
    margin-top: 10px;
    margin-right: 10px;
    padding-left: 0%;
}

/* .question-card {
    background-color: #007bff;
    color: #fff;
    border: none;
    border-radius: 5px;
    padding: 10px;
    text-align: center;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.2s;
} */

.question-card.selected {
    /* background-color: #28a745; 选中后的背景色 */
    box-shadow: inset 0 0 0 2px #202040; /* 内边框效果 */
    /* border: 2px solid #1e7e34; 添加边框 */
    font-weight: bold; /* 字体加粗 */
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
