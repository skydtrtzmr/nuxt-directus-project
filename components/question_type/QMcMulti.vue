<!-- components/QMcMulti.vue -->
<!-- 这里是多选题内容组件 -->
<template>
    <div v-if="questionData && questionData.questions_id && questionData.result">
        <!-- 多选题题干 -->
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
            <!-- 多选题选项列表 -->
            <div class="flex flex-col gap-4">
                <!-- 每个选项容器使用唯一ID，防止在题组模式下ID冲突 -->
                <div class="flex items-center gap-2" :id="`div_option_a_${uniqueId}`">
                    <Checkbox
                        v-model="userAnswers"
                        :inputId="`option_a_${uniqueId}`"
                        name="option"
                        value="A"
                        @change="updateAnswer"
                    />
                    <!-- 标签的for属性使用唯一ID，确保点击文字时正确关联到对应选项 -->
                    <label :for="`option_a_${uniqueId}`">A. {{ questionData.questions_id.q_mc_multi?.option_a }}</label>
                </div>
                <div class="flex items-center gap-2" :id="`div_option_b_${uniqueId}`">
                    <Checkbox
                        v-model="userAnswers"
                        :inputId="`option_b_${uniqueId}`"
                        name="option"
                        value="B"
                        @change="updateAnswer"
                    />
                    <label :for="`option_b_${uniqueId}`">B. {{ questionData.questions_id.q_mc_multi?.option_b }}</label>
                </div>
                <div class="flex items-center gap-2" :id="`div_option_c_${uniqueId}`">
                    <Checkbox
                        v-model="userAnswers"
                        :inputId="`option_c_${uniqueId}`"
                        name="option"
                        value="C"
                        @change="updateAnswer"
                    />
                    <label :for="`option_c_${uniqueId}`">C. {{ questionData.questions_id.q_mc_multi?.option_c }}</label>
                </div>
                <div class="flex items-center gap-2" :id="`div_option_d_${uniqueId}`">
                    <Checkbox
                        v-model="userAnswers"
                        :inputId="`option_d_${uniqueId}`"
                        name="option"
                        value="D"
                        @change="updateAnswer"
                    />
                    <label :for="`option_d_${uniqueId}`">D. {{ questionData.questions_id.q_mc_multi?.option_d }}</label>
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
import { ref, computed, watch } from "vue";
import type {
    QuestionResults,
    Questions,
} from "~/types/directus_types";

const props = defineProps<{
    questionData: any;
    exam_page_mode: string;
}>();

// 定义题目类型，用于答题结果展示
const question_type = "q_mc_multi";

/**
 * 生成唯一ID用于区分不同题目实例的选项
 * 在题组模式下，同一个页面可能存在多个多选题实例，每个实例都需要唯一的inputId
 * 这解决了点击选项文字时可能触发错误选项的问题
 */
const uniqueId = computed(() => {
  // 使用题目ID和groupQuestionIndex(如果存在)创建唯一标识
  const questionId = props.questionData?.id || 'unknown';
  const groupIndex = props.questionData?.groupQuestionIndex !== undefined 
    ? `_group_${props.questionData.groupQuestionIndex}` 
    : '';
  
  return `${questionId}${groupIndex}`;
});

// 创建一个本地的响应式变量用于绑定UI，多选题使用数组存储多个选中项
const userAnswers = ref<string[]>([]);

/**
 * 监听整个questionData对象的变化，确保在题目切换时重置答案
 * 这确保了切换题目时能显示正确的已选答案
 */
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

/**
 * 计算属性：是否显示题目结果
 * 在review模式下显示答题结果
 */
const showResult = computed(() => {
    return props.exam_page_mode === "review";
});

/**
 * 计算属性：是否锁定题目禁止作答
 * 在review模式下锁定题目
 */
const blockQuestion = computed(() => {
    return props.exam_page_mode === "review";
});

const { updateItem } = useDirectusItems();

/**
 * 更新答案到数据库
 * 当用户选择答案时触发，将结果保存到question_results表
 * 多选题使用submit_ans_select_multiple_checkbox字段存储选项数组
 */
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

/**
 * 计算属性：判断答案是否正确
 * 用于在UI上显示不同样式
 */
const isCorrectAnswer = computed(() => {
    if (!props.questionData?.result) return false;
    return props.questionData.result.point_value === props.questionData.result.score;
});

/**
 * 计算属性：根据答案正确性返回不同的CSS类
 */
const answerClass = computed(() => {
    return isCorrectAnswer.value ? "text-green-600" : "text-red-600";
});
</script>
