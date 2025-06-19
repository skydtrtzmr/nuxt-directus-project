<!-- components/v2/QuestionListV2.vue -->
<template>
    <div class="question-list-v2">
        <div class="list-header">
            <h3>题目列表</h3>
            <div class="stats">
                <span>{{ answeredCount }} / {{ totalQuestions }}</span>
            </div>
        </div>
        <ScrollPanel class="list-content">
            <div v-for="(section, sectionIndex) in submittedPaperSections" :key="section.id || sectionIndex" class="section">
                <div class="section-title" @click="toggleSection(sectionIndex)">
                    <span>{{ section.title }}</span>
                    <i :class="['pi', expandedSections.has(sectionIndex) ? 'pi-chevron-down' : 'pi-chevron-right']"></i>
                </div>
                <transition name="fade">
                    <div v-if="expandedSections.has(sectionIndex)" class="question-grid">
                        <Button
                            v-for="question in section.questions"
                            :key="question.id"
                            :label="String(question.sort_in_section)"
                            :class="[
                                'question-button',
                                { 'answered': isQuestionAnswered(question) },
                                { 'selected': selectedQuestion && selectedQuestion.id === question.id }
                            ]"
                            @click="selectQuestion(question)"
                            outlined
                        />
                    </div>
                </transition>
            </div>
        </ScrollPanel>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { PaperSections, QuestionResults, PaperSectionsQuestions } from "~~/types/directus_types";

const props = defineProps<{
    submittedPaperSections: PaperSections[];
    selectQuestion: (question: any) => void;
    selectedQuestion: any | null;
    questionResults: QuestionResults[];
}>();

const expandedSections = ref<Set<number>>(new Set([0])); // Default expand first section

const toggleSection = (index: number) => {
    if (expandedSections.value.has(index)) {
        expandedSections.value.delete(index);
    } else {
        expandedSections.value.add(index);
    }
};

const questionResultsMap = computed(() => {
    const map = new Map<string, QuestionResults>();
    if (props.questionResults) {
        for (const result of props.questionResults) {
             let key: string | undefined = undefined;
            if (typeof result.question_in_paper_id === 'number' || typeof result.question_in_paper_id === 'string') {
                key = String(result.question_in_paper_id);
            } else if (result.question_in_paper_id && typeof result.question_in_paper_id === 'object' && 'id' in result.question_in_paper_id) {
                key = String(result.question_in_paper_id.id);
            }
            if (key !== undefined) {
                map.set(key, result);
            }
        }
    }
    return map;
});

const isQuestionAnswered = (question: PaperSectionsQuestions) => {
    const result = questionResultsMap.value.get(String(question.id));
    if (!result) return false;

    // 检查单选题答案
    if (result.submit_ans_select_radio && result.submit_ans_select_radio.trim() !== '') {
        return true;
    }

    // 检查多选题答案 (类型是 unknown，所以要做类型守卫)
    if (Array.isArray(result.submit_ans_select_multiple_checkbox) && result.submit_ans_select_multiple_checkbox.length > 0) {
        return true;
    }

    return false;
};

const totalQuestions = computed(() => {
    return props.submittedPaperSections.reduce((acc, section) => acc + (section.questions?.length || 0), 0);
});

const answeredCount = computed(() => {
    let count = 0;
    props.submittedPaperSections.forEach(section => {
        section.questions?.forEach(q => {
            if (isQuestionAnswered(q)) {
                count++;
            }
        });
    });
    return count;
});

</script>

<style scoped>
.question-list-v2 {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

.list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid var(--surface-border);
    flex-shrink: 0;
}

.list-header h3 {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
}

.stats {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text-color-secondary);
}

.list-content {
    flex: 1;
    overflow-y: auto;
}

.section {
    border-bottom: 1px solid var(--surface-border);
}

.section-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    cursor: pointer;
    font-weight: 600;
    transition: background-color 0.2s;
}

.section-title:hover {
    background-color: var(--surface-hover);
}

.question-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
    gap: 0.75rem;
    padding: 1rem;
    background-color: var(--surface-section);
}

.question-button {
    width: 40px;
    height: 40px;
    padding: 0;
    font-size: 0.875rem;
    transition: all 0.2s;
    justify-content: center;
}

.question-button.answered {
    background-color: var(--primary-color) !important;
    color: var(--primary-color-text) !important;
    border-color: var(--primary-color) !important;
}

.question-button.selected {
    transform: scale(1.1);
    box-shadow: 0 0 0 2px var(--surface-card), 0 0 0 4px var(--primary-color);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 