<template>
    <div class="exam-header sticky top-0 z-10 bg-white border-b border-gray-200 transition-all duration-300">
        <!-- 电脑视图 -->
        <div class="hidden md:grid grid-cols-12 gap-4 p-3">
            <!-- 左侧：考生信息 -->
            <div class="col-span-3">
                <StudentInfo :studentData="studentData" />
            </div>

            <!-- 中间：考试信息和试卷信息 -->
            <div class="col-span-6 grid grid-rows-2 gap-1">
                <!-- 考试信息 -->
                <div class="row-span-1 overflow-hidden">
                    <ExamInfo
                        v-if="practiceSession"
                        :practiceSession="practiceSession"
                        class="border-0 shadow-none bg-transparent"
                    />
                </div>
                <!-- 试卷信息 -->
                <div class="row-span-1 overflow-hidden">
                    <PaperInfo
                        v-if="paper"
                        :paper="paper"
                        class="border-0 shadow-none bg-transparent"
                    />
                </div>
            </div>

            <!-- 右侧：倒计时和提交按钮 -->
            <div class="col-span-3 flex flex-col justify-between items-end" v-if="exam_page_mode !== 'review'">
                <!-- 倒计时组件 -->
                <div class="mb-2">
                    <ExamCountdown
                        :isClient="isClient"
                        :actualStartTimeDisplay="actual_start_time"
                        :examEndTimeDisplay="examEndTime"
                        :formattedCountDown="formattedCountDown"
                        class="desktop-compact-mode"
                    />
                </div>
                <!-- 提交按钮 -->
                <Button
                    icon="pi pi-send"
                    label="提交试卷"
                    aria-label="Submit"
                    @click="onSubmit"
                    class="submit-button"
                    severity="warning"
                    rounded
                />
            </div>

            <!-- 评分信息(复习模式) -->
            <div
                v-if="exam_page_mode === 'review'"
                class="col-span-3 flex items-center justify-end space-x-3 text-sm font-medium"
            >
                <div class="score-info total-score">
                    试卷总分：{{ paper.total_point_value }}
                </div>
                <div class="score-info current-score">
                    得分：{{ examScore }}
                </div>
            </div>
        </div>

        <!-- 移动视图 -->
        <div class="md:hidden">
            <!-- 第一行：考生信息和倒计时/得分 -->
            <div class="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                <StudentInfo :studentData="studentData" class="flex-1 text-sm min-w-0" />
                <div v-if="exam_page_mode !== 'review'" class="ml-2 flex-shrink-0">
                    <ExamCountdown
                        :isClient="isClient"
                        :actualStartTimeDisplay="actual_start_time"
                        :examEndTimeDisplay="examEndTime"
                        :formattedCountDown="formattedCountDown"
                        class="mobile-compact-mode"
                    />
                </div>
                <div v-else class="score-info current-score mobile-score ml-2 flex-shrink-0">
                    得分：{{ examScore }}
                </div>
            </div>

            <!-- 第二行：考试信息和试卷信息 - 改为上下布局以给试卷标题更多空间 -->
            <div class="px-3 py-2 space-y-1">
                <ExamInfo
                    v-if="practiceSession"
                    :practiceSession="practiceSession"
                    class="border-0 shadow-none bg-transparent p-0"
                />
                <PaperInfo
                    v-if="paper"
                    :paper="paper"
                    class="border-0 shadow-none bg-transparent p-0"
                />
            </div>

            <!-- 第三行：提交按钮 -->
            <div class="px-3 py-2" v-if="exam_page_mode !== 'review'">
                <Button
                    icon="pi pi-send"
                    label="提交试卷"
                    aria-label="Submit"
                    @click="onSubmit"
                    class="submit-button mobile-submit"
                    severity="warning"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { PracticeSessions, Papers } from "~~/types/directus_types";

const props = defineProps<{
    exam_page_mode: string;
    practiceSession: PracticeSessions;
    paper: Papers;
    isClient: boolean;
    actual_start_time: string;
    examEndTime: string;
    practiceSessionTime: PracticeSessions;
    formattedCountDown: string;
    examScore: number | null;
    studentData: {
        name: string;
        student_number: number;
        email: string;
        className: string;
    };
}>();

const emit = defineEmits<{
    (e: 'submit'): void;
}>();

const onSubmit = () => {
    emit('submit');
};
</script>

<style scoped>
.exam-header {
    background: white;
    border-bottom: 1px solid #e0e0e0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 提交按钮样式 */
.submit-button {
    font-size: 0.875rem;
    font-weight: 500;
    padding: 0.5rem 1rem;
    white-space: nowrap;
}

.mobile-submit {
    width: 100%;
    font-size: 0.8rem;
    padding: 0.375rem 0.75rem;
}

/* 评分信息样式 */
.score-info {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-weight: 500;
}

.total-score {
    color: #666;
    background: #f5f5f5;
}

.current-score {
    color: #059669;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
}

.mobile-score {
    font-size: 0.75rem;
    padding: 0.2rem 0.4rem;
}

/* 工具提示样式 */
:deep(.p-tooltip) {
    font-size: 0.75rem;
}

:deep(.exam-countdown-tooltip) {
    position: absolute;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 0.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    min-width: 200px;
}

/* 响应式调整 */
@media (max-width: 768px) {
    .exam-header {
        font-size: 0.875rem;
    }
}

/* 确保组件内容不会过高 */
:deep(.col-span-6) {
    max-height: 60px;
    overflow: visible; /* 改为 visible 以显示完整内容 */
}

:deep(.grid-rows-2) {
    grid-template-rows: 1fr 1fr;
}

/* 优化移动端布局 */
@media (max-width: 640px) {
    /* 在小屏幕上给标题更多空间 */
    .space-y-1 > * + * {
        margin-top: 0.5rem;
    }
}
</style> 