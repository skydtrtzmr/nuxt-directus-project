<template>
    <div class="question-result-container">
        <!-- 结果状态卡片 -->
        <div
            class="result-status-card"
            :class="isCorrectAnswer ? 'correct-answer' : 'incorrect-answer'"
        >
            <div class="status-header">
                <div class="status-icon">
                    <i
                        :class="
                            isCorrectAnswer
                                ? 'pi pi-check-circle'
                                : 'pi pi-times-circle'
                        "
                    ></i>
                </div>
                <div class="status-text">
                    {{ isCorrectAnswer ? "回答正确" : "回答错误" }}
                </div>
                <div class="score-badge">
                    <span class="score-value">{{ questionResult.score }}</span>
                    <span class="score-divider">/</span>
                    <span class="total-score">{{
                        questionResult.point_value
                    }}</span>
                    <span class="score-unit">分</span>
                </div>
            </div>
        </div>

        <!-- 答案对比区域 -->
        <div class="answer-comparison-section">
            <div class="answer-grid">
                <!-- 考生答案 -->
                <div class="answer-card student-answer">
                    <div class="answer-header">
                        <i class="pi pi-user"></i>
                        <span class="answer-label">考生答案</span>
                    </div>
                    <div class="answer-content">
                        {{ getSubmittedAnswer() || "未作答" }}
                    </div>
                </div>

                <!-- 正确答案 -->
                <div class="answer-card correct-answer-card">
                    <div class="answer-header">
                        <i class="pi pi-check"></i>
                        <span class="answer-label">正确答案</span>
                    </div>
                    <div class="answer-content">{{ getCorrectAnswer() }}</div>
                </div>
            </div>
        </div>

        <!-- 题目解析区域 -->
        <div class="analysis-section">
            <div class="analysis-header">
                <div class="analysis-left">
                    <i class="pi pi-lightbulb"></i>
                    <span class="analysis-title">题目解析</span>
                </div>
                <div class="analysis-actions">
                    <Button
                        @click="copyQuestionDataForAI"
                        icon="pi pi-sparkles"
                        label="AI解析"
                        class="ai-copy-button"
                        :loading="copyLoading"
                        v-tooltip.top="'复制题目信息到AI助手获取详细解析'"
                        severity="warning"
                        rounded
                    />
                    <!-- 状态反馈 - 绝对定位不影响布局 -->
                    <div
                        v-if="copyStatus"
                        class="copy-status-message"
                        :class="copyStatusClass"
                    >
                        <i
                            :class="
                                copyStatus.includes('✅')
                                    ? 'pi pi-check'
                                    : 'pi pi-exclamation-triangle'
                            "
                        ></i>
                        <span>{{ copyStatus }}</span>
                    </div>
                </div>
            </div>
            <div class="analysis-content" v-if="getAnalysis()">
                <div
                    v-html="renderMarkdown(getAnalysis())"
                    class="markdown-content"
                ></div>
            </div>
            <div class="analysis-content" v-else>
                <p class="no-analysis-text">暂无题目解析</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import Button from "primevue/button";
import type { QuestionResults, Questions } from "~/types/directus_types";

const props = defineProps<{
    questionResult: QuestionResults;
    questionData?: any; // 可选的完整题目数据
    question_type:
        | "q_mc_single"
        | "q_mc_multi"
        | "q_mc_binary"
        | "q_mc_flexible";
    renderMarkdown: (content: string) => string;
}>();

// 复制状态相关
const copyStatus = ref("");
const copyStatusClass = ref("");
const copyLoading = ref(false);

