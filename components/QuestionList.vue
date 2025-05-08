<!-- components/QuestionList.vue -->
<template>
    <div 
        class="question-list-container" 
        :class="{'collapsed': isSidebarCollapsed}"
        v-if="submittedPaperSections.length > 0"
    >
        <!-- 收缩/展开按钮 - 始终可见 -->
        <div class="toggle-button-wrapper" :class="{'collapsed': isSidebarCollapsed}">
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
                <ScrollPanel class="custom-scrollbar">
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
                </ScrollPanel>
            </div>
        </div>

        <!-- 侧边栏拖动调整宽度的拖动条 -->
        <div v-if="!isSidebarCollapsed" class="resizer" @mousedown="startResize"></div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch, onUnmounted } from "vue";
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

const emit = defineEmits(['sidebar-toggle', 'resize-sidebar']);

const loadingStateStore = useLoadingStateStore();
const globalStore = useGlobalStore(); // 创建 Pinia store 实例
const refItems = ref<HTMLButtonElement[]>([]);
const isSidebarCollapsed = ref(false);
const expandedSections = ref<number[]>([0]); // 默认展开第一个章节

// 拖拽调整宽度相关变量
const startX = ref(0);
const startWidth = ref(0);
const minWidth = 100; // 最小宽度
const maxWidth = 600; // 最大宽度

// 控制章节展开/折叠的状态和样式
const sectionStyles = ref<{ [key: number]: any }>({});

const toggleSidebar = () => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value;
    emit('sidebar-toggle', isSidebarCollapsed.value);
};

// 开始调整宽度
const startResize = (event: MouseEvent) => {
    startX.value = event.clientX;
    // 获取当前容器的宽度
    const element = event.target as HTMLElement;
    const container = element.closest('.question-list-container') as HTMLElement;
    startWidth.value = container.offsetWidth;
    
    // 添加移动和松开鼠标的事件监听
    document.addEventListener('mousemove', resizing);
    document.addEventListener('mouseup', stopResize);
    
    // 添加防止选择文本的样式
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
};

// 调整宽度过程
const resizing = (event: MouseEvent) => {
    const dx = event.clientX - startX.value;
    let newWidth = startWidth.value + dx;
    
    // 限制调整范围
    if (newWidth < minWidth) newWidth = minWidth;
    if (newWidth > maxWidth) newWidth = maxWidth;
    
    // 触发宽度调整事件
    emit('resize-sidebar', newWidth);
};

