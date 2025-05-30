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
                    <span class="font-medium">{{ actualStartTimeDisplay }}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-600 dark:text-gray-400">结束时间：</span>
                    <span class="font-medium">{{ examEndTimeDisplay }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
    isClient: boolean;
    actualStartTimeDisplay: string;
    examEndTimeDisplay: string;
    formattedCountDown: string;
}>();

const showDetails = ref(false);

const toggleDetails = () => {
    showDetails.value = !showDetails.value;
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