// 格式化答案显示
const formatAnswerDisplay = (answer: any): string => {
    if (answer === null || answer === undefined) {
        return "未作答";
    }

    // 如果是数组，格式化为逗号分隔的字符串
    if (Array.isArray(answer)) {
        return answer.length > 0 ? answer.join(", ") : "未作答";
    }

    // 如果是字符串形式的数组（如 "['A','B']" 或 '["A","B"]'）
    if (typeof answer === "string") {
        try {
            const parsed = JSON.parse(answer);
            if (Array.isArray(parsed)) {
                return parsed.length > 0 ? parsed.join(", ") : "未作答";
            }
        } catch (e) {
            // 如果不是JSON格式，直接返回字符串
        }

        // 处理其他字符串格式，如果为空字符串则显示未作答
        return answer.trim() || "未作答";
    }

    // 其他类型转为字符串
    return String(answer);
};

// 获取学生提交的答案
const getSubmittedAnswer = (): string => {
    if (
        props.question_type === "q_mc_single" ||
        props.question_type === "q_mc_binary"
    ) {
        return formatAnswerDisplay(
            props.questionResult.submit_ans_select_radio
        );
    } else if (
        props.question_type === "q_mc_multi" ||
        props.question_type === "q_mc_flexible"
    ) {
        return formatAnswerDisplay(
            props.questionResult.submit_ans_select_multiple_checkbox
        );
    }
    return "未作答";
};

// 获取题目的正确答案
const getCorrectAnswer = (): string => {
    if (!props.questionData || !props.questionData.questions_id) {
        return "缺少题目数据";
    }

    const questionInfo = props.questionData.questions_id;

    if (props.question_type === "q_mc_single" && questionInfo.q_mc_single) {
        return (
            formatAnswerDisplay(questionInfo.q_mc_single.correct_option) ||
            "单选题缺少正确答案"
        );
    } else if (
        props.question_type === "q_mc_binary" &&
        questionInfo.q_mc_binary
    ) {
        return (
            formatAnswerDisplay(questionInfo.q_mc_binary.correct_option) ||
            "判断题缺少正确答案"
        );
    } else if (
        props.question_type === "q_mc_multi" &&
        questionInfo.q_mc_multi
    ) {
        return (
            formatAnswerDisplay(questionInfo.q_mc_multi.correct_options) ||
            "多选题缺少正确答案"
        );
    } else if (
        props.question_type === "q_mc_flexible" &&
        questionInfo.q_mc_flexible
    ) {
        return (
            formatAnswerDisplay(questionInfo.q_mc_flexible.correct_options) ||
            "不定项选择题缺少正确答案"
        );
    }

    return "无法获取正确答案";
};

// 获取题目解析
const getAnalysis = (): string => {
    if (!props.questionData || !props.questionData.questions_id) {
        return "";
    }

    const questionInfo = props.questionData.questions_id;

    if (props.question_type === "q_mc_single" && questionInfo.q_mc_single) {
        return questionInfo.q_mc_single.analysis || "";
    } else if (
        props.question_type === "q_mc_binary" &&
        questionInfo.q_mc_binary
    ) {
        return questionInfo.q_mc_binary.analysis || "";
    } else if (
        props.question_type === "q_mc_multi" &&
        questionInfo.q_mc_multi
    ) {
        return questionInfo.q_mc_multi.analysis || "";
    } else if (
        props.question_type === "q_mc_flexible" &&
        questionInfo.q_mc_flexible
    ) {
        return questionInfo.q_mc_flexible.analysis || "";
    }

    return "";
};

// 获取选项文本
const getOptionText = (optionKey: string): string => {
    if (!props.questionData || !props.questionData.questions_id) {
        return "";
    }

    const questionDetails =
        props.questionData.questions_id[props.question_type];
    if (questionDetails) {
        const text = questionDetails[`option_${optionKey.toLowerCase()}`];
        return text || "";
    }
    return "";
};

// 获取所有有效选项
const getValidOptions = () => {
    const allPossibleOptionKeys = ["A", "B", "C", "D", "E", "F"];
    return allPossibleOptionKeys
        .map((key) => ({
            key: key,
            text: getOptionText(key),
        }))
        .filter((option) => option.text !== "");
};

