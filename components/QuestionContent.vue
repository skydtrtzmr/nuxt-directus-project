<!-- components/QuestionContent.vue -->
<!-- 在这里进行题型的判断，根据题型渲染不同的组件 -->
<template>
    <div ref="selectedQuestionElement">
        <template
            v-if="selectedSubmittedQuestion.question_type === 'q_mc_single'"
        >
            <QMcSingle
                :selectedSubmittedQuestion="selectedSubmittedQuestion"
                :exam_page_mode="exam_page_mode"
            />
        </template>
        <template
            v-if="selectedSubmittedQuestion.question_type === 'q_mc_multi'"
        >
            <QMcMulti
                :selectedSubmittedQuestion="selectedSubmittedQuestion"
                :exam_page_mode="exam_page_mode"
            />
        </template>
        <template
            v-if="selectedSubmittedQuestion.question_type === 'q_mc_binary'"
        >
            <QMcBinary
                :selectedSubmittedQuestion="selectedSubmittedQuestion"
                :exam_page_mode="exam_page_mode"
            />
        </template>
        <template
            v-if="selectedSubmittedQuestion.question_type === 'q_mc_flexible'"
        >
            <QMcFlexible
                :selectedSubmittedQuestion="selectedSubmittedQuestion"
                :exam_page_mode="exam_page_mode"
            />
        </template>
    </div>
</template>

<script setup lang="ts">
import type { SubmittedQuestions } from "~/types/directus_types.js";
import QMcSingle from "~/components/question_type/QMcSingle.vue";
import QMcMulti from "./question_type/QMcMulti.vue";
import QMcBinary from "./question_type/QMcBinary.vue";
import QMcFlexible from "./question_type/QMcFlexible.vue";
const props = defineProps<{
    selectedSubmittedQuestion: SubmittedQuestions;
    exam_page_mode: string;
}>();

const { updateItem } = useDirectusItems();
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const selectedQuestionElement = ref<any>();

// Only for testing
// 以下仅供测试用，每次切换题目时，做题。

// 自动做题
async function autoAnswer() {
    await delay(1000);
    console.log("selectedSubmittedQuestion changed");
    console.log(props.selectedSubmittedQuestion);
    if (props.selectedSubmittedQuestion.question_type === "q_mc_single") {
        props.selectedSubmittedQuestion.submitted_ans_q_mc_single = "C";
        const submitted_question = {
            submitted_ans_q_mc_single:
                props.selectedSubmittedQuestion.submitted_ans_q_mc_single,
        };
        const response = await updateItem<SubmittedQuestions>({
            collection: "submitted_questions",
            id: props.selectedSubmittedQuestion.id,
            item: submitted_question,
        });
    } else if (props.selectedSubmittedQuestion.question_type === "q_mc_multi") {
        props.selectedSubmittedQuestion.submitted_ans_q_mc_multi = ["A", "C"];
        const submitted_question = {
            submitted_ans_q_mc_multi:
                props.selectedSubmittedQuestion.submitted_ans_q_mc_multi,
        };
        const response = await updateItem<SubmittedQuestions>({
            collection: "submitted_questions",
            id: props.selectedSubmittedQuestion.id,
            item: submitted_question,
        });
    } else if (
        props.selectedSubmittedQuestion.question_type === "q_mc_binary"
    ) {
        props.selectedSubmittedQuestion.submitted_ans_q_mc_binary = "B";
        const submitted_question = {
            submitted_ans_q_mc_binary:
                props.selectedSubmittedQuestion.submitted_ans_q_mc_binary,
        };
        const response = await updateItem<SubmittedQuestions>({
            collection: "submitted_questions",
            id: props.selectedSubmittedQuestion.id,
            item: submitted_question,
        });
    } else if (
        props.selectedSubmittedQuestion.question_type === "q_mc_flexible"
    ) {
        props.selectedSubmittedQuestion.submitted_ans_q_mc_flexible = [
            "B",
            "D",
        ];
        const submitted_question = {
            submitted_ans_q_mc_flexible:
                props.selectedSubmittedQuestion.submitted_ans_q_mc_flexible,
        };
        const response = await updateItem<SubmittedQuestions>({
            collection: "submitted_questions",
            id: props.selectedSubmittedQuestion.id,
            item: submitted_question,
        });
    }
}

// 获取环境变量，确定是否运行测试
const {
    public: { isTest },
} = useRuntimeConfig();

onMounted(async () => {
    // 以下是用于测试的自动操作脚本
    // Only for testing
    if (isTest) {
        await nextTick();
        // 先等一会儿，等数据加载完毕，等QuestionList组件选中题目。
        await delay(2000);

        // 先把第一题做了。第一题的时候没有发生变化所以不会触发watch。
        if (Object.keys(props.selectedSubmittedQuestion).length !== 0 ) {
                    await autoAnswer();
                }

        watch(
            () => props.selectedSubmittedQuestion,
            async () => {
                // 判断对象是否为空。注意不要直接用!== null，没用的，{}也不是null。
                if (Object.keys(props.selectedSubmittedQuestion).length !== 0 ) {
                    await autoAnswer();
                }
            }
            // 下面是检测到题目变化时，进行的操作
        );
    }
});
</script>

<style scoped></style>
