<!-- components/QuestionDetail.vue -->
<!-- 题目详情页。这里是包含整个题目详情的页面，包括题目所属的章节、题目内容、答题区 -->
<template>
    <div class="question-detail-container">
        <!-- 题目头部信息 -->
        <div class="question-header-section">
            <template v-if="selectedQuestion && selectedQuestion.questions_id">
                <div class="question-header-content">
                    <div class="question-title-section">
                        <div class="question-number-badge">
                            <span class="question-number">{{ selectedQuestion.sort_in_section || "?" }}</span>
                        </div>
                        <div class="question-title-info">
                            <h3 class="question-title">
                                <template v-if="isGroupMode">
                                    {{ selectedQuestion.questionGroup?.title || "题组" }}
                                </template>
                                <template v-else>
                                    {{ (selectedQuestion.questions_id as Questions)?.title || "试题" }}
                                </template>
                            </h3>
                            <div class="question-meta">
                                <span class="question-type">{{ getQuestionTypeDisplay() }}</span>
                                <span class="question-divider">•</span>
                                <span class="question-mode">{{ isGroupMode ? '题组模式' : '单题模式' }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="question-actions">
                        <Tag
                            v-if="
                                !isGroupMode &&
                                currentSingleQuestionResult &&
                                currentSingleQuestionResult.point_value !== null &&
                                currentSingleQuestionResult.point_value !== undefined
                            "
                            :severity="getScoreSeverity"
                            class="score-tag"
                        >
                            <div class="score-content">
                                <i class="pi pi-star-fill"></i>
                                <span>{{ getScoreDisplay }}</span>
                            </div>
                        </Tag>
                    </div>
                </div>
            </template>
            <div v-else class="empty-state">
                <div class="empty-icon">
                    <i class="pi pi-book"></i>
                </div>
                <div class="empty-content">
                    <h3 class="empty-title">等待选择题目</h3>
                    <p class="empty-description">请从左侧选择一个题目开始答题</p>
                </div>
            </div>
        </div>

        <!-- 题目内容主体 -->
        <div class="question-content-main">
            <div class="question-content-wrapper">
                <div class="question-content-container">
                    <!-- 题组模式 -->
                    <QuestionGroupContent
                        v-if="
                            isGroupMode &&
                            selectedQuestion &&
                            selectedQuestion.questionGroup
                        "
                        :questionGroup="selectedQuestion.questionGroup"
                        :practiceSessionId="practiceSessionId"
                        :questionResults="props.questionResults"
                        :exam_page_mode="exam_page_mode"
                        :groupQuestions="selectedQuestion.groupQuestions || []"
                        :renderMarkdown="render"
                    />

                    <!-- 单题模式 -->
                    <ScrollPanel
                        v-else-if="selectedQuestion"
                        style="width: 100%; height: 100%"
                        :pt="{
                            bary: 'hover:bg-primary-400 bg-primary-300 opacity-80 rounded-full',
                            barx: 'hover:bg-primary-400 bg-primary-300 opacity-80 rounded-full'
                        }"
                    >
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
        </div>

        <!-- 底部导航栏 -->
        <div
            v-if="selectedQuestion && exam_page_mode !== 'review'"
            class="question-footer-section"
        >
            <div class="navigation-container">
                <Button
                    @click="navigateQuestion(-1)"
                    icon="pi pi-chevron-left"
                    label="上一题"
                    class="nav-button nav-button-prev"
                    :aria-label="isGroupMode ? '上一题组' : '上一题'"
                />
                
                <div class="navigation-info">
                    <div class="nav-tips">
                        <i class="pi pi-info-circle"></i>
                        <span>{{ isGroupMode ? '题组答题' : '单题答题' }}</span>
                    </div>
                </div>

                <Button
                    @click="navigateQuestion(1)"
                    icon="pi pi-chevron-right"
                    iconPos="right"
                    label="下一题"
                    class="nav-button nav-button-next"
                    :aria-label="isGroupMode ? '下一题组' : '下一题'"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { watch, computed, ref, onMounted } from "vue";