// 生成AI解析用的markdown文本
const generateQuestionMarkdown = (): string => {
    if (!props.questionData || !props.questionData.questions_id) {
        return "题目数据缺失";
    }

    const questionInfo = props.questionData.questions_id;
    const stem = questionInfo.stem || "题干缺失";
    const validOptions = getValidOptions();
    const submittedAnswer = getSubmittedAnswer();
    const correctAnswer = getCorrectAnswer();
    const analysis = getAnalysis();

    // 生成题干
    let markdown = `${stem}\n\n`;

    // 生成选项
    validOptions.forEach((option) => {
        markdown += `${option.key}. ${option.text}\n\n`;
    });

    markdown += `---\n\n`;

    // 考生答案和正确答案
    markdown += `【考生答案】${submittedAnswer}\n\n`;
    markdown += `【正确答案】${correctAnswer}\n\n`;

    // 题目解析
    if (analysis) {
        markdown += `【题目解析】\n${analysis}\n\n`;
    }

    markdown += `---\n\n`;
    markdown += `我对这题有些不理解，请给我讲解一下，谢谢！`;

    return markdown;
};

// 复制题目数据到剪贴板
const copyQuestionDataForAI = async () => {
    copyLoading.value = true;
    const markdownText = generateQuestionMarkdown();

    try {
        // 现代浏览器使用navigator.clipboard
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(markdownText);
            showCopySuccess();
        } else {
            // 备用方案：使用document.execCommand (已废弃但兼容性好)
            fallbackCopyText(markdownText);
        }
    } catch (error) {
        console.error("复制失败:", error);
        showCopyError("复制失败，请手动复制文本");
    } finally {
        copyLoading.value = false;
    }
};

// 备用复制方案
const fallbackCopyText = (text: string) => {
    try {
        // 创建临时textarea
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);

        // 选中并复制
        textarea.select();
        textarea.setSelectionRange(0, 99999); // 移动端兼容

        const successful = document.execCommand("copy");
        document.body.removeChild(textarea);

        if (successful) {
            showCopySuccess();
        } else {
            showCopyError("复制功能不支持，请查看控制台获取文本内容");
            console.log("题目内容：", generateQuestionMarkdown());
        }
    } catch (error) {
        console.error("备用复制方案也失败:", error);
        showCopyError("复制功能不可用，请查看控制台获取文本内容");
        console.log("题目内容：", generateQuestionMarkdown());
    }
};

// 显示复制成功状态
const showCopySuccess = () => {
    copyStatus.value = "✅ 题目内容已复制到剪贴板！";
    copyStatusClass.value = "success";

    // 5秒后清除状态
    setTimeout(() => {
        copyStatus.value = "";
    }, 5000);
};

// 显示复制失败状态
const showCopyError = (message: string) => {
    copyStatus.value = "❌ " + message;
    copyStatusClass.value = "error";

    // 5秒后清除状态
    setTimeout(() => {
        copyStatus.value = "";
    }, 5000);
};

const isCorrectAnswer = computed(() => {
    if (props.questionResult.point_value === props.questionResult.score) {
        return true;
    } else {
        return false;
    }
});

// 动态绑定正确/错误颜色
const answerClass = computed(() => {
    return isCorrectAnswer.value ? "text-green-600" : "text-red-600";
});
</script>

<style scoped>
.question-result-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    position: relative;
    overflow: hidden;
}

.question-result-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent 0%, var(--p-primary-500) 50%, transparent 100%);
    opacity: 0.7;
}

/* 结果状态卡片 */
.result-status-card {
    border-radius: 8px;
    padding: 1.5rem;
    border: 2px solid;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
}

.result-status-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.8s ease;
}

.result-status-card:hover::before {
    left: 100%;
}

.result-status-card.correct-answer {
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    border-color: #22c55e;
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
}

.result-status-card.incorrect-answer {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    border-color: #ef4444;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}

.status-header {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.status-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.125rem;
    font-weight: 700;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    position: relative;
}

.status-icon::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%);
    transform: rotate(45deg);
    animation: shimmer 3s infinite;
}

