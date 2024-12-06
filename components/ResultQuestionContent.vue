<!-- components/ResultQuestionContent.vue -->
<!-- 在这里进行题型的判断，根据题型渲染不同的组件 -->
<template>
    <div class="flex flex-col">
        <div>
            <div
                v-if="selectedSubmittedQuestion.question_type === 'q_mc_single'"
            >
                <QMcSingle
                    :selectedSubmittedQuestion="selectedSubmittedQuestion"
                    :showResult="true"
                />
            </div>
            <div
                v-if="selectedSubmittedQuestion.question_type === 'q_mc_multi'"
            >
                <QMcMulti
                    :selectedSubmittedQuestion="selectedSubmittedQuestion"
                    :showResult="true"
                />
            </div>
            <div
                v-if="selectedSubmittedQuestion.question_type === 'q_mc_binary'"
            >
                <QMcBinary
                    :selectedSubmittedQuestion="selectedSubmittedQuestion"
                    :showResult="true"
                />
            </div>
            <div
                v-if="
                    selectedSubmittedQuestion.question_type === 'q_mc_flexible'
                "
            >
                <QMcFlexible
                    :selectedSubmittedQuestion="selectedSubmittedQuestion"
                    :showResult="true"
                />
            </div>
        </div>
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
