<!-- components/QuestionList.vue -->
<template>
    <div 
        class="question-list-container" 
        :class="{'collapsed': isSidebarCollapsed}"
        v-if="submittedPaperSections.length > 0"
    >
        <div class="toggle-button-wrapper">
            <Button
                :icon="isSidebarCollapsed ? 'pi pi-chevron-right' : 'pi pi-chevron-left'"
                class="p-button-rounded p-button-text toggle-button"
                @click="toggleSidebar"
                :aria-label="isSidebarCollapsed ? '展开题目列表' : '收起题目列表'"
            />
        </div>

        <div class="sidebar card" :class="{'hidden': isSidebarCollapsed}">
            <div class="sidebar-header">
                <h5>题目列表</h5>
            </div>
            <div class="sidebar-content">
                <div v-for="(section, index) in submittedPaperSections" :key="section.id" class="section-container">
                    <div class="section-header" @click="toggleSection(index)">
                        <h6 class="section-title">{{ section.title }}</h6>
                        <i :class="{'pi pi-chevron-down': !expandedSections.includes(index), 'pi pi-chevron-up': expandedSections.includes(index)}"></i>
                    </div>
                    <div class="section-content" v-show="expandedSections.includes(index)">
                        <!-- 章节下的题目列表，卡片式 -->
                        <div class="question-card-container">
                            <!-- 单题模式 -->
                            <template v-if="!isGroupMode(section)">
                                <div
                                    v-for="question in section.questions"
                                    :key="question.id"
                                    class="question-btn-wrapper"
                                >
                                    <Button
                                        :severity="isQuestionAnswered(question) ? 'primary' : 'secondary'"
                                        class="question-card"
                                        :class="{
                                            'selected': selectedQuestion && selectedQuestion.id === question.id
                                        }"
                                        @click="handleQuestionClick(question, false)"
                                        ref="refItems"
                                    >
                                        {{ question.sort_in_section }}
                                    </Button>
                                    <span class="flag-indicator" :class="{'visible': isQuestionFlagged(question)}">?</span>
                                </div>
                            </template>
                            
                            <!-- 题组模式 -->
                            <template v-else>
                                <div
                                    v-for="group in section.question_groups"
                                    :key="group.id"
                                    class="question-btn-wrapper"
                                >
                                    <Button
                                        :severity="isGroupAnswered(group, section) ? 'primary' : 'secondary'"
                                        class="question-card"
                                        :class="{
                                            'selected': selectedQuestion && 
                                                        selectedQuestion.isGroupMode &&
                                                        selectedQuestion.questionGroup &&
                                                        selectedQuestion.questionGroup.id === (typeof group.question_groups_id === 'string' 
                                                            ? group.question_groups_id 
                                                            : group.question_groups_id.id)
                                        }"
                                        @click="handleQuestionGroupClick(group, section)"
                                        ref="refItems"
                                    >
                                        {{ group.sort_in_section }}
                                    </Button>
                                    <span class="flag-indicator" :class="{'visible': isGroupFlagged(group, section)}">?</span>
                                </div>
                            </template>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from "vue";
import type {
    PaperSections,
    QuestionResults,
    QuestionGroups,
    Questions,
    PaperSectionsQuestionGroups
} from "~~/types/directus_types";
import { useGlobalStore } from "~~/stores/examDone"; // 引入 Pinia store
import { useLoadingStateStore } from "@/stores/loadingState"; // 引入 Pinia store

const props = defineProps<{
    submittedPaperSections: PaperSections[];
    selectQuestion: (question: any) => void;
    selectedQuestion: any | null;
    exam_page_mode: string;
    questionResults: QuestionResults[];
    practiceSessionId: string;
}>();

const emit = defineEmits(['sidebar-toggle']);