import QuestionContent from "~/components/QuestionContent.vue";
import QuestionGroupContent from "~/components/QuestionGroupContent.vue";
import type { QuestionResults, PaperSectionsQuestions, Questions } from "~/types/directus_types";
import { useMarkdown } from '~/composables/useMarkdown';
import ScrollPanel from 'primevue/scrollpanel';
import Button from 'primevue/button';
import Tag from 'primevue/tag';

const { render } = useMarkdown();

const props = defineProps<{
    selectedQuestion: any | null;
    exam_page_mode: string;
    practiceSessionId: string;
    questionResults: QuestionResults[];
}>();

const emit = defineEmits(["navigate-question"]);

// Helper: Get result for a question by its PaperSectionsQuestions ID
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

// Is current view in group mode?
const isGroupMode = computed(() => {
    return (
        props.selectedQuestion &&
        props.selectedQuestion.isGroupMode === true &&
        props.selectedQuestion.questionGroup !== undefined
    );
});

// For single question mode: the result of the currently selected single question
const currentSingleQuestionResult = computed<QuestionResults | null>(() => {
    if (isGroupMode.value || !props.selectedQuestion || !props.selectedQuestion.id) return null;
    return getResultByPsqId(props.selectedQuestion.id);
});

// 获取题型显示文本
const getQuestionTypeDisplay = () => {
    if (!props.selectedQuestion || !props.selectedQuestion.questions_id) return '';
    const type = props.selectedQuestion.questions_id.type;
    switch (type) {
        case "q_mc_single":
            return "单选题";
        case "q_mc_multi":
            return "多选题";
        case "q_mc_binary":
            return "判断题";
        case "q_mc_flexible":
            return "不定项选择题";
        default:
            return "未知题型";
    }
};

// 导航到上一题或下一题
const navigateQuestion = (direction: number) => {
    emit("navigate-question", direction);
};

// 获取分数展示文本
const getScoreDisplay = computed(() => {
    if (isGroupMode.value || !currentSingleQuestionResult.value) return "";
    const score = currentSingleQuestionResult.value.score;
    const pointValue = currentSingleQuestionResult.value.point_value;
    if (score === undefined || score === null || pointValue === undefined || pointValue === null || pointValue === 0) {
        return ""; // 或者显示 "未评分" 等
    }
    return `${score}/${pointValue}分`;
});

// 获取分数标签样式
const getScoreSeverity = computed(() => {
    if (isGroupMode.value || !currentSingleQuestionResult.value) return "info";
    const score = currentSingleQuestionResult.value.score;
    const pointValue = currentSingleQuestionResult.value.point_value;
    if (score === undefined || score === null || pointValue === undefined || pointValue === null || pointValue === 0) {
        return "info";
    }
    const percentage = (score / pointValue) * 100;
    if (percentage >= 80) return "success";
    if (percentage >= 60) return "warning";
    return "danger";
});
</script>

<style scoped>
.question-detail-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: white;
    overflow: hidden;
}

/* 题目头部区域 */
.question-header-section {
    flex-shrink: 0;
    background: white;
    border-bottom: 1px solid #e0e0e0;
    padding: 1rem 1.5rem;
}

.question-header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1.5rem;
}

.question-title-section {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
}

.question-number-badge {
    width: 40px;
    height: 40px;
    background: var(--p-primary-500);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.question-number {
    color: white;
    font-size: 1rem;
    font-weight: 600;
}

.question-title-info {
    flex: 1;
    min-width: 0;
}

.question-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #333;
    margin: 0 0 0.25rem 0;
    line-height: 1.4;
    word-break: break-word;
}

.question-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #666;
}

.question-type {
    background: #f0f0f0;
    color: #333;
    padding: 0.125rem 0.5rem;
    border-radius: 3px;
    font-size: 0.75rem;
    font-weight: 500;
}

.question-divider {
    color: #ccc;
}

.question-mode {
    font-weight: 500;
}

.question-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

:deep(.score-tag) {
    border-radius: 4px !important;
    padding: 0.5rem 0.75rem !important;
    font-weight: 500 !important;
    font-size: 0.875rem !important;
}

.score-content {
    display: flex;
    align-items: center;
    gap: 0.375rem;
}

/* 空状态 */
.empty-state {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    text-align: left;
}

