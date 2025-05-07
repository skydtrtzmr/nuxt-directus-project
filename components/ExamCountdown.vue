<template>
    <div class="exam-countdown">
        <!-- 默认显示的倒计时 -->
        <div 
            class="countdown-display cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg p-2 transition-all duration-300"
            @click="toggleDetails"
        >
            <div class="flex items-center space-x-2">
                <i class="pi pi-clock text-primary text-lg"></i>
                <span class="text-lg font-medium">{{ formattedCountDown }}</span>
                <i :class="['pi', showDetails ? 'pi-chevron-up' : 'pi-chevron-down', 'text-sm text-gray-500']"></i>
            </div>
        </div>

        <!-- 详细信息（点击后显示） -->
        <div v-if="showDetails" class="countdown-details mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3">
            <div class="space-y-2 text-sm">
                <div class="flex justify-between items-center">
                    <span class="text-gray-600 dark:text-gray-400">开始时间：</span>
                    <span class="font-medium">{{ formatDateTime(actualStartTime) }}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-600 dark:text-gray-400">结束时间：</span>
                    <span class="font-medium">{{ formatDateTime(examEndTime) }}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-600 dark:text-gray-400">当前时间：</span>
                    <span class="font-medium">{{ currentTime }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import dayjs from 'dayjs';
import type { PracticeSessions } from "~~/types/directus_types";

const props = defineProps<{
    isClient: boolean;
    actualStartTime: string;
    examEndTime: dayjs.Dayjs;
    practiceSessionTime: PracticeSessions;
    formattedCountDown: string;
}>();

const showDetails = ref(false);
const currentTime = ref('');

const toggleDetails = () => {
    showDetails.value = !showDetails.value;
};

const formatDateTime = (dateTime: string | dayjs.Dayjs) => {
    if (!dateTime) return '未设置';
    return dayjs(dateTime).format('MM-DD HH:mm:ss');
};

let timeInterval: NodeJS.Timeout | null = null;

onMounted(() => {
    if (props.isClient) {
        updateCurrentTime();
        timeInterval = setInterval(updateCurrentTime, 1000);
    }
});

onUnmounted(() => {
    if (timeInterval) {
        clearInterval(timeInterval);
    }
});

const updateCurrentTime = () => {
    currentTime.value = dayjs().format('MM-DD HH:mm:ss');
};
</script>

<style scoped>
.exam-countdown {
    transition: all 0.3s ease;
}

.countdown-display {
    transition: all 0.2s ease;
}

.countdown-display:hover {
    transform: translateY(-1px);
}

.countdown-details {
    animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>

