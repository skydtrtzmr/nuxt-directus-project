<!-- components/QuestionContent.vue -->
<!-- 这里是题目内容组件 -->
<template>
    <div>
        <!-- 根据题型渲染不同的答题组件 -->
        <div
            v-if="
                selectedSubmittedQuestion.question_type === 'q_mc_single' &&
                selectedSubmittedQuestion.question.q_mc_single
            "
        >
            <!-- 单选题或判断题 -->
            <p>{{ selectedSubmittedQuestion.question.q_mc_single.stem }}</p>
            <div class="flex flex-col gap-4">
                <div class="flex items-center gap-2">
                    <RadioButton
                        v-model="selectedSubmittedQuestion.submitted_ans_q_mc_single"
                        inputId="option_a"
                        name="A"
                        value="A"
                        @change="updateAnswer"
                    />
                    <label for="option_a"
                        >A.
                        {{
                            selectedSubmittedQuestion.question.q_mc_single
                                .option_a
                        }}</label
                    >
                </div>
                <div class="flex items-center gap-2">
                    <RadioButton
                        v-model="selectedSubmittedQuestion.submitted_ans_q_mc_single"
                        inputId="option_b"
                        name="B"
                        value="B"
                        @change="updateAnswer"
                    />
                    <label for="option_b"
                        >B.
                        {{
                            selectedSubmittedQuestion.question.q_mc_single
                                .option_b
                        }}</label
                    >
                </div>
                <div class="flex items-center gap-2">
                    <RadioButton
                        v-model="selectedSubmittedQuestion.submitted_ans_q_mc_single"
                        inputId="option_c"
                        name="C"
                        value="C"
                        @change="updateAnswer"
                    />
                    <label for="option_c"
                        >C.
                        {{
                            selectedSubmittedQuestion.question.q_mc_single
                                .option_c
                        }}</label
                    >
                </div>
                <div class="flex items-center gap-2">
                    <RadioButton
                        v-model="selectedSubmittedQuestion.submitted_ans_q_mc_single"
                        inputId="option_d"
                        name="D"
                        value="D"
                        @change="updateAnswer"
                    />
                    <label for="option_d"
                        >D.
                        {{
                            selectedSubmittedQuestion.question.q_mc_single
                                .option_d
                        }}</label
                    >
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    selectedSubmittedQuestion: Object,
});


const question_shared_stem =
    props.selectedSubmittedQuestion.question.shared_stem;

const selectedOption = ref(props.selectedSubmittedQuestion.selected_option);
const selectedOptions = ref([]);

const { updateItem } = useDirectusItems();

// const updateAnswer = async () => {
//     try {
//         const submitted_option = 
//         const response = await axios.post('/api/update-answer', {
//             questionId: props.selectedSubmittedQuestion.question.id,
//             selectedOption: selectedOption.value,
//         });
//         console.log('Answer updated successfully:', response.data);
//     } catch (error) {
//         console.error('Error updating answer:', error);
//     }
// };

</script>
