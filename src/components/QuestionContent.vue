<!-- components/QuestionContent.vue -->
<!-- 这里是题目内容组件 -->
<template>
    <div>
        <p>{{ selectedSubmittedQuestion.question.stem }}</p>
        <!-- 根据题型渲染不同的答题组件 -->
        <div v-if="selectedSubmittedQuestion.option_number">
            <!-- 单选题或多选题 -->
            <!-- <ul>
                <li v-for="(option, index) in question.options" :key="index">
                    <input
                        type="radio"
                        v-if="question.option_number === 1"
                        :name="question.id"
                        :value="option"
                        v-model="selectedAnswer"
                    />
                    <input
                        type="checkbox"
                        v-else
                        :name="question.id"
                        :value="option"
                        v-model="selectedAnswer"
                    />
                    {{ option }}
                </li>
            </ul> -->
        </div>
        <div v-else>
            <!-- 填空题 -->
            <textarea
                v-model="selectedAnswer"
                placeholder="输入答案..."
            ></textarea>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    selectedSubmittedQuestion: Object,
});

const question_shared_stem = props.selectedSubmittedQuestion.question.shared_stem;

const selectedAnswer = ref("");
</script>
