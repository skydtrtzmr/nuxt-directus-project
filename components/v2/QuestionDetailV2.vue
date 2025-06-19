<template>
    <div class="question-detail-v2">
        <div class="detail-header">
            <template v-if="selectedQuestion && selectedQuestion.questions_id">
                <div class="title-container">
                    <span class="question-number">{{ selectedQuestion.sort_in_section || "?" }}</span>
                    <h3 class="question-title">{{ selectedQuestion.questions_id.title || "试题" }}</h3>
                </div>
                <div class="actions-container">
                    <Button
                        @click="navigateQuestion(-1)"
                        icon="pi pi-arrow-left"
                        label="上一题"
                        class="p-button-text"
                    />
                    <Button
                        @click="navigateQuestion(1)"
                        icon="pi pi-arrow-right"
                        iconPos="right"
                        label="下一题"
                        class="p-button-text"
                    />
                </div>
            </template>
            <div v-else class="placeholder">
                <i class="pi pi-book mr-2"></i>
                <span>请从左侧列表选择题目</span>
            </div>
        </div>

        <div class="detail-content">
            <ScrollPanel v-if="selectedQuestion" class="content-scrollpanel">
                 <QuestionContent
                    :selectedQuestion="selectedQuestion"
                    :exam_page_mode="exam_page_mode"
                    :renderMarkdown="render"
                    :groupMode="false"
                    :currentQuestionResult="currentSingleQuestionResult"
                    :questionResults="props.questionResults"
                />
            </ScrollPanel>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import QuestionContent from "~/components/QuestionContent.vue";
import type { QuestionResults } from "~/types/directus_types";
import { useMarkdown } from '~/composables/useMarkdown';

const { render } = useMarkdown();

const props = defineProps<{
    selectedQuestion: any | null;
    exam_page_mode: string;
    practiceSessionId: string;
    questionResults: QuestionResults[];
}>();

const emit = defineEmits(["navigate-question"]);

const navigateQuestion = (direction: -1 | 1) => {
    emit("navigate-question", direction);
};

const getResultByPsqId = (psqId: string | number | undefined | null): QuestionResults | null => {
    if (!props.questionResults || psqId === undefined || psqId === null) return null;
    const psqIdStr = String(psqId);
    return props.questionResults.find(qr => {
        const qrPsq = qr.question_in_paper_id;
        if (typeof qrPsq === 'object' && qrPsq !== null && 'id' in qrPsq) {
            return String(qrPsq.id) === psqIdStr;
        }
        return String(qrPsq) === psqIdStr;
    }) || null;
};

const currentSingleQuestionResult = computed<QuestionResults | null>(() => {
    if (!props.selectedQuestion || !props.selectedQuestion.id) return null;
    return getResultByPsqId(props.selectedQuestion.id);
});

</script>

<style scoped>
.question-detail-v2 {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

.detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1.5rem;
    border-bottom: 1px solid var(--surface-border);
    flex-shrink: 0;
    min-height: 60px;
}

.title-container {
    display: flex;
    align-items: center;
    gap: 1rem;
    overflow: hidden;
}

.question-number {
    font-size: 1rem;
    font-weight: 700;
    color: var(--primary-color-text);
    background-color: var(--primary-color);
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.question-title {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.actions-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
}

.placeholder {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--text-color-secondary);
}

.detail-content {
    flex: 1;
    overflow: hidden;
    position: relative;
}

.content-scrollpanel {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    padding: 1.5rem;
}
</style> 