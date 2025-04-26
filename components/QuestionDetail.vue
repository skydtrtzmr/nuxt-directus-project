<!-- components/QuestionDetail.vue -->
<!-- 题目详情页。这里是包含整个题目详情的页面，包括题目所属的章节、公共题干、题目内容、答题区、 -->
<template>
    <div class="main-content">
        <div class="h-full">
            <template
                v-if="questionData && selectedQuestionResult"
            >
                <h3 class="m-4 red-text">
                    {{ questionData.title || '试题' }}
                </h3>
                <p>
                    {{ questionData.description || '' }}
                </p>
            </template>
            <Divider />
            <br />
            <div class="flex flex-row gap-4 h-full">
                <!-- 公共题干 -->
                <CommonQuestionContent
                    class="basis-2/5 h-full"
                    v-if="
                        questionData?.question_group
                    "
                    :questionData="questionData"
                />

                <Divider
                    layout="vertical"
                    v-if="
                        questionData?.question_group
                    "
                />

                <!-- 题目内容和答题区 -->
                <div class="basis-3/5 h-full">
                    <div v-if="selectedQuestionResult && questionData">
                        <!-- 题目类型判断和渲染 -->
                        <div>
                            <h4>题目：</h4>
                            <div v-html="questionData.stem"></div>
                            
                            <!-- 选项区域 -->
                            <div class="options-container mt-4">
                                <!-- 根据题目类型展示不同的答题方式 -->
                                <template v-if="questionData.type === 'q_mc_single'">
                                    <div v-for="(option, key) in getOptions(questionData)" :key="key" class="option-item">
                                        <RadioButton
                                            v-model="selectedQuestionResult.submit_ans_select_radio"
                                            :value="key"
                                            :disabled="exam_page_mode === 'review'"
                                            @change="updateAnswer"
                                        />
                                        <label class="ml-2">{{ key }}. {{ option }}</label>
                                    </div>
                                </template>
                                
                                <template v-else-if="questionData.type === 'q_mc_multi'">
                                    <div v-for="(option, key) in getOptions(questionData)" :key="key" class="option-item">
                                        <Checkbox
                                            v-model="selectedQuestionResult.submit_ans_select_multiple_checkbox"
                                            :value="key"
                                            :disabled="exam_page_mode === 'review'"
                                            @change="updateAnswer"
                                        />
                                        <label class="ml-2">{{ key }}. {{ option }}</label>
                                    </div>
                                </template>
                            </div>
                            
                            <!-- 查看模式下的答案和解析 -->
                            <div v-if="exam_page_mode === 'review'" class="mt-4 p-4 bg-gray-100 rounded">
                                <div class="font-bold" :class="isCorrect ? 'text-green-600' : 'text-red-600'">
                                    {{ isCorrect ? '答案正确' : '答案错误' }}
                                </div>
                                <div class="mt-2">
                                    <span class="font-medium">得分：</span>
                                    {{ selectedQuestionResult.score }} / {{ selectedQuestionResult.point_value }}
                                </div>
                                <div class="mt-2">
                                    <span class="font-medium">正确答案：</span>
                                    {{ getCorrectAnswer(questionData) }}
                                </div>
                                <div class="mt-2" v-if="questionData.analysis">
                                    <span class="font-medium">解析：</span>
                                    <div v-html="questionData.analysis"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import CommonQuestionContent from "~/components/CommonQuestionContent.vue";
import type { QuestionResults, Questions, QMcSingle } from "~/types/directus_types";

const props = defineProps<{
    selectedQuestionResult: QuestionResults | null;
    exam_page_mode: string;
}>();

const { updateItem } = useDirectusItems();

// 获取题目数据
const questionData = computed(() => {
    if (!props.selectedQuestionResult) return null;
    
    // 这里需要调整，根据实际情况从QuestionResults中获取题目数据
    // 可能需要从关联字段中获取，或通过API单独获取题目详情
    return null; // 暂时返回null，实际项目中需要实现此功能
});

// 获取题目的选项
const getOptions = (question: Questions) => {
    const options: Record<string, string> = {};
    
    if (question.type === 'q_mc_single' && question.q_mc_single) {
        if ((question.q_mc_single as QMcSingle).option_a) options['A'] = question.q_mc_single.option_a;
        if (question.q_mc_single.option_b) options['B'] = question.q_mc_single.option_b;
        if (question.q_mc_single.option_c) options['C'] = question.q_mc_single.option_c;
        if (question.q_mc_single.option_d) options['D'] = question.q_mc_single.option_d;
    } else if (question.type === 'q_mc_multi' && question.q_mc_multi) {
        if (question.q_mc_multi.option_a) options['A'] = question.q_mc_multi.option_a;
        if (question.q_mc_multi.option_b) options['B'] = question.q_mc_multi.option_b;
        if (question.q_mc_multi.option_c) options['C'] = question.q_mc_multi.option_c;
        if (question.q_mc_multi.option_d) options['D'] = question.q_mc_multi.option_d;
    }
    
    return options;
};

// 获取正确答案
const getCorrectAnswer = (question: Questions) => {
    if (question.type === 'q_mc_single' && question.q_mc_single) {
        return question.q_mc_single.correct_option || '';
    } else if (question.type === 'q_mc_multi' && question.q_mc_multi) {
        const correctOptions = question.q_mc_multi.correct_options as string[] || [];
        return correctOptions.join(', ');
    }
    return '';
};

// 判断答案是否正确
const isCorrect = computed(() => {
    if (!props.selectedQuestionResult) return false;
    return props.selectedQuestionResult.score === props.selectedQuestionResult.point_value;
});

// 更新答案
const updateAnswer = async () => {
    if (!props.selectedQuestionResult || props.exam_page_mode === 'review') return;
    
    try {
        const updateData: any = {};
        
        if (questionData.value?.type === 'q_mc_single') {
            updateData.submit_ans_select_radio = props.selectedQuestionResult.submit_ans_select_radio;
        } else if (questionData.value?.type === 'q_mc_multi') {
            updateData.submit_ans_select_multiple_checkbox = props.selectedQuestionResult.submit_ans_select_multiple_checkbox;
        }
        
        await updateItem({
            collection: 'question_results',
            id: props.selectedQuestionResult.id,
            item: updateData
        });
        console.log('答案已更新');
    } catch (error) {
        console.error('更新答案失败:', error);
    }
};
</script>

<style scoped>
.main-content {
    padding: 20px;
}
.option-item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
}
</style>