const loadingStateStore = useLoadingStateStore();
const globalStore = useGlobalStore(); // 创建 Pinia store 实例
const refItems = ref<HTMLButtonElement[]>([]);
const isSidebarCollapsed = ref(false);
const expandedSections = ref<number[]>([0]); // 默认展开第一个章节

const toggleSidebar = () => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value;
    emit('sidebar-toggle', isSidebarCollapsed.value);
};

// 判断章节是否使用题组模式
const isGroupMode = (section: PaperSections) => {
    return section.question_mode === 'group';
};

// 监听窗口尺寸变化，在移动端下自动折叠
const checkMobileView = () => {
    if (typeof window !== 'undefined') {
        if (window.innerWidth < 768 && !isSidebarCollapsed.value) {
            isSidebarCollapsed.value = true;
            emit('sidebar-toggle', true);
        }
    }
};

const toggleSection = (index: number) => {
    const foundIndex = expandedSections.value.indexOf(index);
    if (foundIndex > -1) {
        expandedSections.value.splice(foundIndex, 1);
    } else {
        expandedSections.value.push(index);
    }
};

// 处理题目点击（单题模式）
const handleQuestionClick = (question: any | undefined, isGroupMode: boolean) => {
    if (question) {
        console.log("handleQuestionClick", question);
        props.selectQuestion(question); // 调用父组件传递的选择方法
        
        // 在移动设备上，选中题目后自动收起题目列表
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            isSidebarCollapsed.value = true;
            emit('sidebar-toggle', true);
        }
    }
};

/**
 * 处理题组点击事件
 * 在题组模式下，点击题组时查找并加载该题组内的所有题目
 */
const handleQuestionGroupClick = async (group: any, section: PaperSections) => {
    if (!group || !group.question_groups_id) return;
    
    // 获取题组ID
    const groupId = typeof group.question_groups_id === 'string' 
        ? group.question_groups_id 
        : group.question_groups_id.id;
        
    // 查找题组详情
    let questionGroup: QuestionGroups | null = null;
    if (typeof group.question_groups_id === 'object') {
        questionGroup = group.question_groups_id;
    } else {
        // 此处应该使用题组ID查询题组详情
        // 由于无法在这里执行实际查询，假设能从某个地方获取
        console.log("需要查询题组详情:", groupId);
    }
    
    // 获取该题组包含的题目列表
    const groupQuestionIds = group.group_question_ids || [];
    const groupQuestions = section.questions.filter(q => groupQuestionIds.includes(q.id));
    
    // 题组模式下按sort_in_group字段排序题目
    const sortedGroupQuestions = [...groupQuestions].sort((a, b) => {
        // 优先使用sort_in_group排序
        const aSort = a.questions_id.sort_in_group ?? 999;
        const bSort = b.questions_id.sort_in_group ?? 999;
        
        // 如果sort_in_group相同或不存在，再使用sort_in_section作为备选
        if (aSort === bSort) {
            return (a.sort_in_section || 0) - (b.sort_in_section || 0);
        }
        
        return aSort - bSort;
    });
    
    // 创建包含题组的question对象
    const enhancedQuestion = {
        ...group,
        isGroupMode: true,
        questionGroup: questionGroup,
        questions_id: { type: 'group' }, // 保留一个虚拟的questions_id以兼容现有代码
        section_id: section.id,
        paper_sections_id: section.id,
        sort_in_section: group.sort_in_section,
        groupQuestions: sortedGroupQuestions // 使用排序后的题目列表
    };
    
    // 调用父组件的选择方法
    props.selectQuestion(enhancedQuestion);
    
    // 在移动设备上，选中题目后自动收起题目列表
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
        isSidebarCollapsed.value = true;
        emit('sidebar-toggle', true);
    }
};

// 获取题目样式
const getQuestionSeverity = (question: any | undefined) => {
    if (!question || !question.result) return "secondary";
    
    if (
        question.result.submit_ans_select_radio ||
        (question.result.submit_ans_select_multiple_checkbox &&
            (question.result.submit_ans_select_multiple_checkbox as any[]).length > 0)
    ) {
        return "primary";
    } else {
        return "secondary";
    }
};

