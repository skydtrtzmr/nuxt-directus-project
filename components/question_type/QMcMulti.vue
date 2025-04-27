<!-- components/QMcMulti.vue -->
<!-- 这里是题目内容组件 -->
<template>
    <div v-if="questionData && questionData.questions_id && questionData.result">
        <!-- 多选题 -->
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
                        v-model="userAnswers"
                        inputId="option_a"
                        name="option"
                        value="A"
                        @change="updateAnswer"
                    />
                    <label for="option_a">A. {{ questionData.questions_id.q_mc_multi?.option_a }}</label>
                </div>
                <div class="flex items-center gap-2" id="div_option_b">
                    <Checkbox
                        v-model="userAnswers"
                        inputId="option_b"
                        name="option"
                        value="B"
                        @change="updateAnswer"
                    />
                    <label for="option_b">B. {{ questionData.questions_id.q_mc_multi?.option_b }}</label>
                </div>
                <div class="flex items-center gap-2" id="div_option_c">
                    <Checkbox
                        v-model="userAnswers"
                        inputId="option_c"
                        name="option"
                        value="C"
                        @change="updateAnswer"
                    />
                    <label for="option_c">C. {{ questionData.questions_id.q_mc_multi?.option_c }}</label>
                </div>
                <div class="flex items-center gap-2" id="div_option_d">
                    <Checkbox
                        v-model="userAnswers"
                        inputId="option_d"
                        name="option"
                        value="D"
                        @change="updateAnswer"
                    />
                    <label for="option_d">D. {{ questionData.questions_id.q_mc_multi?.option_d }}</label>
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
import { ref, computed, watch, onMounted } from "vue";
import type {
    QuestionResults,
    Questions,
} from "~/types/directus_types";

const props = defineProps<{
    questionData: any;
    exam_page_mode: string;
}>();

const question_type = "q_mc_multi";

// 创建一个本地的响应式变量用于绑定UI
const userAnswers = ref<string[]>([]);

// 监听整个questionData对象的变化，确保在题目切换时重置答案
watch(
    () => props.questionData,
    (newQuestionData) => {
        if (newQuestionData?.result?.submit_ans_select_multiple_checkbox) {
            userAnswers.value = Array.isArray(newQuestionData.result.submit_ans_select_multiple_checkbox) 
                ? [...newQuestionData.result.submit_ans_select_multiple_checkbox] 
                : [];
        } else {
            userAnswers.value = [];
        }
    },
    { immediate: true, deep: true }
);

const showResult = computed(() => {
    return props.exam_page_mode === "review";
});

// 是否锁定题目禁止作答
const blockQuestion = computed(() => {
    return props.exam_page_mode === "review";
});

const { updateItem } = useDirectusItems();

// 更新答案到数据库
const updateAnswer = async () => {
    if (!props.questionData?.result?.id) return;
    
    try {
        const submitted_question = {
            submit_ans_select_multiple_checkbox: userAnswers.value,
        };
        
        const response = await updateItem<QuestionResults>({
            collection: "question_results",
            id: props.questionData.result.id,
            item: submitted_question,
        });
        
        // 确保更新本地状态以反映在UI上
        if (response) {
            // 更新本地props中的数据，这样在下次渲染时能够显示正确的答案
            if (props.questionData && props.questionData.result) {
                props.questionData.result.submit_ans_select_multiple_checkbox = userAnswers.value;
            }
        }
        
        console.log("答案已成功更新:", response);
    } catch (error) {
        console.error("更新答案时出错:", error);
    }
};

const isCorrectAnswer = computed(() => {
    if (!props.questionData?.result) return false;
    return props.questionData.result.point_value === props.questionData.result.score;
});

// 动态绑定正确/错误颜色
const answerClass = computed(() => {
    return isCorrectAnswer.value ? "text-green-600" : "text-red-600";
});
</script>
