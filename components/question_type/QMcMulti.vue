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
        <BlockUI
            :blocked="blockQuestion"
            class="basis-4/5"
            :pt="{
                // 通过透传pt参数，控制BlockUI的样式
                mask: {
                    style: {
                        background: 'transparent',
                        animation: 'none',
                    },
                    class: [],
                },
            }"
        >
            <div class="flex flex-col gap-4">
                <div class="flex items-center gap-2" id="div_option_a">
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
                            selectedSubmittedQuestion.question.q_mc_multi
                                .option_a
                        }}</label
                    >
                </div>
                <div class="flex items-center gap-2" id="div_option_b">
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
                            selectedSubmittedQuestion.question.q_mc_multi
                                .option_b
                        }}</label
                    >
                </div>
                <div class="flex items-center gap-2" id="div_option_c">
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
                            selectedSubmittedQuestion.question.q_mc_multi
                                .option_c
                        }}</label
                    >
                </div>
                <div class="flex items-center gap-2" id="div_option_d">
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
                            selectedSubmittedQuestion.question.q_mc_multi
                                .option_d
                        }}</label
                    >
                </div>
            </div>
        </BlockUI>
    </div>
    <template v-if="showResult">
        <Divider />
        <!-- 以下是答题结果区域 -->
        <div class="p-4 bg-white shadow rounded-md">
            <div :class="answerClass" class="font-semibold text-xl mb-2">
                {{ isCorrectAnswer ? "正确" : "错误" }}
            </div>
            <div>
                <span class="font-medium">正确答案: </span
                ><span
                    class="text-lg"
                    v-if="
                        typeof selectedSubmittedQuestion.question ===
                            'object' &&
                        selectedSubmittedQuestion.question.q_mc_multi &&
                        typeof selectedSubmittedQuestion.question.q_mc_multi ===
                            'object'
                    "
                    >{{
                        selectedSubmittedQuestion.question.q_mc_multi
                            .correct_options
                    }}</span
                >
            </div>
            <div class="text-gray-700">
                <span class="font-medium">本题总分: </span>
                <span class="text-lg">{{
                    selectedSubmittedQuestion.point_value
                }}</span>
            </div>
            <div class="text-gray-700 mt-2">
                <span class="font-medium">考生得分: </span>
                <span class="text-lg">{{
                    selectedSubmittedQuestion.score
                }}</span>
            </div>
        </div></template
    >
</template>

<script setup lang="ts">
import type { SubmittedQuestions } from "~/types/directus_types";

const props = defineProps<{
    selectedSubmittedQuestion: SubmittedQuestions;
    exam_page_mode: string;
}>();
// 传进来的这个本来就是一个Ref类型，所以不需要用ref包裹

const showResult = computed(() => {
    if (props.exam_page_mode === "review") {
        return true;
    } else {
        return false;
    }
});

// 是否锁定题目禁止作答
const blockQuestion = computed(() => {
    if (props.exam_page_mode === "review") {
        return true;
    } else {
        return false;
    }
});

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
