<!-- components/QMcBase.vue -->
<!-- 这里是通用选择题内容组件 -->
<template>
    <div
        v-if="
            questionData && questionData.questions_id && currentQuestionResult
        "
    >
        <!-- 题干 -->
        <div
            v-html="renderMarkdown(questionData.questions_id.stem)"
            class="markdown-content question-stem"
        ></div>
        <BlockUI
            :blocked="blockQuestion"
            class="basis-4/5 options-container mt-4"
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
            <!-- 选项列表 -->
            <div class="flex flex-col gap-3">
                <div
                    v-for="option in options"
                    :key="option.key"
                    class="flex items-start gap-3 option-item p-2 rounded-lg transition-all"
                    :id="`div_option_${option.key.toLowerCase()}_${uniqueId}`"
                    :class="{ 'option-selected': isOptionSelected(option.key) }"
                >
                    <RadioButton
                        v-if="
                            questionType === 'q_mc_single' ||
                            questionType === 'q_mc_binary'
                        "
                        v-model="localAnswer"
                        :inputId="`option_${option.key.toLowerCase()}_${uniqueId}`"
                        name="option"
                        :value="option.key"
                        @change="handleAnswerChangeAndOptimisticUpdate"
                    />
                    <Checkbox
                        v-if="
                            questionType === 'q_mc_multi' ||
                            questionType === 'q_mc_flexible'
                        "
                        v-model="localAnswer"
                        :inputId="`option_${option.key.toLowerCase()}_${uniqueId}`"
                        :name="`option_${option.key.toLowerCase()}`"
                        :value="option.key"
                        @change="handleAnswerChangeAndOptimisticUpdate"
                    />
                    <label
                        :for="`option_${option.key.toLowerCase()}_${uniqueId}`"
                        class="option-label flex-1 cursor-pointer"
                    >
                        <span class="option-marker">{{ option.key }}</span>
                        <span
                            v-html="renderMarkdown(option.text)"
                            class="markdown-content"
                        ></span>
                    </label>
                </div>
            </div>
        </BlockUI>
    </div>
    <template v-if="showResult && currentQuestionResult">
        <Divider />
        <!-- 以下是答题结果区域 -->
        <QuestionResult
            :questionResult="currentQuestionResult"
            :questionData="questionData"
            :question_type="dynamicQuestionTypeForQuestionResult"
            :renderMarkdown="renderMarkdown"
        ></QuestionResult>
    </template>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { QuestionResults } from "~/types/directus_types";

const {
    public: {
        directus: { url },
    },
} = useRuntimeConfig();

type QuestionType =
    | "q_mc_binary"
    | "q_mc_single"
    | "q_mc_multi"
    | "q_mc_flexible";

interface Option {
    key: string;
    text: string;
}

const props = defineProps<{
    questionData: any;
    exam_page_mode: string;
    renderMarkdown: (content: string) => string;
    questionType: QuestionType;
    currentQuestionResult: QuestionResults | null;
    questionResults: QuestionResults[];
}>();

// 防抖延迟时间 (毫秒)
const DEBOUNCE_DELAY_MS = 800;

/**
 * 防抖函数
 * @param fn 要执行的函数
 * @param delay 延迟时间 (毫秒)
 */
function debounce(fn: Function, delay: number) {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let lastArgs: any[] | null = null;
    // let lastThis: any = null; // 'this' context, not strictly needed for arrow functions / module scope functions

    const debounced = (...args: any[]) => {
        lastArgs = args;
        // lastThis = this;
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            if (lastArgs) {
                fn.apply(null, lastArgs); // Using null for 'this' as actualApiSubmit is an arrow function
            }
            timeoutId = null;
            // lastArgs = null; // Optionally clear after execution
        }, delay);
    };

    debounced.flush = () => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            if (lastArgs) {
                fn.apply(null, lastArgs); // Using null for 'this'
            }
            timeoutId = null;
            // lastArgs = null; // Optionally clear after execution
        }
    };

    debounced.cancel = () => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
            lastArgs = null; // Clear pending args on cancel
        }
    };
    return debounced;
}

const dynamicQuestionTypeForQuestionResult = computed(() => {
    return props.questionType;
});

/**
 * 生成唯一ID用于区分不同题目实例的选项
 * 在题组模式下，同一个页面可能存在多个单选题实例，每个实例都需要唯一的inputId
 * 这解决了点击选项文字时可能触发错误选项的问题
 */
const uniqueId = computed(() => {
    // 使用题目ID和groupQuestionIndex(如果存在)创建唯一标识
    const questionId = props.questionData?.id || "unknown";
    const groupIndex =
        props.questionData?.groupQuestionIndex !== undefined
            ? `_group_${props.questionData.groupQuestionIndex}`
            : "";
    return `${questionId}${groupIndex}`;
});

// 创建一个本地的响应式变量用于绑定UI
const localAnswer = ref<string | string[]>(
    props.questionType === "q_mc_multi" ||
        props.questionType === "q_mc_flexible"
        ? []
        : ""
);

