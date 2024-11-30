<!-- components/QMcMulti.vue -->
<!-- 这里是题目内容组件 -->
<template>
    <div
        v-if="
            typeof selectedSubmittedQuestion.question === 'object' &&
            selectedSubmittedQuestion.question.q_mc_multi &&
            typeof selectedSubmittedQuestion.question.q_mc_multi === 'object'
        "
    >
        <!-- 单选题或判断题 -->
        <p>{{ selectedSubmittedQuestion.question.q_mc_multi.stem }}</p>
        <div class="flex flex-col gap-4">
            <div class="flex items-center gap-2">
                <Checkbox
                    v-model="
                        selectedSubmittedQuestion.submitted_ans_q_mc_multi
                    "
                    inputId="option_a"
                    name="A"
                    value="A"
                    @change="updateAnswer"
                />
                <label for="option_a"
                    >A.
                    {{
                        selectedSubmittedQuestion.question.q_mc_multi.option_a
                    }}</label
                >
            </div>
            <div class="flex items-center gap-2">
                <Checkbox
                    v-model="
                        selectedSubmittedQuestion.submitted_ans_q_mc_multi
                    "
                    inputId="option_b"
                    name="B"
                    value="B"
                    @change="updateAnswer"
                />
                <label for="option_b"
                    >B.
                    {{
                        selectedSubmittedQuestion.question.q_mc_multi.option_b
                    }}</label
                >
            </div>
            <div class="flex items-center gap-2">
                <Checkbox
                    v-model="
                        selectedSubmittedQuestion.submitted_ans_q_mc_multi
                    "
                    inputId="option_c"
                    name="C"
                    value="C"
                    @change="updateAnswer"
                />
                <label for="option_c"
                    >C.
                    {{
                        selectedSubmittedQuestion.question.q_mc_multi.option_c
                    }}</label
                >
            </div>
            <div class="flex items-center gap-2">
                <Checkbox
                    v-model="
                        selectedSubmittedQuestion.submitted_ans_q_mc_multi
                    "
                    inputId="option_d"
                    name="D"
                    value="D"
                    @change="updateAnswer"
                />
                <label for="option_d"
                    >D.
                    {{
                        selectedSubmittedQuestion.question.q_mc_multi.option_d
                    }}</label
                >
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { SubmittedQuestions } from "~/types/directus_types";

const props = defineProps<{
    selectedSubmittedQuestion: SubmittedQuestions;
}>();
// 传进来的这个本来就是一个Ref类型，所以不需要用ref包裹

const { updateItem } = useDirectusItems();

const updateAnswer = async () => {
    try {
        const submitted_question = {
            submitted_ans_q_mc_multi:
                props.selectedSubmittedQuestion.submitted_ans_q_mc_multi,
        };
        const response = await updateItem<SubmittedQuestions>({
            collection: "submitted_questions",
            id: props.selectedSubmittedQuestion.id,
            item: submitted_question,
        });
        console.log("Answer updated successfully:", response);
    } catch (error) {
        console.error("Error updating answer:", error);
    }
};
</script>
