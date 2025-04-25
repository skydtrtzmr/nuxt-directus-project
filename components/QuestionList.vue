<!-- components/QuestionList.vue -->
<template>
    <div class="sidebar" v-if="submittedPaperSections.length > 0">
        <h5>题目列表</h5>
        <ul>
            <li v-for="section in submittedPaperSections" :key="section.id">
                <h4>{{ section.title }}</h4>
                <ul>
                    <!-- 章节下的题目列表，卡片式 -->
                    <div class="question-card-container">
                        <Button
                            v-for="question in section.questions"
                            :key="question.id"
                            :severity="getQuestionSeverity(question.result)"
                            class="question-card"
                            :class="{
                                selected:
                                    selectedQuestionResult &&
                                    selectedQuestionResult.id ===
                                        question.result?.id,
                            }"
                            @click="handleQuestionClick(question.result)"
                            ref="refItems"
                        >
                            {{ question.sort_in_section }}
                        </Button>
                    </div>
                </ul>
                <br />
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type {
    PaperSections,
    QuestionResults,
} from "~~/types/directus_types";
import { useGlobalStore } from "~~/stores/examDone"; // 引入 Pinia store
import { useLoadingStateStore } from "@/stores/loadingState"; // 引入 Pinia store

const props = defineProps<{
    submittedPaperSections: PaperSections[];
    selectQuestion: (question: QuestionResults) => void;
    selectedQuestionResult: QuestionResults | null;
    exam_page_mode: string;
}>();

const loadingStateStore = useLoadingStateStore();
const globalStore = useGlobalStore(); // 创建 Pinia store 实例
const refItems = ref<HTMLButtonElement[]>([]);

const handleQuestionClick = (questionResult: QuestionResults | undefined) => {
    if (questionResult) {
        console.log("handleQuestionClick", questionResult);
        props.selectQuestion(questionResult); // 调用父组件传递的选择方法
    }
};

const getQuestionSeverity = (result: QuestionResults | undefined) => {
    if (!result) return "secondary";
    
    if (
        result.submit_ans_select_radio ||
        (result.submit_ans_select_multiple_checkbox &&
            (result.submit_ans_select_multiple_checkbox as any[]).length > 0)
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
}
.question-card.selected {
    background-color: #ff8f00;
    color: white;
}
</style>
