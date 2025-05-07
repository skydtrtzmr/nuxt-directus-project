<template>
    <div class="exam-header sticky top-0 z-10 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 shadow-md transition-all duration-300">
        <!-- 电脑视图 -->
        <div class="hidden md:grid grid-cols-12 gap-4 p-2">
            <!-- 左侧：考生信息 -->
            <div class="col-span-3">
                <StudentInfo :studentData="studentData" />
            </div>

            <!-- 中间：考试信息和试卷信息 -->
            <div class="col-span-6 grid grid-rows-2 -space-y-1">
                <!-- 考试信息 -->
                <div class="row-span-1">
                    <ExamInfo
                        v-if="practiceSession"
                        :practiceSession="practiceSession"
                        class="border-0 shadow-none bg-transparent"
                    />
                </div>
                <!-- 试卷信息 -->
                <div class="row-span-1">
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
                <div class="mb-4">
                    <ExamCountdown
                        :isClient="isClient"
                        :actualStartTime="actual_start_time"
                        :examEndTime="examEndTime"
                        :practiceSessionTime="practiceSessionTime"
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
                    class="p-button font-medium w-fit px-3"
                    severity="warning"
                    rounded
                />
            </div>

            <!-- 评分信息(复习模式) -->
            <div
                v-if="exam_page_mode === 'review'"
                class="col-span-3 flex items-center justify-end space-x-2 text-sm font-medium"
            >
                <div class="text-gray-700 dark:text-gray-300">
                    试卷总分：{{ paper.total_point_value }}
                </div>
                <div class="text-emerald-600 dark:text-emerald-400">
                    得分：{{ examScore }}
                </div>
            </div>
        </div>

        <!-- 移动视图 -->
        <div class="md:hidden">
            <!-- 第一行：考生信息和倒计时 -->
            <div class="flex items-center justify-between px-3 py-1 border-b border-blue-100 dark:border-blue-800">
                <StudentInfo :studentData="studentData" class="flex-1 text-base" />
                <div v-if="exam_page_mode !== 'review'" class="ml-2">
                    <ExamCountdown
                        :isClient="isClient"
                        :actualStartTime="actual_start_time"
                        :examEndTime="examEndTime"
                        :practiceSessionTime="practiceSessionTime"
                        :formattedCountDown="formattedCountDown"
                        class="mobile-compact-mode"
                    />
                </div>
                <div v-else class="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    得分：{{ examScore }}
                </div>
            </div>

            <!-- 第二行：考试信息和试卷信息 -->
            <div class="grid grid-cols-2 gap-1 px-3 py-1">
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
            <div class="px-3 py-1" v-if="exam_page_mode !== 'review'">
                <Button
                    icon="pi pi-send"
                    label="提交试卷"
                    aria-label="Submit"
                    @click="onSubmit"
                    class="p-button-sm p-button-rounded w-fit px-3"
                    severity="warning"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { PracticeSessions, Papers } from "~~/types/directus_types";
import dayjs from "dayjs";

const props = defineProps<{
    exam_page_mode: string;
    practiceSession: PracticeSessions;
    paper: Papers;
    isClient: boolean;
    actual_start_time: string;
    examEndTime: dayjs.Dayjs;
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
    border-bottom: 2px solid var(--blue-200);
}

:deep(.p-button) {
    font-size: 0.875rem;
    white-space: nowrap;
}

:deep(.p-tooltip) {
    font-size: 0.75rem;
}

:deep(.exam-countdown-tooltip) {
    position: absolute;
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: 6px;
    padding: 0.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    z-index: 1000;
    min-width: 200px;
}
</style> 