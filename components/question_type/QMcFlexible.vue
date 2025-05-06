<!-- components/QMcFlexible.vue -->
<!-- 这里是灵活选择题内容组件 -->
<template>
    <div v-if="questionData && questionData.questions_id && questionData.result">
        <!-- 灵活选择题题干 -->
        <div v-html="renderMarkdown(questionData.questions_id.stem)" class="markdown-content"></div>
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
            <!-- 灵活选择题选项列表 -->
            <div class="flex flex-col gap-4">
                <!-- 每个选项容器使用唯一ID，防止在题组模式下ID冲突 -->
                <div class="flex items-start gap-3" :id="`div_option_a_${uniqueId}`">
                    <Checkbox
                        v-model="questionData.result.submit_ans_select_multiple_checkbox"
                        :inputId="`option_a_${uniqueId}`"
                        name="A"
                        value="A"
                        @change="updateAnswer"
                    />
                    <!-- 标签的for属性使用唯一ID，确保点击文字时正确关联到对应选项 -->
                    <label :for="`option_a_${uniqueId}`" class="option-label flex-1">
                        <span class="option-marker">A</span>
                        <span v-html="renderMarkdown(questionData.questions_id.q_mc_flexible?.option_a)" class="markdown-content"></span>
                    </label>
                </div>
                <div class="flex items-start gap-3" :id="`div_option_b_${uniqueId}`">
                    <Checkbox
                        v-model="questionData.result.submit_ans_select_multiple_checkbox"
                        :inputId="`option_b_${uniqueId}`"
                        name="B"
                        value="B"
                        @change="updateAnswer"
                    />
                    <label :for="`option_b_${uniqueId}`" class="option-label flex-1">
                        <span class="option-marker">B</span>
                        <span v-html="renderMarkdown(questionData.questions_id.q_mc_flexible?.option_b)" class="markdown-content"></span>
                    </label>
                </div>
                <div class="flex items-start gap-3" :id="`div_option_c_${uniqueId}`">
                    <Checkbox
                        v-model="questionData.result.submit_ans_select_multiple_checkbox"
                        :inputId="`option_c_${uniqueId}`"
                        name="C"
                        value="C"
                        @change="updateAnswer"
                    />
                    <label :for="`option_c_${uniqueId}`" class="option-label flex-1">
                        <span class="option-marker">C</span>
                        <span v-html="renderMarkdown(questionData.questions_id.q_mc_flexible?.option_c)" class="markdown-content"></span>
                    </label>
                </div>
                <div class="flex items-start gap-3" :id="`div_option_d_${uniqueId}`">
                    <Checkbox
                        v-model="questionData.result.submit_ans_select_multiple_checkbox"
                        :inputId="`option_d_${uniqueId}`"
                        name="D"
                        value="D"
                        @change="updateAnswer"
                    />
                    <label :for="`option_d_${uniqueId}`" class="option-label flex-1">
                        <span class="option-marker">D</span>
                        <span v-html="renderMarkdown(questionData.questions_id.q_mc_flexible?.option_d)" class="markdown-content"></span>
                    </label>
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
            :renderMarkdown="renderMarkdown"
        ></QuestionResult>
    </template>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type {
    QuestionResults,
    Questions,
} from "~/types/directus_types";

const props = defineProps<{
    questionData: any;
    exam_page_mode: string;
    renderMarkdown: (content: string) => string;
}>();

// 定义题目类型，用于答题结果展示
const question_type = "q_mc_flexible";

/**
 * 生成唯一ID用于区分不同题目实例的选项
 * 在题组模式下，同一个页面可能存在多个灵活选择题实例，每个实例都需要唯一的inputId
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

/**
 * 计算属性：是否显示题目结果
 * 在review模式下显示答题结果
 */
const showResult = computed(() => {
    if (props.exam_page_mode === "review") {
        return true;
    } else {
        return false;
    }
});

/**
 * 计算属性：是否锁定题目禁止作答
 * 在review模式下锁定题目
 */
const blockQuestion = computed(() => {
    if (props.exam_page_mode === "review") {
        return true;
    } else {
        return false;
    }
});

const { updateItem } = useDirectusItems();

/**
 * 更新答案到数据库
 * 当用户选择答案时触发，将结果保存到question_results表
 * 灵活选择题直接使用questionData.result.submit_ans_select_multiple_checkbox
 * 而不是通过本地变量绑定
 */
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

/**
 * 计算属性：判断答案是否正确
 * 用于在UI上显示不同样式
 */
const isCorrectAnswer = computed(() => {
    if (props.questionData.result.point_value === props.questionData.result.score) {
        return true;
    } else {
        return false;
    }
});

/**
 * 计算属性：根据答案正确性返回不同的CSS类
 */
const answerClass = computed(() => {
    return isCorrectAnswer.value ? "text-green-600" : "text-red-600";
});
</script>

<style scoped>
/* 确保Markdown内容的样式在此组件中正确显示 */
:deep(.markdown-content) {
    display: inline-block;
}

:deep(.markdown-content p) {
    margin-bottom: 0.5em;
    display: inline;
}

/* 选项标签样式 */
.option-label {
    display: flex;
    align-items: flex-start;
    gap: 8px;
}

/* 选项标记样式 */
.option-marker {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 28px;
    background-color: #f0f0f0;
    color: #333;
    font-weight: bold;
    border-radius: 50%;
    padding: 0 4px;
    margin-right: 8px;
    font-size: 14px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

/* 深色模式下的选项标记 */
@media (prefers-color-scheme: dark) {
    .option-marker {
        background-color: #444;
        color: #fff;
    }
}
</style>
