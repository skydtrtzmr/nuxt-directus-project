<template>
    <div class="p-4 bg-white shadow rounded-md">
        <div :class="answerClass" class="font-semibold text-xl mb-2">
            {{ isCorrectAnswer ? "正确" : "错误" }}
        </div>
        <div class="text-gray-700 mt-2">
            <span class="font-medium">考生得分: </span>
            <span class="text-lg">{{ questionResult.score }}</span>
        </div>
        <div class="text-gray-700">
            <span class="font-medium">本题总分: </span>
            <span class="text-lg">{{ questionResult.point_value }}</span>
        </div>
        <div>
            <span class="font-medium">考生答案: </span>
            <span class="text-lg">{{ getSubmittedAnswer() }}</span>
        </div>
        <div>
            <span class="font-medium">正确答案: </span>
            <span class="text-lg">{{ getCorrectAnswer() }}</span>
        </div>
        <br/>
        <div>
            <p class="font-medium">题目解析:</p>
            <span class="text-lg">{{ getAnalysis() }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import type {
    QuestionResults,
    Questions,
} from "~/types/directus_types";

const props = defineProps<{
    questionResult: QuestionResults;
    questionData?: any; // 可选的完整题目数据
    question_type:
        | "q_mc_single"
        | "q_mc_multi"
        | "q_mc_binary"
        | "q_mc_flexible";
}>();

// 获取学生提交的答案
const getSubmittedAnswer = () => {
    if (props.question_type === "q_mc_single" || props.question_type === "q_mc_binary") {
        return props.questionResult.submit_ans_select_radio;
    } else if (props.question_type === "q_mc_multi" || props.question_type === "q_mc_flexible") {
        return props.questionResult.submit_ans_select_multiple_checkbox;
    }
    return null;
};

// 获取题目的正确答案
const getCorrectAnswer = () => {
    if (!props.questionData || !props.questionData.questions_id) {
        return "";
    }
    
    const questionInfo = props.questionData.questions_id;
    
    if (props.question_type === "q_mc_single" && questionInfo.q_mc_single) {
        return questionInfo.q_mc_single.correct_option || "";
    } else if (props.question_type === "q_mc_binary" && questionInfo.q_mc_binary) {
        return questionInfo.q_mc_binary.correct_option || "";
    } else if (props.question_type === "q_mc_multi" && questionInfo.q_mc_multi) {
        return JSON.stringify(questionInfo.q_mc_multi.correct_options) || "";
    } else if (props.question_type === "q_mc_flexible" && questionInfo.q_mc_flexible) {
        return JSON.stringify(questionInfo.q_mc_flexible.correct_options) || "";
    }
    
    return "";
};

// 获取题目解析
const getAnalysis = () => {
    if (!props.questionData || !props.questionData.questions_id) {
        return "";
    }
    
    const questionInfo = props.questionData.questions_id;
    
    if (props.question_type === "q_mc_single" && questionInfo.q_mc_single) {
        return questionInfo.q_mc_single.analysis || "";
    } else if (props.question_type === "q_mc_binary" && questionInfo.q_mc_binary) {
        return questionInfo.q_mc_binary.analysis || "";
    } else if (props.question_type === "q_mc_multi" && questionInfo.q_mc_multi) {
        return questionInfo.q_mc_multi.analysis || "";
    } else if (props.question_type === "q_mc_flexible" && questionInfo.q_mc_flexible) {
        return questionInfo.q_mc_flexible.analysis || "";
    }
    
    return "";
};

const isCorrectAnswer = computed(() => {
    if (props.questionResult.point_value === props.questionResult.score) {
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