/**
 * 实际的API提交逻辑
 */
const actualApiSubmit = async (
    questionResultForApi: QuestionResults,
    payloadForApi: any,
    originalDataForRollback: QuestionResults | null,
    resultIndexForRollback: number
) => {
    if (!questionResultForApi || !questionResultForApi.id) {
        console.error("actualApiSubmit: questionResultForApi 或其 ID 缺失。");
        return;
    }

    const MAX_RETRIES = 6;
    const RETRY_DELAY_MS = 1000;
    let retries = 0;

    while (retries < MAX_RETRIES) {
        try {
            const response = await $fetch(
                `/question-results-mq/question_result`,
                {
                    baseURL: url,
                    method: "POST",
                    body: {
                        collection: "question_results",
                        id: questionResultForApi.id,
                        item: {
                            ...payloadForApi,
                            practice_session_id: questionResultForApi.practice_session_id as string,
                        },
                    },
                }
            );
            console.log("答案已通过MQ提交更新:", response);
            return; // 成功
        } catch (error) {
            retries++;
            console.error(
                `通过MQ更新答案时出错 (尝试 ${retries}/${MAX_RETRIES}):`,
                error
            );
            if (retries >= MAX_RETRIES) {
                console.error("达到最大重试次数，更新答案失败。");
                // 回滚乐观更新
                if (resultIndexForRollback !== -1 && originalDataForRollback) {
                    props.questionResults.splice(
                        resultIndexForRollback,
                        1,
                        originalDataForRollback // 恢复原始数据
                    );
                    // 恢复 localAnswer 的值以反映回滚
                    if (
                        props.questionType === "q_mc_multi" ||
                        props.questionType === "q_mc_flexible"
                    ) {
                        localAnswer.value = Array.isArray(originalDataForRollback.submit_ans_select_multiple_checkbox)
                            ? [...originalDataForRollback.submit_ans_select_multiple_checkbox]
                            : [];
                    } else {
                        localAnswer.value = originalDataForRollback.submit_ans_select_radio || "";
                    }
                }
                return; // 失败
            }
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        }
    }
};

// 创建 debouncedActualApiSubmit 函数
const debouncedActualApiSubmit = debounce(actualApiSubmit, DEBOUNCE_DELAY_MS) as {
    (...args: Parameters<typeof actualApiSubmit>): void;
    flush: () => void;
    cancel: () => void;
};

/**
 * 监听整个questionData对象的变化，确保在题目切换时重置答案
 * 这确保了切换题目时能显示正确的已选答案
 */
