<template>
    <div 
        class="countdown-container rounded-lg transition-all duration-300"
        :class="{ 'expanded': isExpanded, 'compact-mode': isMobileView }"
    >
        <!-- 桌面端模式 - 始终完整显示 -->
        <div v-if="!isMobileView" class="p-2 desktop-view">
            <div class="countdown-header flex justify-between items-center mb-1">
                <h3 class="text-sm font-semibold">考试倒计时</h3>
                <div 
                    class="timer-display ml-2"
                    :class="getTimerClass(formattedCountDown)"
                >
                    {{ isClient ? formattedCountDown : "计算中..." }}
                </div>
            </div>

            <div class="time-details">
                <div class="time-row">
                    <div class="time-label">
                        <i class="pi pi-calendar-plus text-blue-500 mr-1"></i>
                        开始
                    </div>
                    <div class="time-value">
                        {{ isClient ? formatTime(actualStartTime) : "计算中..." }}
                    </div>
                </div>

                <div class="time-row">
                    <div class="time-label">
                        <i class="pi pi-calendar-times text-red-500 mr-1"></i>
                        结束
                    </div>
                    <div class="time-value">
                        {{ isClient ? formatTime(examEndTime) : "计算中..." }}
                    </div>
                </div>
            </div>
        </div>

        <!-- 移动端模式 - 可折叠 -->
        <div v-else @click="toggleExpand">
            <!-- 收缩状态 - 只显示倒计时本身 -->
            <div v-if="!isExpanded" class="countdown-compact flex items-center justify-center">
                <div 
                    class="timer-display"
                    :class="getTimerClass(formattedCountDown)"
                >
                    {{ isClient ? formattedCountDown : "计算中..." }}
                </div>
            </div>

            <!-- 展开状态 -->
            <div v-else class="p-2">
                <div class="countdown-header flex justify-between items-center mb-2">
                    <h3 class="text-base font-semibold">考试倒计时</h3>
                    <i class="pi pi-chevron-up"></i>
                </div>

                <div class="countdown-timer text-center mb-2">
                    <div 
                        class="timer-display"
                        :class="getTimerClass(formattedCountDown)"
                    >
                        {{ isClient ? formattedCountDown : "计算中..." }}
                    </div>
                </div>

                <div class="time-details">
                    <div class="time-row" v-if="isClient">
                        <div class="time-label">
                            <i class="pi pi-calendar-plus text-blue-500 mr-1"></i>
                            开始时间
                        </div>
                        <div class="time-value">
                            {{ dayjs(actualStartTime).format("YYYY-MM-DD HH:mm:ss") }}
                        </div>
                    </div>

                    <div class="time-row" v-if="isClient">
                        <div class="time-label">
                            <i class="pi pi-clock text-orange-500 mr-1"></i>
                            当前时间
                        </div>
                        <div class="time-value">
                            {{ dayjs().format("YYYY-MM-DD HH:mm:ss") }}
                        </div>
                    </div>

                    <div class="time-row" v-if="isClient">
                        <div class="time-label">
                            <i class="pi pi-calendar-times text-red-500 mr-1"></i>
                            结束时间
                        </div>
                        <div class="time-value">
                            {{ dayjs(examEndTime).format("YYYY-MM-DD HH:mm:ss") }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import { ref, onMounted, onUnmounted } from "vue";

const props = defineProps<{
    isClient: boolean;
    examEndTime: dayjs.Dayjs;
    formattedCountDown: string;
    practiceSessionTime?: any;
    actualStartTime?: any;
}>();

// 控制展开/折叠状态
const isExpanded = ref(false);
const isMobileView = ref(false);

// 切换展开/折叠状态
const toggleExpand = () => {
    isExpanded.value = !isExpanded.value;
};

// 格式化时间
const formatTime = (dateTime: any) => {
    if (!dateTime) return "";
    return dayjs(dateTime).format("HH:mm");
};

// 根据剩余时间获取CSS类名
const getTimerClass = (time: string) => {
    if (!time) return "timer-normal";

    // 解析时间格式 HH:MM:SS
    const parts = time.split(":");
    if (parts.length !== 3) return "timer-normal";

    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);

    if (hours === 0 && minutes < 15) {
        return "timer-danger";
    } else if (hours === 0 && minutes < 30) {
        return "timer-warning";
    } else {
        return "timer-normal";
    }
};

// 检测窗口大小变化，根据屏幕宽度设置移动视图
const checkIfMobile = () => {
    isMobileView.value = window.innerWidth < 768;
};

// 组件挂载时检测屏幕尺寸
onMounted(() => {
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
});

// 组件卸载时移除事件监听
onUnmounted(() => {
    window.removeEventListener('resize', checkIfMobile);
});
</script>

<style scoped>
.countdown-container {
    background-color: #ffffff;
    border: 1px solid #dee2e6;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    width: 100%;
    min-width: 160px;
}

.compact-mode {
    cursor: pointer;
}

.compact-mode:hover {
    background-color: #f8f9fa;
}

.countdown-compact {
    padding: 0.2rem;
}

.desktop-view .timer-display {
    font-size: 1rem;
    padding: 0.15rem 0.5rem;
}

.timer-display {
    font-family: monospace;
    font-weight: bold;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    transition: all 0.3s ease;
    display: inline-block;
    font-size: 1.25rem;
}

.timer-normal {
    background-color: #3B82F6;
    color: #ffffff;
}

.timer-warning {
    background-color: #F59E0B;
    color: #ffffff;
    animation: pulse 2s infinite;
}

.timer-danger {
    background-color: #EF4444;
    color: white;
    animation: pulse 1s infinite;
}

.time-details {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.time-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.15rem 0.25rem;
    border-radius: 4px;
    background-color: rgba(248, 249, 250, 0.7);
    font-size: 0.75rem;
}

.time-label {
    display: flex;
    align-items: center;
    color: #4b5563;
    font-weight: 500;
}

.time-value {
    color: #111827;
    font-family: monospace;
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
        font-size: 1.1rem;
    }
}
</style>