@keyframes shimmer {
    0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
    100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
}

.correct-answer .status-icon {
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    color: white;
}

.incorrect-answer .status-icon {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
}

.status-text {
    font-size: 1.125rem;
    font-weight: 700;
    flex: 1;
}

.correct-answer .status-text {
    color: #166534;
    text-shadow: 0 1px 2px rgba(22, 101, 52, 0.1);
}

.incorrect-answer .status-text {
    color: #991b1b;
    text-shadow: 0 1px 2px rgba(153, 27, 27, 0.1);
}

.score-badge {
    display: flex;
    align-items: baseline;
    gap: 0.375rem;
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, white 0%, #f8fafc 100%);
    border-radius: 8px;
    font-weight: 700;
    border: 2px solid #e2e8f0;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
}

.score-badge:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.score-value {
    font-size: 1.25rem;
    color: var(--p-primary-600);
    text-shadow: 0 1px 2px rgba(var(--p-primary-600), 0.2);
}

.score-divider,
.total-score {
    color: #64748b;
    font-weight: 600;
}

.score-unit {
    font-size: 0.875rem;
    color: #64748b;
    font-weight: 600;
}

/* 答案对比区域 */
.answer-comparison-section {
    background: linear-gradient(135deg, white 0%, #f8fafc 100%);
    border-radius: 8px;
    padding: 1.5rem;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    position: relative;
}

.answer-comparison-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 1.5rem;
    right: 1.5rem;
    height: 2px;
    background: linear-gradient(90deg, transparent 0%, #e2e8f0 50%, transparent 100%);
}

.answer-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
}

@media (max-width: 768px) {
    .answer-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
    }
}

.answer-card {
    border-radius: 8px;
    padding: 1.25rem;
    border: 2px solid;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
}

.answer-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    transition: left 0.6s ease;
}

.answer-card:hover::before {
    left: 100%;
}

.answer-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.student-answer {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-color: #3b82f6;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.correct-answer-card {
    background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
    border-color: #22c55e;
    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.15);
}

.answer-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
    font-weight: 700;
    color: #1e293b;
}

