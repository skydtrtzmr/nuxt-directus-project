<template>
    <div class="question-result-container">
        <!-- 结果状态卡片 -->
        <div class="result-status-card" :class="isCorrectAnswer ? 'correct-answer' : 'incorrect-answer'">
            <div class="status-header">
                <div class="status-icon">
                    <i :class="isCorrectAnswer ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                </div>
                <div class="status-text">
                    {{ isCorrectAnswer ? "回答正确" : "回答错误" }}
                </div>
                <div class="score-badge">
                    <span class="score-value">{{ questionResult.score }}</span>
                    <span class="score-divider">/</span>
                    <span class="total-score">{{ questionResult.point_value }}</span>
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
                    <div class="answer-content">{{ getSubmittedAnswer() || "未作答" }}</div>
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
        <div class="analysis-section" v-if="getAnalysis()">
            <div class="analysis-header">
                <i class="pi pi-lightbulb"></i>
                <span class="analysis-title">题目解析</span>
            </div>
            <div class="analysis-content">
                <div v-html="renderMarkdown(getAnalysis())" class="markdown-content"></div>
            </div>
        </div>

        <!-- AI解析功能区域 -->
        <div class="ai-analysis-section">
            <div class="ai-section-header">
                <div class="ai-icon-wrapper">
                    <i class="pi pi-sparkles"></i>
                </div>
                <div class="ai-text-content">
                    <h4 class="ai-title">AI智能解析</h4>
                    <p class="ai-description">复制题目信息到AI助手获取详细解析</p>
                </div>
            </div>
            
            <div class="ai-actions">
                <Button 
                    @click="copyQuestionDataForAI"
                    icon="pi pi-copy"
                    label="复制题目信息"
                    class="ai-copy-button"
                    :loading="copyLoading"
                />
                
                <!-- 状态反馈 -->
                <div v-if="copyStatus" class="copy-status-message" :class="copyStatusClass">
                    <i :class="copyStatus.includes('✅') ? 'pi pi-check' : 'pi pi-exclamation-triangle'"></i>
                    <span>{{ copyStatus }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import Button from 'primevue/button';
import type {
    QuestionResults,
    Questions,
} from "~/types/directus_types";

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
const copyStatus = ref('')
const copyStatusClass = ref('')
const copyLoading = ref(false)

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
    if (typeof answer === 'string') {
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
    if (props.question_type === "q_mc_single" || props.question_type === "q_mc_binary") {
        return formatAnswerDisplay(props.questionResult.submit_ans_select_radio);
    } else if (props.question_type === "q_mc_multi" || props.question_type === "q_mc_flexible") {
        return formatAnswerDisplay(props.questionResult.submit_ans_select_multiple_checkbox);
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
        return formatAnswerDisplay(questionInfo.q_mc_single.correct_option) || "单选题缺少正确答案";
    } else if (props.question_type === "q_mc_binary" && questionInfo.q_mc_binary) {
        return formatAnswerDisplay(questionInfo.q_mc_binary.correct_option) || "判断题缺少正确答案";
    } else if (props.question_type === "q_mc_multi" && questionInfo.q_mc_multi) {
        return formatAnswerDisplay(questionInfo.q_mc_multi.correct_options) || "多选题缺少正确答案";
    } else if (props.question_type === "q_mc_flexible" && questionInfo.q_mc_flexible) {
        return formatAnswerDisplay(questionInfo.q_mc_flexible.correct_options) || "不定项选择题缺少正确答案";
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
    } else if (props.question_type === "q_mc_binary" && questionInfo.q_mc_binary) {
        return questionInfo.q_mc_binary.analysis || "";
    } else if (props.question_type === "q_mc_multi" && questionInfo.q_mc_multi) {
        return questionInfo.q_mc_multi.analysis || "";
    } else if (props.question_type === "q_mc_flexible" && questionInfo.q_mc_flexible) {
        return questionInfo.q_mc_flexible.analysis || "";
    }
    
    return "";
};

// 获取选项文本
const getOptionText = (optionKey: string): string => {
    if (!props.questionData || !props.questionData.questions_id) {
        return "";
    }
    
    const questionDetails = props.questionData.questions_id[props.question_type];
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
    validOptions.forEach(option => {
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
    copyLoading.value = true
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
        console.error('复制失败:', error);
        showCopyError('复制失败，请手动复制文本');
    } finally {
        copyLoading.value = false
    }
};

// 备用复制方案
const fallbackCopyText = (text: string) => {
    try {
        // 创建临时textarea
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        
        // 选中并复制
        textarea.select();
        textarea.setSelectionRange(0, 99999); // 移动端兼容
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (successful) {
            showCopySuccess();
        } else {
            showCopyError('复制功能不支持，请查看控制台获取文本内容');
            console.log('题目内容：', generateQuestionMarkdown());
        }
    } catch (error) {
        console.error('备用复制方案也失败:', error);
        showCopyError('复制功能不可用，请查看控制台获取文本内容');
        console.log('题目内容：', generateQuestionMarkdown());
    }
};

// 显示复制成功状态
const showCopySuccess = () => {
    copyStatus.value = '✅ 题目内容已复制到剪贴板！';
    copyStatusClass.value = 'success';
    
    // 5秒后清除状态
    setTimeout(() => {
        copyStatus.value = '';
    }, 5000);
};

// 显示复制失败状态
const showCopyError = (message: string) => {
    copyStatus.value = '❌ ' + message;
    copyStatusClass.value = 'error';
    
    // 5秒后清除状态
    setTimeout(() => {
        copyStatus.value = '';
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
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

/* 结果状态卡片 */
.result-status-card {
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.result-status-card.correct-answer {
    background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
    border: 2px solid #22c55e;
}

.result-status-card.incorrect-answer {
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
    border: 2px solid #ef4444;
}

.status-header {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.status-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: bold;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.correct-answer .status-icon {
    background: #22c55e;
    color: white;
}

.incorrect-answer .status-icon {
    background: #ef4444;
    color: white;
}

.status-text {
    font-size: 1.25rem;
    font-weight: 600;
    flex: 1;
}

.correct-answer .status-text {
    color: #166534;
}

.incorrect-answer .status-text {
    color: #991b1b;
}

.score-badge {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 20px;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.score-value {
    font-size: 1.5rem;
    color: var(--p-primary-600);
}

.score-divider, .total-score {
    color: var(--p-surface-600);
}

.score-unit {
    font-size: 0.875rem;
    color: var(--p-surface-500);
}

/* 答案对比区域 */
.answer-comparison-section {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    border: 1px solid var(--p-surface-200);
}

.answer-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
}

@media (max-width: 768px) {
    .answer-grid {
        grid-template-columns: 1fr;
    }
}

.answer-card {
    border-radius: 10px;
    padding: 1.25rem;
    border: 2px solid;
    transition: all 0.3s ease;
}

.answer-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.student-answer {
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    border-color: var(--p-blue-300);
}

.correct-answer-card {
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    border-color: var(--p-green-300);
}

.answer-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    font-weight: 600;
    color: var(--p-surface-700);
}

.answer-header i {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 0.875rem;
}

.student-answer .answer-header i {
    background: var(--p-blue-500);
    color: white;
}

.correct-answer-card .answer-header i {
    background: var(--p-green-500);
    color: white;
}

.answer-content {
    font-size: 1rem;
    line-height: 1.6;
    color: var(--p-surface-800);
    background: rgba(255, 255, 255, 0.7);
    padding: 0.75rem 1rem;
    border-radius: 8px;
    border: 1px solid rgba(0, 0, 0, 0.05);
}

/* 题目解析区域 */
.analysis-section {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    border: 1px solid var(--p-surface-200);
}

.analysis-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid var(--p-surface-100);
}

.analysis-header i {
    color: var(--p-amber-500);
    font-size: 1.25rem;
}

.analysis-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--p-surface-800);
}

.analysis-content {
    color: var(--p-surface-700);
    line-height: 1.7;
}

/* AI解析功能区域 */
.ai-analysis-section {
    background: linear-gradient(135deg, #fafafa 0%, #f4f4f5 100%);
    border: 2px solid var(--p-purple-200);
    border-radius: 16px;
    padding: 1.5rem;
    position: relative;
    overflow: hidden;
}

.ai-analysis-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--p-purple-400), var(--p-blue-400), var(--p-cyan-400));
}

.ai-section-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.25rem;
}

