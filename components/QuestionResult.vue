<template>
    <div class="p-4 bg-white shadow rounded-md">
        <div :class="answerClass" class="font-semibold text-xl mb-2">
            {{ isCorrectAnswer ? "正确" : "错误" }}
        </div>
        <div class="text-gray-700 mt-2">
            <span class="font-medium">考生得分: </span>
            <span class="text-lg">{{ selectedSubmittedQuestion.score }}</span>
        </div>
        <div class="text-gray-700">
            <span class="font-medium">本题总分: </span>
            <span class="text-lg">{{
                selectedSubmittedQuestion.point_value
            }}</span>
        </div>
        <div>
            <span class="font-medium">正确答案: </span
            ><span
                class="text-lg"
                v-if="
                    typeof selectedSubmittedQuestion.question === 'object' &&
                    selectedSubmittedQuestion.question[question_type] &&
                    typeof selectedSubmittedQuestion.question[question_type] ===
                        'object' &&
                    typeof selectedSubmittedQuestion_question_type === 'object'
                "
                >{{
                    question_type === ("q_mc_single" || "q_mc_binary")
                    // 别忘了加括号！
                        ? (
                              selectedSubmittedQuestion_question_type as
                                  | QMcSingle
                                  | QMcBinary
                          )?.correct_option
                        : (
                              selectedSubmittedQuestion_question_type as
                                  | QMcMulti
                                  | QMcFlexible
                          )?.correct_options
                }}</span
            >
        </div>
        <div>
            <p class="font-medium">题目解析:</p>
            <span
                class="text-lg"
                v-if="
                    typeof selectedSubmittedQuestion.question === 'object' &&
                    selectedSubmittedQuestion.question[question_type] &&
                    typeof selectedSubmittedQuestion.question[question_type] ===
                        'object' &&
                    typeof selectedSubmittedQuestion_question_type === 'object'
                "
                >{{ selectedSubmittedQuestion_question_type!.analysis }}</span
            >
        </div>
    </div>
</template>

<script setup lang="ts">
import type {
    SubmittedQuestions,
    Questions,
    QMcSingle,
    QMcBinary,
    QMcMulti,
    QMcFlexible,
} from "~/types/directus_types";

// TODO 目前是把题目连带答案、解析都一起fetch的，即使是考试模式也会fetch。
// 这样肯定是不安全的，得把考试模式和考试结果查看模式分开考虑。

const props = defineProps<{
    selectedSubmittedQuestion: SubmittedQuestions;
    question_type:
        | "q_mc_single"
        | "q_mc_multi"
        | "q_mc_binary"
        | "q_mc_flexible";
}>();

const selectedSubmittedQuestion_question_type = computed(() => {
    if (props.question_type === "q_mc_single") {
        return (props.selectedSubmittedQuestion.question as Questions)
            .q_mc_single;
    } else if (props.question_type === "q_mc_multi") {
        return (props.selectedSubmittedQuestion.question as Questions)
            .q_mc_multi;
    } else if (props.question_type === "q_mc_binary") {
        return (props.selectedSubmittedQuestion.question as Questions)
            .q_mc_binary;
    } else if (props.question_type === "q_mc_flexible") {
        return (props.selectedSubmittedQuestion.question as Questions)
            .q_mc_flexible;
    } else {
        return null;
    }
});

const isCorrectAnswer = computed(() => {
    if (
        props.selectedSubmittedQuestion.point_value ===
        props.selectedSubmittedQuestion.score
    ) {
        return true;
    } else {
        return false;
    }
});

// 动态绑定正确/错误颜色
const answerClass = computed(() => {
    return isCorrectAnswer.value ? "text-green-600" : "text-red-600";
});
</script>

<style scoped></style>