watch(
    () => props.currentQuestionResult,
    (newResult, oldResult) => {
        // 如果题目已更改，则刷新上一题的待处理提交
        if (oldResult && oldResult.id && newResult?.id !== oldResult.id) {
            console.log(
                `题目从 ${oldResult.id} 切换到 ${newResult?.id}. 执行上一题 (${oldResult.id}) 的待处理提交。`
            );
            debouncedActualApiSubmit.flush();
        }

        // 为新题目重置 localAnswer
        if (
            props.questionType === "q_mc_multi" ||
            props.questionType === "q_mc_flexible"
        ) {
            if (newResult?.submit_ans_select_multiple_checkbox) {
                localAnswer.value = Array.isArray(
                    newResult.submit_ans_select_multiple_checkbox
                )
                    ? [...newResult.submit_ans_select_multiple_checkbox]
                    : [];
            } else {
                localAnswer.value = [];
            }
        } else {
            if (newResult?.submit_ans_select_radio) {
                localAnswer.value = newResult.submit_ans_select_radio;
            } else {
                localAnswer.value = "";
            }
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

/**
 * 当用户选择/更改答案时调用。
 * 执行乐观更新并调度 API 提交。
 */
const handleAnswerChangeAndOptimisticUpdate = async () => {
    if (!props.currentQuestionResult || !props.currentQuestionResult.id) {
        console.error("无法更新答案：currentQuestionResult 或其 ID 缺失。");
        return;
    }
    if (!props.questionResults || !Array.isArray(props.questionResults)) {
        console.error(
            "无法更新答案：questionResults prop 未定义或不是数组。父组件可能未正确传递。"
        );
        return;
    }

    const resultIdToUpdate = props.currentQuestionResult.id;
    let newAnswerPayload: any = {};

    if (
        props.questionType === "q_mc_multi" ||
        props.questionType === "q_mc_flexible"
    ) {
        newAnswerPayload.submit_ans_select_multiple_checkbox = localAnswer.value;
    } else {
        newAnswerPayload.submit_ans_select_radio = localAnswer.value;
    }

    const resultIndex = props.questionResults.findIndex(
        (qr) => qr.id === resultIdToUpdate
    );
    let originalResultDataForRollback: QuestionResults | null = null;

    // 乐观更新UI
    if (resultIndex !== -1) {
        originalResultDataForRollback = { // 创建浅拷贝用于回滚
            ...props.questionResults[resultIndex],
        };
        const currentLocalAnswer = localAnswer.value; // 捕获当前的 localAnswer
        const updatedResultItem = {
            ...props.questionResults[resultIndex],
            ...(props.questionType === "q_mc_multi" ||
            props.questionType === "q_mc_flexible"
                ? {
                      submit_ans_select_multiple_checkbox: Array.isArray(
                          currentLocalAnswer
                      )
                          ? [...currentLocalAnswer] // 确保多选答案是新数组
                          : [],
                  }
                : { submit_ans_select_radio: currentLocalAnswer as string }),
        };
        props.questionResults.splice(resultIndex, 1, updatedResultItem);
    } else {
        console.warn("在本地 questionResults 数组中未找到要乐观更新的记录。");
         // 如果找不到记录，可能不应该继续提交，或者初始状态应确保 currentQuestionResult 始终在 questionResults 中。
        return;
    }

    // 调度防抖的 API 提交
    // 传递 actualApiSubmit 所需的所有参数，包括用于回滚的数据
    debouncedActualApiSubmit(
        props.currentQuestionResult, // 当前提交的 QuestionResults 对象
        newAnswerPayload,
        originalResultDataForRollback,
        resultIndex
    );
};

/**
 * 计算属性：判断答案是否正确
 * 用于在UI上显示不同样式
 */
const isCorrectAnswer = computed(() => {
    if (!props.currentQuestionResult) return false;
    return (
        props.currentQuestionResult.point_value ===
        props.currentQuestionResult.score
    );
});

/**
 * 计算属性：根据答案正确性返回不同的CSS类
 */
const answerClass = computed(() => {
    return isCorrectAnswer.value ? "text-green-600" : "text-red-600";
});

const getOptionText = (optionKey: string): string => {
    const questionDetails =
        props.questionData?.questions_id?.[`${props.questionType}`];
    if (questionDetails) {
        const text = questionDetails[`option_${optionKey.toLowerCase()}`];
        return text || ""; // 返回空字符串如果选项文本未定义
    }
    return "";
};

const options = computed<Option[]>(() => {
    const allPossibleOptionKeys = ["A", "B", "C", "D", "E", "F"];
    const questionDetails =
        props.questionData?.questions_id?.[`${props.questionType}`];

    // console.log("questionDetails", questionDetails);

    if (!questionDetails) return [];

    return allPossibleOptionKeys
        .map((key) => ({
            key: key,
            text: getOptionText(key),
        }))
        .filter((option) => option.text !== "");
});

const isOptionSelected = (optionKey: string): boolean => {
    if (
        props.questionType === "q_mc_multi" ||
        props.questionType === "q_mc_flexible"
    ) {
        return (
            Array.isArray(localAnswer.value) &&
            localAnswer.value.includes(optionKey)
        );
    } else {
        return localAnswer.value === optionKey;
    }
};
</script>

<style scoped>
/* 题干样式 */
.question-stem {
    padding: 0.5rem 1rem;
    margin-bottom: 1rem;
    border-left: 4px solid var(--primary-color);
    background-color: rgba(var(--surface-50), 0.6);
    border-radius: 0 8px 8px 0;
    font-size: 1.05rem;
}

/* 选项容器样式 */
.options-container {
    margin-top: 1rem;
}

/* 选项项样式 */
.option-item {
    border: 1px solid var(--surface-200);
    transition: all 0.2s ease;
    font-size: 1.05rem;
}

.option-item:hover {
    background-color: var(--surface-100);
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.option-selected {
    border-color: var(--primary-color);
    background-color: rgba(var(--primary-color-rgb), 0.05);
    box-shadow: 0 2px 8px rgba(var(--primary-color-rgb), 0.15);
}

/* 确保Markdown内容的样式在此组件中正确显示 */
:deep(.markdown-content) {
    display: inline-block;
    font-size: 1.05rem;
}

:deep(.markdown-content p) {
    margin-bottom: 0.3em;
    display: inline;
}

/* 选项标签样式 */
.option-label {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 0.1rem 0;
}

/* 选项标记样式 */
.option-marker {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 28px;
    background-color: var(--surface-200);
    color: var(--text-color);
    font-weight: bold;
    border-radius: 50%;
    padding: 0 4px;
    margin-right: 8px;
    font-size: 14px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
}

.option-selected .option-marker {
    background-color: var(--primary-color);
    color: white;
    box-shadow: 0 2px 5px rgba(var(--primary-color-rgb), 0.3);
}

/* 深色模式下的选项标记 */
@media (prefers-color-scheme: dark) {
    .option-marker {
        background-color: var(--surface-600);
        color: var(--surface-50);
    }

    .option-item {
        border-color: var(--surface-600);
    }

    .option-item:hover {
        background-color: var(--surface-700);
    }

    .option-selected {
        border-color: var(--primary-color);
        background-color: rgba(var(--primary-color-rgb), 0.15);
    }
}
</style>