// 停止调整宽度
const stopResize = () => {
    document.removeEventListener('mousemove', resizing);
    document.removeEventListener('mouseup', stopResize);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
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

// 修改toggleSection函数，增加动画效果控制
const toggleSection = (index: number) => {
    const foundIndex = expandedSections.value.indexOf(index);
    
    // 获取章节内容的DOM元素
    nextTick(() => {
        const sectionContentEl = document.querySelectorAll('.section-content')[index] as HTMLElement;
        if (sectionContentEl) {
            if (foundIndex > -1) {
                // 折叠动画
                sectionContentEl.style.maxHeight = sectionContentEl.scrollHeight + 'px';
                
                // 强制重绘
                void sectionContentEl.offsetHeight;
                
                // 开始折叠
                sectionContentEl.style.maxHeight = '0px';
                
                // 等待动画完成后从数组中移除
                setTimeout(() => {
                    expandedSections.value.splice(foundIndex, 1);
                }, 300);
            } else {
                // 首先添加到展开数组
                expandedSections.value.push(index);
                
                // 在下一个渲染循环中设置高度动画
                nextTick(() => {
                    sectionContentEl.style.maxHeight = '0px';
                    
                    // 强制重绘
                    void sectionContentEl.offsetHeight;
                    
                    // 设置实际高度以展开
                    sectionContentEl.style.maxHeight = sectionContentEl.scrollHeight + 'px';
                    
                    // 动画完成后清除maxHeight限制
                    setTimeout(() => {
                        sectionContentEl.style.maxHeight = 'none';
                    }, 300);
                });
            }
        } else {
            // 如果没有找到DOM元素，退回到简单切换
            if (foundIndex > -1) {
                expandedSections.value.splice(foundIndex, 1);
            } else {
                expandedSections.value.push(index);
            }
        }
    });
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
    // if (isTest) {
    //     if (props.exam_page_mode !== "review") {
    //         // 等待所有题目准备就绪
    //         await loadingStateStore.waitUntilReady("examPage");
            
    //         // 点击所有题目
    //         await nextTick();
    //         await delay(500);
            
    //         for (const item of refItems.value) {
    //             item.click();
    //             await delay(500);
    //         }
            
    //         // 设置全部题目已完成
    //         globalStore.setAllDone(true);
    //     }
    // }
    
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
    height: 100%;
    transition: all 0.3s ease;
}

.question-list-container.collapsed {
    width: 40px !important; /* 确保collapsed状态有一个固定的宽度，足够容纳展开按钮 */
    min-width: 40px !important;
}

.toggle-button-wrapper {
    position: absolute;
    top: 50%; /* 垂直居中 */
    right: 0; /* 调整右侧位置 */
    transform: translateY(-50%); /* 垂直居中 */
    z-index: 10000;
}

.toggle-button-wrapper.collapsed {
    right: 0.25rem; /* 当侧边栏收起时，调整按钮位置使其可见 */
    left: auto;
}

.toggle-button {
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
    background-color: var(--surface-0);
}

.sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.sidebar.hidden {
    display: none;
}

.sidebar-header {
    padding: 1rem;
    border-bottom: 1px solid var(--surface-200);
    background-color: var(--surface-50);
}

.sidebar-content {
    flex: 1;
    overflow: hidden;
}

.custom-scrollbar {
    width: 100%;
    height: 100%;
}

.section-container {
    margin-bottom: 0.5rem;
}

.section-header {
    padding: 0.75rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: var(--surface-100);
    transition: all 0.2s ease;
}

.section-header:hover {
    background-color: var(--surface-200);
}

.section-title {
    margin: 0;
    font-weight: 600;
}

.section-content {
    padding: 0.5rem;
    overflow: hidden;
    transition: max-height 0.3s ease;
}

.question-card-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.5rem;
}

.question-btn-wrapper {
    position: relative;
}

.question-card {
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: 600;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.question-card.selected {
    transform: scale(1.05);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    /* box-shadow: 0 0 0 2px var(--primary-300); */
    border: 2px solid; /* 添加边框高亮效果 */
}

.flag-indicator {
    position: absolute;
    top: -8px;
    right: -8px;
    background-color: rgb(246, 242, 44); /* 改回黄色背景 */
    color: rgb(237, 19, 19); /* 改回红色文字 */
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 0.7rem;
    font-weight: bold;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(231, 139, 139, 0.253); /* 添加阴影效果 */
}

.flag-indicator.visible {
    opacity: 1;
    visibility: visible;
}

/* 拖动调整宽度的拖动条 */
.resizer {
    position: absolute;
    right: 0;
    top: 0;
    height: 100%;
    width: 5px;
    background-color: transparent;
    cursor: col-resize;
    z-index: 10;
}

.resizer:hover {
    background-color: var(--primary-200);
}

.resizer:active {
    background-color: var(--primary-300);
}

/* 媒体查询适配移动设备 */
@media screen and (max-width: 768px) {
    .sidebar {
        border-radius: 0;
    }
    
    .toggle-button-wrapper {
        top: auto;
        bottom: -1.5rem;
        right: 1rem;
    }
    
    .toggle-button-wrapper.collapsed {
        bottom: -1.5rem;
        right: 1rem;
    }
    
    .question-list-container.collapsed {
        max-height: 10px !important;
        height: 10px !important;
        width: 100% !important;
    }
    
    .resizer {
        display: none; /* 移动设备上不显示拖动条 */
    }
}
</style>

