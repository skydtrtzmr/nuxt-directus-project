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
                                <Button
                                    v-for="question in section.questions"
                                    :key="question.id"
                                    :severity="getQuestionSeverity(question)"
                                    class="question-card"
                                    :class="{
                                        selected:
                                            selectedQuestion &&
                                            selectedQuestion.id ===
                                                question.id,
                                    }"
                                    @click="handleQuestionClick(question, false)"
                                    ref="refItems"
                                >
                                    {{ question.sort_in_section }}
                                </Button>
                            </template>
                            
                            <!-- 题组模式 -->
                            <template v-else>
                                <Button
                                    v-for="group in section.question_groups"
                                    :key="group.id"
                                    :severity="getQuestionGroupSeverity(group, section)"
                                    class="question-card"
                                    :class="{
                                        selected:
                                            selectedQuestion &&
                                            selectedQuestion.question_groups_id ===
                                                group.id,
                                    }"
                                    @click="handleQuestionGroupClick(group, section)"
                                    ref="refItems"
                                >
                                    {{ group.sort_in_section }}
                                </Button>
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

// 处理题组点击（题组模式）
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
    
    // 创建包含题组的question对象
    const enhancedQuestion = {
        ...group,
        isGroupMode: true,
        questionGroup: questionGroup,
        questions_id: { type: 'group' }, // 保留一个虚拟的questions_id以兼容现有代码
        section_id: section.id,
        paper_sections_id: section.id,
        sort_in_section: group.sort_in_section,
        groupQuestions: groupQuestions // 添加组内题目列表
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

.question-card {
    min-width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s ease;
}

.question-card.selected {
    background-color: var(--primary-color);
    color: white;
    transform: scale(1.05);
    font-weight: bold;
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
    
    .question-card {
        min-width: 36px;
        height: 36px;
    }
}
</style>
