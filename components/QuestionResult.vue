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
            <div v-html="renderMarkdown(getAnalysis())" class="text-lg markdown-content"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
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
    renderMarkdown: (content: string) => string;
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
        return "缺少题目数据";
    }
    
    const questionInfo = props.questionData.questions_id;
    
    if (props.question_type === "q_mc_single" && questionInfo.q_mc_single) {
        return questionInfo.q_mc_single.correct_option || "单选题缺少正确答案";
    } else if (props.question_type === "q_mc_binary" && questionInfo.q_mc_binary) {
        return questionInfo.q_mc_binary.correct_option || "判断题缺少正确答案";
    } else if (props.question_type === "q_mc_multi" && questionInfo.q_mc_multi) {
        return JSON.stringify(questionInfo.q_mc_multi.correct_options) || "多选题缺少正确答案";
    } else if (props.question_type === "q_mc_flexible" && questionInfo.q_mc_flexible) {
        return JSON.stringify(questionInfo.q_mc_flexible.correct_options) || "不定项选择题缺少正确答案";
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

<style scoped>
/* Markdown样式 */
:deep(.markdown-content) h1,
:deep(.markdown-content) h2,
:deep(.markdown-content) h3,
:deep(.markdown-content) h4,
:deep(.markdown-content) h5,
:deep(.markdown-content) h6 {
    margin-top: 1em;
    margin-bottom: 0.5em;
    font-weight: bold;
}

:deep(.markdown-content) p {
    margin-bottom: 1em;
}

:deep(.markdown-content) ul,
:deep(.markdown-content) ol {
    padding-left: 2em;
    margin-bottom: 1em;
}

:deep(.markdown-content) code {
    background-color: rgba(0, 0, 0, 0.05);
    padding: 0.2em 0.4em;
    border-radius: 3px;
}

:deep(.markdown-content) pre {
    background-color: rgba(0, 0, 0, 0.05);
    padding: 1em;
    border-radius: 5px;
    overflow-x: auto;
    margin-bottom: 1em;
}

:deep(.markdown-content) blockquote {
    border-left: 4px solid #ddd;
    padding-left: 1em;
    color: #666;
    margin-bottom: 1em;
}

:deep(.markdown-content) img {
    max-width: 100%;
}

:deep(.markdown-content) table {
    border-collapse: collapse;
    width: 100%;
    margin-bottom: 1em;
}

:deep(.markdown-content) th,
:deep(.markdown-content) td {
    border: 1px solid #ddd;
    padding: 8px;
}

:deep(.markdown-content) th {
    background-color: rgba(0, 0, 0, 0.05);
}
</style>
