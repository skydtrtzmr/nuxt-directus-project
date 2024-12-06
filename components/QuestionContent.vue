<!-- components/QuestionContent.vue -->
<!-- 在这里进行题型的判断，根据题型渲染不同的组件 -->
<template>
    <div ref="selectedQuestionElement">
        <template
            v-if="selectedSubmittedQuestion.question_type === 'q_mc_single'"
        >
            <QMcSingle
                :selectedSubmittedQuestion="selectedSubmittedQuestion"
                :showResult="false"
            />
        </template>
        <template
            v-if="selectedSubmittedQuestion.question_type === 'q_mc_multi'"
        >
            <QMcMulti
                :selectedSubmittedQuestion="selectedSubmittedQuestion"
                :showResult="false"
            />
        </template>
        <template
            v-if="selectedSubmittedQuestion.question_type === 'q_mc_binary'"
        >
            <QMcBinary
                :selectedSubmittedQuestion="selectedSubmittedQuestion"
                :showResult="false"
            />
        </template>
        <template
            v-if="selectedSubmittedQuestion.question_type === 'q_mc_flexible'"
        >
            <QMcFlexible
                :selectedSubmittedQuestion="selectedSubmittedQuestion"
                :showResult="false"
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
}>();

const { updateItem } = useDirectusItems();
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const selectedQuestionElement = ref<any>();

// Only for testing
// 以下仅供测试用，每次切换题目时，做题。

onMounted(async () => {
    // 以下是用于测试的自动操作脚本
    // Only for testing
    await nextTick();
    watch(
        () => props.selectedSubmittedQuestion,
        // 下面是检测到题目变化时，进行的操作
        async () => {
            await delay(1000);
            console.log("selectedSubmittedQuestion changed");
            console.log(props.selectedSubmittedQuestion);
            if (
                props.selectedSubmittedQuestion.question_type === "q_mc_single"
            ) {
                props.selectedSubmittedQuestion.submitted_ans_q_mc_single = "A";
                const submitted_question = {
                    submitted_ans_q_mc_single:
                        props.selectedSubmittedQuestion
                            .submitted_ans_q_mc_single,
                };
                const response = await updateItem<SubmittedQuestions>({
                    collection: "submitted_questions",
                    id: props.selectedSubmittedQuestion.id,
                    item: submitted_question,
                });
            } else if (
                props.selectedSubmittedQuestion.question_type === "q_mc_multi"
            ) {
                props.selectedSubmittedQuestion.submitted_ans_q_mc_multi = [
                    "A",
                    "B",
                ];
                const submitted_question = {
                    submitted_ans_q_mc_multi:
                        props.selectedSubmittedQuestion
                            .submitted_ans_q_mc_multi,
                };
                const response = await updateItem<SubmittedQuestions>({
                    collection: "submitted_questions",
                    id: props.selectedSubmittedQuestion.id,
                    item: submitted_question,
                });
            } else if (
                props.selectedSubmittedQuestion.question_type === "q_mc_binary"
            ) {
                props.selectedSubmittedQuestion.submitted_ans_q_mc_binary = "A";
                const submitted_question = {
                    submitted_ans_q_mc_binary:
                        props.selectedSubmittedQuestion
                            .submitted_ans_q_mc_binary,
                };
                const response = await updateItem<SubmittedQuestions>({
                    collection: "submitted_questions",
                    id: props.selectedSubmittedQuestion.id,
                    item: submitted_question,
                });
            } else if (
                props.selectedSubmittedQuestion.question_type ===
                "q_mc_flexible"
            ) {
                props.selectedSubmittedQuestion.submitted_ans_q_mc_flexible = [
                    "A",
                    "B",
                ];
                const submitted_question = {
                    submitted_ans_q_mc_flexible:
                        props.selectedSubmittedQuestion
                            .submitted_ans_q_mc_flexible,
                };
                const response = await updateItem<SubmittedQuestions>({
                    collection: "submitted_questions",
                    id: props.selectedSubmittedQuestion.id,
                    item: submitted_question,
                });
            }
        }
    );
});
</script>

<style scoped></style>
