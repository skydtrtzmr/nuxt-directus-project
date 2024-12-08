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
                            ref="refItems"
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
import { useGlobalStore } from '~~/stores/examDone'; // 引入 Pinia store

const props = defineProps<{
    submittedPaperChapters: SubmittedPaperChapters[];
    selectQuestion: (question: SubmittedQuestions) => void;
    selectedSubmittedQuestion: SubmittedQuestions | null;
}>();

const globalStore = useGlobalStore(); // 创建 Pinia store 实例

const refItems = ref<HTMLButtonElement[]>([]);

// 当前选中题目
// console.log(
//     "props.submittedPaperChapters[0].submitted_questions[0]",
//     props.submittedPaperChapters[0].submitted_questions[0]
// );

const handleQuestionClick = (question: SubmittedQuestions) => {
    console.log("handleQuestionClick", question);
    props.selectQuestion(question); // 调用父组件传递的选择方法
};

const getQuestionSeverity = (question: SubmittedQuestions) => {
    if (
        question.submitted_ans_q_mc_single ||
        (question.submitted_ans_q_mc_multi &&
            (question.submitted_ans_q_mc_multi as any[]).length > 0) ||
        // 自动生成的directus type中，这里是unknown，所以需要用类型断言`as any[]`。
        question.submitted_ans_q_mc_binary ||
        (question.submitted_ans_q_mc_flexible &&
            (question.submitted_ans_q_mc_flexible as any[]).length > 0)
        // 多选题、不定项选择题必须选了选项（数组长度大于0）才算做已提交；
        // 因为这种题做完之后对应的submitted_ans就会从null变成[]或[null]，所以要加上这个判断
    ) {
        return "primary";
    } else {
        return "secondary";
    }
};
// 获取环境变量，确定是否运行测试
const {
    public: { isTest },
} = useRuntimeConfig();
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
onMounted(async () => {
    // 以下是用于测试的自动操作脚本
    // Only for testing
    if (isTest) {
        await nextTick();
        console.log("测试自动操作脚本开始。");

        // 注意！这里delay时间不要随意设置，太短可能导致测试失败。
        await delay(2000);
        // 没必要非要点击按钮（双层v-for循环下的ref太复杂了……），直接修改按钮触发的函数即可
        for (let i = 0; i < props.submittedPaperChapters.length; i++) {
            const chapter = props.submittedPaperChapters[i];
            await delay(1000);
            for (let j = 0; j < chapter.submitted_questions.length; j++) {
                await delay(2000);
                const question = chapter.submitted_questions[j];
                handleQuestionClick(question);
                await delay(1000); // 点击完成之后，要留一点时间等待答题操作
                // 根据题型开始作答
            }
            await delay(1000);
        }

        await delay(1000);
        globalStore.setAllDone(true); // 全部做完后，设置全局状态为已完成
        // 做题完成后点击提交试卷。
    }
});
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
    box-shadow: inset 0 0 2px 3px #747474; /* 内边框效果 */
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