.empty-icon {
    width: 48px;
    height: 48px;
    background: #e0e0e0;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    font-size: 1.25rem;
    flex-shrink: 0;
}

.empty-content {
    flex: 1;
}

.empty-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #333;
    margin: 0 0 0.25rem 0;
}

.empty-description {
    color: #666;
    margin: 0;
    line-height: 1.5;
}

/* 题目内容主体 */
.question-content-main {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.question-content-wrapper {
    flex: 1;
    padding: 1rem 1.5rem;
    overflow: hidden;
}

.question-content-container {
    width: 100%;
    height: 100%;
    background: #fafafa;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
    position: relative;
}

/* 底部导航区域 */
.question-footer-section {
    flex-shrink: 0;
    background: white;
    border-top: 1px solid #e0e0e0;
    padding: 1rem 1.5rem;
}

.navigation-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 600px;
    margin: 0 auto;
    gap: 1.5rem;
}

.navigation-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
}

.nav-tips {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.8rem;
    color: #666;
    padding: 0.25rem 0.75rem;
    background: #f5f5f5;
    border-radius: 12px;
    border: 1px solid #e0e0e0;
}

/* 导航按钮样式 */
:deep(.nav-button) {
    border-radius: 4px !important;
    padding: 0.75rem 1.25rem !important;
    font-weight: 500 !important;
    transition: all 0.2s ease !important;
    border: 1px solid #e0e0e0 !important;
}

:deep(.nav-button-prev) {
    background: white !important;
    color: #666 !important;
}

:deep(.nav-button-prev:hover) {
    background: #f5f5f5 !important;
    border-color: #ccc !important;
}

:deep(.nav-button-next) {
    background: var(--p-primary-500) !important;
    color: white !important;
    border-color: var(--p-primary-500) !important;
}

:deep(.nav-button-next:hover) {
    background: var(--p-primary-600) !important;
    border-color: var(--p-primary-600) !important;
}

/* 响应式设计 */
@media screen and (max-width: 1024px) {
    .question-header-content {
        padding: 0;
        gap: 1rem;
    }
    
    .question-content-wrapper {
        padding: 0.75rem 1rem;
    }
    
    .question-footer-section {
        padding: 0.75rem 1rem;
    }
}

@media screen and (max-width: 768px) {
    .question-header-section {
        padding: 0.75rem 1rem;
    }
    
    .question-header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
    }
    
    .question-title-section {
        gap: 0.75rem;
    }
    
    .question-number-badge {
        width: 36px;
        height: 36px;
    }
    
    .question-number {
        font-size: 0.9rem;
    }
    
    .question-title {
        font-size: 1rem;
    }
    
    .question-meta {
        flex-wrap: wrap;
    }
    
    .navigation-container {
        flex-direction: column;
        gap: 1rem;
    }
    
    .navigation-info {
        order: -1;
    }
    
    .nav-tips {
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
    }
    
    :deep(.nav-button) {
        width: 100% !important;
        max-width: 180px !important;
    }
    
    .empty-state {
        flex-direction: column;
        text-align: center;
        gap: 0.75rem;
    }
    
    .empty-icon {
        width: 42px;
        height: 42px;
        font-size: 1.125rem;
    }
}

@media screen and (max-width: 480px) {
    .question-content-wrapper {
        padding: 0.5rem;
    }
    
    .question-header-section {
        padding: 0.75rem;
    }
    
    .question-footer-section {
        padding: 0.75rem;
    }
    
    .question-title {
        font-size: 0.9rem;
    }
    
    .question-number-badge {
        width: 32px;
        height: 32px;
    }
    
    .question-number {
        font-size: 0.8rem;
    }
}

/* 滚动面板自定义样式 */
:deep(.p-scrollpanel .p-scrollpanel-wrapper) {
    border-right: none;
}

:deep(.p-scrollpanel .p-scrollpanel-bar) {
    background-color: #ccc;
    opacity: 0.6;
    border-radius: 3px;
    transition: opacity 0.2s ease;
}

:deep(.p-scrollpanel .p-scrollpanel-bar:hover) {
    opacity: 0.8;
    background-color: #999;
}
</style>
