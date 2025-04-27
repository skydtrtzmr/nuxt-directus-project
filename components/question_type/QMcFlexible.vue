<!-- components/QMcFlexible.vue -->
<!-- 这里是题目内容组件 -->
<template>
    <div v-if="questionData && questionData.questions_id && questionData.result">
        <!-- 灵活选择题 -->
        <p>{{ questionData.questions_id.stem }}</p>
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
                        v-model="questionData.result.submit_ans_select_multiple_checkbox"
                        inputId="option_a"
                        name="A"
                        value="A"
                        @change="updateAnswer"
                    />
                    <label for="option_a">A. {{ questionData.questions_id.q_mc_flexible?.option_a }}</label>
                </div>
                <div class="flex items-center gap-2" id="div_option_b">
                    <Checkbox
                        v-model="questionData.result.submit_ans_select_multiple_checkbox"
                        inputId="option_b"
                        name="B"
                        value="B"
                        @change="updateAnswer"
                    />
                    <label for="option_b">B. {{ questionData.questions_id.q_mc_flexible?.option_b }}</label>
                </div>
                <div class="flex items-center gap-2" id="div_option_c">
                    <Checkbox
                        v-model="questionData.result.submit_ans_select_multiple_checkbox"
                        inputId="option_c"
                        name="C"
                        value="C"
                        @change="updateAnswer"
                    />
                    <label for="option_c">C. {{ questionData.questions_id.q_mc_flexible?.option_c }}</label>
                </div>
                <div class="flex items-center gap-2" id="div_option_d">
                    <Checkbox
                        v-model="questionData.result.submit_ans_select_multiple_checkbox"
                        inputId="option_d"
                        name="D"
                        value="D"
                        @change="updateAnswer"
                    />
                    <label for="option_d">D. {{ questionData.questions_id.q_mc_flexible?.option_d }}</label>
                </div>
            </div>
        </BlockUI>
    </div>
    <template v-if="showResult">
        <Divider />
        <!-- 以下是答题结果区域 -->
        <QuestionResult
            :questionResult="questionData.result"
            :questionData="questionData"
            :question_type="question_type"
        ></QuestionResult>
    </template>
</template>

<script setup lang="ts">
import type {
    QuestionResults,
    Questions,
} from "~/types/directus_types";

const props = defineProps<{
    questionData: any;
    exam_page_mode: string;
}>();

const question_type = "q_mc_flexible";

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
            submit_ans_select_multiple_checkbox: props.questionData.result.submit_ans_select_multiple_checkbox,
        };
        const response = await updateItem<QuestionResults>({
            collection: "question_results",
            id: props.questionData.result.id,
            item: submitted_question,
        });
        console.log("Answer updated successfully:", response);
    } catch (error) {
        console.error("Error updating answer:", error);
    }
};

const isCorrectAnswer = computed(() => {
    if (props.questionData.result.point_value === props.questionData.result.score) {
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