.answer-header i {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 0.875rem;
    font-weight: 700;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.student-answer .answer-header i {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
}

.correct-answer-card .answer-header i {
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    color: white;
}

.answer-content {
    font-size: 0.925rem;
    line-height: 1.6;
    color: #1e293b;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%);
    padding: 1rem;
    border-radius: 6px;
    border: 1px solid rgba(226, 232, 240, 0.5);
    font-weight: 500;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* 题目解析区域 */
.analysis-section {
    background: linear-gradient(135deg, white 0%, #f8fafc 100%);
    border-radius: 8px;
    padding: 1.5rem;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    position: relative;
}

.analysis-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 1.5rem;
    right: 1.5rem;
    height: 2px;
    background: linear-gradient(90deg, transparent 0%, #f59e0b 50%, transparent 100%);
}

.analysis-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #f1f5f9;
}

.analysis-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.analysis-left i {
    color: #f59e0b;
    font-size: 1.25rem;
    padding: 0.5rem;
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(245, 158, 11, 0.3);
}

.analysis-title {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1e293b;
    text-shadow: 0 1px 2px rgba(30, 41, 59, 0.1);
}

.analysis-actions {
    position: relative;
    display: flex;
    align-items: center;
}

:deep(.ai-copy-button) {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
    border: 2px solid #f59e0b !important;
    color: white !important;
    font-weight: 600 !important;
    padding: 0.75rem 1.25rem !important;
    border-radius: 8px !important;
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3) !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    position: relative !important;
    overflow: hidden !important;
}

:deep(.ai-copy-button::before) {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.6s ease;
}

:deep(.ai-copy-button:hover::before) {
    left: 100%;
}

:deep(.ai-copy-button:hover) {
    transform: translateY(-2px) !important;
    box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4) !important;
    background: linear-gradient(135deg, #d97706 0%, #b45309 100%) !important;
}

.analysis-content {
    color: #1e293b;
    line-height: 1.7;
    font-size: 0.925rem;
}

.no-analysis-text {
    color: #64748b;
    font-style: italic;
    margin: 0;
    font-size: 0.925rem;
    text-align: center;
    padding: 2rem;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 6px;
    border: 1px dashed #cbd5e1;
}

.copy-status-message {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    animation: slideInUp 0.3s ease-out;
    z-index: 10;
    white-space: nowrap;
    border: 2px solid;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.copy-status-message.success {
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    color: #166534;
    border-color: #22c55e;
}

.copy-status-message.error {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    color: #991b1b;
    border-color: #ef4444;
}

@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Markdown样式优化 */
:deep(.markdown-content) {
    line-height: 1.7;
    color: #1e293b;
}

:deep(.markdown-content) h1,
:deep(.markdown-content) h2,
:deep(.markdown-content) h3,
:deep(.markdown-content) h4,
:deep(.markdown-content) h5,
:deep(.markdown-content) h6 {
    margin-top: 1.75em;
    margin-bottom: 0.75em;
    font-weight: 700;
    color: #1e293b;
    line-height: 1.3;
}

:deep(.markdown-content) h1 {
    font-size: 1.5rem;
    background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

:deep(.markdown-content) h2 {
    font-size: 1.25rem;
}

:deep(.markdown-content) h3 {
    font-size: 1.125rem;
}

:deep(.markdown-content) p {
    margin-bottom: 1.25em;
    line-height: 1.7;
    color: #334155;
}

:deep(.markdown-content) ul,
:deep(.markdown-content) ol {
    padding-left: 1.75em;
    margin-bottom: 1.25em;
    line-height: 1.6;
}

:deep(.markdown-content) li {
    margin-bottom: 0.5em;
    color: #334155;
}

:deep(.markdown-content) code {
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-family: 'JetBrains Mono', 'Consolas', monospace;
    color: #475569;
    font-size: 0.875em;
    border: 1px solid #cbd5e1;
}

:deep(.markdown-content) pre {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    padding: 1.25rem;
    border-radius: 8px;
    overflow-x: auto;
    margin: 1.5rem 0;
    border: 1px solid #e2e8f0;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

:deep(.markdown-content) blockquote {
    border-left: 4px solid var(--p-primary-500);
    padding: 1rem 1.5rem;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    margin: 1.5rem 0;
    border-radius: 0 8px 8px 0;
    color: #334155;
    font-style: italic;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

:deep(.markdown-content) table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
    border-radius: 8px;
    overflow: hidden;
    background: white;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

:deep(.markdown-content) th,
:deep(.markdown-content) td {
    padding: 1rem;
    border: 1px solid #e2e8f0;
    text-align: left;
}

:deep(.markdown-content) th {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    font-weight: 700;
    color: #1e293b;
}

:deep(.markdown-content) tr:nth-child(even) td {
    background: linear-gradient(135deg, #fdfdfe 0%, #f8fafc 100%);
}

:deep(.markdown-content) tr:hover td {
    background: linear-gradient(135deg, #f0f8ff 0%, #e0f2fe 100%);
    transition: all 0.3s ease;
}

/* 进入动画 */
@keyframes fadeInScale {
    from {
        opacity: 0;
        transform: scale(0.95);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

.result-status-card {
    animation: fadeInScale 0.4s ease-out;
    animation-delay: 0.1s;
    animation-fill-mode: both;
}

.answer-comparison-section {
    animation: fadeInScale 0.4s ease-out;
    animation-delay: 0.2s;
    animation-fill-mode: both;
}

.analysis-section {
    animation: fadeInScale 0.4s ease-out;
    animation-delay: 0.3s;
    animation-fill-mode: both;
}
</style>
