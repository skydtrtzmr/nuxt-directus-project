<template>
    <div class="countdown-container p-3 rounded-lg">
        <div class="countdown-header flex justify-between items-center mb-2">
            <h3 class="text-lg font-semibold">考试倒计时</h3>
            <i class="pi pi-clock text-lg"></i>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div class="countdown-item" v-if="isClient">
                <div class="text-xs text-surface-600 dark:text-surface-400">当前时间</div>
                <div class="text-sm">{{ dayjs().format("YYYY-MM-DD HH:mm:ss") }}</div>
            </div>
            <div class="countdown-item" v-if="!isClient">
                <div class="text-xs text-surface-600 dark:text-surface-400">当前时间</div>
                <div class="text-sm">计算中...</div>
            </div>
            
            <div class="countdown-item" v-if="isClient">
                <div class="text-xs text-surface-600 dark:text-surface-400">结束时间</div>
                <div class="text-sm">{{ dayjs(examEndTime).format("YYYY-MM-DD HH:mm:ss") }}</div>
            </div>
            <div class="countdown-item" v-if="!isClient">
                <div class="text-xs text-surface-600 dark:text-surface-400">结束时间</div>
                <div class="text-sm">计算中...</div>
            </div>
        </div>
        
        <div class="countdown-timer mt-3 text-center">
            <div class="text-sm text-surface-600 dark:text-surface-400 mb-1">剩余时间</div>
            <div class="timer-display" :class="getTimerClass(formattedCountDown)">
                {{ isClient ? formattedCountDown : '计算中...' }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import dayjs from "dayjs";

const props = defineProps<{
    isClient: boolean;
    examEndTime: dayjs.Dayjs;
    formattedCountDown: string;
    practiceSessionTime?: any;
}>();

// 根据剩余时间获取CSS类名
const getTimerClass = (time: string) => {
    if (!time) return 'timer-normal';
    
    // 解析时间格式 HH:MM:SS
    const parts = time.split(':');
    if (parts.length !== 3) return 'timer-normal';
    
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    
    if (hours === 0 && minutes < 15) {
        return 'timer-danger';
    } else if (hours === 0 && minutes < 30) {
        return 'timer-warning';
    } else {
        return 'timer-normal';
    }
};
</script>

<style scoped>
.countdown-container {
    background-color: var(--surface-card);
    border: 1px solid var(--surface-border);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.countdown-item {
    padding: 0.5rem;
    border-radius: 4px;
    background-color: var(--surface-ground);
}

.timer-display {
    font-family: monospace;
    font-size: 1.5rem;
    font-weight: bold;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    transition: all 0.3s ease;
    display: inline-block;
}

.timer-normal {
    background-color: var(--primary-color);
    color: var(--primary-color-text);
}

.timer-warning {
    background-color: var(--yellow-500);
    color: var(--yellow-900);
    animation: pulse 2s infinite;
}

.timer-danger {
    background-color: var(--red-500);
    color: white;
    animation: pulse 1s infinite;
}

@keyframes pulse {
    0% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.05);
    }
    100% {
        transform: scale(1);
    }
}

@media screen and (max-width: 768px) {
    .timer-display {
        font-size: 1.25rem;
    }
}
</style>
