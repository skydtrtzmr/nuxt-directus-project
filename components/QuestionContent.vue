<!-- components/QuestionContent.vue -->
<!-- 在这里进行题型的判断，根据题型渲染不同的组件 -->
<template>
    <div>
        <template v-if="selectedQuestion && selectedQuestion.questions_id">
            <!-- 单选题 -->
            <template v-if="selectedQuestion.questions_id.type === 'q_mc_single'">
                <QMcSingle 
                    :questionData="selectedQuestion" 
                    :exam_page_mode="exam_page_mode" 
                />
            </template>
            
            <!-- 多选题 -->
            <template v-else-if="selectedQuestion.questions_id.type === 'q_mc_multi'">
                <QMcMulti 
                    :questionData="selectedQuestion" 
                    :exam_page_mode="exam_page_mode" 
                />
            </template>
            
            <!-- 判断题 (二元选择) -->
            <template v-else-if="selectedQuestion.questions_id.type === 'q_mc_binary'">
                <QMcBinary 
                    :questionData="selectedQuestion" 
                    :exam_page_mode="exam_page_mode" 
                />
            </template>
            
            <!-- 灵活选择题 -->
            <template v-else-if="selectedQuestion.questions_id.type === 'q_mc_flexible'">
                <QMcFlexible 
                    :questionData="selectedQuestion" 
                    :exam_page_mode="exam_page_mode" 
                />
            </template>
            
            <!-- 未知题型情况 -->
            <template v-else>
                <div class="unknown-question-type">
                    <p class="text-red-500">未知题型: {{ selectedQuestion.questions_id.type }}</p>
                    <pre class="bg-gray-100 p-4 rounded mt-2">{{ selectedQuestion.questions_id }}</pre>
                </div>
            </template>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { QuestionResults } from "~/types/directus_types";
import QMcSingle from "~/components/question_type/QMcSingle.vue";
import QMcMulti from "~/components/question_type/QMcMulti.vue";
import QMcBinary from "~/components/question_type/QMcBinary.vue";
import QMcFlexible from "~/components/question_type/QMcFlexible.vue";

const props = defineProps<{
    selectedQuestion: any | null;
    exam_page_mode: string;
}>();
</script>

<style scoped>
.unknown-question-type {
    border: 2px dashed #ff5252;
    padding: 16px;
    border-radius: 8px;
    margin-top: 20px;
}
</style> 