<template>
    <div class="p-4 bg-white shadow rounded-md">
        <div :class="answerClass" class="font-semibold text-xl mb-2">
            {{ isCorrectAnswer ? "正确" : "错误" }}
        </div>
        <div class="text-gray-700 mt-2">
            <span class="font-medium">考生得分: </span>
            <span class="text-lg">{{ questionResult.score }}</span>
        </div>
        <div class="text-gray-700">
            <span class="font-medium">本题总分: </span>
            <span class="text-lg">{{ questionResult.point_value }}</span>
        </div>
        <div>
            <span class="font-medium">考生答案: </span>
            <span class="text-lg">{{ getSubmittedAnswer() }}</span>
        </div>
        <div>
            <span class="font-medium">正确答案: </span>
            <span class="text-lg">{{ getCorrectAnswer() }}</span>
        </div>
        <br/>
        <div>
            <p class="font-medium">题目解析:</p>
            <div v-html="renderMarkdown(getAnalysis())" class="text-lg markdown-content"></div>
        </div>
        
        <!-- AI解析按钮区域 -->
        <div class="mt-4 pt-4 border-t border-gray-200">
            <button 
                @click="copyQuestionDataForAI"
                class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors mr-2"
            >
                AI解析
            </button>
            
            <!-- 状态提示 -->
            <span v-if="copyStatus" class="text-sm" :class="copyStatusClass">
                {{ copyStatus }}
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
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

// 获取学生提交的答案
const getSubmittedAnswer = () => {
    if (props.question_type === "q_mc_single" || props.question_type === "q_mc_binary") {
        return props.questionResult.submit_ans_select_radio;
    } else if (props.question_type === "q_mc_multi" || props.question_type === "q_mc_flexible") {
        return props.questionResult.submit_ans_select_multiple_checkbox;
    }
    return null;
};

// 获取题目的正确答案
const getCorrectAnswer = () => {
    if (!props.questionData || !props.questionData.questions_id) {
        return "缺少题目数据";
    }
    
    const questionInfo = props.questionData.questions_id;
    
    if (props.question_type === "q_mc_single" && questionInfo.q_mc_single) {
        return questionInfo.q_mc_single.correct_option || "单选题缺少正确答案";
    } else if (props.question_type === "q_mc_binary" && questionInfo.q_mc_binary) {
        return questionInfo.q_mc_binary.correct_option || "判断题缺少正确答案";
    } else if (props.question_type === "q_mc_multi" && questionInfo.q_mc_multi) {
        return JSON.stringify(questionInfo.q_mc_multi.correct_options) || "多选题缺少正确答案";
    } else if (props.question_type === "q_mc_flexible" && questionInfo.q_mc_flexible) {
        return JSON.stringify(questionInfo.q_mc_flexible.correct_options) || "不定项选择题缺少正确答案";
    }
    
    return "";
};

// 获取题目解析
const getAnalysis = () => {
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
const generateQuestionMarkdown = () => {
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
    markdown += `【考生答案】${submittedAnswer || "未作答"}\n\n`;
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
    copyStatus.value = '✅ 题目内容已复制到剪贴板！可以粘贴到AI助手中进行解析';
    copyStatusClass.value = 'text-green-600';
    
    // 5秒后清除状态
    setTimeout(() => {
        copyStatus.value = '';
    }, 5000);
};

// 显示复制失败状态
const showCopyError = (message: string) => {
    copyStatus.value = '❌ ' + message;
    copyStatusClass.value = 'text-red-600';
    
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
/* Markdown样式 */
:deep(.markdown-content) h1,
:deep(.markdown-content) h2,
:deep(.markdown-content) h3,
:deep(.markdown-content) h4,
:deep(.markdown-content) h5,
:deep(.markdown-content) h6 {
    margin-top: 1em;
    margin-bottom: 0.5em;
    font-weight: bold;
}

:deep(.markdown-content) p {
    margin-bottom: 1em;
}

:deep(.markdown-content) ul,
:deep(.markdown-content) ol {
    padding-left: 2em;
    margin-bottom: 1em;
}

:deep(.markdown-content) code {
    background-color: rgba(0, 0, 0, 0.05);
    padding: 0.2em 0.4em;
    border-radius: 3px;
}

:deep(.markdown-content) pre {
    background-color: rgba(0, 0, 0, 0.05);
    padding: 1em;
    border-radius: 5px;
    overflow-x: auto;
    margin-bottom: 1em;
}

:deep(.markdown-content) blockquote {
    border-left: 4px solid #ddd;
    padding-left: 1em;
    color: #666;
    margin-bottom: 1em;
}

:deep(.markdown-content) img {
    max-width: 100%;
}

:deep(.markdown-content) table {
    border-collapse: collapse;
    width: 100%;
    margin-bottom: 1em;
}

:deep(.markdown-content) th,
:deep(.markdown-content) td {
    border: 1px solid #ddd;
    padding: 8px;
}

:deep(.markdown-content) th {
    background-color: rgba(0, 0, 0, 0.05);
}
</style>
