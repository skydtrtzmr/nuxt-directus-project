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
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

/* 题目头部区域 */
.question-header-section {
    flex-shrink: 0;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border-bottom: 2px solid var(--p-surface-200);
    box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
}

.question-header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.75rem 2rem;
    gap: 2rem;
}

.question-title-section {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    flex: 1;
}

.question-number-badge {
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, var(--p-primary-500), var(--p-primary-600));
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 6px 20px rgba(var(--p-primary-500-rgb), 0.3);
    position: relative;
}

.question-number-badge::before {
    content: '';
    position: absolute;
    inset: -2px;
    background: linear-gradient(135deg, var(--p-primary-400), var(--p-primary-700));
    border-radius: 18px;
    z-index: -1;
    opacity: 0.3;
}

.question-number {
    color: white;
    font-size: 1.25rem;
    font-weight: 700;
}

.question-title-info {
    flex: 1;
    min-width: 0;
}

.question-title {
    font-size: 1.375rem;
    font-weight: 600;
    color: var(--p-surface-800);
    margin: 0 0 0.5rem 0;
    line-height: 1.4;
    word-break: break-word;
}

.question-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.875rem;
    color: var(--p-surface-500);
}

.question-type {
    background: var(--p-primary-50);
    color: var(--p-primary-700);
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-weight: 500;
}

.question-divider {
    color: var(--p-surface-300);
}

.question-mode {
    font-weight: 500;
}

.question-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
}

:deep(.score-tag) {
    border-radius: 12px !important;
    padding: 0.75rem 1rem !important;
    font-weight: 600 !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

.score-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

/* 空状态 */
.empty-state {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 2rem;
    text-align: left;
}

.empty-icon {
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, var(--p-surface-300), var(--p-surface-400));
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.75rem;
    flex-shrink: 0;
}

.empty-content {
    flex: 1;
}

.empty-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--p-surface-700);
    margin: 0 0 0.5rem 0;
}

.empty-description {
    color: var(--p-surface-500);
    margin: 0;
    line-height: 1.6;
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
    padding: 1.5rem 2rem;
    overflow: hidden;
}

.question-content-container {
    width: 100%;
    height: 100%;
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid var(--p-surface-200);
    overflow: hidden;
    position: relative;
}

.question-content-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--p-primary-400), var(--p-blue-400), var(--p-cyan-400));
    z-index: 1;
}

/* 底部导航区域 */
.question-footer-section {
    flex-shrink: 0;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border-top: 2px solid var(--p-surface-200);
    padding: 1.5rem 2rem;
    box-shadow: 0 -2px 16px rgba(0, 0, 0, 0.08);
}

.navigation-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 600px;
    margin: 0 auto;
    gap: 2rem;
}

.navigation-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
}

.nav-tips {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--p-surface-500);
    padding: 0.5rem 1rem;
    background: var(--p-surface-50);
    border-radius: 20px;
    border: 1px solid var(--p-surface-200);
}

/* 导航按钮样式 */
:deep(.nav-button) {
    border-radius: 12px !important;
    padding: 0.875rem 1.5rem !important;
    font-weight: 600 !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    border: 2px solid transparent !important;
}

:deep(.nav-button-prev) {
    background: linear-gradient(135deg, var(--p-surface-100), var(--p-surface-200)) !important;
    color: var(--p-surface-700) !important;
}

:deep(.nav-button-prev:hover) {
    background: linear-gradient(135deg, var(--p-surface-200), var(--p-surface-300)) !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2) !important;
}

:deep(.nav-button-next) {
    background: linear-gradient(135deg, var(--p-primary-500), var(--p-primary-600)) !important;
    color: white !important;
}

:deep(.nav-button-next:hover) {
    background: linear-gradient(135deg, var(--p-primary-600), var(--p-primary-700)) !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 20px rgba(var(--p-primary-500-rgb), 0.4) !important;
}

:deep(.nav-button:active) {
    transform: translateY(0) !important;
}

/* 响应式设计 */
@media screen and (max-width: 1024px) {
    .question-header-content {
        padding: 1.5rem;
        gap: 1.5rem;
    }
    
    .question-content-wrapper {
        padding: 1.25rem;
    }
    
    .question-footer-section {
        padding: 1.25rem 1.5rem;
    }
}

@media screen and (max-width: 768px) {
    .question-detail-container {
        border-radius: 16px;
    }
    
    .question-header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
        padding: 1.25rem;
    }
    
    .question-title-section {
        gap: 1rem;
    }
    
    .question-number-badge {
        width: 48px;
        height: 48px;
    }
    
    .question-title {
        font-size: 1.25rem;
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
        font-size: 0.8rem;
        padding: 0.375rem 0.75rem;
    }
    
    :deep(.nav-button) {
        width: 100% !important;
        max-width: 200px !important;
    }
    
    .empty-state {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
    }
    
    .empty-icon {
        width: 56px;
        height: 56px;
        font-size: 1.5rem;
    }
}

@media screen and (max-width: 480px) {
    .question-content-wrapper {
        padding: 1rem;
    }
    
    .question-header-content {
        padding: 1rem;
    }
    
    .question-footer-section {
        padding: 1rem;
    }
    
    .question-title {
        font-size: 1.125rem;
    }
    
    .question-number-badge {
        width: 44px;
        height: 44px;
    }
    
    .question-number {
        font-size: 1.125rem;
    }
}

/* 滚动面板自定义样式 */
:deep(.p-scrollpanel .p-scrollpanel-wrapper) {
    border-right: none;
}

:deep(.p-scrollpanel .p-scrollpanel-bar) {
    background-color: var(--p-primary-300);
    opacity: 0.6;
    border-radius: 20px;
    transition: opacity 0.3s ease;
}

:deep(.p-scrollpanel .p-scrollpanel-bar:hover) {
    opacity: 0.8;
    background-color: var(--p-primary-400);
}

/* 动画效果 */
.question-detail-container {
    animation: slideIn 0.4s ease-out;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.question-header-section,
.question-content-main,
.question-footer-section {
    animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}
</style>
