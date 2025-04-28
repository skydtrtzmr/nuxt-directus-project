<!-- components/QuestionList.vue -->
<template>
    <div 
        class="sidebar card" 
        :class="{'sidebar-collapsed': isSidebarCollapsed}"
        v-if="submittedPaperSections.length > 0"
    >
        <div class="sidebar-header">
            <h5>题目列表</h5>
            <Button
                :icon="isSidebarCollapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up'"
                class="p-button-rounded p-button-text p-button-sm sidebar-toggle-btn"
                @click="toggleSidebar"
                :aria-label="isSidebarCollapsed ? '展开题目列表' : '收起题目列表'"
            />
        </div>
        <div class="sidebar-content" :class="{'hidden': isSidebarCollapsed}">
            <div v-for="(section, index) in submittedPaperSections" :key="section.id" class="section-container">
                <div class="section-header" @click="toggleSection(index)">
                    <h6 class="section-title">{{ section.title }}</h6>
                    <i :class="{'pi pi-chevron-down': !expandedSections.includes(index), 'pi pi-chevron-up': expandedSections.includes(index)}"></i>
                </div>
                <div class="section-content" v-show="expandedSections.includes(index)">
                    <!-- 章节下的题目列表，卡片式 -->
                    <div class="question-card-container">
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
                            @click="handleQuestionClick(question)"
                            ref="refItems"
                        >
                            {{ question.sort_in_section }}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import type {
    PaperSections,
    QuestionResults,
} from "~~/types/directus_types";
import { useGlobalStore } from "~~/stores/examDone"; // 引入 Pinia store
import { useLoadingStateStore } from "@/stores/loadingState"; // 引入 Pinia store

const props = defineProps<{
    submittedPaperSections: PaperSections[];
    selectQuestion: (question: any) => void;
    selectedQuestion: any | null;
    exam_page_mode: string;
}>();

const loadingStateStore = useLoadingStateStore();
const globalStore = useGlobalStore(); // 创建 Pinia store 实例
const refItems = ref<HTMLButtonElement[]>([]);
const isSidebarCollapsed = ref(false);
const expandedSections = ref<number[]>([0]); // 默认展开第一个章节

const toggleSidebar = () => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value;
};

const toggleSection = (index: number) => {
    const foundIndex = expandedSections.value.indexOf(index);
    if (foundIndex > -1) {
        expandedSections.value.splice(foundIndex, 1);
    } else {
        expandedSections.value.push(index);
    }
};

const handleQuestionClick = (question: any | undefined) => {
    if (question) {
        console.log("handleQuestionClick", question);
        props.selectQuestion(question); // 调用父组件传递的选择方法
    }
};

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
});
</script>

<style scoped>
.sidebar {
    background-color: var(--surface-card);
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
    max-width: 100%;
    overflow: hidden;
}

.sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1.25rem;
    border-bottom: 1px solid var(--surface-border);
}

.sidebar-toggle-btn {
    margin-right: -0.5rem;
}

.sidebar-content {
    padding: 0.5rem;
    transition: all 0.3s ease;
    max-height: 75vh;
    overflow-y: auto;
}

.sidebar-collapsed {
    max-width: 100%;
}

.sidebar-collapsed .sidebar-content {
    display: none;
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
    .sidebar {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 100;
        border-radius: 12px 12px 0 0;
        max-height: 50vh;
        max-width: 100%;
        transition: all 0.3s ease;
    }
    
    .sidebar-collapsed {
        max-height: 50px;
    }
    
    .question-card {
        min-width: 36px;
        height: 36px;
    }
}
</style>