.ai-icon-wrapper {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, var(--p-purple-500), var(--p-purple-600));
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.25rem;
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.ai-text-content {
    flex: 1;
}

.ai-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--p-surface-800);
    margin: 0 0 0.25rem 0;
}

.ai-description {
    font-size: 0.875rem;
    color: var(--p-surface-600);
    margin: 0;
}

.ai-actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

:deep(.ai-copy-button) {
    background: linear-gradient(135deg, var(--p-purple-500), var(--p-purple-600)) !important;
    border: none !important;
    color: white !important;
    font-weight: 600 !important;
    padding: 0.75rem 1.5rem !important;
    border-radius: 10px !important;
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3) !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

:deep(.ai-copy-button:hover) {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4) !important;
    background: linear-gradient(135deg, var(--p-purple-600), var(--p-purple-700)) !important;
}

:deep(.ai-copy-button:active) {
    transform: translateY(0) !important;
}

.copy-status-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    animation: slideIn 0.3s ease-out;
}

.copy-status-message.success {
    background: var(--p-green-50);
    color: var(--p-green-700);
    border: 1px solid var(--p-green-200);
}

.copy-status-message.error {
    background: var(--p-red-50);
    color: var(--p-red-700);
    border: 1px solid var(--p-red-200);
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Markdown样式优化 */
:deep(.markdown-content) {
    line-height: 1.7;
}

:deep(.markdown-content) h1,
:deep(.markdown-content) h2,
:deep(.markdown-content) h3,
:deep(.markdown-content) h4,
:deep(.markdown-content) h5,
:deep(.markdown-content) h6 {
    margin-top: 1.5em;
    margin-bottom: 0.75em;
    font-weight: 600;
    color: var(--p-surface-800);
}

:deep(.markdown-content) p {
    margin-bottom: 1em;
    color: var(--p-surface-700);
}

:deep(.markdown-content) ul,
:deep(.markdown-content) ol {
    padding-left: 2em;
    margin-bottom: 1em;
}

:deep(.markdown-content) code {
    background: var(--p-surface-100);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-family: 'JetBrains Mono', 'Consolas', monospace;
    color: var(--p-surface-800);
}

:deep(.markdown-content) pre {
    background: var(--p-surface-50);
    padding: 1.5rem;
    border-radius: 8px;
    overflow-x: auto;
    margin: 1rem 0;
    border: 1px solid var(--p-surface-200);
}

:deep(.markdown-content) blockquote {
    border-left: 4px solid var(--p-primary-400);
    padding: 1rem 1.5rem;
    background: var(--p-primary-50);
    margin: 1rem 0;
    border-radius: 0 8px 8px 0;
    color: var(--p-surface-700);
}

:deep(.markdown-content) table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.markdown-content) th,
:deep(.markdown-content) td {
    padding: 0.75rem 1rem;
    border: 1px solid var(--p-surface-200);
}

:deep(.markdown-content) th {
    background: var(--p-surface-100);
    font-weight: 600;
    color: var(--p-surface-800);
}
</style>