// 获取题组样式（检查题组内的所有题目是否都已经作答）
const getQuestionGroupSeverity = (group: any, section: PaperSections) => {
    // 如果题组ID是对象而非字符串，或者为null
    const groupId = group.question_groups_id
        ? (typeof group.question_groups_id === 'string' 
            ? group.question_groups_id 
            : group.question_groups_id.id)
        : null;
    
    if (!groupId) return "secondary";
    
    // 获取该题组下的所有题目IDs
    const groupQuestionIds = group.group_question_ids || [];
    
    // 如果找不到题目，返回secondary
    if (groupQuestionIds.length === 0) return "secondary";
    
    // 获取该题组对应的实际题目列表
    const groupQuestions = section.questions.filter(q => groupQuestionIds.includes(q.id));
    
    // 检查题组内是否有至少一个题目已作答
    const hasAnsweredQuestion = groupQuestions.some(question => {
        if (!question.result) return false;
        
        return (
            question.result.submit_ans_select_radio ||
            (question.result.submit_ans_select_multiple_checkbox &&
                (question.result.submit_ans_select_multiple_checkbox as any[]).length > 0)
        );
    });
    
    return hasAnsweredQuestion ? "primary" : "secondary";
};

// 获取环境变量，确定是否运行测试
const {
    public: { isTest },
} = useRuntimeConfig();
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 自动化测试部分，仍然保留
onMounted(async () => {
    if (isTest) {
        if (props.exam_page_mode !== "review") {
            // 等待所有题目准备就绪
            await loadingStateStore.waitUntilReady("examPage");
            
            // 点击所有题目
            await nextTick();
            await delay(500);
            
            for (const item of refItems.value) {
                item.click();
                await delay(500);
            }
            
            // 设置全部题目已完成
            globalStore.setAllDone(true);
        }
    }
    
    // 检查是否为移动设备，初始化时自动收起
    checkMobileView();
    
    // 添加窗口尺寸变化监听器
    if (typeof window !== 'undefined') {
        window.addEventListener('resize', checkMobileView);
    }
});

// 组件卸载时移除事件监听器
onUnmounted(() => {
    if (typeof window !== 'undefined') {
        window.removeEventListener('resize', checkMobileView);
    }
});

// 判断题目是否被标记为有疑问
const isQuestionFlagged = (question: any) => {
    if (!question || !question.result) return false;
    return question.result.is_flagged === true;
};

// 判断题组中是否有题目被标记为有疑问
const isGroupFlagged = (group: any, section: PaperSections) => {
    // 获取该题组下的所有题目IDs
    const groupQuestionIds = group.group_question_ids || [];
    
    // 如果找不到题目，返回false
    if (groupQuestionIds.length === 0) return false;
    
    // 获取该题组对应的实际题目列表
    const groupQuestions = section.questions.filter(q => groupQuestionIds.includes(q.id));
    
    // 检查题组内是否有至少一个题目被标记
    return groupQuestions.some(question => isQuestionFlagged(question));
};

// 判断题目是否已作答
const isQuestionAnswered = (question: any) => {
    if (!question || !question.result) return false;
    
    return (
        !!question.result.submit_ans_select_radio ||
        (question.result.submit_ans_select_multiple_checkbox &&
            Array.isArray(question.result.submit_ans_select_multiple_checkbox) &&
            question.result.submit_ans_select_multiple_checkbox.length > 0) ||
        !!question.result.submit_ans_text
    );
};

// 判断题组中是否有题目已作答
const isGroupAnswered = (group: any, section: PaperSections) => {
    // 获取该题组下的所有题目IDs
    const groupQuestionIds = group.group_question_ids || [];
    
    // 如果找不到题目，返回false
    if (groupQuestionIds.length === 0) return false;
    
    // 获取该题组对应的实际题目列表
    const groupQuestions = section.questions.filter(q => groupQuestionIds.includes(q.id));
    
    // 检查题组内是否有至少一个题目已作答
    return groupQuestions.some(question => isQuestionAnswered(question));
};
</script>

<style scoped>
.question-list-container {
    position: relative;
    transition: all 0.3s ease;
    height: 100%;
    display: flex;
}

.sidebar {
    background-color: var(--surface-card);
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    width: 100%;
    height: 100%;
    transition: width 0.3s ease;
    overflow: hidden;
    flex: 1;
}

.toggle-button-wrapper {
    position: absolute;
    right: -20px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
}

.toggle-button {
    background-color: var(--surface-card);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border: 1px solid var(--surface-border);
}

.question-list-container.collapsed {
    width: 40px !important;
    min-width: 40px !important;
}

.question-list-container.collapsed .sidebar {
    width: 0;
    overflow: hidden;
}

.sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1.25rem;
    border-bottom: 1px solid var(--surface-border);
}

.sidebar-content {
    padding: 0.5rem;
    max-height: calc(100% - 50px);
    overflow-y: auto;
}

.section-container {
    margin-bottom: 0.5rem;
    border: 1px solid var(--surface-border);
    border-radius: 6px;
    overflow: hidden;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background-color: var(--surface-ground);
    cursor: pointer;
    transition: background-color 0.2s;
}

.section-header:hover {
    background-color: var(--surface-hover);
}

.section-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
}

.section-content {
    padding: 0.75rem;
    border-top: 1px solid var(--surface-border);
    background-color: var(--surface-section);
}

.question-card-container {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 10px 0;
}

.question-btn-wrapper {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 40px;
}

.question-card {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    min-width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s ease;
    /* 确保边框不会改变盒子大小 */
    box-sizing: border-box;
    border: 2px solid transparent;
}

/* 已答题状态 */
.question-card.p-button-primary {
    opacity: 0.95;
}

/* 选中状态 */
.question-card.selected {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5); /* 半透明的蓝色阴影 */
    border: 2px solid var(--primary-700, #2563EB);
    transform: none; /* 移除缩放效果，防止影响布局 */
    font-weight: bold;
    z-index: 2;
    opacity: 1;
}

/* 既是选中状态又是已答题状态 */
.question-card.selected.p-button-primary {
    border-color: var(--primary-800, #1D4ED8);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.7); /* 更明显的阴影 */
}

.flag-indicator {
    position: absolute;
    top: -8px;
    right: -8px;
    background-color: var(--red-500);
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    /* 默认隐藏但保留空间 */
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.2s ease;
    z-index: 3;
}

.flag-indicator.visible {
    visibility: visible;
    opacity: 1;
}

/* 移动端样式适配 */
@media screen and (max-width: 768px) {
    .question-list-container {
        position: fixed;
        left: 0;
        bottom: 0;
        top: auto;
        width: 100%;
        height: auto;
        max-height: 60vh;
        z-index: 1000;
    }
    
    .question-list-container.collapsed {
        width: 100% !important;
        height: 40px;
        max-height: 40px;
    }
    
    .toggle-button-wrapper {
        position: absolute;
        right: 10px;
        top: 10px;
        transform: none;
    }
    
    .toggle-button {
        transform: rotate(90deg);
    }
    
    .question-list-container.collapsed .toggle-button {
        transform: rotate(-90deg);
    }
    
    .sidebar {
        border-radius: 12px 12px 0 0;
        height: 100%;
        max-height: calc(60vh - 40px);
    }
    
    .sidebar-content {
        max-height: calc(60vh - 90px);
    }
    
    .question-btn-wrapper {
        width: 36px;
        height: 36px;
    }
    
    .question-card {
        min-width: 36px;
        height: 36px;
    }
}
</style>

